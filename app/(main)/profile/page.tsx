// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { User, Star, Zap, Trophy, BookOpen, Flame, Sparkles } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Profile — PokéVault TCG',
  description: 'Your trainer profile and collection stats.',
}

const TITLES = [
  { threshold: 0,    label: 'Rookie Trainer',    color: 'text-gray-400' },
  { threshold: 10,   label: 'Card Collector',     color: 'text-green-400' },
  { threshold: 50,   label: 'Pack Hunter',        color: 'text-blue-400' },
  { threshold: 150,  label: 'Elite Trainer',      color: 'text-violet-400' },
  { threshold: 500,  label: 'Master Trainer',     color: 'text-orange-400' },
  { threshold: 1000, label: 'Pokémon Legend',     color: 'text-[#CA8A04]' },
]

function getTitle(totalPulls: number) {
  return [...TITLES].reverse().find(t => totalPulls >= t.threshold) ?? TITLES[0]
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, inventoryCountRes, rareCountRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('inventory').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase
      .from('inventory')
      .select('cards!inner(rarity_tier)', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('cards.rarity_tier', 3),
  ])

  const profile = profileRes.data
  const totalPulls = profile?.total_pulls ?? 0
  const title = getTitle(totalPulls)
  const uniqueCards = inventoryCountRes.count ?? 0
  const rareCards = rareCountRes.count ?? 0

  const stats = [
    { label: 'Total Pulls',    value: totalPulls,             icon: Zap,      color: 'text-[#CA8A04]' },
    { label: 'Unique Cards',   value: uniqueCards,            icon: BookOpen, color: 'text-blue-400' },
    { label: 'Rare+ Cards',    value: rareCards,              icon: Star,     color: 'text-violet-400' },
    { label: 'Coins',          value: profile?.coins ?? 0,   icon: Zap,      color: 'text-yellow-400' },
    { label: 'Dust',           value: profile?.dust ?? 0,    icon: Sparkles, color: 'text-violet-300' },
    { label: 'Day Streak',     value: profile?.streak_days ?? 0, icon: Flame, color: 'text-orange-400' },
  ]

  return (
    <div className="min-h-screen p-4 lg:p-8 max-w-3xl mx-auto">

      {/* Profile Card */}
      <div className="bg-[#1C1917] border border-[#44403C] rounded-2xl p-6 mb-8 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-[#CA8A04]/5 -translate-y-1/4 translate-x-1/4 blur-2xl pointer-events-none" />

        <div className="flex items-center gap-5 relative">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#CA8A04] to-[#D97706] flex items-center justify-center text-3xl font-bold text-black flex-shrink-0 shadow-[0_0_20px_rgba(202,138,4,0.4)]">
            {profile?.username?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? '?'}
          </div>

          <div>
            <h1 className="font-['Righteous'] text-2xl text-white">
              {profile?.username ?? user.email?.split('@')[0]}
            </h1>
            <p className={`text-sm font-semibold mt-0.5 ${title.color}`}>
              {title.label}
            </p>
            <p className="text-[#A8A29E] text-xs mt-1">
              {user.email}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <h2 className="font-['Righteous'] text-lg text-white mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-[#CA8A04]" />
        Trainer Stats
      </h2>
      <div className="grid grid-cols-3 gap-3 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-[#1C1917] border border-[#44403C] rounded-xl p-4 text-center">
            <Icon className={`w-5 h-5 ${color} mx-auto mb-2`} />
            <p className={`font-['Righteous'] text-xl ${color}`} suppressHydrationWarning>{value.toLocaleString()}</p>
            <p className="text-[#A8A29E] text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Title Progression */}
      <div className="bg-[#1C1917] border border-[#44403C] rounded-2xl p-5 mb-6">
        <h2 className="font-['Righteous'] text-white mb-4 flex items-center gap-2">
          <Star className="w-4 h-4 text-[#CA8A04]" />
          Title Progression
        </h2>
        <div className="space-y-3">
          {TITLES.map((t, i) => {
            const isActive = title.label === t.label
            const isPassed = totalPulls >= t.threshold
            const nextThreshold = TITLES[i + 1]?.threshold
            const progressPct = nextThreshold
              ? Math.min(((totalPulls - t.threshold) / (nextThreshold - t.threshold)) * 100, 100)
              : 100

            return (
              <div key={t.label} className={`flex items-center gap-3 ${isActive ? '' : isPassed ? 'opacity-60' : 'opacity-30'}`}>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isPassed ? 'bg-[#CA8A04]' : 'bg-[#292524]'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-sm font-semibold ${isActive ? t.color : isPassed ? 'text-[#A8A29E]' : 'text-[#57534E]'}`}>
                      {t.label} {isActive && '← Current'}
                    </span>
                    <span className="text-[#57534E] text-xs" suppressHydrationWarning>{t.threshold.toLocaleString()} pulls</span>
                  </div>
                  {isActive && nextThreshold && (
                    <div className="h-1 bg-[#292524] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#CA8A04] rounded-full transition-all"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/pack-opening" className="btn-primary text-center">
          Open Packs
        </Link>
        <Link href="/collection" className="btn-secondary text-center">
          View Collection
        </Link>
      </div>
    </div>
  )
}
