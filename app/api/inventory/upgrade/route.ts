import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const FLAIR_UPGRADE_COSTS: Record<number, number> = {
  1: 100,
  2: 500,
  3: 1000,
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { inventoryId } = await request.json()
    if (!inventoryId) {
      return NextResponse.json({ error: 'inventoryId is required' }, { status: 400 })
    }

    // 1. Fetch current inventory item
    const { data: inventoryItem, error: invError } = await (supabase
      .from('inventory')
      .select('*, cards(*)') as any)
      .eq('id', inventoryId)
      .eq('user_id', user.id)
      .single()

    if (invError || !inventoryItem) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 })
    }

    const currentLevel = inventoryItem.flair_level || 0
    if (currentLevel >= 3) {
      return NextResponse.json({ error: 'Maximum flair level reached' }, { status: 400 })
    }

    const nextLevel = currentLevel + 1
    const cost = FLAIR_UPGRADE_COSTS[nextLevel]

    // 2. Fetch user profile for dust check
    const { data: profile, error: profError } = await supabase
      .from('profiles')
      .select('dust')
      .eq('id', user.id)
      .single()

    if (profError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    if ((profile as any).dust < cost) {
      return NextResponse.json({ error: `Not enough dust. Need ${cost} ✨` }, { status: 400 })
    }

    // 3. Perform Transaction (Atomic update)
    // Update inventory level
    const { error: updateInvError } = await (supabase
      .from('inventory') as any)
      .update({ flair_level: nextLevel })
      .eq('id', inventoryId)

    if (updateInvError) throw updateInvError

    // Deduct dust from profile
    const { error: updateProfError } = await (supabase
      .from('profiles') as any)
      .update({ dust: (profile as any).dust - cost })
      .eq('id', user.id)

    if (updateProfError) throw updateProfError

    // 4. Log transaction
    await (supabase.from('transactions') as any).insert({
      user_id: user.id,
      type: 'flair_upgrade',
      dust_delta: -cost,
      description: `Upgraded ${inventoryItem.cards.name} to Flair Lvl ${nextLevel}`,
      metadata: { inventory_id: inventoryId, card_name: inventoryItem.cards.name, level: nextLevel } as any,
    })

    return NextResponse.json({
      success: true,
      newLevel: nextLevel,
      newDust: (profile as any).dust - cost
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upgrade failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
