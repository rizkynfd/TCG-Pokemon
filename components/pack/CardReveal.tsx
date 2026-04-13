'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Trophy, RotateCcw, X, ArrowLeftRight } from 'lucide-react'
import CardFlip from '../cards/CardFlip'
import { useRouter } from 'next/navigation'
import { useSound, SFX } from '@/hooks/useSound'

interface CardRevealProps {
  cards: any[]
  onComplete: () => void
  onPlayAgain?: () => void
}

export default function CardReveal({ cards, onComplete, onPlayAgain }: CardRevealProps) {
  const router = useRouter()
  const { play } = useSound()
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set())
  const [focusedId, setFocusedId] = useState<string | null>(null)

  // Calculate the PREMIUM ARC positions (Fan-fan layout)
  // We lift them higher so they never 'peek' from below
  const arcPositions = useMemo(() => {
    const total = cards.length
    const spread = Math.min(110, total * 12) // Slightly tighter for better focus
    return cards.map((_, i) => {
      const angle = (i / (total - 1 || 1)) * spread - (spread / 2)
      const radius = 500 // Large radius for a majestic curve
      const x = Math.sin(angle * (Math.PI / 180)) * radius
      // Lifted Y to ensure cards are in the vertical center of the viewport
      const y = (1 - Math.cos(angle * (Math.PI / 180))) * radius - 120 
      return { x, y, rotate: angle }
    })
  }, [cards.length])

  const handleCardClick = (id: string, index: number) => {
    if (!revealedIndices.has(index)) {
      play(SFX.FLIP, 0.6)
      setRevealedIndices(prev => {
        const next = new Set(prev)
        next.add(index)
        return next
      })
      return
    }
    
    // Play subtle sound when focusing/toggling
    play(SFX.REVEAL, 0.3)
    
    // Toggle focus for inspection
    setFocusedId(focusedId === id ? null : id)
  }

  const revealAll = () => {
    play(SFX.SWISH, 0.4) // Play a swish for the batch action
    const all = new Set(cards.map((_, i) => i))
    setRevealedIndices(all)
  }

  const handleCollectionClick = () => {
    // Force direct window location change to ensure it bypasses any potential navigation blockers
    if (typeof onComplete === 'function') {
      onComplete()
    }
    window.location.href = '/collection'
  }

  const isAllRevealed = revealedIndices.size === cards.length
  const totalDust = useMemo(() => cards.reduce((sum, c) => (c.isDuplicate ? sum + (c.dustReceived || 0) : sum), 0), [cards])
  const hasPity = cards.some(c => c.isPity)

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-between bg-black/98 backdrop-blur-3xl overflow-hidden font-['Outfit']">
      
      {/* Premium Header */}
      <motion.div 
        className="w-full pt-12 px-8 flex flex-col items-center z-50 pointer-events-none"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4 mb-2">
          <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#CA8A04]" />
          <h1 className="text-[12px] font-black tracking-[0.6em] text-[#CA8A04] uppercase">
            {isAllRevealed ? 'REVEAL COMPLETE' : 'PULLING CARDS...'}
          </h1>
          <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#CA8A04]" />
        </div>
        
        {isAllRevealed && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-8 mt-2">
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Shinedust</span>
              <span className="text-2xl font-['Righteous'] text-white">+{totalDust} ✨</span>
            </div>
            {hasPity && <div className="h-10 w-[1px] bg-white/10" />}
            {hasPity && (
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">GUARANTEED</span>
                <span className="text-xl font-['Righteous'] text-orange-400">PITY BREAK</span>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* MAJESTIC ARC AREA */}
      <div className="relative flex-1 w-full flex items-center justify-center overflow-visible">
        
        {!isAllRevealed && (
          <motion.div 
            className="absolute top-[20%] left-1/2 -translate-x-1/2 text-center z-20 pointer-events-none flex flex-col items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ArrowLeftRight className="w-5 h-5 text-[#CA8A04] mb-2" />
            <p className="text-[#CA8A04] text-[10px] font-black tracking-[0.4em] uppercase">
              Swipe or Tap Cards
            </p>
          </motion.div>
        )}

        <AnimatePresence mode="popLayout">
          {cards.map((cardData, i) => {
            const isRevealed = revealedIndices.has(i);
            const pos = arcPositions[i];
            const isFocused = focusedId === cardData.card.id;

            return (
              <motion.div
                key={`arc-card-${i}-${cardData.card.id}`}
                className="absolute"
                style={{ zIndex: isFocused ? 100 : 10 + i }}
                initial={{ opacity: 0, y: 150, scale: 0.2, rotate: 0 }}
                animate={{ 
                  x: isFocused ? 0 : pos.x,
                  y: isFocused ? -80 : pos.y,
                  rotate: isFocused ? 0 : pos.rotate,
                  scale: isFocused ? 1.4 : 1,
                  opacity: 1
                }}
                transition={{
                  type: 'spring',
                  stiffness: isFocused ? 180 : 90,
                  damping: isFocused ? 22 : 18,
                  delay: isFocused ? 0 : i * 0.08
                }}
              >
                {/* Rarity Glow for Secret Rares */}
                {cardData.card.rarity_tier >= 4 && (
                  <motion.div 
                    className={`absolute -inset-8 blur-3xl opacity-30 rounded-full z-0 ${
                      cardData.card.rarity_tier >= 5 ? 'bg-orange-500' : 'bg-cyan-500'
                    }`}
                    animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                )}

                <CardFlip
                  cardData={cardData}
                  isRevealed={isRevealed}
                  index={i}
                  size="md"
                  onClick={() => handleCardClick(cardData.card.id, i)}
                  isInspecting={isFocused}
                />
                
                {isRevealed && !cardData.isDuplicate && (
                  <motion.div 
                    className="absolute -top-3 -right-3 bg-green-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full z-30 shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                    initial={{ scale: 0, rotate: 10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', damping: 12 }}
                  >
                    NEW!
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Control Actions */}
      <footer className="w-full pb-16 px-8 flex flex-col items-center gap-6 z-50">
        <div className="flex gap-4">
          {!isAllRevealed && (
            <button
              onClick={revealAll}
              className="px-12 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white text-[10px] font-black tracking-[0.4em] uppercase transition-all backdrop-blur-md"
            >
              Flip All
            </button>
          )}

          {isAllRevealed && (
            <motion.div className="flex gap-4" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
              {onPlayAgain && (
                <button
                  onClick={onPlayAgain}
                  className="px-10 py-4 bg-white text-black rounded-full text-[10px] font-black tracking-[0.3em] uppercase transition-all flex items-center gap-3 hover:scale-105 active:scale-95"
                >
                  <RotateCcw className="w-4 h-4" />
                  RETRY
                </button>
              )}
              <button
                onClick={handleCollectionClick}
                className="px-10 py-4 bg-[#CA8A04] text-black rounded-full text-[10px] font-black tracking-[0.3em] uppercase transition-all flex items-center gap-3 hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(202,138,4,0.4)]"
              >
                BINDER
                <Trophy className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-32 h-[1px] bg-white/5" />
          <p className="text-[9px] font-bold text-white/30 tracking-[0.2em] uppercase">
            {revealedIndices.size} OF {cards.length} REVEALED
          </p>
          <div className="w-32 h-[1px] bg-white/5" />
        </div>
      </footer>

      {/* Focus Overlay */}
      <AnimatePresence>
        {focusedId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md z-[90] cursor-zoom-out"
            onClick={() => setFocusedId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
