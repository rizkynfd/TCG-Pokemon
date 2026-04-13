// @ts-nocheck
import { createAdminClient } from '@/lib/supabase/server'
import { mapApiRarityToTier, DUST_BY_TIER } from '@/lib/gacha/probabilities'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

const TCG_API = 'https://api.pokemontcg.io/v2'
const API_KEY = process.env.POKEMON_TCG_API_KEY!

// Helper to create a deterministic UUID from a string (TCG Set ID)
function generateUUID(str: string): string {
  const hash = crypto.createHash('md5').update(str).digest('hex')
  return hash.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5')
}

// Focus on 25 most recent sets for the "Elite" experience
const MAX_SETS = 25

interface TcgCard {
  id: string
  name: string
  set: { id: string; name: string }
  rarity?: string
  types?: string[]
  hp?: string
  images: { small: string; large?: string }
}

async function fetchCardsForSet(setId: string): Promise<TcgCard[]> {
  const url = `${TCG_API}/cards?q=set.id:${setId}&pageSize=1000&select=id,name,set,rarity,types,hp,images`
  const res = await fetch(url, {
    headers: API_KEY ? { 'X-Api-Key': API_KEY } : {},
    next: { revalidate: 86400 },
  })
  if (!res.ok) throw new Error(`TCG API error for set ${setId}: ${res.status}`)
  const json = await res.json()
  return json.data ?? []
}

const POPULAR_SET_IDS = [
  'sv3pt5',    // 151
  'swsh12pt5', // Crown Zenith
  'swsh7',     // Evolving Skies
  'sv4pt5',    // Paldean Fates
  'swsh9',     // Brilliant Stars
  'swsh10',    // Astral Radiance
  'sv1',       // Scarlet & Violet
  'sv2',       // Paldea Evolved
  'sv3',       // Obsidian Flames
  'sv4',       // Paradox Rift
  'swsh4',     // Vivid Voltage
  'base1',     // Base Set
]

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const onlyPacks = searchParams.get('onlyPacks') === 'true'

  const supabase = createAdminClient()
  const results: Record<string, any> = {}

  try {
    // Fetch ALL sets from Scarlet & Violet and Sword & Shield
    // NOTE: The & must be URL-encoded inside the q parameter value
    const q = encodeURIComponent('(series:"Scarlet & Violet" OR series:"Sword & Shield")')
    const url = `${TCG_API}/sets?q=${q}&orderBy=-releaseDate&pageSize=45`
    console.log('[SEED] Fetching sets from:', url)
    
    let sets: any[] = []
    const setsRes = await fetch(url, {
      headers: API_KEY ? { 'X-Api-Key': API_KEY } : {},
    })
    
    if (!setsRes.ok) {
      // Fallback: use the hardcoded popular IDs to seed individual sets
      console.warn('[SEED] Dynamic set list failed, falling back to POPULAR_SET_IDS')
      sets = POPULAR_SET_IDS.map(id => ({ id, name: id, series: 'Popular', total: 0, images: {} }))
    } else {
      const json = await setsRes.json()
      sets = json.data ?? []
    }

    if (sets.length === 0) {
      return NextResponse.json({ error: 'No sets returned from TCG API. Check API key.' }, { status: 500 })
    }

    // PASS 1: Seed ALL Packs Metadata (FAST)
    console.log(`[SEED] Pass 1: Seeding ${sets.length} packs metadata...`)
    const packRows = sets.map((set: any) => ({
      id: generateUUID(set.id),
      name: set.name ?? set.id,
      description: `${set.series ?? ''} Series. ${set.total ?? ''} cards. Released: ${set.releaseDate ?? 'N/A'}.`,
      image_url: set.images?.logo || set.images?.symbol || null,
      cost_coins: 500,
      cards_count: 5,
      set_filter: [set.id],
      is_active: true,
    }))

    const { error: packsBatchError } = await supabase
      .from('packs')
      .upsert(packRows, { onConflict: 'id' })

    if (packsBatchError) console.error('[SEED] Failed to batch seed packs:', packsBatchError)
    results['packs_metadata'] = { count: sets.length }

    if (onlyPacks) {
      return NextResponse.json({ success: true, seeded: results, mode: 'metadata_only', message: `${sets.length} packs synced.` })
    }

    // 3. PASS 2: Progressive Card Seeding & Mascot Update (SLOW - May timeout)
    console.log('Starting Pass 2: Progressive card enrichment...')
    const targetSets = sets.slice(0, 40)

    for (const set of targetSets) {
      const setId = set.id
      const packId = generateUUID(setId)
      
      // Check if cards already exist for this set to avoid redundant fetching
      const { count: existingCardCount } = await supabase
        .from('cards')
        .select('*', { count: 'exact', head: true })
        .eq('set_id', setId)

      if (existingCardCount && existingCardCount > 50) {
        console.log(`Set ${set.name} already has ${existingCardCount} cards. Skipping card seed.`)
        results[setId] = { pack: set.name, status: 'already_seeded', cards: existingCardCount }
        continue
      }

      console.log(`Fetching cards for: ${set.name} (${setId})...`)
      const cards = await fetchCardsForSet(setId)
      
      // 3a. Identify Mascot Card
      const sortedCards = [...cards].sort((a, b) => {
        const tierA = mapApiRarityToTier(a.rarity ?? '')
        const tierB = mapApiRarityToTier(b.rarity ?? '')
        if (tierB !== tierA) return tierB - tierA
        const priority = ['Charizard', 'Pikachu', 'Mewtwo', 'Mew', 'Rayquaza', 'Lugia', 'Gengar', 'Giratina']
        const aPri = priority.findIndex(p => a.name.includes(p))
        const bPri = priority.findIndex(p => b.name.includes(p))
        if (aPri !== -1 && bPri === -1) return -1
        if (aPri === -1 && bPri !== -1) return 1
        return 0
      })

      const mascotCard = sortedCards[0]
      const packArtUrl = mascotCard?.images?.large ?? mascotCard?.images?.small ?? set.images?.logo ?? set.images?.symbol

      // 3b. Update Pack with Mascot Art (High Fidelity Overlay)
      await supabase
        .from('packs')
        .update({ image_url: packArtUrl })
        .eq('id', packId)

      // 3c. Upsert cards
      const cardRows = cards
        .filter((c) => c.images?.small)
        .map((c) => {
          const tier = mapApiRarityToTier(c.rarity ?? 'Common')
          return {
            id:             c.id,
            name:           c.name,
            set_id:         c.set.id,
            set_name:       c.set.name,
            rarity:         c.rarity ?? 'Common',
            rarity_tier:    tier,
            type:           c.types?.[0] ?? null,
            hp:             c.hp ? parseInt(c.hp) : null,
            image_url:      c.images.small,
            image_url_hires: c.images.large ?? null,
            dust_value:     DUST_BY_TIER[tier] ?? 5,
            is_available:   true,
          }
        })

      const { error: cardsError } = await supabase
        .from('cards')
        .upsert(cardRows, { onConflict: 'id' })

      if (cardsError) console.error(`Failed to seed cards for ${setId}:`, cardsError)
      
      results[setId] = { 
        pack: set.name, 
        cards: cardRows.length, 
        mascot: mascotCard?.name 
      }
    }

    return NextResponse.json({ success: true, seeded: results, mode: 'full' })
  } catch (err: any) {
    console.error('Seeding error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET() {
  const supabase = createAdminClient()
  const [
    { count: cardCount },
    { count: packCount }
  ] = await Promise.all([
    supabase.from('cards').select('*', { count: 'exact', head: true }),
    supabase.from('packs').select('*', { count: 'exact', head: true })
  ])
  return NextResponse.json({ cardCount, packCount })
}

