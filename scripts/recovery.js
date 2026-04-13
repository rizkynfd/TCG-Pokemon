const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8');
const env = {};
envConfig.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function recoverAllLostCards() {
  console.log('--- 🛡️ DATA RECOVERY: Restoring Missing Collection Items ---');

  // 1. Get all pull history to identify every card unboxed
  const { data: pullHistory, error: historyError } = await supabase
    .from('pull_history')
    .select('card_id, user_id');

  if (historyError) {
    console.error('Failed to fetch pull history:', historyError);
    return;
  }

  console.log(`Found ${pullHistory.length} total pull records. Processing...`);

  // 2. Count occurrences (since some may be duplicates that weren't counted)
  const userCardMap = {}; // userId -> cardId -> count
  
  for (const record of pullHistory) {
    if (!userCardMap[record.user_id]) userCardMap[record.user_id] = {};
    if (!userCardMap[record.user_id][record.card_id]) userCardMap[record.user_id][record.card_id] = 0;
    userCardMap[record.user_id][record.card_id]++;
  }

  // 3. Force-sync every record into inventory using the robust RPC
  let restored = 0;
  for (const [userId, cards] of Object.entries(userCardMap)) {
    console.log(`Syncing collection for user ${userId}...`);
    for (const [cardId, count] of Object.entries(cards)) {
      // We use the same RPC as the engine to ensure atomic upsert
      const { error: rpcError } = await supabase.rpc('upsert_inventory_card', {
        p_user_id: userId,
        p_card_id: cardId,
        p_inc_qty: 0 // We'll handle quantity logic carefully below
      });

      // Actually, since we want to overwrite/correct the inventory, 
      // let's just make sure it EXISTS first. 
      // If it exists, the count in inventory might already be partially correct.
      // THE GOAL IS: Total Unique in Inventory should >= Unique in History.
      
      const { data: inv } = await supabase
        .from('inventory')
        .select('quantity')
        .eq('user_id', userId)
        .eq('card_id', cardId)
        .single();

      if (!inv) {
        console.log(`[RECOVERY] Adding missing card ${cardId} to user ${userId}...`);
        await supabase.from('inventory').insert({
          user_id: userId,
          card_id: cardId,
          quantity: count
        });
        restored++;
      }
    }
  }

  console.log(`\n✅ RECOVERY COMPLETE. ${restored} missing card types restored to inventory.`);
  console.log('Now Mastery counts should be accurate.');
}

recoverAllLostCards().catch(console.error);
