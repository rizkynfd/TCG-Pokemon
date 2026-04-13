// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const CRAFT_COST: Record<number, number> = {
  1: 25,
  2: 75,
  3: 200,
  4: 600,
  5: 1800,
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { cardId } = await request.json()
  if (!cardId) return NextResponse.json({ error: 'cardId required' }, { status: 400 })

  const admin = createAdminClient()

  // Get card details
  const { data: card } = await admin
    .from('cards')
    .select('id, name, rarity_tier, is_available')
    .eq('id', cardId)
    .single()

  if (!card || !card.is_available) {
    return NextResponse.json({ error: 'Card not found or unavailable' }, { status: 404 })
  }

  const cost = CRAFT_COST[card.rarity_tier] ?? 200

  // Get user profile
  const { data: profile } = await admin
    .from('profiles')
    .select('dust')
    .eq('id', user.id)
    .single()

  if (!profile || profile.dust < cost) {
    return NextResponse.json({ error: `Not enough dust. Need ${cost}, have ${profile?.dust ?? 0}` }, { status: 400 })
  }

  // Check if already owned
  const { data: existing } = await admin
    .from('inventory')
    .select('id, quantity')
    .eq('user_id', user.id)
    .eq('card_id', cardId)
    .single()

  // Deduct dust
  await admin.from('profiles').update({ dust: profile.dust - cost }).eq('id', user.id)

  // Add to inventory
  if (existing) {
    await admin
      .from('inventory')
      .update({ quantity: existing.quantity + 1 })
      .eq('id', existing.id)
  } else {
    await admin.from('inventory').insert({
      user_id: user.id,
      card_id: cardId,
      quantity: 1,
    })
  }

  // Log transaction
  await admin.from('transactions').insert({
    user_id: user.id,
    type: 'craft',
    dust_delta: -cost,
    description: `Crafted card: ${card.name}`,
    metadata: { cardId, cardName: card.name, cost },
  })

  return NextResponse.json({ success: true, dustSpent: cost })
}
