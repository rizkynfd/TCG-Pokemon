// @ts-nocheck
'use client'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { useState, useMemo } from 'react'
import { Search, Filter, Heart, SlidersHorizontal, Star, BookOpen, X, Sparkles, Trophy } from 'lucide-react'
import CardFlip from '@/components/cards/CardFlip'
import { useRouter } from 'next/navigation'

interface Card {
  id: string
  name: string
  rarity: string
  rarity_tier: number
  image_url: string
  type: string | null
  hp: number | null
  set_name: string
  dust_value: number
}

interface InventoryCard extends Card {
  inventoryId: string
  quantity: number
  is_favorite: boolean
  in_wishlist: boolean
  flair_level: number
}

const FLAIR_UPGRADE_COSTS: Record<number, number> = {
  1: 100,
  2: 500,
  3: 1000,
}

const RARITY_TIER_CONFIG: Record<number, { label: string; color: string; glowClass: string; borderColor: string; bg: string }> = {
  1: { label: 'Common',     color: 'text-gray-400',   glowClass: '',             borderColor: 'border-[#44403C]/50', bg: 'bg-gray-500/5' },
  2: { label: 'Uncommon',   color: 'text-green-400',  glowClass: 'glow-uncommon', borderColor: 'border-green-500/30', bg: 'bg-green-500/5' },
  3: { label: 'Rare',       color: 'text-blue-400',   glowClass: 'glow-rare',     borderColor: 'border-blue-500/30', bg: 'bg-blue-500/5' },
  4: { label: 'Ultra Rare', color: 'text-violet-400', glowClass: 'glow-ultra',    borderColor: 'border-violet-500/30', bg: 'bg-violet-500/5' },
  5: { label: 'Secret Rare',color: 'text-orange-400', glowClass: 'glow-secret',   borderColor: 'border-orange-500/30', bg: 'bg-orange-500/5' },
}

const FILTER_RARITIES = [
  { label: 'All',    value: 0 },
  { label: 'Common', value: 1 },
  { label: 'Uncommon', value: 2 },
  { label: 'Rare',   value: 3 },
  { label: 'Ultra',  value: 4 },
  { label: 'Secret', value: 5 },
]

interface BinderViewProps {
  inventory: InventoryCard[]
  totalCards: number
}

export default function BinderView({ inventory, totalCards }: BinderViewProps) {
  const router = useRouter()
  const [search, setSearch]           = useState('')
  const [rarityFilter, setRarityFilter] = useState(0)
  const [selectedSet, setSelectedSet]   = useState<string>('All')
  const [sortBy, setSortBy]           = useState<'rarity' | 'name' | 'quantity'>('rarity')
  const [focused, setFocused]         = useState<InventoryCard | null>(null)
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [upgradeError, setUpgradeError] = useState<string | null>(null)
  const [wishlistOnly, setWishlistOnly] = useState(false)

  // Get unique sets from inventory for dynamic filtering
  const availableSets = useMemo(() => ['All', ...new Set(inventory.map(c => c.set_name))].sort(), [inventory])

  const filtered = useMemo(() => {
    return inventory
      .filter(c => {
        const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
                            c.set_name.toLowerCase().includes(search.toLowerCase())
        const matchRarity = rarityFilter === 0 || c.rarity_tier === rarityFilter
        const matchSet    = selectedSet === 'All' || c.set_name === selectedSet
        const matchWishlist = !wishlistOnly || c.in_wishlist
        return matchSearch && matchRarity && matchSet && matchWishlist
      })
      .sort((a, b) => {
        if (sortBy === 'rarity')    return b.rarity_tier - a.rarity_tier
        if (sortBy === 'name')      return a.name.localeCompare(b.name)
        if (sortBy === 'quantity')  return b.quantity - a.quantity
        return 0
      })
  }, [inventory, search, rarityFilter, selectedSet, sortBy, wishlistOnly])

  const handleUpgrade = async () => {
    if (!focused || isUpgrading) return
    setIsUpgrading(true)
    setUpgradeError(null)

    try {
      const res = await fetch('/api/inventory/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inventoryId: focused.inventoryId }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upgrade failed')
      router.refresh()
      setFocused(prev => prev ? { ...prev, flair_level: data.newLevel } : null)
    } catch (err) {
      setUpgradeError(err instanceof Error ? err.message : 'Upgrade failed')
    } finally {
      setIsUpgrading(false)
    }
  }

    const setStats = useMemo(() => {
    if (selectedSet === 'All') return null
    const setCards = inventory.filter(c => c.set_name === selectedSet)
    // We don't have totalCards per set in props easily, but we can estimate or show count
    return {
      unique: setCards.length,
      totalSheets: setCards.reduce((s, c) => s + c.quantity, 0)
    }
  }, [inventory, selectedSet])

  const completionRate = totalCards > 0 ? (inventory.length / totalCards) * 100 : 0
  const totalSheetsOwned = useMemo(() => inventory.reduce((sum, item) => sum + item.quantity, 0), [inventory])

  return (
    <div className="relative min-h-screen p-6 lg:p-10 max-w-[1600px] mx-auto space-y-10 font-['Outfit']">
      
      {/* Background Decorative Element */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#CA8A04]/5 blur-[150px] rounded-full -z-10" />

      {/* Header Section with Live Stats */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-white/5 pb-10">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[#CA8A04] font-black text-[10px] tracking-[0.4em] uppercase">
            <Trophy className="w-4 h-4" />
            Collection Vault — {selectedSet}
          </div>
          <h1 className="text-5xl lg:text-6xl font-['Righteous'] text-white tracking-tight flex items-center gap-4">
            The <span className="text-[#CA8A04]">Binder</span>
            <BookOpen className="w-10 h-10 text-[#CA8A04] opacity-10" />
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-12">
          {/* Total Sheets Counter */}
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-[#A8A29E] uppercase tracking-widest mb-1">
              {selectedSet === 'All' ? 'Total Collection' : `${selectedSet} Stock`}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-['Righteous'] text-white leading-none">
                {selectedSet === 'All' ? totalSheetsOwned : setStats?.totalSheets}
              </span>
              <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Sheets</span>
            </div>
          </div>

          {/* Mastery Progress */}
          <div className="w-full sm:w-64">
            <div className="flex justify-between items-end mb-2">
              <span className="text-[10px] font-black text-[#A8A29E] uppercase tracking-widest">Mastery Progress</span>
              <span className="text-sm font-['Righteous'] text-[#CA8A04]">{Math.round(completionRate)}%</span>
            </div>
            <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5 p-[1px]">
              <motion.div 
                 className="h-full bg-gradient-to-r from-[#CA8A04] to-[#D97706] rounded-full shadow-[0_0_15px_rgba(202,138,4,0.3)]"
                 initial={{ width: 0 }}
                 animate={{ width: `${completionRate}%` }}
                 transition={{ duration: 1.5, ease: 'easeOut' }}
              />
            </div>
            <p className="text-[10px] text-[#A8A29E] mt-2 font-bold tracking-tight text-right flex items-center justify-end gap-2">
              <Sparkles className="w-3 h-3 text-[#CA8A04] opacity-50" />
              {selectedSet === 'All' 
                ? `${inventory.length} of ${totalCards} Global Card Types`
                : `${setStats?.unique} Unique Cards found in ${selectedSet}`
              }
            </p>
          </div>
        </div>
      </div>

      {/* Logic Controls Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Search Input */}
        <div className="lg:col-span-6 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A8A29E] group-focus-within:text-[#CA8A04] transition-colors" />
          <input
            type="text"
            placeholder="Search card name or set..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#1C1917]/60 backdrop-blur-sm border border-[#44403C]/50 rounded-2xl pl-12 pr-6 py-4 text-white placeholder:text-[#57534E] focus:outline-none focus:border-[#CA8A04] focus:ring-1 focus:ring-[#CA8A04]/20 transition-all font-medium"
          />
        </div>

        {/* Rarity Filters */}
        <div className="lg:col-span-4 flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
          {FILTER_RARITIES.map(r => (
            <button
              key={r.value}
              onClick={() => setRarityFilter(r.value)}
              className={`whitespace-nowrap px-4 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${
                rarityFilter === r.value
                  ? 'bg-white text-black shadow-lg'
                  : 'bg-[#1C1917]/40 border border-[#44403C]/50 text-[#A8A29E] hover:border-[#CA8A04]/40'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="lg:col-span-2 flex items-center gap-2">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="flex-1 bg-[#1C1917]/60 backdrop-blur-sm border border-[#44403C]/50 rounded-2xl px-6 py-4 text-sm text-white font-bold appearance-none cursor-pointer focus:outline-none focus:border-[#CA8A04] transition-all"
          >
            <option value="rarity">Tier Order</option>
            <option value="name">A - Z</option>
            <option value="quantity">Duplicates First</option>
          </select>
          {/* Wishlist Toggle */}
          <button
            onClick={() => setWishlistOnly(v => !v)}
            title={wishlistOnly ? 'Show All' : 'Show Wishlist Only'}
            className={`flex-shrink-0 w-12 h-12 rounded-2xl border flex items-center justify-center transition-all ${
              wishlistOnly
                ? 'bg-pink-500/20 border-pink-500/60 text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.3)]'
                : 'bg-[#1C1917]/60 border-[#44403C]/50 text-[#A8A29E] hover:border-pink-500/40 hover:text-pink-400'
            }`}
          >
            <Heart className={`w-5 h-5 ${wishlistOnly ? 'fill-pink-400' : ''}`} />
          </button>
        </div>

        {/* Set Filter Chips */}
        <div className="lg:col-span-12 flex items-center gap-2 overflow-x-auto pt-2 pb-4 scrollbar-hide border-b border-white/5">
          {availableSets.map(setName => (
            <button
              key={setName}
              onClick={() => setSelectedSet(setName)}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all ${
                selectedSet === setName
                  ? 'bg-[#CA8A04] text-black shadow-[0_0_20px_rgba(202,138,4,0.3)]'
                  : 'bg-white/5 border border-white/10 text-[#A8A29E] hover:bg-white/10'
              }`}
            >
              {setName}
            </button>
          ))}
        </div>
      </div>

      {/* Collection Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        <AnimatePresence mode="popLayout">
          {filtered.map((card, i) => {
            const config = RARITY_TIER_CONFIG[card.rarity_tier] || RARITY_TIER_CONFIG[1]
            return (
              <motion.div
                key={card.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: Math.min(i * 0.01, 0.2), duration: 0.4 }}
                className="group relative cursor-pointer"
                onClick={() => setFocused(card)}
              >
                {/* Quantity Orb */}
                {card.quantity > 1 && (
                  <div className="absolute -top-2 -right-2 z-20 bg-white text-black font-black text-[10px] px-2 py-1 rounded-lg border-2 border-[#0C0A09] shadow-lg">
                    ×{card.quantity}
                  </div>
                )}

                {/* Flair Level Indicator */}
                {card.flair_level > 0 && (
                  <div className="absolute -top-2 -left-2 z-20 bg-violet-600 p-1.5 rounded-full border-2 border-[#0C0A09] shadow-lg">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                )}
                
                {/* Wrapper */}
                <div className={`relative aspect-[3/4] rounded-2xl overflow-hidden border-2 transition-all group-hover:scale-105 group-hover:-translate-y-2 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)] ${config.borderColor} ${config.bg}`}>
                   <Image 
                     src={card.image_url} 
                     alt={card.name} 
                     fill 
                     className={`object-cover transition-all duration-700 ${card.rarity_tier >= 3 ? 'group-hover:brightness-110' : ''}`}
                     loading="lazy"
                   />
                   
                   {/* Bottom Detail bar */}
                   <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end transition-opacity opacity-0 group-hover:opacity-100">
                     <p className="text-[10px] font-black text-white/60 truncate uppercase tracking-tighter mb-0.5">{card.set_name}</p>
                     <p className={`text-[10px] font-black tracking-widest uppercase ${config.color}`}>{card.rarity}</p>
                   </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Luxury Detail Modal */}
      <AnimatePresence>
        {focused && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0C0A09]/95 backdrop-blur-3xl px-4 py-8 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFocused(null)}
          >
             {/* Dynamic Backdrop Aura */}
             <div 
               className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-full opacity-30 blur-[120px] pointer-events-none transition-all duration-1000"
               style={{ 
                 background: `radial-gradient(circle at center, ${
                   focused.rarity_tier === 5 ? '#f97316' : 
                   focused.rarity_tier === 4 ? '#a78bfa' : 
                   focused.rarity_tier === 3 ? '#60a5fa' : 
                   focused.rarity_tier === 2 ? '#4ade80' : 
                   '#CA8A04'
                 } 0%, transparent 70%)` 
               }} 
             />

             <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] pointer-events-none" />

             <button 
                className="absolute top-8 right-8 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all z-[110]"
                onClick={() => setFocused(null)}
             >
               <X className="w-6 h-6" />
             </button>

             <div className="relative flex flex-col lg:flex-row gap-12 lg:gap-24 max-w-7xl w-full items-center justify-center p-6" onClick={e => e.stopPropagation()}>
               <div className="relative z-[120] w-[280px] sm:w-[320px] lg:w-[400px]">
                 <CardFlip cardData={{ card: focused, isDuplicate: focused.quantity > 1, dustReceived: focused.dust_value, isPity: false }} isRevealed={true} index={0} size="lg" flairLevel={focused.flair_level} isInspecting={true} />
               </div>

               <div className="flex-1 space-y-8 text-center lg:text-left max-w-xl">
                  <div className="space-y-4">
                    <div className="flex items-center justify-center lg:justify-start gap-3">
                       <span className={`text-xs font-black tracking-widest uppercase px-3 py-1 rounded-full bg-white/5 border border-white/10 ${RARITY_TIER_CONFIG[focused.rarity_tier]?.color || 'text-white'}`}>
                         {focused.rarity}
                       </span>
                       <span className="text-xs font-bold text-[#A8A29E]/50">ID: {focused.id}</span>
                    </div>
                    <h2 className="text-5xl lg:text-7xl font-['Righteous'] text-white leading-none capitalize tracking-tighter">
                      {focused.name}
                    </h2>
                    <p className="text-[#CA8A04] text-2xl font-medium">{focused.set_name}</p>
                  </div>

                  <div className="bg-[#1C1917] border border-white/5 rounded-3xl p-6 relative overflow-hidden group/flair">
                     <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="space-y-1 text-center md:text-left">
                           <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest">Card Cosmetics</p>
                           <h3 className="text-2xl font-['Righteous'] text-white">Tier {focused.flair_level} Flair</h3>
                        </div>
                        {focused.flair_level < 3 ? (
                          <button onClick={handleUpgrade} disabled={isUpgrading} className="px-8 py-3.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-black rounded-2xl transition-all shadow-lg flex items-center gap-3 text-xs uppercase tracking-widest">
                             <Sparkles className="w-4 h-4" /> Upgrade Flair
                          </button>
                        ) : (
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
                             <Trophy className="w-4 h-4 text-yellow-500" /> <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Maxed Out</span>
                          </div>
                        )}
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                        <p className="text-[10px] font-black text-[#57534E] uppercase tracking-widest mb-1">Quantity Owned</p>
                        <p className="text-xl font-['Righteous'] text-[#CA8A04]">{focused.quantity}</p>
                     </div>
                     <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                        <p className="text-[10px] font-black text-[#57534E] uppercase tracking-widest mb-1">Dust Value</p>
                        <p className="text-xl font-['Righteous'] text-white">{focused.dust_value} ✨</p>
                     </div>
                  </div>
               </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
