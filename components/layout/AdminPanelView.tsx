'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import {
  Users, Database, Zap, BookOpen, Shield, RefreshCw,
  TrendingUp, Clock, Crown, Star, AlertTriangle, Check, Search, SearchCode,
  Sparkles
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
  adminEmail: string
}

export default function AdminPanelView({ stats, recentPulls, latestUsers, adminEmail }: AdminPanelViewProps) {
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
        window.location.reload() // Quickest way to refresh the server data
      } else {
        alert('Update failed')
      }
    } catch {
      alert('Network error')
    } finally {
      setIsUpdating(false)
    }
  }

  const filteredUsers = latestUsers.filter(u => 
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const statCards = [
    { label: 'Total Users',     value: stats.totalUsers,     icon: Users,    color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20' },
    { label: 'Available Cards', value: stats.totalCards,     icon: BookOpen, color: 'text-[#CA8A04]',  bg: 'bg-[#CA8A04]/10',   border: 'border-[#CA8A04]/20' },
    { label: 'Total Pulls',     value: stats.totalPulls,     icon: Zap,      color: 'text-yellow-400', bg: 'bg-yellow-500/10',  border: 'border-yellow-500/20' },
    { label: 'Inventory Rows',  value: stats.totalInventory, icon: Database, color: 'text-violet-400', bg: 'bg-violet-500/10',  border: 'border-violet-500/20' },
  ]

  return (
    <div className="min-h-screen p-6 lg:p-10 max-w-7xl mx-auto space-y-10 font-['Outfit']">
      
      {/* Header */}
      <motion.div
        className="flex items-center justify-between"
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
        <div className="hidden lg:flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span className="text-red-400 text-xs font-bold">Admin Mode Active</span>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg, border }, i) => (
          <motion.div
            key={label}
            className={`${bg} border ${border} rounded-2xl p-5`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <div className={`w-9 h-9 rounded-xl ${bg} border ${border} flex items-center justify-center mb-3`}>
              <Icon className={`w-4.5 h-4.5 ${color}`} />
            </div>
            <p className={`font-['Righteous'] text-2xl ${color}`} suppressHydrationWarning>{value.toLocaleString()}</p>
            <p className="text-[#A8A29E] text-xs mt-0.5 font-medium">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Actions + Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Admin Actions */}
        <motion.div
          className="bg-[#1C1917] border border-[#44403C] rounded-2xl p-6 space-y-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
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
              <button
                onClick={() => handleSeed('full')}
                disabled={seedStatus === 'loading'}
                className="flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-[#CA8A04] text-black hover:brightness-110 disabled:opacity-50"
              >
                {seedStatus === 'loading' ? 'Seeding...' : 'Full Seed'}
              </button>
              <button
                onClick={() => handleSeed('packs_only')}
                disabled={seedStatus === 'loading'}
                className="flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider border border-[#44403C] text-[#A8A29E] hover:text-white"
              >
                Packs Only
              </button>
            </div>
          </div>
        </motion.div>

        {/* Recent Pulls */}
        <motion.div
          className="bg-[#1C1917] border border-[#44403C] rounded-2xl p-6 overflow-hidden flex flex-col"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 }}
        >
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
                  <span className="text-[#57534E] text-[10px]">Active</span>
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>

      {/* User Management Section */}
      <motion.div
        className="bg-[#1C1917] border border-[#44403C] rounded-2xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
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
              className="pl-10 pr-4 py-2 bg-[#0C0A09] border border-[#292524] rounded-xl text-xs text-white placeholder-[#57534E] focus:outline-none focus:border-[#CA8A04]/50 hover:border-[#292524] transition-all w-full sm:w-64"
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
                <button 
                  onClick={() => setEditingUser(u)}
                  className="p-1.5 rounded-lg bg-white/5 text-[#A8A29E] opacity-0 group-hover:opacity-100 hover:text-white hover:bg-[#CA8A04] transition-all"
                >
                  <SearchCode className="w-4 h-4" />
                </button>
              </div>
              <p className="text-white text-sm font-bold truncate">{u.username ?? 'Unnamed Trainer'}</p>
              <p className="text-[#57534E] text-[10px] truncate">{u.email}</p>
              
              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/5">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-yellow-400" />
                  <span className="text-[#A8A29E] text-[10px] font-bold" suppressHydrationWarning>{u.coins.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Crown className="w-3 h-3 text-blue-400" />
                  <span className="text-[#A8A29E] text-[10px] font-bold" suppressHydrationWarning>{u.gems.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Edit Balances Modal */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingUser(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-[#1C1917] border border-[#CA8A04]/50 rounded-3xl p-8 shadow-2xl overflow-hidden shadow-[#CA8A04]/10"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#CA8A04] to-transparent" />
              
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#CA8A04] to-[#B45309] flex items-center justify-center text-black font-black text-2xl mx-auto mb-4 shadow-xl">
                  {editingUser.username[0].toUpperCase()}
                </div>
                <h3 className="font-['Righteous'] text-2xl text-white">Manage Trainer</h3>
                <p className="text-[#A8A29E] text-sm uppercase tracking-widest font-black mt-1">{editingUser.username}</p>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[#57534E] uppercase tracking-widest ml-1">Koin (Lightning)</label>
                    <div className="relative">
                      <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#CA8A04]" />
                      <input 
                        type="number"
                        value={editingUser.coins}
                        onChange={(e) => setEditingUser({...editingUser, coins: e.target.value})}
                        className="w-full bg-[#0C0A09] border border-[#292524] rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#CA8A04]/50 transition-all font-['Righteous'] text-lg"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-[#57534E] uppercase tracking-widest ml-1">Gems</label>
                      <div className="relative">
                        <Crown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                        <input 
                          type="number"
                          value={editingUser.gems}
                          onChange={(e) => setEditingUser({...editingUser, gems: e.target.value})}
                          className="w-full bg-[#0C0A09] border border-[#292524] rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500/50 transition-all font-['Righteous'] text-lg"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-[#57534E] uppercase tracking-widest ml-1">Stardust</label>
                      <div className="relative">
                        <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400" />
                        <input 
                          type="number"
                          value={editingUser.dust}
                          onChange={(e) => setEditingUser({...editingUser, dust: e.target.value})}
                          className="w-full bg-[#0C0A09] border border-[#292524] rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-violet-500/50 transition-all font-['Righteous'] text-lg"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="flex-1 py-3.5 rounded-2xl bg-white/5 text-[#A8A29E] font-black uppercase tracking-wider text-xs hover:bg-white/10 transition-all border border-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="flex-[2] py-3.5 rounded-2xl bg-[#CA8A04] text-black font-black uppercase tracking-wider text-xs hover:shadow-[0_0_20px_rgba(202,138,4,0.4)] transition-all disabled:opacity-50"
                  >
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
