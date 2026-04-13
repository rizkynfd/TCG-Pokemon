import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Check if this is a new Google user who hasn't set a custom username yet.
      // The DB trigger sets username from full_name or email prefix.
      // We detect "new" users = created within last 30 seconds.
      const createdAt = new Date(data.user.created_at ?? 0)
      const isNewUser = Date.now() - createdAt.getTime() < 30_000

      if (isNewUser && data.user.app_metadata?.provider === 'google') {
        // Redirect to profile completion page
        return NextResponse.redirect(`${origin}/complete-profile`)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
