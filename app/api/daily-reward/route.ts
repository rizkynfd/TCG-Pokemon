// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Daily reward amounts
const DAILY_REWARD = {
  coins: 100,
  streak_bonus_coins: 25,   // extra per streak day (up to day 7)
  max_streak_bonus: 7,
  gems_at_streak_7: 5,      // bonus gems on 7-day milestone
}

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('coins, gems, streak_days, last_daily_claimed')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const now = new Date()
  const lastClaimed = profile.last_daily_claimed ? new Date(profile.last_daily_claimed) : null

  // Check if already claimed today
  if (lastClaimed) {
    const sameDay =
      lastClaimed.getUTCFullYear() === now.getUTCFullYear() &&
      lastClaimed.getUTCMonth()    === now.getUTCMonth() &&
      lastClaimed.getUTCDate()     === now.getUTCDate()
    if (sameDay) {
      return NextResponse.json({ error: 'Already claimed today!' }, { status: 400 })
    }
  }

  // Calculate streak
  let newStreak = 1
  if (lastClaimed) {
    const daysDiff = Math.floor((now.getTime() - lastClaimed.getTime()) / (1000 * 60 * 60 * 24))
    newStreak = daysDiff <= 1 ? Math.min(profile.streak_days + 1, 999) : 1
  }

  // Calculate rewards
  const streakMultiplier = Math.min(newStreak, DAILY_REWARD.max_streak_bonus)
  const coinsEarned = DAILY_REWARD.coins + (streakMultiplier - 1) * DAILY_REWARD.streak_bonus_coins
  const gemsEarned  = newStreak % 7 === 0 ? DAILY_REWARD.gems_at_streak_7 : 0

  // Update profile
  await admin.from('profiles').update({
    coins: profile.coins + coinsEarned,
    gems: profile.gems + gemsEarned,
    streak_days: newStreak,
    last_daily_claimed: now.toISOString(),
  }).eq('id', user.id)

  // Log transaction
  await admin.from('transactions').insert({
    user_id: user.id,
    type: 'daily_reward',
    coins_delta: coinsEarned,
    gems_delta: gemsEarned,
    description: `Day ${newStreak} daily reward`,
    metadata: { streak: newStreak, coins: coinsEarned, gems: gemsEarned },
  })

  return NextResponse.json({
    success: true,
    coinsEarned,
    gemsEarned,
    newStreak,
  })
}
