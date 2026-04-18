// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { snap, GEM_BUNDLE_PRICES } from '@/lib/midtrans'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { bundleId } = await request.json()

    const bundle = GEM_BUNDLE_PRICES[bundleId]
    if (!bundle) {
      return NextResponse.json({ error: 'Invalid bundle ID' }, { status: 400 })
    }

    // Fetch user profile for customer details
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()

    // Create unique order ID
    const orderId = `pokevault-${bundleId}-${user.id.slice(0, 8)}-${Date.now()}`

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: bundle.priceIdr,
      },
      item_details: [
        {
          id: bundleId,
          price: bundle.priceIdr,
          quantity: 1,
          name: `PokéVault ${bundle.name} (${bundle.gems} Gems)`,
        },
      ],
      customer_details: {
        first_name: profile?.username ?? 'Trainer',
        email: user.email ?? '',
      },
      credit_card: {
        secure: true,
      },
      // Store metadata for webhook processing
      custom_field1: user.id,
      custom_field2: bundleId,
      custom_field3: String(bundle.gems),
    }

    const transaction = await snap.createTransaction(parameter)

    return NextResponse.json({
      token: transaction.token,
      orderId,
    })
  } catch (error: any) {
    console.error('[PAYMENT CREATE] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
