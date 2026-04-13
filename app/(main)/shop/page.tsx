// @ts-nocheck
'use client'
import { motion } from 'framer-motion'
import { Gem, Zap, Star, Crown, Gift, ShoppingBag, Check, ArrowRight, Sparkles } from 'lucide-react'
import { useState } from 'react'

const GEM_BUNDLES = [
  { id: 'starter', name: 'Starter Pack', gems: 80, bonus: 0, price: 'Rp 15.000', badge: null, color: 'from-blue-600/20 to-blue-900/40', borderColor: 'border-blue-500/30', iconColor: 'text-blue-400', icon: '💎' },
  { id: 'popular', name: 'Popular Pack', gems: 280, bonus: 30, price: 'Rp 50.000', badge: 'POPULAR', color: 'from-violet-600/20 to-violet-900/40', borderColor: 'border-violet-500/30', iconColor: 'text-violet-400', icon: '💜' },
  { id: 'value', name: 'Value Pack', gems: 600, bonus: 100, price: 'Rp 100.000', badge: 'BEST VALUE', color: 'from-emerald-600/20 to-emerald-900/40', borderColor: 'border-emerald-500/30', iconColor: 'text-emerald-400', icon: '✨' },
  { id: 'mega', name: 'Mega Pack', gems: 1280, bonus: 280, price: 'Rp 200.000', badge: 'MEGA DEAL', color: 'from-orange-600/20 to-orange-900/40', borderColor: 'border-orange-500/30', iconColor: 'text-orange-400', icon: '🔥' },
]

const COIN_BUNDLES = [
  { id: 'coins_sm', name: '500 Coins', coins: 500, gems: 5, label: 'Standard Pack Value' },
  { id: 'coins_md', name: '1,500 Coins', coins: 1500, gems: 12, label: 'Best for 3 Packs' },
  { id: 'coins_lg', name: '5,000 Coins', coins: 5000, gems: 35, label: 'Master Collector Choice' },
]

const FREE_REWARDS = [
  { id: 'daily_free', name: 'Daily Free Pack', description: 'Claim your daily vault reward', icon: Gift, color: 'text-green-400' },
  { id: 'ad_pack', name: 'Elite Bounty', description: 'Bonus coins for daily activity', icon: Zap, color: 'text-yellow-400' },
]

export default function ShopPage() {
  const [purchased, setPurchased] = useState<string[]>([])

  const handlePurchase = (id: string) => {
    setPurchased(prev => [...prev, id])
    setTimeout(() => setPurchased(prev => prev.filter(p => p !== id)), 3000)
  }

  return (
    <div className="relative min-h-screen p-6 lg:p-12 max-w-7xl mx-auto space-y-16 overflow-hidden">
      
      {/* Background Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 blur-[120px] rounded-full -z-10" />
      <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-[#CA8A04]/5 blur-[100px] rounded-full -z-10" />

      {/* Header */}
      <motion.div
        className="flex flex-col items-center text-center space-y-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="bg-[#CA8A04]/10 text-[#CA8A04] px-4 py-1 rounded-full text-xs font-black tracking-[0.3em] uppercase border border-[#CA8A04]/20">
          Premium Storefront
        </div>
        <h1 className="font-['Righteous'] text-5xl lg:text-6xl text-white tracking-tight">
          The <span className="text-[#CA8A04]">Vault</span> Store
        </h1>
        <p className="text-[#A8A29E] max-w-xl text-lg font-light">
          Acquire gems and coins to expand your collection and discover hidden rarities.
        </p>
      </motion.div>

      {/* Main Grid Section */}
      <div className="grid lg:grid-cols-3 gap-12">
        
        {/* Left 2/3: Gem Bundles */}
        <div className="lg:col-span-2 space-y-10">
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                <Gem className="w-6 h-6" />
              </div>
              <h2 className="font-['Righteous'] text-2xl text-white tracking-wide">Gem Bundles</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {GEM_BUNDLES.map((bundle, i) => {
                const isBought = purchased.includes(bundle.id)
                return (
                  <motion.div
                    key={bundle.id}
                    className={`group relative bg-gradient-to-br ${bundle.color} to-[#0C0A09] border ${bundle.borderColor} rounded-[2rem] p-8 transition-all hover:shadow-[0_0_40px_rgba(0,0,0,0.4)] hover:-translate-y-1 overflow-hidden`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    {/* Glossy overlay */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    
                    {bundle.badge && (
                      <div className="absolute top-4 right-4 bg-white text-black text-[9px] font-black px-3 py-1 rounded-full tracking-widest">
                        {bundle.badge}
                      </div>
                    )}

                    <div className="relative z-10">
                      <div className="text-5xl mb-6 transform group-hover:scale-110 transition-transform origin-left">{bundle.icon}</div>
                      <div className="space-y-1 mb-8">
                        <h3 className="text-white text-xl font-bold">{bundle.name}</h3>
                        <div className="flex items-center gap-2">
                          <p className={`text-3xl font-['Righteous'] ${bundle.iconColor}`}>
                            <span suppressHydrationWarning>
                              {bundle.gems.toLocaleString()}
                            </span>
                          </p>
                          {bundle.bonus > 0 && (
                            <div className="bg-green-500/20 text-green-400 text-[10px] font-black px-2 py-0.5 rounded-md border border-green-500/20">
                              +{bundle.bonus} BONUS
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handlePurchase(bundle.id)}
                        className={`w-full py-4 rounded-2xl font-black text-sm tracking-widest transition-all flex items-center justify-center gap-3 overflow-hidden group ${
                          isBought 
                            ? 'bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]' 
                            : 'bg-white text-black hover:bg-[#CA8A04] hover:text-black shadow-xl'
                        }`}
                      >
                        {isBought ? (
                          <><Check className="w-5 h-5" /> COMPLETE</>
                        ) : (
                          <>BUY FOR {bundle.price}</>
                        )}
                        <motion.div 
                          className="absolute inset-0 bg-white/20 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                          style={{ skewX: -20 }}
                        />
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </section>
        </div>

        {/* Right 1/3: Coins & VIP */}
        <div className="space-y-12">
          {/* Rewards Section */}
          <section className="bg-[#1C1917]/40 backdrop-blur-xl border border-[#44403C]/50 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 blur-3xl rounded-full" />
            
            <h2 className="font-['Righteous'] text-xl text-white mb-8 flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-green-400" />
              Daily Perks
            </h2>

            <div className="space-y-6">
              {FREE_REWARDS.map((reward) => (
                <div key={reward.id} className="flex items-center justify-between group p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl bg-white/5 ${reward.color}`}>
                      <reward.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-bold">{reward.name}</p>
                      <p className="text-[#A8A29E] text-[10px] uppercase font-bold tracking-tight">{reward.description}</p>
                    </div>
                  </div>
                  <button className="text-[10px] font-black text-[#CA8A04] hover:text-white uppercase tracking-widest px-4 py-2 bg-[#CA8A04]/10 rounded-lg transition-colors">
                    Claim
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Coin Exchange Section */}
          <section className="space-y-6">
            <h2 className="font-['Righteous'] text-xl text-white flex items-center gap-3">
              <Zap className="w-5 h-5 text-[#CA8A04]" />
              Coin Exchange
            </h2>
            <div className="space-y-4">
              {COIN_BUNDLES.map((bundle) => (
                <div key={bundle.id} className="flex items-center justify-between p-5 bg-[#1C1917]/20 border border-[#44403C]/40 rounded-2xl hover:border-[#CA8A04]/30 transition-all group">
                  <div>
                    <p className="text-white font-bold">{bundle.name}</p>
                    <p className="text-[#A8A29E] text-[10px] font-medium">{bundle.label}</p>
                  </div>
                  <button
                    onClick={() => handlePurchase(bundle.id)}
                    className="flex items-center gap-2 bg-[#CA8A04]/10 text-[#CA8A04] px-4 py-2 rounded-xl font-black text-[11px] tracking-widest hover:bg-[#CA8A04] hover:text-black transition-all"
                  >
                    EXCHANGE {bundle.gems} <Gem className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* VIP Pass Tease */}
          <section className="relative group rounded-[2rem] p-8 border border-yellow-600/30 bg-[#0C0A09] overflow-hidden shadow-2xl">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
             <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-yellow-600/10 to-transparent" />
             
             <div className="relative z-10 flex flex-col items-center text-center space-y-4">
               <div className="flex items-center gap-2 text-yellow-600 text-xs font-black tracking-widest uppercase">
                 <Crown className="w-4 h-4" />
                 Coming Soon
               </div>
               <h3 className="text-white text-2xl font-['Righteous'] leading-none">Vault Elite Pass</h3>
               <p className="text-[#A8A29E] text-xs leading-relaxed max-w-[200px]">
                 Unlock exclusive daily rewards, legacy packs, and the 
                 <span className="text-[#CA8A04] font-bold"> Master Collector </span> title.
               </p>
               <div className="w-full h-px bg-yellow-600/20 my-4" />
               <div className="flex -space-x-2">
                 {[...Array(4)].map((_, i) => (
                   <div key={i} className="w-8 h-8 rounded-full border border-black bg-stone-900 overflow-hidden">
                     <img src={`https://images.pokemontcg.io/swsh1/icon.png`} className="w-full h-full object-contain p-1" />
                   </div>
                 ))}
               </div>
             </div>
          </section>
        </div>
      </div>

      <footer className="pt-12 border-t border-white/5 text-center">
        <p className="text-[#57534E] text-[11px] font-medium tracking-tight">
          This is a demonstration of a high-fidelity e-commerce experience. <br />
          No actual financial transactions are processed. Pokémon and Pokémon TCG are trademarks of Nintendo/The Pokémon Company.
        </p>
      </footer>
    </div>
  )
}
