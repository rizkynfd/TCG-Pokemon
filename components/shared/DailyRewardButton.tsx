'use client'
import { useState } from 'react'
import { Gift, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

interface Props {
  canClaim: boolean
  streak: number
}

export default function DailyRewardButton({ canClaim, streak }: Props) {
  const [isClaiming, setIsClaiming] = useState(false)
  const [claimResult, setClaimResult] = useState<{ coins: number; gems: number; newStreak: number } | null>(null)
  const router = useRouter()

  const handleClaim = async () => {
    if (!canClaim || isClaiming) return

    setIsClaiming(true)
    try {
      const res = await fetch('/api/daily-reward', { method: 'POST' })
      const data = await res.json()

      if (data.success) {
        setClaimResult({
          coins: data.coinsEarned,
          gems: data.gemsEarned,
          newStreak: data.newStreak,
        })
        router.refresh()
      } else {
        console.error(data.error)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsClaiming(false)
    }
  }

  return (
    <>
      <motion.button
        onClick={handleClaim}
        disabled={!canClaim || isClaiming}
        className={`relative overflow-hidden flex flex-col items-center justify-center px-6 py-3 rounded-xl border-2 transition-all group min-w-[140px]
          ${canClaim 
            ? 'bg-gradient-to-b from-[#1C1917] to-[#CA8A04]/20 border-[#CA8A04] hover:shadow-[0_0_20px_rgba(202,138,4,0.4)] cursor-pointer' 
            : 'bg-[#1C1917] border-[#44403C] opacity-60 cursor-not-allowed'
          }
        `}
        whileHover={canClaim ? { scale: 1.05 } : {}}
        whileTap={canClaim ? { scale: 0.95 } : {}}
      >
        {/* Shimmer effect for available reward */}
        {canClaim && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
            animate={{ x: ['-200%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
          />
        )}

        <div className="flex items-center gap-2 mb-1 z-10">
          {canClaim ? (
            <Gift className="w-5 h-5 text-[#CA8A04] animate-pulse-gold inline-block" />
          ) : (
            <CheckCircle className="w-5 h-5 text-green-500" />
          )}
          <span className={`font-['Righteous'] ${canClaim ? 'text-[#CA8A04]' : 'text-[#A8A29E]'}`}>
            {canClaim ? 'Claim Daily' : 'Claimed'}
          </span>
        </div>
        <span className="text-[10px] text-[#A8A29E] z-10">
          {canClaim ? 'Bonus available now!' : `Next reward in 24h`}
        </span>
      </motion.button>

      {/* Claim Result Modal */}
      <AnimatePresence>
        {claimResult && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setClaimResult(null)}
          >
            <motion.div
              className="bg-[#1C1917] border border-[#CA8A04] rounded-2xl p-8 max-w-sm w-full text-center glow-gold"
              initial={{ scale: 0.8, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 30 }}
              onClick={e => e.stopPropagation()}
            >
              <motion.div
                initial={{ rotate: -10, scale: 0.5 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', damping: 10 }}
                className="w-20 h-20 bg-[#CA8A04]/20 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <Gift className="w-10 h-10 text-[#CA8A04]" />
              </motion.div>
              
              <h2 className="font-['Righteous'] text-2xl text-[#CA8A04] neon-gold mb-2">Daily Reward!</h2>
              <p className="text-white mb-6">You're on a <span className="font-bold text-orange-400">{claimResult.newStreak} day</span> streak!</p>
              
              <div className="bg-[#292524] rounded-xl p-4 flex justify-around mb-6">
                <div className="flex flex-col items-center">
                  <span className="text-xs text-[#A8A29E] mb-1">Earned</span>
                  <span className="font-['Righteous'] text-xl text-[#CA8A04]">+{claimResult.coins} ⚡</span>
                </div>
                {claimResult.gems > 0 && (
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-[#A8A29E] mb-1">Bonus</span>
                    <span className="font-['Righteous'] text-xl text-blue-400">+{claimResult.gems} 💎</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => setClaimResult(null)}
                className="w-full btn-primary"
              >
                Awesome!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
