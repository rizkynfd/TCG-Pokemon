'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import {
  Users, Database, Zap, BookOpen, Shield, RefreshCw,
  TrendingUp, Clock, Crown, Star, AlertTriangle, Check, Search, SearchCode,
  Sparkles, Package, Ticket, Activity, Edit3, Trash2, Plus
} from 'lucide-react'

const RARITY_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Common',     color: 'text-gray-400' },
  2: { label: 'Uncommon',   color: 'text-green-400' },
  3: { label: 'Rare',       color: 'text-blue-400' },
  4: { label: 'Ultra Rare', color: 'text-violet-400' },
  5: { label: 'Secret',     color: 'text-orange-400' },
}

interface AdminStats {
  totalUsers: number
  totalCards: number
  totalPulls: number
  totalInventory: number
}

interface AdminPanelViewProps {
  stats: AdminStats
  recentPulls: any[]
  latestUsers: any[]
  recentTransactions: any[]
  packs: any[]
  promos: any[]
  adminEmail: string
}

export default function AdminPanelView({ stats, recentPulls, latestUsers, recentTransactions, packs: initialPacks, promos: initialPromos, adminEmail }: AdminPanelViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'packs' | 'promos' | 'transactions'>('overview')

  return (
    <div className="min-h-screen p-6 lg:p-10 max-w-7xl mx-auto space-y-10 font-['Outfit']">
      {/* Header */}
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <div className="flex items-center gap-2 text-red-400 text-[10px] font-black tracking-[0.3em] uppercase mb-2">
            <Shield className="w-3.5 h-3.5" />
            Restricted Access
          </div>
          <h1 className="font-['Righteous'] text-4xl lg:text-5xl text-white tracking-tight">
            Admin <span className="text-[#CA8A04]">Panel</span>
          </h1>
          <p className="text-[#A8A29E] text-sm mt-1">Logged in as <span className="text-white font-semibold">{adminEmail}</span></p>
        </div>

        {/* Tab Navigation */}
        <div className="flex p-1 bg-[#1C1917] border border-[#44403C] rounded-2xl">
          {[
            { id: 'overview', icon: Activity, label: 'Overview' },
            { id: 'packs', icon: Package, label: 'Packs' },
            { id: 'promos', icon: Ticket, label: 'Promos' },
            { id: 'transactions', icon: TrendingUp, label: 'Revenue' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-[#CA8A04] text-black shadow-lg'
                  : 'text-[#A8A29E] hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && (
            <OverviewTab stats={stats} recentPulls={recentPulls} latestUsers={latestUsers} />
          )}
          {activeTab === 'packs' && (
            <PackManagerTab initialPacks={initialPacks} />
          )}
          {activeTab === 'promos' && (
            <PromoManagerTab initialPromos={initialPromos} />
          )}
          {activeTab === 'transactions' && (
            <TransactionsTab transactions={recentTransactions} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ==========================================
// TABS COMPONENTS
// ==========================================

function OverviewTab({ stats, recentPulls, latestUsers }: { stats: AdminStats, recentPulls: any[], latestUsers: any[] }) {
  const [seedStatus, setSeedStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [seedMsg, setSeedMsg] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [editingUser, setEditingUser] = useState<any>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleSeed = async (mode: 'full' | 'packs_only' = 'full') => {
    setSeedStatus('loading')
    setSeedMsg('')
    try {
      const res = await fetch(`/api/admin/seed-proxy?mode=${mode}`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setSeedStatus('success')
        const total = Object.values(data.seeded ?? {}).length
        setSeedMsg(data.message ?? `Done! ${total} sets processed.`)
      } else {
        setSeedStatus('error')
        setSeedMsg(data.error ?? 'Seeding failed.')
      }
    } catch {
      setSeedStatus('error')
      setSeedMsg('Network error.')
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser || isUpdating) return

    setIsUpdating(true)
    try {
      const res = await fetch('/api/admin/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingUser.id,
          coins: editingUser.coins,
          gems: editingUser.gems,
          dust: editingUser.dust,
        }),
      })

      if (res.ok) {
        setEditingUser(null)
        window.location.reload()
      } else {
        alert('Update failed')
      }
    } catch {
      alert('Network error')
    } finally {
      setIsUpdating(false)
    }
  }

  const filteredUsers = latestUsers.filter(u => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    const uname = u.username?.toLowerCase() || ''
    const email = u.email?.toLowerCase() || ''
    return uname.includes(searchLower) || email.includes(searchLower)
  })

  const statCards = [
    { label: 'Total Users',     value: stats.totalUsers,     icon: Users,    color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20' },
    { label: 'Available Cards', value: stats.totalCards,     icon: BookOpen, color: 'text-[#CA8A04]',  bg: 'bg-[#CA8A04]/10',   border: 'border-[#CA8A04]/20' },
    { label: 'Total Pulls',     value: stats.totalPulls,     icon: Zap,      color: 'text-yellow-400', bg: 'bg-yellow-500/10',  border: 'border-yellow-500/20' },
    { label: 'Inventory Rows',  value: stats.totalInventory, icon: Database, color: 'text-violet-400', bg: 'bg-violet-500/10',  border: 'border-violet-500/20' },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg, border }, i) => (
          <div key={label} className={`${bg} border ${border} rounded-2xl p-5`}>
            <div className={`w-9 h-9 rounded-xl ${bg} border ${border} flex items-center justify-center mb-3`}>
              <Icon className={`w-4.5 h-4.5 ${color}`} />
            </div>
            <p className={`font-['Righteous'] text-2xl ${color}`} suppressHydrationWarning>{value.toLocaleString()}</p>
            <p className="text-[#A8A29E] text-xs mt-0.5 font-medium">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Admin Actions */}
        <div className="bg-[#1C1917] border border-[#44403C] rounded-2xl p-6 space-y-4">
          <h2 className="font-['Righteous'] text-white text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#CA8A04]" />
            Quick Actions
          </h2>
          <div className="bg-[#0C0A09] rounded-xl p-4 border border-[#292524] space-y-3">
            <div>
              <p className="text-white text-sm font-bold mb-0.5">Seed Database</p>
              <p className="text-[#A8A29E] text-xs">Populate cards & packs from API.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button onClick={() => handleSeed('full')} disabled={seedStatus === 'loading'} className="flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-[#CA8A04] text-black hover:brightness-110 disabled:opacity-50">
                {seedStatus === 'loading' ? 'Seeding...' : 'Full Seed'}
              </button>
              <button onClick={() => handleSeed('packs_only')} disabled={seedStatus === 'loading'} className="flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider border border-[#44403C] text-[#A8A29E] hover:text-white">
                Packs Only
              </button>
            </div>
            {seedMsg && (
              <p className={`text-xs font-bold ${seedStatus === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                {seedMsg}
              </p>
            )}
          </div>
        </div>

        {/* Recent Pulls */}
        <div className="bg-[#1C1917] border border-[#44403C] rounded-2xl p-6 overflow-hidden flex flex-col">
          <h2 className="font-['Righteous'] text-white text-lg flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-[#CA8A04]" />
            Recent Pulls
          </h2>
          <div className="flex-1 space-y-2 overflow-y-auto max-h-[300px] pr-2 scrollbar-thin scrollbar-thumb-white/10">
            {recentPulls.map((pull, i) => {
              const card = pull.cards
              const rarity = RARITY_LABELS[card?.rarity_tier ?? 1]
              return (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                  <Star className={`w-3.5 h-3.5 ${rarity?.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-semibold truncate uppercase tracking-wider font-['Outfit']">{card?.name}</p>
                    <p className={`text-[10px] ${rarity?.color}`}>{rarity?.label}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* User Management Section */}
      <div className="bg-[#1C1917] border border-[#44403C] rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="font-['Righteous'] text-white text-xl flex items-center gap-2">
            <Crown className="w-5 h-5 text-[#CA8A04]" />
            User Management
          </h2>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#57534E] group-hover:text-[#CA8A04] transition-colors" />
            <input 
              type="text" 
              placeholder="Search trainers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-[#0C0A09] border border-[#292524] rounded-xl text-xs text-white placeholder-[#57534E] focus:outline-none focus:border-[#CA8A04]/50 w-full sm:w-64"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {filteredUsers.map((u, i) => (
            <div key={i} className="group bg-[#0C0A09] border border-[#292524] rounded-xl p-4 hover:border-[#CA8A04]/30 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#CA8A04] to-[#B45309] flex items-center justify-center text-black font-black text-lg">
                  {(u.username ?? u.email ?? '?')[0].toUpperCase()}
                </div>
                <button onClick={() => setEditingUser(u)} className="p-1.5 rounded-lg bg-white/5 text-[#A8A29E] opacity-0 group-hover:opacity-100 hover:text-white hover:bg-[#CA8A04]">
                  <SearchCode className="w-4 h-4" />
                </button>
              </div>
              <p className="text-white text-sm font-bold truncate">{u.username ?? 'Unnamed Trainer'}</p>
              <p className="text-[#57534E] text-[10px] truncate">{u.email}</p>
              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/5">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-yellow-400" />
                  <span className="text-[#A8A29E] text-[10px] font-bold">{(u.coins ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Crown className="w-3 h-3 text-blue-400" />
                  <span className="text-[#A8A29E] text-[10px] font-bold">{(u.gems ?? 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Balances Modal */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setEditingUser(null)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-md bg-[#1C1917] border border-[#CA8A04]/50 rounded-3xl p-8 shadow-2xl overflow-hidden shadow-[#CA8A04]/10">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#CA8A04] to-transparent" />
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#CA8A04] to-[#B45309] flex items-center justify-center text-black font-black text-2xl mx-auto mb-4">
                  {(editingUser.username ?? editingUser.email ?? '?')[0].toUpperCase()}
                </div>
                <h3 className="font-['Righteous'] text-2xl text-white">Manage Trainer</h3>
                <p className="text-[#A8A29E] text-sm font-black mt-1 uppercase">{editingUser.username ?? editingUser.email?.split('@')[0] ?? 'Unknown'}</p>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[#57534E] uppercase tracking-widest ml-1">Koin (Lightning)</label>
                    <div className="relative">
                      <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#CA8A04]" />
                      <input type="number" value={editingUser.coins} onChange={(e) => setEditingUser({...editingUser, coins: e.target.value})} className="w-full bg-[#0C0A09] border border-[#292524] rounded-xl py-3 pl-12 pr-4 text-white font-['Righteous'] text-lg" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-[#57534E] uppercase tracking-widest ml-1">Gems</label>
                      <div className="relative">
                        <Crown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                        <input type="number" value={editingUser.gems} onChange={(e) => setEditingUser({...editingUser, gems: e.target.value})} className="w-full bg-[#0C0A09] border border-[#292524] rounded-xl py-3 pl-12 pr-4 text-white font-['Righteous'] text-lg" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-[#57534E] uppercase tracking-widest ml-1">Stardust</label>
                      <div className="relative">
                        <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400" />
                        <input type="number" value={editingUser.dust} onChange={(e) => setEditingUser({...editingUser, dust: e.target.value})} className="w-full bg-[#0C0A09] border border-[#292524] rounded-xl py-3 pl-12 pr-4 text-white font-['Righteous'] text-lg" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setEditingUser(null)} className="flex-1 py-3.5 rounded-2xl bg-white/5 text-[#A8A29E] font-black uppercase text-xs">Cancel</button>
                  <button type="submit" disabled={isUpdating} className="flex-[2] py-3.5 rounded-2xl bg-[#CA8A04] text-black font-black uppercase text-xs disabled:opacity-50">{isUpdating ? 'Saving...' : 'Save Changes'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function PackManagerTab({ initialPacks }: { initialPacks: any[] }) {
  const [packs, setPacks] = useState(initialPacks)
  
  const handleToggle = async (id: string, current: boolean) => {
    try {
      const res = await fetch('/api/admin/packs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates: { is_available: !current } })
      })
      if (res.ok) {
        setPacks(packs.map(p => p.id === id ? { ...p, is_available: !current } : p))
      }
    } catch { alert('Update failed') }
  }

  const handlePriceChange = async (id: string, newPrice: number) => {
    try {
      const res = await fetch('/api/admin/packs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates: { price_coins: newPrice } })
      })
      if (res.ok) {
        setPacks(packs.map(p => p.id === id ? { ...p, price_coins: newPrice } : p))
      }
    } catch { alert('Update failed') }
  }

  return (
    <div className="bg-[#1C1917] border border-[#44403C] rounded-2xl p-6">
      <h2 className="font-['Righteous'] text-2xl text-white mb-6">Pack Manager</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#44403C] text-[#A8A29E] text-xs uppercase tracking-widest">
              <th className="py-4 px-4">Pack Name</th>
              <th className="py-4 px-4 w-40">Price (Coins)</th>
              <th className="py-4 px-4 text-center w-32">Status</th>
            </tr>
          </thead>
          <tbody>
            {packs.map((pack) => (
              <tr key={pack.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <img src={pack.cover_url} alt="" className="w-8 h-12 object-cover rounded-md shadow-md" />
                    <div>
                      <p className="text-white font-bold">{pack.name}</p>
                      <p className="text-[#57534E] text-[10px] uppercase font-['Righteous']">{pack.set_id}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2 bg-[#0C0A09] border border-[#292524] rounded-lg px-3 py-1">
                    <Zap className="w-3 h-3 text-yellow-400" />
                    <input 
                      type="number" 
                      defaultValue={pack.price_coins}
                      onBlur={(e) => {
                        const val = parseInt(e.target.value)
                        if (!isNaN(val) && val !== pack.price_coins) {
                          handlePriceChange(pack.id, val)
                        }
                      }}
                      className="w-full bg-transparent text-white text-sm font-bold focus:outline-none"
                    />
                  </div>
                </td>
                <td className="py-4 px-4 text-center">
                  <button 
                    onClick={() => handleToggle(pack.id, pack.is_available)}
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                      pack.is_available ? 'bg-green-500/20 text-green-400 hover:bg-red-500/20 hover:text-red-400' : 'bg-red-500/20 text-red-400 hover:bg-green-500/20 hover:text-green-400'
                    }`}
                  >
                    {pack.is_available ? 'Active' : 'Hidden'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PromoManagerTab({ initialPromos }: { initialPromos: any[] }) {
  const [promos, setPromos] = useState(initialPromos)
  const [isLoading, setIsLoading] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    const formData = new FormData(e.target as HTMLFormElement)
    const body = Object.fromEntries(formData.entries())
    
    try {
      const res = await fetch('/api/admin/promos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (res.ok) {
        setPromos([data, ...promos])
        ;(e.target as HTMLFormElement).reset()
      } else {
        alert(data.error)
      }
    } catch { alert('Network error') }
    finally { setIsLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus promo code ini?')) return
    try {
      const res = await fetch('/api/admin/promos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      if (res.ok) {
        setPromos(promos.filter(p => p.id !== id))
      }
    } catch { alert('Delete failed') }
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* List */}
      <div className="lg:col-span-2 bg-[#1C1917] border border-[#44403C] rounded-2xl p-6">
        <h2 className="font-['Righteous'] text-2xl text-white mb-6">Active Promo Codes</h2>
        <div className="space-y-3">
          {promos.length === 0 && <p className="text-[#A8A29E] text-sm text-center py-10">Belum ada promo code.</p>}
          {promos.map(promo => (
            <div key={promo.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#0C0A09] rounded-xl border border-[#292524]">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-mono text-lg font-bold text-white bg-white/10 px-2 py-0.5 rounded">{promo.code}</span>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                    promo.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {promo.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold text-[#A8A29E]">
                  <span className="flex items-center gap-1 text-[#CA8A04]"><Zap className="w-3 h-3"/> {promo.reward_amount} {promo.reward_type}</span>
                  <span>Uses: {promo.current_uses} / {promo.max_uses || '∞'}</span>
                </div>
              </div>
              <button onClick={() => handleDelete(promo.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors mt-3 sm:mt-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Create Form */}
      <div className="bg-[#1C1917] border border-[#CA8A04]/30 rounded-2xl p-6 h-fit sticky top-6 shadow-xl shadow-[#CA8A04]/5">
        <h2 className="font-['Righteous'] text-xl text-[#CA8A04] mb-6 flex items-center gap-2">
          <Plus className="w-5 h-5" /> Generate Code
        </h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-[#A8A29E] uppercase tracking-widest">Code</label>
            <input name="code" required placeholder="WELCOME2026" className="w-full bg-[#0C0A09] border border-[#44403C] rounded-lg p-3 text-white font-mono uppercase text-sm mt-1 focus:border-[#CA8A04] focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black text-[#A8A29E] uppercase tracking-widest">Reward Type</label>
              <select name="reward_type" required className="w-full bg-[#0C0A09] border border-[#44403C] rounded-lg p-3 text-white text-sm mt-1 focus:border-[#CA8A04] focus:outline-none appearance-none">
                <option value="coins">Coins</option>
                <option value="gems">Gems</option>
                <option value="dust">Dust</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-[#A8A29E] uppercase tracking-widest">Amount</label>
              <input name="reward_amount" type="number" required min="1" defaultValue="100" className="w-full bg-[#0C0A09] border border-[#44403C] rounded-lg p-3 text-white text-sm mt-1 focus:border-[#CA8A04] focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black text-[#A8A29E] uppercase tracking-widest">Max Uses (Optional)</label>
            <input name="max_uses" type="number" min="1" placeholder="Leave empty for unlimited" className="w-full bg-[#0C0A09] border border-[#44403C] rounded-lg p-3 text-white text-sm mt-1 focus:border-[#CA8A04] focus:outline-none" />
          </div>
          <button type="submit" disabled={isLoading} className="w-full py-3 mt-4 bg-[#CA8A04] text-black font-black uppercase tracking-wider rounded-xl text-xs hover:brightness-110 disabled:opacity-50">
            {isLoading ? 'Generating...' : 'Create Code'}
          </button>
        </form>
      </div>
    </div>
  )
}

function TransactionsTab({ transactions }: { transactions: any[] }) {
  const isMidtrans = (desc: string) => desc.toLowerCase().includes('midtrans')

  return (
    <div className="bg-[#1C1917] border border-[#44403C] rounded-2xl p-6">
      <h2 className="font-['Righteous'] text-2xl text-white mb-6 flex items-center gap-2">
        <Activity className="w-6 h-6 text-green-400" /> Revenue & Logs
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b border-[#44403C] text-[#A8A29E] text-xs uppercase tracking-widest">
              <th className="py-4 px-4 font-black">Date</th>
              <th className="py-4 px-4 font-black">Trainer</th>
              <th className="py-4 px-4 font-black">Type</th>
              <th className="py-4 px-4 font-black">Description</th>
              <th className="py-4 px-4 font-black text-right">Delta</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 && (
               <tr><td colSpan={5} className="py-8 text-center text-[#57534E]">No transactions found.</td></tr>
            )}
            {transactions.map(tx => (
              <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5 transition-colors text-sm">
                <td className="py-4 px-4 text-[#A8A29E]">
                  {new Date(tx.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="py-4 px-4 text-white font-bold">{tx.profiles?.username || 'Unknown'}</td>
                <td className="py-4 px-4">
                  <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                    isMidtrans(tx.description) ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-white/50'
                  }`}>
                    {tx.type}
                  </span>
                </td>
                <td className="py-4 px-4 text-[#A8A29E] max-w-[200px] truncate">{tx.description}</td>
                <td className="py-4 px-4 text-right font-mono font-bold">
                  {tx.gems_delta !== 0 && (
                    <span className={tx.gems_delta > 0 ? 'text-green-400' : 'text-red-400'}>
                      {tx.gems_delta > 0 ? '+' : ''}{tx.gems_delta} 💎
                    </span>
                  )}
                  {tx.coins_delta !== 0 && (
                    <span className={`ml-2 ${tx.coins_delta > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {tx.coins_delta > 0 ? '+' : ''}{tx.coins_delta} ⚡
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
