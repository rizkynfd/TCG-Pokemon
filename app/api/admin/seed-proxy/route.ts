// Secure proxy — validates user session first, then forwards to /api/admin/seed
// This keeps SUPABASE_SERVICE_ROLE_KEY server-side only.
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
    return NextResponse.json({ error: 'Access denied — not an admin.' }, { status: 403 })
  }

  // 3. Forward to actual seed endpoint with service role key
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('mode') ?? 'full'
  const seedUrl = new URL('/api/admin/seed', request.url)
  if (mode === 'packs_only') seedUrl.searchParams.set('onlyPacks', 'true')

  const res = await fetch(seedUrl.toString(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
