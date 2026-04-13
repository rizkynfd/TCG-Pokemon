import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function migrate() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('🚀 Starting Migration: Adding flair_level to inventory table...');

  // Using RPC if exists, but most likely we need to run SQL.
  // Since we can't run raw SQL via JS client easily without a stored procedure,
  // we will try to fetch the inventory first to see if column exists.
  
  const { error: checkError } = await supabase
    .from('inventory')
    .select('flair_level')
    .limit(1);

  if (checkError && checkError.code === '42703') {
    console.log('⚠️ Column flair_level does not exist. Please run the SQL migration in your Supabase dashboard:');
    console.log('------------------------------------------------------------');
    console.log('ALTER TABLE inventory ADD COLUMN flair_level INT DEFAULT 0;');
    console.log('------------------------------------------------------------');
  } else if (checkError) {
    console.error('❌ Error checking database:', checkError);
  } else {
    console.log('✅ Column flair_level already exists!');
  }
}

migrate();
