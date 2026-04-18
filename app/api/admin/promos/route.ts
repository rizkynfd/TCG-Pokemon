// @ts-nocheck
import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const admin = createAdminClient()
  try {
    const { data: promos } = await admin
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false })
    
    return NextResponse.json(promos || [])
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const admin = createAdminClient()
  try {
    const { code, reward_type, reward_amount, max_uses, expires_at } = await request.json()

    // Validate
    if (!code || !reward_type || !reward_amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await admin
      .from('promo_codes')
      .insert({
        code: code.toUpperCase(),
        reward_type,
        reward_amount: Number(reward_amount),
        max_uses: max_uses ? Number(max_uses) : null,
        expires_at: expires_at || null,
        is_active: true
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    if (error.code === '23505') return NextResponse.json({ error: 'Code already exists' }, { status: 400 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const admin = createAdminClient()
  try {
    const { id } = await request.json()
    const { error } = await admin.from('promo_codes').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
