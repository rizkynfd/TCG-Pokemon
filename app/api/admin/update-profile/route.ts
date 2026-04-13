import { createClient } from '@/lib/supabase/server'
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

    // 3. Update profile
    // We use the regular supabase client here, but because we're on the server
    // and it's an admin-triggered action, we'll use the service role client 
    // to bypass RLS if needed. 
    // Actually, createClient() returns the authenticated client.
    // For admin-level writes to OTHER users, we NEED the service role.
    
    // Let's create a service role client
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
    const serviceRoleClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

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
