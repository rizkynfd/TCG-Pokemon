// @ts-nocheck
import { createClient, createAdminClient } from '@/lib/supabase/server'

import { NextResponse } from 'next/server'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean)

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 1. Auth check
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Admin email check
  const email = user.email?.toLowerCase() ?? ''
  if (!ADMIN_EMAILS.includes(email)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  try {
    const { userId, coins, gems, dust } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Use the existing admin client (service role) to bypass RLS
    const serviceRoleClient = createAdminClient()

    const { error } = await serviceRoleClient
      .from('profiles')
      .update({
        coins: Number(coins),
        gems: Number(gems),
        dust: Number(dust),
      })
      .eq('id', userId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Admin Update Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
