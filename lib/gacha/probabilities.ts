import { RARITY_TIERS } from '@/types/database'

// ================================================================
// Gacha Probability System
// ================================================================

export interface RarityWeight {
  tier: number
  name: string
  baseWeight: number
}

export const RARITY_WEIGHTS: RarityWeight[] = [
  { tier: 1, name: 'Common',     baseWeight: 5500 }, // 55%
  { tier: 2, name: 'Uncommon',   baseWeight: 2500 }, // 25%
  { tier: 3, name: 'Rare',       baseWeight: 1400 }, // 14%
  { tier: 4, name: 'Ultra Rare', baseWeight:  500 }, //  5%
  { tier: 5, name: 'Secret Rare',baseWeight:  100 }, //  1%
]

const TOTAL_WEIGHT = RARITY_WEIGHTS.reduce((s, r) => s + r.baseWeight, 0)

// Pity thresholds
export const PITY_ULTRA_SOFT  = 40  // soft pity starts here
export const PITY_ULTRA_HARD  = 50  // guaranteed Ultra Rare+
export const PITY_SECRET_HARD = 100 // guaranteed Secret Rare

/**
 * Calculate adjusted weights based on current pity counters.
 * Soft pity: each pull past SOFT threshold adds +200 weight to Ultra+ tiers.
 */
export function calculateWeights(
  pityRare: number,
  pityUltra: number,
  rarityBoost?: Record<string, number> | null
): RarityWeight[] {
  return RARITY_WEIGHTS.map((r) => {
    let weight = r.baseWeight

    // Apply pack-specific rarity boost
    if (rarityBoost?.[r.tier.toString()]) {
      weight += rarityBoost[r.tier.toString()]
    }

    // Soft pity for Ultra Rare
    if (r.tier >= 4 && pityUltra >= PITY_ULTRA_SOFT) {
      const softBonus = (pityUltra - PITY_ULTRA_SOFT + 1) * 200
      weight += softBonus
    }

    return { ...r, baseWeight: Math.max(0, weight) }
  })
}

/**
 * Roll a rarity tier based on current pity state.
 * Hard pity overrides RNG.
 */
export function rollRarityTier(
  pityRare: number,
  pityUltra: number
): { tier: number; isPity: boolean } {
  // Hard pity: Secret Rare guaranteed
  if (pityUltra >= PITY_SECRET_HARD) {
    return { tier: 5, isPity: true }
  }

  // Hard pity: Ultra Rare guaranteed
  if (pityUltra >= PITY_ULTRA_HARD) {
    return { tier: 4, isPity: true }
  }

  // Normal weighted roll
  const weights = calculateWeights(pityRare, pityUltra)
  const total = weights.reduce((s, r) => s + r.baseWeight, 0)
  let rand = Math.random() * total

  for (const rarity of weights) {
    rand -= rarity.baseWeight
    if (rand <= 0) {
      return { tier: rarity.tier, isPity: false }
    }
  }

  return { tier: 1, isPity: false }
}

/** Map pokemontcg.io rarity strings → our tier numbers */
export function mapApiRarityToTier(apiRarity: string): number {
  const rarityMap: Record<string, number> = {
    'Common': 1,
    'Uncommon': 2,
    'Rare': 3,
    'Rare Holo': 3,
    'Rare Holo EX': 4,
    'Rare Holo GX': 4,
    'Rare Holo V': 4,
    'Rare Holo VMAX': 4,
    'Rare Holo VSTAR': 4,
    'Rare Ultra': 4,
    'Ultra Rare': 4,
    'Double Rare': 4,
    'Illustration Rare': 4,
    'Rare Rainbow': 5,
    'Secret Rare': 5,
    'Hyper Rare': 5,
    'Special Illustration Rare': 5,
    'Trainer Gallery Rare Holo': 4,
  }
  return rarityMap[apiRarity] ?? 1
}

/** Dust value per tier for duplicate cards */
export const DUST_BY_TIER: Record<number, number> = {
  1: 5,
  2: 10,
  3: 25,
  4: 100,
  5: 400,
}
