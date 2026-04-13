'use client'
import { motion } from 'framer-motion'
import { Shield, Zap } from 'lucide-react'

interface PityTrackerProps {
  pityRare: number   // current pity_rare counter
  pityUltra: number  // current pity_ultra counter
}

const RARE_GUARANTEE = 10    // guaranteed rare every N pulls
const ULTRA_GUARANTEE = 30   // guaranteed ultra every N pulls

export default function PityTracker({ pityRare, pityUltra }: PityTrackerProps) {
  const rarePct  = Math.min((pityRare / RARE_GUARANTEE) * 100, 100)
  const ultraPct = Math.min((pityUltra / ULTRA_GUARANTEE) * 100, 100)

  const getRareColor = () => {
    if (rarePct >= 80) return { bar: 'from-red-500 to-orange-500', text: 'text-red-400', glow: 'shadow-[0_0_12px_rgba(239,68,68,0.5)]' }
    if (rarePct >= 50) return { bar: 'from-yellow-500 to-amber-500', text: 'text-yellow-400', glow: 'shadow-[0_0_12px_rgba(234,179,8,0.4)]' }
    return { bar: 'from-blue-500 to-cyan-500', text: 'text-blue-400', glow: '' }
  }

  const getUltraColor = () => {
    if (ultraPct >= 80) return { bar: 'from-red-500 to-pink-500', text: 'text-red-400', glow: 'shadow-[0_0_15px_rgba(239,68,68,0.6)]' }
    if (ultraPct >= 50) return { bar: 'from-orange-500 to-amber-400', text: 'text-orange-400', glow: 'shadow-[0_0_12px_rgba(249,115,22,0.5)]' }
    return { bar: 'from-violet-500 to-purple-400', text: 'text-violet-400', glow: '' }
  }

  const rareC  = getRareColor()
  const ultraC = getUltraColor()

  return (
    <motion.div
      className="bg-[#0C0A09]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 space-y-3 w-full"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Shield className="w-3.5 h-3.5 text-[#CA8A04]" />
        <span className="text-[10px] font-black text-[#A8A29E] uppercase tracking-[0.3em]">Pity Counter</span>
      </div>

      {/* Rare Pity */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[10px] font-bold text-[#A8A29E] uppercase tracking-wider flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
            Rare
          </span>
          <span className={`text-xs font-['Righteous'] ${rareC.text}`}>
            {pityRare}<span className="text-[#57534E]">/{RARE_GUARANTEE}</span>
          </span>
        </div>
        <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
          <motion.div
            className={`h-full rounded-full bg-gradient-to-r ${rareC.bar} ${rareC.glow}`}
            initial={{ width: 0 }}
            animate={{ width: `${rarePct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        {rarePct >= 80 && (
          <p className="text-[9px] text-red-400 font-bold mt-1 animate-pulse">⚡ Rare guaranteed soon!</p>
        )}
      </div>

      {/* Ultra Pity */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[10px] font-bold text-[#A8A29E] uppercase tracking-wider flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-violet-400 inline-block" />
            Ultra Rare
          </span>
          <span className={`text-xs font-['Righteous'] ${ultraC.text}`}>
            {pityUltra}<span className="text-[#57534E]">/{ULTRA_GUARANTEE}</span>
          </span>
        </div>
        <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
          <motion.div
            className={`h-full rounded-full bg-gradient-to-r ${ultraC.bar} ${ultraC.glow}`}
            initial={{ width: 0 }}
            animate={{ width: `${ultraPct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
          />
        </div>
        {ultraPct >= 80 && (
          <p className="text-[9px] text-orange-400 font-bold mt-1 animate-pulse">🌟 Ultra Rare guaranteed soon!</p>
        )}
      </div>
    </motion.div>
  )
}
