// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Package, Star, Zap, Trophy } from 'lucide-react'
import Image from 'next/image'

export const metadata = {
  title: 'Pull History — PokéVault TCG',
  description: 'Your complete Pokémon TCG card pull history.',
}

const RARITY_CONFIG: Record<number, { color: string; label: string }> = {
  1: { color: 'text-gray-400',   label: 'Common' },
  2: { color: 'text-green-400',  label: 'Uncommon' },
  3: { color: 'text-blue-400',   label: 'Rare' },
  4: { color: 'text-violet-400', label: 'Ultra Rare' },
  5: { color: 'text-orange-400', label: 'Secret Rare' },
}

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: pullHistory } = await supabase
    .from('pull_history')
    .select('*, cards(*), packs!inner(name)')
    .eq('user_id', user.id)
    .order('pulled_at', { ascending: false })
    .limit(100)

  const { data: profile } = await supabase
    .from('profiles')
    .select('total_pulls, pity_ultra, pity_rare')
    .eq('id', user.id)
    .single()

  // Stats
  const totalDustEarned = (pullHistory ?? []).reduce((sum: number, p: any) => sum + (p.dust_received ?? 0), 0)
  const pitiPulls = (pullHistory ?? []).filter((p: any) => p.is_pity).length
  const rarePulls = (pullHistory ?? []).filter((p: any) => p.cards?.rarity_tier >= 3).length

  return (
    <div className="min-h-screen bg-[#0C0A09] p-4 lg:p-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-['Righteous'] text-3xl text-[#CA8A04] neon-gold flex items-center gap-2">
          <Trophy className="w-7 h-7" />
          Pull History
        </h1>
        <p className="text-[#A8A29E] mt-1">Your complete card pulling journey</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Pulls',   value: profile?.total_pulls ?? 0,           color: 'text-[#CA8A04]', icon: Package },
          { label: 'Rare+ Pulls',   value: rarePulls,                            color: 'text-blue-400',  icon: Star },
          { label: 'Dust Earned',   value: totalDustEarned,                      color: 'text-violet-400',icon: Zap },
          { label: 'Pity Triggers', value: pitiPulls,                            color: 'text-orange-400',icon: Trophy },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-[#1C1917] border border-[#44403C] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-[#A8A29E] text-xs">{label}</span>
            </div>
            <p className={`font-['Righteous'] text-2xl ${color}`}>{value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Pity Bar */}
      {profile && (
        <div className="bg-[#1C1917] border border-[#44403C] rounded-xl p-4 mb-8">
          <h2 className="font-['Righteous'] text-sm text-white mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#CA8A04]" />
            Current Pity Counter
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-[#A8A29E]">Ultra Rare Pity</span>
                <span className="text-violet-400 font-semibold">{profile.pity_ultra}/50</span>
              </div>
              <div className="h-2 bg-[#292524] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-700 to-violet-400 rounded-full transition-all"
                  style={{ width: `${Math.min((profile.pity_ultra / 50) * 100, 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-[#A8A29E]">Secret Rare Pity</span>
                <span className="text-orange-400 font-semibold">{profile.pity_ultra}/100</span>
              </div>
              <div className="h-2 bg-[#292524] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-700 to-orange-400 rounded-full transition-all"
                  style={{ width: `${Math.min((profile.pity_ultra / 100) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pull History List */}
      {(!pullHistory || pullHistory.length === 0) ? (
        <div className="text-center py-24">
          <Package className="w-16 h-16 text-[#44403C] mx-auto mb-4" />
          <h3 className="font-['Righteous'] text-xl text-white mb-2">No pulls yet!</h3>
          <p className="text-[#A8A29E]">Open your first pack to see your history here.</p>
        </div>
      ) : (
        <div className="bg-[#1C1917] border border-[#44403C] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#44403C] flex justify-between items-center">
            <span className="font-['Righteous'] text-white text-sm">Recent Pulls</span>
            <span className="text-[#A8A29E] text-xs">{pullHistory.length} records</span>
          </div>
          <div className="divide-y divide-[#292524]">
            {(pullHistory as any[]).map((pull) => {
              const card = pull.cards
              const rarity = RARITY_CONFIG[card?.rarity_tier ?? 1]
              return (
                <div key={pull.id} className="flex items-center gap-4 px-4 py-3 hover:bg-[#292524]/50 transition-colors">
                  {/* Card image */}
                  <div className="w-10 h-14 rounded-lg overflow-hidden bg-[#292524] flex-shrink-0 relative">
                    {card?.image_url && (
                      <Image src={card.image_url} alt={card.name} fill className="object-cover" sizes="40px" />
                    )}
                  </div>

                  {/* Card info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{card?.name ?? '—'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs font-semibold ${rarity?.color ?? 'text-gray-400'}`}>
                        {rarity?.label ?? card?.rarity}
                      </span>
                      {pull.is_pity && (
                        <span className="text-[9px] bg-[#CA8A04] text-black font-bold px-1 rounded">PITY</span>
                      )}
                      {pull.is_duplicate && (
                        <span className="text-[9px] text-[#A8A29E] bg-[#292524] px-1 rounded">DUP</span>
                      )}
                    </div>
                  </div>

                  {/* Pack + Date */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-[#A8A29E] text-xs">{pull.packs?.name ?? 'Pack'}</p>
                    {pull.dust_received > 0 && (
                      <p className="text-violet-400 text-xs font-semibold">+{pull.dust_received} ✨</p>
                    )}
                    <p className="text-[#57534E] text-[10px] mt-0.5">
                      {new Date(pull.pulled_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
