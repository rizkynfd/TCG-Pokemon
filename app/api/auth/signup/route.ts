import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password, username } = await request.json()

    if (!email || !password || !username) {
      return NextResponse.json({ error: 'Email, password, and username are required.' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 })
    }

    if (username.trim().length < 3 || username.trim().length > 30) {
      return NextResponse.json({ error: 'Username must be 3–30 characters.' }, { status: 400 })
    }

    const supabase = createAdminClient() as any

    // Check if username is already taken
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', username.trim())
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Username is already taken. Please choose another.' }, { status: 409 })
    }

    // Create user via Supabase Auth Admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // requires email confirmation
      user_metadata: { username: username.trim() },
    })

    if (authError) {
      const msg = authError.message.includes('already registered')
        ? 'An account with this email already exists.'
        : authError.message
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    // The DB trigger handle_new_user() will auto-create the profile.
    // But it uses raw_user_meta_data for username, so we update it explicitly.
    if (authData.user) {
      await supabase
        .from('profiles')
        .update({ username: username.trim() })
        .eq('id', authData.user.id)
    }

    return NextResponse.json({ success: true, message: 'Account created! Please check your email to confirm.' })
  } catch (err) {
    console.error('[AUTH/SIGNUP]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
