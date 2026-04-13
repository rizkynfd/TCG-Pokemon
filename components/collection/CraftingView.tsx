// @ts-nocheck
'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { Sparkles, Lock, ChevronRight, Search, Info } from 'lucide-react'
import Image from 'next/image'

interface Card {
  id: string
  name: string
  rarity: string
  rarity_tier: number
  image_url: string
  dust_value: number
  set_name: string
  type: string | null
}

interface CraftingViewProps {
  dust: number
  craftableCards: Card[]
  ownedCardIds: string[]
}

const CRAFT_COST: Record<number, number> = {
  1: 25,
  2: 75,
  3: 200,
  4: 600,
  5: 1800,
}

const RARITY_CONFIG: Record<number, { label: string; color: string; borderColor: string }> = {
  1: { label: 'Common',      color: 'text-gray-400',   borderColor: '#57534E' },
  2: { label: 'Uncommon',    color: 'text-green-400',  borderColor: '#16A34A' },
  3: { label: 'Rare',        color: 'text-blue-400',   borderColor: '#2563EB' },
  4: { label: 'Ultra Rare',  color: 'text-violet-400', borderColor: '#9333EA' },
  5: { label: 'Secret Rare', color: 'text-orange-400', borderColor: '#EA580C' },
}

export default function CraftingView({ dust, craftableCards, ownedCardIds }: CraftingViewProps) {
  const [search, setSearch] = useState('')
  const [rarityFilter, setRarityFilter] = useState(0)
  const [crafting, setCrafting] = useState<string | null>(null)
  const [justCrafted, setJustCrafted] = useState<string[]>([])
  const [currentDust, setCurrentDust] = useState(dust)
  const [showConfirm, setShowConfirm] = useState<Card | null>(null)

  const filtered = craftableCards
    .filter(c => !ownedCardIds.includes(c.id)) // only show unowned
    .filter(c => {
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase())
      const matchRarity = rarityFilter === 0 || c.rarity_tier === rarityFilter
      return matchSearch && matchRarity
    })
    .sort((a, b) => b.rarity_tier - a.rarity_tier)

  const handleCraft = async (card: Card) => {
    const cost = CRAFT_COST[card.rarity_tier] ?? 200
    if (currentDust < cost) return

    setCrafting(card.id)
    try {
      const res = await fetch('/api/craft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: card.id }),
      })
      const data = await res.json()
      if (data.success) {
        setCurrentDust(d => d - cost)
        setJustCrafted(prev => [...prev, card.id])
        setShowConfirm(null)
      }
    } finally {
      setCrafting(null)
    }
  }

  return (
    <div className="min-h-screen p-4 lg:p-6 max-w-6xl mx-auto">

      {/* Header */}
      <motion.div
        className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 gap-4"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="font-['Righteous'] text-3xl text-[#CA8A04] neon-gold flex items-center gap-2">
            <Sparkles className="w-7 h-7" />
            Crafting
          </h1>
          <p className="text-[#A8A29E] mt-1">Use dust to craft cards you don't own yet</p>
        </div>

        {/* Dust Balance */}
        <div className="bg-[#1C1917] border border-[#44403C] rounded-xl px-5 py-3 flex items-center gap-3">
          <span className="text-2xl">✨</span>
          <div>
            <p className="text-[#A8A29E] text-xs">Available Dust</p>
            <p className="font-['Righteous'] text-2xl text-violet-400" suppressHydrationWarning>{currentDust.toLocaleString()}</p>
          </div>
        </div>
      </motion.div>

      {/* Craft cost reference */}
      <motion.div
        className="bg-[#1C1917] border border-[#44403C] rounded-xl p-4 mb-6 flex flex-wrap gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 0.1 } }}
      >
        <div className="flex items-center gap-1 text-xs text-[#A8A29E]">
          <Info className="w-3 h-3" />
          <span>Craft cost:</span>
        </div>
        {Object.entries(CRAFT_COST).map(([tier, cost]) => {
          const config = RARITY_CONFIG[Number(tier)]
          return (
            <div key={tier} className="flex items-center gap-1 text-xs">
              <span className={config?.color}>{config?.label}</span>
              <span className="text-[#A8A29E]">= {cost} ✨</span>
            </div>
          )
        })}
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A29E]" />
          <input
            type="text"
            placeholder="Search cards..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#1C1917] border border-[#44403C] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-[#57534E] focus:outline-none focus:border-[#CA8A04]"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {[{ label: 'All', value: 0 }, ...Object.entries(RARITY_CONFIG).map(([t, c]) => ({ label: c.label, value: Number(t) }))].map(r => (
            <button
              key={r.value}
              onClick={() => setRarityFilter(r.value)}
              className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                rarityFilter === r.value
                  ? 'bg-[#CA8A04] text-black'
                  : 'bg-[#1C1917] border border-[#44403C] text-[#A8A29E] hover:border-[#CA8A04]/50'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-20">
          <Sparkles className="w-16 h-16 text-[#44403C] mx-auto mb-4" />
          <p className="font-['Righteous'] text-xl text-white mb-2">No cards to craft</p>
          <p className="text-[#A8A29E]">You might already own all filtered cards, or try adjusting the search.</p>
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {filtered.map((card, i) => {
          const cost = CRAFT_COST[card.rarity_tier] ?? 200
          const config = RARITY_CONFIG[card.rarity_tier]
          const canAfford = currentDust >= cost
          const isCrafted = justCrafted.includes(card.id)
          const isThisCrafting = crafting === card.id

          return (
            <motion.div
              key={card.id}
              className={`relative rounded-xl overflow-hidden border-2 group ${
                isCrafted ? 'border-green-500' : canAfford ? 'border-[#44403C] hover:border-[#CA8A04]' : 'border-[#292524] opacity-50'
              }`}
              style={!isCrafted && canAfford ? { '--hover-border': config?.borderColor } as any : undefined}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(i * 0.015, 0.3) }}
            >
              {/* Card image */}
              <div className="relative aspect-[3/4]">
                <Image src={card.image_url} alt={card.name} fill className="object-cover" sizes="120px" />
                {!canAfford && !isCrafted && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-[#A8A29E]" />
                  </div>
                )}
                {isCrafted && (
                  <div className="absolute inset-0 bg-green-900/70 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-green-400" />
                  </div>
                )}
              </div>

              {/* Bottom info */}
              <div className="p-2 bg-[#1C1917]">
                <p className="text-white text-[10px] font-semibold truncate">{card.name}</p>
                <p className={`text-[9px] ${config?.color}`}>{config?.label}</p>
                <button
                  onClick={() => canAfford && !isCrafted && setShowConfirm(card)}
                  disabled={!canAfford || isCrafted || isThisCrafting}
                  className={`w-full mt-1.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    isCrafted
                      ? 'bg-green-600 text-white cursor-default'
                      : canAfford
                        ? 'bg-[#CA8A04]/20 text-[#CA8A04] hover:bg-[#CA8A04] hover:text-black border border-[#CA8A04]/40'
                        : 'bg-[#292524] text-[#57534E] cursor-not-allowed'
                  }`}
                >
                  {isCrafted ? '✓ Crafted' : isThisCrafting ? '...' : `${cost} ✨`}
                </button>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Confirm Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowConfirm(null)}
          >
            <motion.div
              className="bg-[#1C1917] border border-violet-800/60 rounded-2xl p-6 max-w-sm w-full"
              initial={{ scale: 0.85, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex gap-4 mb-4">
                <div className="w-24 h-32 relative rounded-lg overflow-hidden flex-shrink-0">
                  <Image src={showConfirm.image_url} alt={showConfirm.name} fill className="object-cover" sizes="96px" />
                </div>
                <div>
                  <p className="font-['Righteous'] text-lg text-white">{showConfirm.name}</p>
                  <p className={`text-sm ${RARITY_CONFIG[showConfirm.rarity_tier]?.color}`}>
                    {RARITY_CONFIG[showConfirm.rarity_tier]?.label}
                  </p>
                  <p className="text-[#A8A29E] text-xs mt-1">{showConfirm.set_name}</p>
                  <div className="mt-3 bg-[#292524] rounded-lg px-3 py-2">
                    <p className="text-[#A8A29E] text-xs">Craft Cost</p>
                    <p className="font-['Righteous'] text-xl text-violet-400">
                      {CRAFT_COST[showConfirm.rarity_tier]} ✨
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-[#A8A29E] text-sm mb-4">
                Are you sure you want to craft <span className="text-white font-semibold">{showConfirm.name}</span>?
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirm(null)} className="flex-1 btn-secondary text-sm">
                  Cancel
                </button>
                <button
                  onClick={() => handleCraft(showConfirm)}
                  disabled={crafting === showConfirm.id}
                  className="flex-1 btn-primary text-sm flex items-center justify-center gap-2"
                >
                  {crafting === showConfirm.id ? '...' : <><Sparkles className="w-4 h-4" /> Craft!</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
