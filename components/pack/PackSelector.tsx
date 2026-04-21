'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Gem, Lock, Sparkles, ChevronRight, Info, Package } from 'lucide-react'
import PityTracker from './PityTracker'
import Image from 'next/image'
import { useState } from 'react'
import BoosterPack3D, { PackVariant } from './BoosterPack3D'

interface Pack {
  id: string
  name: string
  description: string | null
  image_url: string | null
  cost_coins: number
  cost_gems: number
  cards_count: number
  is_limited: boolean
  limited_until: string | null
  is_active: boolean
  set_filter?: string[] | null
}

interface PackSelectorProps {
  packs: Pack[]
  selectedPackId: string | null
  profile: { coins: number; gems: number; pity_rare?: number; pity_ultra?: number } | null
  onSelect: (packId: string) => void
  onSelectWithCount: (packId: string, count: number) => void
  onOpen: () => void
  isLoading: boolean
}

export default function PackSelector({ packs, selectedPackId, profile, onSelect, onSelectWithCount, onOpen, isLoading }: PackSelectorProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const selectedPack = packs.find(p => p.id === selectedPackId)
  
  // Local state for quantity in the selector before opening
  const [quantity, setQuantity] = useState(1)

  const canAfford = (pack: Pack, qty: number = 1) => {
    if (!profile) return false
    const totalGems = pack.cost_gems * qty
    const totalCoins = pack.cost_coins * qty
    if (pack.cost_gems > 0) return profile.gems >= totalGems
    return profile.coins >= totalCoins
  }

  // Helper to determine variant and custom artwork
  const getPackData = (pack: Pack) => {
    const n = pack.name.toLowerCase()
    
    // Special named packs
    if (n.includes('genetic apex')) {
      if (n.includes('mewtwo')) return { variant: 'mewtwo' as const, image: '/images/packs/mewtwo_genetic_apex.png' }
      if (n.includes('charizard')) return { variant: 'charizard' as const, image: '/images/packs/charizard_genetic_apex.png' }
      if (n.includes('pikachu')) return { variant: 'pikachu' as const, image: '/images/packs/pikachu_genetic_apex.png' }
    }

    // Color-assign by keywords for visual variety
    if (n.includes('scarlet') || n.includes('fire') || n.includes('obsidian') || n.includes('charizard') || n.includes('paradox')) {
      return { variant: 'charizard' as const, image: pack.image_url || '' }
    }
    if (n.includes('pikachu') || n.includes('pika') || n.includes('brilliant') || n.includes('lost') || n.includes('crown')) {
      return { variant: 'pikachu' as const, image: pack.image_url || '' }
    }
    if (n.includes('violet') || n.includes('paldea') || n.includes('mewtwo') || n.includes('shadow') || n.includes('darkness')) {
      return { variant: 'mewtwo' as const, image: pack.image_url || '' }
    }

    // Default blue
    return { variant: 'standard' as const, image: pack.image_url || '' }
  }

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto px-4 py-8 pb-32">

      {/* Hero Section */}
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-['Righteous'] text-5xl lg:text-7xl text-[#CA8A04] neon-gold mb-4 tracking-tight">
          BOOSTER SHOP
        </h1>
        <p className="text-[#A8A29E] text-lg max-w-2xl mx-auto">
          Sync directly with the official TCG API. Collect the rarest cards from over 25 recent sets.
        </p>
      </motion.div>

      {/* Currency & Stats Bar */}
      {profile && (
        <motion.div
          className="flex flex-wrap justify-center gap-4 mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 0.2 } }}
        >
          <div className="flex items-center gap-3 bg-[#1C1917]/80 backdrop-blur-md border border-[#44403C] rounded-2xl px-6 py-3 shadow-xl">
            <div className="w-8 h-8 rounded-full bg-[#CA8A04]/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-[#CA8A04]" />
            </div>
            <div>
              <p className="text-sm text-[#A8A29E] font-medium leading-none mb-1">Total Coins</p>
              <p className="font-['Righteous'] text-lg text-[#CA8A04]" suppressHydrationWarning>
                {profile.coins.toLocaleString('en-US')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-[#1C1917]/80 backdrop-blur-md border border-[#44403C] rounded-2xl px-6 py-3 shadow-xl">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Gem className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-[#A8A29E] font-medium leading-none mb-1">Rare Gems</p>
              <p className="font-['Righteous'] text-lg text-blue-400" suppressHydrationWarning>
                {profile.gems.toLocaleString('en-US')}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Packs Grid — portrait booster pack layout */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 lg:gap-6">
        {packs.map((pack) => {
          const isSelected = selectedPackId === pack.id
          const isHovered = hoveredId === pack.id
          const packData = getPackData(pack)
          const affordable = canAfford(pack)
          
          // SOLD OUT LOGIC: If set_filter exists but is empty, or explicitly flagged
          // (For now, we treat specific IDs or empty set_filters as out of stock if they return 0 cards)
          // SOLD OUT LOGIC: 
          // 1. If set_filter is an empty array [] -> Guaranteed Empty
          // 2. If cards_count is 0 -> Empty
          const isOutOfStock = !!(pack.set_filter && Array.isArray(pack.set_filter) && pack.set_filter.length === 0) || pack.cards_count === 0

          return (
            <div key={pack.id} className={`relative transition-all duration-500 ${isOutOfStock ? 'grayscale opacity-60' : ''}`}>
              <BoosterPack3D
                variant={packData.variant}
                name={pack.name}
                imageUrl={packData.image}
                logoUrl={pack.set_filter?.[0] ? `https://images.pokemontcg.io/${pack.set_filter[0]}/logo.png` : null}
                isSelected={isSelected}
                isHovered={isHovered}
                onClick={() => !isOutOfStock && onSelect(pack.id)}
                disabled={(!affordable && !isSelected) || isOutOfStock}
              />

              {/* Sold Out Label */}
              {isOutOfStock && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
                  <div className="bg-red-600/90 text-white px-4 py-1 rounded-full font-black text-[10px] tracking-widest uppercase shadow-[0_0_20px_rgba(220,38,38,0.5)] border border-red-400/50 -rotate-12">
                    STOK KOSONG
                  </div>
                </div>
              )}

              {/* Interaction Hooks */}
              <div 
                className={`absolute inset-0 z-[25] ${isOutOfStock ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                onMouseEnter={() => !isOutOfStock && setHoveredId(pack.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => !isOutOfStock && onSelect(pack.id)}
              />

              {/* Pack Details Info (Visible on Hover) */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    className="absolute -bottom-16 left-0 right-0 z-20 pointer-events-none"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="bg-[#1C1917] border border-[#44403C] rounded-lg p-3 shadow-2xl text-[10px] text-[#A8A29E] text-center">
                      {pack.description}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>

      {/* Floating Action Menu (Sticky Bottom) */}
      <AnimatePresence>
        {selectedPack && (
          <motion.div
            className="fixed bottom-28 lg:bottom-8 left-1/2 -translate-x-1/2 z-[70] w-full max-w-lg px-4"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
          >
            <div className="bg-[#1C1917]/95 backdrop-blur-xl border border-[#CA8A04]/40 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#CA8A04]/10 border border-[#CA8A04]/20 flex items-center justify-center shrink-0">
                    {selectedPack.image_url ? (
                      <div className="relative w-7 h-7 sm:w-8 sm:h-8">
                        <Image src={selectedPack.image_url} alt="" fill className="object-contain" />
                      </div>
                    ) : (
                      <Package className="w-5 h-5 sm:w-6 sm:h-6 text-[#CA8A04]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-['Righteous'] text-white leading-none mb-1 text-sm sm:text-base truncate">{selectedPack.name}</h4>
                    <p className="text-[10px] sm:text-xs text-[#A8A29E]">Selected for opening</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs sm:text-sm font-bold" style={{ color: selectedPack.cost_gems > 0 ? '#60A5FA' : '#CA8A04' }} suppressHydrationWarning>
                    {selectedPack.cost_gems > 0 
                      ? `${(selectedPack.cost_gems * quantity).toLocaleString('en-US')} Gems` 
                      : `${(selectedPack.cost_coins * quantity).toLocaleString('en-US')} Coins`}
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-[#A8A29E]" suppressHydrationWarning>
                    Bal: {selectedPack.cost_gems > 0 ? profile?.gems.toLocaleString('en-US') : profile?.coins.toLocaleString('en-US')}
                  </p>
                </div>
              </div>

              {/* Pity Tracker HUD */}
              <div className="mb-3 sm:mb-4">
                <PityTracker
                  pityRare={profile?.pity_rare ?? 0}
                  pityUltra={profile?.pity_ultra ?? 0}
                />
              </div>

              {/* Quantity Selection */}
              <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4 bg-black/40 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-white/5">
                {[1, 5, 10].map((num) => {
                  const affordable = canAfford(selectedPack, num)
                  const isQtySelected = quantity === num
                  return (
                    <button
                      key={num}
                      disabled={!affordable}
                      onClick={() => {
                        setQuantity(num)
                        onSelectWithCount(selectedPack.id, num)
                      }}
                      className={`
                        flex-1 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black transition-all border
                        ${isQtySelected 
                          ? 'bg-[#CA8A04] text-black border-[#CA8A04] shadow-[0_0_15px_rgba(202,138,4,0.3)]' 
                          : affordable 
                            ? 'bg-white/5 text-[#A8A29E] border-white/5 hover:bg-white/10 hover:text-white'
                            : 'bg-transparent text-[#44403C] border-transparent cursor-not-allowed opacity-50'
                        }
                      `}
                    >
                      x{num}
                    </button>
                  )
                })}
              </div>

              <motion.button
                onClick={onOpen}
                disabled={!!(isLoading || !canAfford(selectedPack, quantity) || (selectedPack.set_filter && selectedPack.set_filter.length === 0))}
                className={`
                  w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 sm:gap-3 font-bold text-sm sm:text-lg shadow-xl relative overflow-hidden group
                  ${(selectedPack.set_filter && selectedPack.set_filter.length === 0)
                    ? 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed'
                    : canAfford(selectedPack, quantity)
                      ? 'bg-gradient-to-r from-[#CA8A04] to-[#FACC15] text-black hover:shadow-[0_0_30px_rgba(202,138,4,0.4)]'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }
                `}
                whileHover={canAfford(selectedPack) && !(selectedPack.set_filter && selectedPack.set_filter.length === 0) ? { scale: 1.02 } : {}}
                whileTap={canAfford(selectedPack) && !(selectedPack.set_filter && selectedPack.set_filter.length === 0) ? { scale: 0.98 } : {}}
              >
                {isLoading ? (
                  <motion.div
                    className="w-6 h-6 border-3 border-black border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  />
                ) : (selectedPack.set_filter && selectedPack.set_filter.length === 0) ? (
                  <>
                    <Lock className="w-6 h-6" />
                    STOK KOSONG
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    RIP OPEN PACK
                    <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
                
                {/* Button Shimmer */}
                {canAfford(selectedPack, quantity) && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
                    animate={{ x: ['-200%', '200%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
                  />
                )}
              </motion.button>
              
              {!canAfford(selectedPack, quantity) && (
                <p className="text-center text-red-400 text-[10px] mt-2 font-medium uppercase tracking-wider">
                  Insufficient funds for {quantity}x packs
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
