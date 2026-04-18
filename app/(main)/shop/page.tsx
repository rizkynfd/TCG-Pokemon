// @ts-nocheck
'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { Gem, Zap, Star, Crown, Gift, Check, Sparkles, Loader2, X, CheckCircle2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import Script from 'next/script'

const GEM_BUNDLES = [
  { id: 'starter', name: 'Starter Pack', gems: 80,   bonus: 0,   price: 'Rp 15.000',  badge: null,        color: 'from-blue-600/20 to-blue-900/40',     borderColor: 'border-blue-500/30',    iconColor: 'text-blue-400',   icon: '💎' },
  { id: 'popular', name: 'Popular Pack', gems: 280,  bonus: 30,  price: 'Rp 50.000',  badge: 'POPULER',   color: 'from-violet-600/20 to-violet-900/40', borderColor: 'border-violet-500/30',  iconColor: 'text-violet-400', icon: '💜' },
  { id: 'value',   name: 'Value Pack',   gems: 600,  bonus: 100, price: 'Rp 100.000', badge: 'BEST VALUE', color: 'from-emerald-600/20 to-emerald-900/40', borderColor: 'border-emerald-500/30', iconColor: 'text-emerald-400', icon: '✨' },
  { id: 'mega',    name: 'Mega Pack',    gems: 1280, bonus: 280, price: 'Rp 200.000', badge: 'MEGA DEAL', color: 'from-orange-600/20 to-orange-900/40',  borderColor: 'border-orange-500/30',  iconColor: 'text-orange-400', icon: '🔥' },
]

const COIN_BUNDLES = [
  { id: 'coins_sm', name: '500 Coins',   coins: 500,  gems: 5,  label: 'Standard Pack Value' },
  { id: 'coins_md', name: '1,500 Coins', coins: 1500, gems: 12, label: 'Best for 3 Packs' },
  { id: 'coins_lg', name: '5,000 Coins', coins: 5000, gems: 35, label: 'Master Collector Choice' },
]

const FREE_REWARDS = [
  { id: 'daily_free', name: 'Daily Free Pack', description: 'Claim your daily vault reward', icon: Gift, color: 'text-green-400' },
  { id: 'ad_pack',    name: 'Elite Bounty',    description: 'Bonus coins for daily activity', icon: Zap, color: 'text-yellow-400' },
]

type PaymentState = 'idle' | 'loading' | 'success' | 'error'

export default function ShopPage() {
  const [payingId, setPayingId]     = useState<string | null>(null)
  const [snapLoaded, setSnapLoaded] = useState(false)
  const [toast, setToast]           = useState<{ type: PaymentState; msg: string } | null>(null)
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY!

  const showToast = (type: PaymentState, msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 5000)
  }

  const handleGemPurchase = async (bundleId: string) => {
    if (payingId || !snapLoaded) return
    setPayingId(bundleId)

    try {
      // 1. Get Snap token from our API
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bundleId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create transaction')

      // 2. Open Midtrans Snap popup
      window.snap.pay(data.token, {
        onSuccess: () => {
          showToast('success', '✅ Pembayaran berhasil! Gems akan segera masuk ke akun kamu.')
          setPayingId(null)
        },
        onPending: () => {
          showToast('idle', '⏳ Pembayaran pending. Gems akan masuk setelah konfirmasi bank.')
          setPayingId(null)
        },
        onError: () => {
          showToast('error', '❌ Pembayaran gagal. Silakan coba lagi.')
          setPayingId(null)
        },
        onClose: () => {
          setPayingId(null)
        },
      })
    } catch (err: any) {
      showToast('error', err.message ?? 'Terjadi kesalahan.')
      setPayingId(null)
    }
  }

  const handleCoinExchange = async (bundleId: string) => {
    if (payingId) return
    setPayingId(bundleId)
    try {
      const res = await fetch('/api/shop/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bundleId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Gagal menukar coins')
      showToast('success', `✅ Berhasil menukar gems dengan ${data.coins} Coins!`)
      // Refresh window slightly to update navbar stats if needed, or rely on future global states
      setTimeout(() => window.location.reload(), 1500)
    } catch (err: any) {
      showToast('error', `❌ ${err.message}`)
    } finally {
      setPayingId(null)
    }
  }

  const handleClaimReward = async (rewardId: string) => {
    if (payingId) return
    setPayingId(rewardId)
    try {
      if (rewardId === 'daily_free') {
        const res = await fetch('/api/daily-reward', { method: 'POST' })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Gagal klaim hadiah')
        showToast('success', `🎁 Berhasil klaim ${data.coins} Coins!`)
        setTimeout(() => window.location.reload(), 1500)
      } else {
        // Fallback for Elite Bounty or other future rewards
        setTimeout(() => {
          showToast('idle', '📺 Fitur Web Ad untuk Elite Bounty belum tersedia.')
          setPayingId(null)
        }, 1000)
      }
    } catch (err: any) {
      showToast('error', `❌ ${err.message}`)
      setPayingId(null)
    }
  }

  const handleRedeemPromo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (payingId) return
    setPayingId('promo')
    
    const formData = new FormData(e.currentTarget)
    const code = formData.get('code')
    try {
      const res = await fetch('/api/promo/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Gagal klaim hadiah')
      showToast('success', data.message)
      setTimeout(() => window.location.reload(), 1500)
    } catch (err: any) {
      showToast('error', err.message)
      setPayingId(null)
    }
  }

  return (
    <>
      {/* Load Midtrans Snap.js */}
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={clientKey}
        onLoad={() => setSnapLoaded(true)}
        strategy="afterInteractive"
      />

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -60 }}
            className={`fixed top-6 right-6 z-[999] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-sm font-bold max-w-sm border ${
              toast.type === 'success'
                ? 'bg-green-900/90 border-green-500/40 text-green-200'
                : toast.type === 'error'
                ? 'bg-red-900/90 border-red-500/40 text-red-200'
                : 'bg-[#1C1917]/90 border-white/10 text-white'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" /> : null}
            <span className="leading-snug">{toast.msg}</span>
            <button onClick={() => setToast(null)} className="ml-auto opacity-60 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
          {/* Payment Badge */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5">
            <span className="text-xs text-[#A8A29E]">Pembayaran aman via</span>
            <span className="text-xs font-black text-white">Midtrans</span>
            <span className="text-[10px] text-green-400 font-bold">🔒 SSL</span>
          </div>
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
                  const isPaying = payingId === bundle.id
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
                              <span suppressHydrationWarning>{bundle.gems.toLocaleString()}</span>
                            </p>
                            {bundle.bonus > 0 && (
                              <div className="bg-green-500/20 text-green-400 text-[10px] font-black px-2 py-0.5 rounded-md border border-green-500/20">
                                +{bundle.bonus} BONUS
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleGemPurchase(bundle.id)}
                          disabled={!!payingId || !snapLoaded}
                          className={`relative w-full py-4 rounded-2xl font-black text-sm tracking-widest transition-all flex items-center justify-center gap-3 overflow-hidden ${
                            isPaying
                              ? 'bg-[#CA8A04]/50 text-black cursor-wait'
                              : !snapLoaded
                              ? 'bg-white/20 text-white/50 cursor-not-allowed'
                              : 'bg-white text-black hover:bg-[#CA8A04] hover:text-black shadow-xl'
                          }`}
                        >
                          {isPaying ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</>
                          ) : !snapLoaded ? (
                            <>Loading...</>
                          ) : (
                            <>BELI {bundle.price}</>
                          )}
                          {!isPaying && snapLoaded && (
                            <motion.div
                              className="absolute inset-0 bg-white/20 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                              style={{ skewX: -20 }}
                            />
                          )}
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
                    <button 
                      onClick={() => handleClaimReward(reward.id)}
                      disabled={!!payingId}
                      className="text-[10px] font-black text-[#CA8A04] hover:text-black uppercase tracking-widest px-4 py-2 bg-[#CA8A04]/10 hover:bg-[#CA8A04] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center min-w-[70px]"
                    >
                      {payingId === reward.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Claim'}
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Promo Code User Redeem Section */}
            <section className="bg-[#1C1917]/20 border border-[#44403C]/40 rounded-2xl p-6 hover:border-[#CA8A04]/30 transition-all">
              <h2 className="font-['Righteous'] text-lg text-white mb-4">Promo Code</h2>
              <form onSubmit={handleRedeemPromo} className="flex gap-2">
                <input 
                  name="code"
                  type="text"
                  required
                  placeholder="Enter code here..."
                  className="w-full bg-[#0C0A09] border border-[#292524] rounded-xl px-4 py-2 text-white font-mono uppercase text-sm focus:outline-none focus:border-[#CA8A04]/50"
                />
                <button 
                  disabled={payingId === 'promo'}
                  type="submit"
                  className="bg-[#CA8A04] text-black font-black uppercase text-xs px-4 py-2 rounded-xl transition-all hover:brightness-110 disabled:opacity-50"
                >
                  {payingId === 'promo' ? '...' : 'REDEEM'}
                </button>
              </form>
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
                      onClick={() => handleCoinExchange(bundle.id)}
                      disabled={!!payingId}
                      className="flex items-center gap-2 bg-[#CA8A04]/10 text-[#CA8A04] px-4 py-2 rounded-xl font-black text-[11px] tracking-widest hover:bg-[#CA8A04] hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {payingId === bundle.id ? (
                        <><Loader2 className="w-3 h-3 animate-spin" /> PROSES</>
                      ) : (
                        <>EXCHANGE {bundle.gems} <Gem className="w-3 h-3" /></>
                      )}
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
            Pembayaran diproses dengan aman melalui Midtrans. Semua transaksi terenkripsi SSL. <br />
            Pokémon dan Pokémon TCG adalah merek dagang Nintendo/The Pokémon Company.
          </p>
        </footer>
      </div>
    </>
  )
}
