// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Package, BookOpen, Zap, Star, Trophy, ArrowRight, TrendingUp, Sparkles } from 'lucide-react'
import Link from 'next/link'
import DailyRewardButton from '@/components/shared/DailyRewardButton'
import EventBanner from '@/components/shared/EventBanner'
import EVENT_CONFIG from '@/lib/event-config'

export const metadata = {
  title: 'Dashboard — PokéVault TCG',
  description: 'Your Pokémon TCG collection hub — stats, packs, and daily rewards.',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: recentPulls } = await supabase
    .from('pull_history')
    .select('*, cards(*)')
    .eq('user_id', user.id)
    .order('pulled_at', { ascending: false })
    .limit(5)

  const { data: packs } = await supabase
    .from('packs')
    .select('*')
    .eq('is_active', true)
    .limit(4)

  const { data: inventoryData } = await supabase
    .from('inventory')
    .select('quantity')
    .eq('user_id', user.id)

  const uniqueCount = inventoryData?.length ?? 0
  const totalSheetsOwned = inventoryData?.reduce((sum, item) => sum + item.quantity, 0) ?? 0

  const today = new Date()
  const lastClaimed = profile?.last_daily_claimed ? new Date(profile.last_daily_claimed) : null
  const canClaimDaily = !lastClaimed || (
    lastClaimed.getUTCFullYear() !== today.getUTCFullYear() ||
    lastClaimed.getUTCMonth() !== today.getUTCMonth() ||
    lastClaimed.getUTCDate() !== today.getUTCDate()
  )

  const stats = [
    { label: 'Collection',    value: totalSheetsOwned,             icon: BookOpen, color: 'text-blue-400',   bg: 'bg-blue-500/10' },
    { label: 'Unique Types',  value: uniqueCount,                  icon: Trophy,   color: 'text-[#CA8A04]', bg: 'bg-[#CA8A04]/10' },
    { label: 'Total Pulls',   value: profile?.total_pulls ?? 0,    icon: Zap,      color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { label: 'Stardust',      value: profile?.dust ?? 0,           icon: Sparkles, color: 'text-violet-400', bg: 'bg-violet-500/10' },
  ]

  const RARITY_COLORS: Record<number, string> = {
    1: 'text-gray-400',
    2: 'text-green-400',
    3: 'text-blue-400',
    4: 'text-violet-400',
    5: 'text-orange-400',
  }

  return (
    <div className="relative min-h-screen p-6 lg:p-10 space-y-12 max-w-7xl mx-auto overflow-hidden">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-yellow-500/5 blur-[120px] rounded-full -z-10" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 blur-[100px] rounded-full -z-10" />

      {/* Event Banner */}
      <EventBanner event={EVENT_CONFIG} />

      {/* Hero Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[#CA8A04] font-bold text-sm tracking-widest uppercase">
            <span className="w-8 h-px bg-[#CA8A04]/40" />
            Elite Trainer Dashboard
          </div>
          <h1 className="text-4xl lg:text-5xl font-['Righteous'] text-white tracking-tight">
            Welcome back, <span className="text-[#CA8A04]">{profile?.username ?? 'Trainer'}</span>
          </h1>
          <p className="text-[#A8A29E] text-lg max-w-2xl font-light">
            You're currently on a <span className="text-white font-semibold">{profile?.streak_days ?? 0} day streak</span>. 
            Ready for your next legendary pull?
          </p>
        </div>
        <DailyRewardButton canClaim={canClaimDaily} streak={profile?.streak_days ?? 0} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="group relative overflow-hidden bg-[#1C1917]/40 backdrop-blur-md border border-[#44403C]/50 rounded-3xl p-6 transition-all hover:border-[#CA8A04]/40 hover:bg-[#1C1917]/60 shadow-xl">
            <div className={`absolute top-0 right-0 w-24 h-24 ${bg} blur-2xl rounded-full -mr-12 -mt-12 group-hover:blur-3xl transition-all`} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-xl ${bg} ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-[10px] font-bold text-[#A8A29E] uppercase tracking-tighter">Live Sync</div>
              </div>
              <p className="text-[#A8A29E] text-sm font-medium mb-1">{label}</p>
              <h3 className="text-3xl font-['Righteous'] text-white" suppressHydrationWarning>
                {value.toLocaleString()}
              </h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Pity & Packs */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Pity Progress Section */}
          <section className="bg-gradient-to-br from-[#1C1917] to-[#0C0A09] border border-[#44403C]/50 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-['Righteous'] text-white flex items-center gap-3">
                <Trophy className="w-6 h-6 text-[#CA8A04]" />
                Pity System
              </h2>
              <div className="text-xs text-[#A8A29E] bg-white/5 px-3 py-1 rounded-full border border-white/10 uppercase tracking-widest font-bold">Guaranteed Pulls</div>
            </div>
            
            <div className="space-y-8">
              <div>
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <p className="text-white font-semibold flex items-center gap-2">
                       Ultra Rare pity
                       <Star className="w-3 h-3 text-violet-400 fill-violet-400" />
                    </p>
                    <p className="text-xs text-[#A8A29E]">Guaranteed Ultra Rare at 50 pulls</p>
                  </div>
                  <span className="text-violet-400 font-['Righteous'] text-xl" suppressHydrationWarning>{profile?.pity_ultra ?? 0}<span className="text-[#57534E] text-sm">/50</span></span>
                </div>
                <div className="h-3 bg-black/40 rounded-full overflow-hidden border border-white/5 p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                    style={{ width: `${Math.min(((profile?.pity_ultra ?? 0) / 50) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <p className="text-white font-semibold flex items-center gap-2">
                       Secret Rare pity
                       <Sparkles className="w-3 h-3 text-orange-400 fill-orange-400" />
                    </p>
                    <p className="text-xs text-[#A8A29E]">Guaranteed Secret Rare at 100 pulls</p>
                  </div>
                  <span className="text-orange-400 font-['Righteous'] text-xl" suppressHydrationWarning>{profile?.pity_ultra ?? 1}<span className="text-[#57534E] text-sm">/100</span></span>
                </div>
                <div className="h-3 bg-black/40 rounded-full overflow-hidden border border-white/5 p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(249,115,22,0.3)]"
                    style={{ width: `${Math.min(((profile?.pity_ultra ?? 1) / 100) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Quick Open Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-['Righteous'] text-white">Recommended Packs</h2>
              <Link href="/shop" className="group flex items-center gap-2 text-[#CA8A04] text-sm font-bold hover:text-white transition-all">
                The Store
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {(packs ?? []).map((pack: any) => (
                <Link
                  key={pack.id}
                  href={`/pack-opening?packId=${pack.id}`}
                  className="group relative bg-[#1C1917]/60 border border-[#44403C]/50 rounded-2xl p-4 transition-all hover:border-[#CA8A04] hover:-translate-y-1 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-full aspect-[3/4] bg-[#292524] rounded-xl mb-4 flex items-center justify-center p-4 group-hover:scale-105 transition-transform">
                     {pack.image_url ? (
                       <img src={pack.image_url} alt={pack.name} className="w-full h-full object-contain filter drop-shadow-2xl" />
                     ) : (
                       <Package className="w-12 h-12 text-[#CA8A04] opacity-20" />
                     )}
                  </div>
                  <h3 className="font-bold text-white text-sm truncate leading-tight">{pack.name}</h3>
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="w-3 h-3 rounded-full bg-[#CA8A04]/20 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#CA8A04]" />
                    </div>
                    <p className="text-[#CA8A04] text-xs font-['Righteous']" suppressHydrationWarning>
                      {pack.cost_coins.toLocaleString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Activity Feed */}
        <section className="bg-[#1C1917]/40 backdrop-blur-lg border border-[#44403C]/50 rounded-3xl p-8 flex flex-col h-full shadow-2xl">
          <div className="flex items-center justify-between mb-8">
             <h2 className="text-xl font-['Righteous'] text-white flex items-center gap-3">
               Activity
               <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
             </h2>
             <Link href="/history" className="text-xs text-[#A8A29E] hover:text-white underline font-medium">History</Link>
          </div>

          <div className="flex-1 space-y-6">
            {recentPulls && recentPulls.length > 0 ? (
              recentPulls.map((pull: any) => (
                <div key={pull.id} className="flex items-center gap-4 group">
                  <div className="relative w-12 h-16 bg-[#292524] rounded-lg overflow-hidden flex-shrink-0 border border-white/5 transition-transform group-hover:scale-110">
                    {pull.cards?.image_url && (
                      <img src={pull.cards.image_url} alt={pull.cards.name} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-bold truncate group-hover:text-[#CA8A04] transition-colors">{pull.cards?.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-black uppercase tracking-tighter ${RARITY_COLORS[pull.cards?.rarity_tier ?? 1]}`}>
                        {pull.cards?.rarity}
                      </span>
                      <span className="text-[10px] text-[#57534E]">· {new Date(pull.pulled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  {pull.is_duplicate ? (
                    <div className="text-[10px] font-bold text-[#A8A29E] bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                      +{pull.dust_received}✨
                    </div>
                  ) : (
                    <div className="text-[10px] font-bold text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-0.5 rounded-full">
                      NEW!
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                <Sparkles className="w-12 h-12 mb-4" />
                <p className="text-sm font-medium">No recent activity</p>
                <p className="text-[11px] mt-1">Visit the store to start collecting</p>
              </div>
            )}
          </div>

          <Link
            href="/pack-opening"
            className="mt-8 w-full group flex items-center justify-center gap-3 bg-[#CA8A04] text-black font-black py-4 rounded-2xl hover:bg-[#D97706] hover:shadow-[0_0_30px_rgba(202,138,4,0.3)] transition-all"
          >
            OPEN A PACK
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </section>
      </div>
    </div>
  )
}
