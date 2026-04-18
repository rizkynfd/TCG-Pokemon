// @ts-nocheck
import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { GEM_BUNDLE_PRICES } from '@/lib/midtrans'
import crypto from 'crypto'

// Verify Midtrans signature to prevent fake webhook calls
function verifySignature(orderId: string, statusCode: string, grossAmount: string): string {
  const serverKey = process.env.MIDTRANS_SERVER_KEY!
  const rawString = orderId + statusCode + grossAmount + serverKey
  return crypto.createHash('sha512').update(rawString).digest('hex')
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      custom_field1: userId,
      custom_field2: bundleId,
      custom_field3: gemsStr,
    } = body

    // 1. Verify signature — prevents fake webhook calls
    const expectedSignature = verifySignature(order_id, status_code, gross_amount)
    if (signature_key !== expectedSignature) {
      console.error('[WEBHOOK] Invalid signature. Possible fraud attempt.')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }

    // 2. Only process successful & non-fraudulent payments
    const isSuccess =
      (transaction_status === 'capture' && fraud_status === 'accept') ||
      transaction_status === 'settlement'

    if (!isSuccess) {
      console.log(`[WEBHOOK] Ignoring status: ${transaction_status}, fraud: ${fraud_status}`)
      return NextResponse.json({ received: true, processed: false })
    }

    // 3. Validate required fields
    if (!userId || !bundleId || !gemsStr) {
      console.error('[WEBHOOK] Missing custom fields — cannot credit gems.')
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }

    const gems = parseInt(gemsStr, 10)
    const bundle = GEM_BUNDLE_PRICES[bundleId]
    if (!bundle || isNaN(gems)) {
      return NextResponse.json({ error: 'Invalid bundle data' }, { status: 400 })
    }

    const admin = createAdminClient()

    // 4. Prevent double-processing: check if order already fulfilled
    const { data: existing } = await admin
      .from('transactions')
      .select('id')
      .eq('description', `Midtrans: ${order_id}`)
      .maybeSingle()

    if (existing) {
      console.log('[WEBHOOK] Order already processed:', order_id)
      return NextResponse.json({ received: true, processed: false, reason: 'duplicate' })
    }

    // 5. Fetch current gems balance
    const { data: profile } = await admin
      .from('profiles')
      .select('gems')
      .eq('id', userId)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 6. Add gems to user account
    await admin
      .from('profiles')
      .update({ gems: profile.gems + gems })
      .eq('id', userId)

    // 7. Log the transaction for auditing
    await admin.from('transactions').insert({
      user_id: userId,
      type: 'purchase_gems',
      gems_delta: gems,
      description: `Midtrans: ${order_id}`,
      metadata: {
        bundle_id: bundleId,
        bundle_name: bundle.name,
        gems_credited: gems,
        gross_amount: gross_amount,
        order_id,
      },
    })

    console.log(`[WEBHOOK] ✅ Credited ${gems} gems to user ${userId} for order ${order_id}`)
    return NextResponse.json({ received: true, processed: true, gemsCredited: gems })
  } catch (error: any) {
    console.error('[WEBHOOK] Critical error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
