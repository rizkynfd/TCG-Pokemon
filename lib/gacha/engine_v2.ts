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
 * Core gacha roll engine V2 — bypasses stale Turbopack cache.
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

  // 2. Fetch User Profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (profileError || !profile) throw new Error('Profile not found')

  // 3. Prepare card pool (OPTIMIZED: fetch only relevant sets)
  let cardsQuery = supabase.from('cards').select('*').eq('is_available', true)
  let filteredPool: any[] = []
  
  if (pack.set_filter && Array.isArray(pack.set_filter) && pack.set_filter.length > 0) {
    cardsQuery = cardsQuery.in('set_id', pack.set_filter)
  }

  const { data: cardsPool, error: poolError } = await cardsQuery
  
  if (poolError || !cardsPool || cardsPool.length === 0) {
    // Fallback if set-specific query failed or returned empty
    console.warn('[GACHA] Set-specific pool empty, falling back to all available cards')
    const { data: fallbackPool } = await supabase.from('cards').select('*').eq('is_available', true).limit(500)
    if (!fallbackPool || fallbackPool.length === 0) {
      throw new Error('SYSTEM_ERROR: Database is empty. Please add cards.')
    }
    filteredPool = fallbackPool
  } else {
    filteredPool = cardsPool
  }

  const activePool = filteredPool

  // 4. Validate currency
  const totalCoins = (pack.cost_coins ?? 0) * validatedCount
  const totalGems = (pack.cost_gems ?? 0) * validatedCount

  if (profile.coins < totalCoins || profile.gems < totalGems) throw new Error('Insufficient currency')

  // NOTE: Do NOT deduct currency here — deduct only once in step 9 after all logic completes.

  // 5. DETECT EXISTING INVENTORY (for duplicate detection)
  const { data: currentInv } = await supabase.from('inventory').select('card_id').eq('user_id', userId)
  const ownedIds = new Set((currentInv ?? []).map((i: any) => i.card_id))
  const sessionNewIds = new Set<string>()

  // 6. ROLL CARDS
  let pityR = profile.pity_rare ?? 0
  let pityU = profile.pity_ultra ?? 0
  let collectedDust = 0
  const resultingCards: PulledCard[] = []
  const hRows: any[] = []
  const cCounts: Record<string, number> = {}

  for (let pIdx = 0; pIdx < validatedCount; pIdx++) {
    for (let iIdx = 0; iIdx < pack.cards_count; iIdx++) {
      const { tier, isPity } = rollRarityTier(pityR, pityU)
      const tierPool = activePool.filter((c: any) => c.rarity_tier === tier)
      const p = tierPool.length > 0 ? tierPool : activePool
      const card = p[Math.floor(Math.random() * p.length)]

      const isDup = ownedIds.has(card.id) || sessionNewIds.has(card.id)
      if (!isDup) sessionNewIds.add(card.id)

      const dust = isDup ? (DUST_BY_TIER[card.rarity_tier] ?? 5) : 0
      collectedDust += dust

      resultingCards.push({ card, isDuplicate: isDup, dustReceived: dust, isPity })
      cCounts[card.id] = (cCounts[card.id] || 0) + 1

      if (tier >= 4) { pityU = 0; pityR = 0 }
      else if (tier >= 3) { pityR = 0; pityU++ }
      else { pityR++; pityU++ }

      hRows.push({
        user_id: userId, pack_id: packId, card_id: card.id,
        is_duplicate: isDup, dust_received: dust, is_pity: isPity
      })
    }
  }

  // 7. SYNC PULL HISTORY
  await supabase.from('pull_history').insert(hRows)

  // 8. SYNC INVENTORY — upsert pattern, no silent failures
  console.log(`[GACHA V2] Syncing inventory for ${userId} (${Object.keys(cCounts).length} unique cards)...`)
  for (const cid of Object.keys(cCounts)) {
    const qty = cCounts[cid]
    const { data: existing, error: fetchErr } = await supabase
      .from('inventory')
      .select('id, quantity')
      .eq('user_id', userId)
      .eq('card_id', cid)
      .maybeSingle()

    if (fetchErr) {
      console.error(`[GACHA V2] Failed to fetch inventory for card ${cid}:`, fetchErr)
      continue
    }

    if (existing) {
      const { error: updateErr } = await supabase
        .from('inventory')
        .update({ quantity: existing.quantity + qty })
        .eq('id', existing.id)
      if (updateErr) console.error(`[GACHA V2] Failed to update inventory ${cid}:`, updateErr)
    } else {
      const { error: insertErr } = await supabase
        .from('inventory')
        .insert({ user_id: userId, card_id: cid, quantity: qty, is_favorite: false, in_wishlist: false, flair_level: 0 })
      if (insertErr) console.error(`[GACHA V2] Failed to insert inventory ${cid}:`, insertErr)
      else console.log(`[GACHA V2] NEW CARD added to inventory: ${cid}`)
    }
  }

  // 9. Update Profile Stats
  const newCoins = profile.coins - totalCoins
  const newDust = profile.dust + collectedDust
  const newTotalPulls = (profile.total_pulls || 0) + (pack.cards_count * validatedCount)

  await supabase.from('profiles').update({
    coins: newCoins,
    dust: newDust,
    pity_rare: pityR,
    pity_ultra: pityU,
    total_pulls: newTotalPulls
  }).eq('id', userId)

  return { 
    cards: resultingCards, 
    newProfile: { 
      ...profile, 
      coins: newCoins, 
      dust: newDust,
      pity_rare: pityR,
      pity_ultra: pityU,
      total_pulls: newTotalPulls
    } 
  }
}
