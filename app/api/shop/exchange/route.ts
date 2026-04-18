// @ts-nocheck
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const COIN_BUNDLES = {
  coins_sm: { coins: 500, gems: 5 },
  coins_md: { coins: 1500, gems: 12 },
  coins_lg: { coins: 5000, gems: 35 },
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { bundleId } = await request.json()
    const bundle = COIN_BUNDLES[bundleId as keyof typeof COIN_BUNDLES]

    if (!bundle) {
      return NextResponse.json({ error: 'Invalid bundle ID' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Get current balance
    const { data: profile } = await admin
      .from('profiles')
      .select('coins, gems')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (profile.gems < bundle.gems) {
      return NextResponse.json({ error: 'Gems tidak cukup' }, { status: 400 })
    }

    // Update balances
    await admin
      .from('profiles')
      .update({
        coins: profile.coins + bundle.coins,
        gems: profile.gems - bundle.gems
      })
      .eq('id', user.id)

    // Log transaction
    await admin.from('transactions').insert({
      user_id: user.id,
      type: 'exchange_coins',
      coins_delta: bundle.coins,
      gems_delta: -bundle.gems,
      description: `Exchanged ${bundle.gems} gems for ${bundle.coins} coins`,
      metadata: { bundle_id: bundleId }
    })

    return NextResponse.json({ success: true, coins: bundle.coins, gemsSpent: bundle.gems })
  } catch (error: any) {
    console.error('[EXCHANGE API] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
