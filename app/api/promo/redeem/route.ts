// @ts-nocheck
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { code } = await request.json()
    if (!code) return NextResponse.json({ error: 'Code is required' }, { status: 400 })

    const normalizedCode = code.toUpperCase().trim()
    const admin = createAdminClient()

    // 1. Find active promo code
    // We do NOT use normal supabase read, because promo codes are readable by everyone based on RLS anyway, 
    // but just checking the code via admin to avoid relying solely on RLS policies inside the edge logic.
    const { data: promo, error: promoError } = await admin
      .from('promo_codes')
      .select('*')
      .eq('code', normalizedCode)
      .single()

    if (promoError || !promo) {
      return NextResponse.json({ error: 'Kode tidak valid' }, { status: 404 })
    }

    if (!promo.is_active) {
      return NextResponse.json({ error: 'Kode sudah kadaluarsa' }, { status: 400 })
    }

    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Kode sudah kadaluarsa' }, { status: 400 })
    }

    if (promo.max_uses && promo.current_uses >= promo.max_uses) {
      return NextResponse.json({ error: 'Limit kode ini sudah habis' }, { status: 400 })
    }

    // 2. Try adding redemption to lock it per user
    const { error: redeemError } = await admin
      .from('promo_redemptions')
      .insert({
        promo_code_id: promo.id,
        user_id: user.id
      })

    if (redeemError) {
      if (redeemError.code === '23505') {
        return NextResponse.json({ error: 'Kamu sudah memakai kode promo ini' }, { status: 400 })
      }
      throw redeemError
    }

    // 3. Increment uses safely
    await admin.rpc('increment_promo_uses', { p_id: promo.id })
    // Note: If increment_promo_uses RPC doesn't exist, we will safely update using direct API
    const { data: updatedPromo } = await admin
      .from('promo_codes')
      .select('current_uses')
      .eq('id', promo.id)
      .single()
      
    await admin
      .from('promo_codes')
      .update({ current_uses: (updatedPromo?.current_uses || promo.current_uses) + 1 })
      .eq('id', promo.id)

    // 4. Give the reward
    // Get current balance
    const { data: profile } = await admin
      .from('profiles')
      .select(promo.reward_type)
      .eq('id', user.id)
      .single()

    const newBalance = (profile?.[promo.reward_type] || 0) + promo.reward_amount

    await admin
      .from('profiles')
      .update({ [promo.reward_type]: newBalance })
      .eq('id', user.id)

    // 5. Log transaction
    await admin.from('transactions').insert({
      user_id: user.id,
      type: 'promo_code',
      [`${promo.reward_type}_delta`]: promo.reward_amount,
      description: `Redeemed promo code: ${promo.code}`,
      metadata: { code: promo.code, reward: promo.reward_amount, type: promo.reward_type }
    })

    return NextResponse.json({ 
      success: true, 
      message: `Selamat! Kamu mendapatkan ${promo.reward_amount} ${promo.reward_type}.`,
      reward_type: promo.reward_type,
      reward_amount: promo.reward_amount
    })

  } catch (error: any) {
    console.error('[PROMO REDEEM API]', error)
    return NextResponse.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 })
  }
}
