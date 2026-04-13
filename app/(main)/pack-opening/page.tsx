// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PackOpening from '@/components/pack/PackOpening'

interface PageProps {
  searchParams: Promise<{ packId?: string }>
}

export const metadata = {
  title: 'Open Packs — PokéVault TCG',
  description: 'Open booster packs and discover rare Pokémon cards!',
}

// This page needs to be a Server Component to fetch packs & profile,
// but PackOpening itself is Client Component for animations.
export default async function PackOpeningPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const initialPackId = params?.packId ?? null

  const [{ data: packs }, { data: profile }] = await Promise.all([
    supabase.from('packs').select('*').eq('is_active', true).order('cost_coins'),
    supabase.from('profiles').select('coins, gems, pity_rare, pity_ultra').eq('id', user.id).single(),
  ])

  return (
    <div className="min-h-screen bg-[#0C0A09]">
      <PackOpening
        packs={packs ?? []}
        initialPackId={initialPackId}
        profile={profile}
      />
    </div>
  )
}
