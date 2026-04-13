// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CheckCircle, Clock, Gift, Target, Zap, BookOpen, Package } from 'lucide-react'

export const metadata = {
  title: 'Quests — PokéVault TCG',
  description: 'Complete daily and weekly quests to earn coins and gems.',
}

type QuestStatus = 'completed' | 'active' | 'locked'

interface Quest {
  id: string
  title: string
  description: string
  reward_coins: number
  reward_gems: number
  progress: number
  target: number
  type: 'daily' | 'weekly'
  status: QuestStatus
  icon: string
}

const QUEST_TEMPLATES: Omit<Quest, 'status' | 'progress'>[] = [
  { id: 'q_open_1',   title: 'First Pull',       description: 'Open 1 pack today',             reward_coins: 50,   reward_gems: 0, target: 1,  type: 'daily',  icon: '📦' },
  { id: 'q_open_3',   title: 'Pack Addict',       description: 'Open 3 packs today',            reward_coins: 150,  reward_gems: 0, target: 3,  type: 'daily',  icon: '🎴' },
  { id: 'q_login',    title: 'Daily Login',        description: 'Login and claim daily reward',  reward_coins: 30,   reward_gems: 0, target: 1,  type: 'daily',  icon: '📅' },
  { id: 'q_rare_1',   title: 'Lucky Draw',         description: 'Pull 1 Rare or higher card',   reward_coins: 200,  reward_gems: 2, target: 1,  type: 'daily',  icon: '⭐' },
  { id: 'q_w_open_10',title: 'Dedicated Trainer',  description: 'Open 10 packs this week',      reward_coins: 500,  reward_gems: 5, target: 10, type: 'weekly', icon: '🏆' },
  { id: 'q_w_col_50', title: 'Card Collector',     description: 'Own at least 50 unique cards',  reward_coins: 300,  reward_gems: 3, target: 50, type: 'weekly', icon: '📖' },
  { id: 'q_w_streak', title: 'Streak Master',      description: 'Login 7 days in a row',        reward_coins: 1000, reward_gems: 10,target: 7, type: 'weekly', icon: '🔥' },
]

function QuestCard({ quest }: { quest: Quest }) {
  const pct = Math.min((quest.progress / quest.target) * 100, 100)
  const isDone = quest.status === 'completed'

  return (
    <div className={`bg-[#1C1917] border rounded-xl p-4 transition-all ${
      isDone ? 'border-green-700/60 opacity-75' : 'border-[#44403C] hover:border-[#CA8A04]/40'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="text-2xl flex-shrink-0">{quest.icon}</span>
          <div className="min-w-0">
            <p className={`font-semibold text-sm ${isDone ? 'text-green-400 line-through' : 'text-white'}`}>
              {quest.title}
            </p>
            <p className="text-[#A8A29E] text-xs mt-0.5">{quest.description}</p>
          </div>
        </div>
        <div className="flex-shrink-0 flex flex-col items-end gap-1">
          {quest.reward_coins > 0 && (
            <span className="text-[#CA8A04] text-xs font-semibold">+{quest.reward_coins} ⚡</span>
          )}
          {quest.reward_gems > 0 && (
            <span className="text-blue-400 text-xs font-semibold">+{quest.reward_gems} 💎</span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="flex justify-between text-[10px] text-[#A8A29E] mb-1">
          <span>Progress</span>
          <span>{quest.progress}/{quest.target}</span>
        </div>
        <div className="h-1.5 bg-[#292524] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isDone ? 'bg-green-500' : 'bg-gradient-to-r from-[#CA8A04] to-[#D97706]'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {isDone && (
        <div className="mt-2 flex items-center gap-1 text-green-400 text-xs font-semibold">
          <CheckCircle className="w-3 h-3" />
          Completed!
        </div>
      )}
    </div>
  )
}

export default async function QuestPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('total_pulls, coins, gems, streak_days, last_daily_claimed')
    .eq('id', user.id)
    .single()

  const { count: ownedCards } = await supabase
    .from('inventory')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const today = new Date()
  const lastClaimed = profile?.last_daily_claimed ? new Date(profile.last_daily_claimed) : null
  const claimedToday = lastClaimed && (
    lastClaimed.getUTCFullYear() === today.getUTCFullYear() &&
    lastClaimed.getUTCMonth() === today.getUTCMonth() &&
    lastClaimed.getUTCDate() === today.getUTCDate()
  )

  // Simulate quest progress based on real data
  const totalPulls = profile?.total_pulls ?? 0
  const streakDays = profile?.streak_days ?? 0
  const cards = ownedCards ?? 0

  const quests: Quest[] = QUEST_TEMPLATES.map(q => {
    let progress = 0
    let status: QuestStatus = 'active'

    switch (q.id) {
      case 'q_open_1':   progress = Math.min(totalPulls > 0 ? 1 : 0, 1); break
      case 'q_open_3':   progress = Math.min(totalPulls, 3); break
      case 'q_login':    progress = claimedToday ? 1 : 0; break
      case 'q_rare_1':   progress = 0; break // would need pull_history query
      case 'q_w_open_10':progress = Math.min(totalPulls, 10); break
      case 'q_w_col_50': progress = Math.min(cards, 50); break
      case 'q_w_streak': progress = Math.min(streakDays, 7); break
    }

    if (progress >= q.target) status = 'completed'

    return { ...q, progress, status }
  })

  const daily = quests.filter(q => q.type === 'daily')
  const weekly = quests.filter(q => q.type === 'weekly')
  const completed = quests.filter(q => q.status === 'completed').length
  const total = quests.length

  return (
    <div className="min-h-screen p-4 lg:p-6 max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-['Righteous'] text-3xl text-[#CA8A04] neon-gold flex items-center gap-2">
          <Target className="w-7 h-7" />
          Quests
        </h1>
        <p className="text-[#A8A29E] mt-1">Complete quests to earn extra rewards!</p>
      </div>

      {/* Overall Progress */}
      <div className="bg-[#1C1917] border border-[#44403C] rounded-xl p-5 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-white font-semibold">Today's Progress</span>
          <span className="font-['Righteous'] text-[#CA8A04]">{completed}/{total}</span>
        </div>
        <div className="h-2 bg-[#292524] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#CA8A04] to-[#D97706] rounded-full transition-all"
            style={{ width: `${(completed / total) * 100}%` }}
          />
        </div>
        {completed === total && (
          <p className="text-green-400 text-sm font-semibold mt-2 flex items-center gap-1">
            <CheckCircle className="w-4 h-4" />
            All quests completed! Amazing work!
          </p>
        )}
      </div>

      {/* Daily Quests */}
      <div className="mb-8">
        <h2 className="font-['Righteous'] text-lg text-white mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#CA8A04]" />
          Daily Quests
          <span className="text-[#A8A29E] text-xs font-normal ml-auto">Resets midnight UTC</span>
        </h2>
        <div className="space-y-3">
          {daily.map(q => <QuestCard key={q.id} quest={q} />)}
        </div>
      </div>

      {/* Weekly Quests */}
      <div>
        <h2 className="font-['Righteous'] text-lg text-white mb-3 flex items-center gap-2">
          <Gift className="w-4 h-4 text-blue-400" />
          Weekly Quests
          <span className="text-[#A8A29E] text-xs font-normal ml-auto">Resets Monday UTC</span>
        </h2>
        <div className="space-y-3">
          {weekly.map(q => <QuestCard key={q.id} quest={q} />)}
        </div>
      </div>
    </div>
  )
}
