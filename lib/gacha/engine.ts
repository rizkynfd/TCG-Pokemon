// @ts-nocheck
import { createAdminClient } from '@/lib/supabase/server'
import { rollRarityTier, DUST_BY_TIER } from './probabilities'
import type { Card, Pack, Profile } from '@/types/database'

export interface PulledCard {
  card: Card
  isDuplicate: boolean
  dustReceived: number
  isPity: boolean
}

export interface GachaResult {
  cards: PulledCard[]
  newProfile: {
    coins: number
    dust: number
    pity_rare: number
    pity_ultra: number
    total_pulls: number
  }
}

/**
 * Core gacha roll — runs server-side only.
 * Validates currency, rolls cards, updates inventory + pity counters.
 */
export async function performGachaRoll(
  userId: string,
  packId: string,
  count: number = 1
): Promise<GachaResult> {
  const supabase = createAdminClient() as any
  const validatedCount = Math.max(1, Math.min(10, count))

  // 1. Fetch pack info
  const { data: pack, error: packError } = await supabase
    .from('packs')
    .select('*')
    .eq('id', packId)
    .eq('is_active', true)
    .single()

  if (packError || !pack) throw new Error('Pack not found or inactive')

  // Check limited pack expiry
  if (pack.is_limited && pack.limited_until) {
    if (new Date(pack.limited_until) < new Date()) {
      throw new Error('This limited pack has expired')
    }
  }

  // 2. Fetch User Profile (Balance check)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    throw new Error('Profile not found')
  }

  // TEMPORARILY DISABLED for recovery/debugging
  /*
  const totalCost = (pack.price || 0) * count
  if (profile.currency < totalCost) {
    throw new Error(`Insufficient Coins. You need ${totalCost} but have ${profile.currency}.`)
  }
  */
  // 3. Prepare the card pool (with fallback)
  let cardsQuery = supabase.from('cards').select('*').eq('is_available', true)
  if (pack.set_filter && pack.set_filter.length > 0) {
    cardsQuery = cardsQuery.in('set_id', pack.set_filter)
  }
  
  let { data: allCards } = await cardsQuery
  
  // FALLBACK: If specific set cards are missing, pull from ALL available cards
  if (!allCards || allCards.length === 0) {
    console.warn(`Gacha: No cards found for set ${pack.set_filter}. Falling back to general pool.`)
    const fallbackQuery = await supabase.from('cards').select('*').eq('is_available', true).limit(500)
    allCards = fallbackQuery.data
  }

  // CRITICAL: If after fallback there are STILL no cards, safety exit BEFORE charging user
  if (!allCards || allCards.length === 0) {
    throw new Error('Gacha System Error: No cards available in database. Please contact admin.')
  }

  // 4. Validate currency for total bundles
  const totalCoins = (pack.cost_coins ?? 0) * validatedCount
  const totalGems = (pack.cost_gems ?? 0) * validatedCount

  if (totalGems > 0 && profile.gems < totalGems) {
    throw new Error('Insufficient gems')
  }
  if (totalCoins > 0 && profile.coins < totalCoins) {
    throw new Error('Insufficient coins')
  }

  // 5. Deduct currency (Now safe because we know cards exist)
  const currencyUpdate: Partial<Profile> = {
    coins: profile.coins - totalCoins,
    gems: profile.gems - totalGems,
  }
  await supabase.from('profiles').update(currencyUpdate).eq('id', userId)

  // 6. Fetch user's current inventory (for duplicate detection)
  const { data: userInventory } = await supabase
    .from('inventory')
    .select('card_id, quantity')
    .eq('user_id', userId)

  const ownedCardIds = new Set((userInventory ?? []).map((i: any) => i.card_id))
  // We keep one set for the entire multi-pack session to accurately identify "NEW" cards
  const sessionNewCardIds = new Set<string>() 

  // 7. Roll cards
  let pityRare  = profile.pity_rare
  let pityUltra = profile.pity_ultra
  let totalDust = 0
  const pulledCards: PulledCard[] = []
  const historyRows = []
  
  // Grouping for atomic DB updates later
  const cardCounts: Record<string, number> = {}

  // Loop for each pack in the bundle
  for (let p = 0; p < validatedCount; p++) {
    for (let i = 0; i < pack.cards_count; i++) {
      const { tier, isPity } = rollRarityTier(pityRare, pityUltra)

      // Filter cards by rolled tier
      const tierCards = allCards.filter((c: any) => c.rarity_tier === tier)
      const pool = tierCards.length > 0 ? tierCards : allCards
      const card = pool[Math.floor(Math.random() * pool.length)]

      // isDuplicate is true if card was owned BEFORE this session OR already pulled in this bulk session
      const isDuplicate = ownedCardIds.has(card.id) || sessionNewCardIds.has(card.id)
      
      if (!isDuplicate) {
        sessionNewCardIds.add(card.id)
      }

      const dustReceived = isDuplicate ? DUST_BY_TIER[card.rarity_tier] ?? 5 : 0
      totalDust += dustReceived

      pulledCards.push({ card, isDuplicate, dustReceived, isPity })
      
      // Accumulate for DB update
      cardCounts[card.id] = (cardCounts[card.id] || 0) + 1

      // Update pity counters
      if (tier >= 4) {
        pityUltra = 0
        pityRare  = 0
      } else if (tier >= 3) {
        pityRare  = 0
        pityUltra = pityUltra + 1
      } else {
        pityRare  = pityRare  + 1
        pityUltra = pityUltra + 1
      }

      historyRows.push({
        user_id: userId,
        pack_id: packId,
        card_id: card.id,
        is_duplicate: isDuplicate,
        dust_received: dustReceived,
        is_pity: isPity,
      })
    }
  }

  const { error: historyError } = await supabase.from('pull_history').insert(historyRows);
  if (historyError) throw new Error(`History error: ${historyError.message}`);

  console.log(`[GACHA] Syncing inventory for ${userId}...`);
  const finalIds = Object.keys(cardCounts);
  for (const targetId of finalIds) {
    const totalToSync = cardCounts[targetId];
    for (let s = 0; s < totalToSync; s++) {
      const { error: e } = await supabase.rpc('increment_card_quantity', {
        p_user_id: userId,
        p_card_id: targetId
      });
      if (e) throw e;
    }
  }

  // 10. Update profile: pity counters, dust, total_pulls, currency
  const newProfile = {
    coins: profile.coins - totalCoins,
    dust:  profile.dust + totalDust,
    gems:  profile.gems - totalGems,
    pity_rare:   pityRare,
    pity_ultra:  pityUltra,
    total_pulls: profile.total_pulls + (pack.cards_count * validatedCount),
  }
  await supabase.from('profiles').update(newProfile).eq('id', userId)

  // 11. Log transaction
  await supabase.from('transactions').insert({
    user_id: userId,
    type: 'pack_purchase',
    coins_delta: -totalCoins,
    dust_delta: totalDust,
    gems_delta: -totalGems,
    description: `Opened ${validatedCount}x ${pack.name}`,
    metadata: { pack_id: packId, cards_count: pack.cards_count, bundle_count: validatedCount } as any,
  })

  return { cards: pulledCards, newProfile }
}

