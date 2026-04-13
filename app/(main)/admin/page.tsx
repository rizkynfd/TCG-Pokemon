// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminPanelView from '@/components/layout/AdminPanelView'

export const metadata = {
  title: 'Admin Panel — PokéVault TCG',
  description: 'Admin dashboard for PokéVault TCG management.',
}

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean)

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Email-based protection
  if (!ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? '')) {
    redirect('/dashboard')
  }

  // Gather stats
  const [
    { count: totalUsers },
    { count: totalCards },
    { count: totalPulls },
    { count: totalInventory },
    { data: recentPulls },
    { data: latestUsers },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('cards').select('*', { count: 'exact', head: true }).eq('is_available', true),
    supabase.from('pull_history').select('*', { count: 'exact', head: true }),
    supabase.from('inventory').select('*', { count: 'exact', head: true }),
    supabase.from('pull_history')
      .select('pulled_at, is_duplicate, is_pity, cards(name, rarity_tier)')
      .order('pulled_at', { ascending: false })
      .limit(10),
    supabase.from('profiles')
      .select('username, email, total_pulls, coins, created_at')
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  return (
    <AdminPanelView
      stats={{
        totalUsers: totalUsers ?? 0,
        totalCards: totalCards ?? 0,
        totalPulls: totalPulls ?? 0,
        totalInventory: totalInventory ?? 0,
      }}
      recentPulls={recentPulls ?? []}
      latestUsers={latestUsers ?? []}
      adminEmail={user.email ?? ''}
    />
  )
}
