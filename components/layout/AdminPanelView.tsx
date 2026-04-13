'use client'
import { motion } from 'framer-motion'
import { useState } from 'react'
import {
  Users, Database, Zap, BookOpen, Shield, RefreshCw,
  TrendingUp, Clock, Crown, Star, AlertTriangle, Check, Search, SearchCode
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

  const handleSeed = async (mode: 'full' | 'packs_only' = 'full') => {
    setSeedStatus('loading')
    setSeedMsg('')
    try {
      // Call our secure proxy, which attaches the Authorization header server-side
      const res = await fetch(`/api/admin/seed-proxy?mode=${mode}`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setSeedStatus('success')
        const total = Object.values(data.seeded ?? {}).length
        setSeedMsg(data.message ?? `Done! ${total} sets processed.`)
      } else {
        setSeedStatus('error')
        setSeedMsg(data.error ?? 'Seeding failed. Check server logs.')
      }
    } catch {
      setSeedStatus('error')
      setSeedMsg('Network error. Check console.')
    }
  }

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
      <div className="grid lg:grid-cols-3 gap-6">

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

          {/* Seed Database */}
          <div className="bg-[#0C0A09] rounded-xl p-4 border border-[#292524] space-y-3">
            <div>
              <p className="text-white text-sm font-bold mb-0.5">Seed Database</p>
              <p className="text-[#A8A29E] text-xs">
                Populate the <span className="text-white font-medium">cards</span> &amp; <span className="text-white font-medium">packs</span> tables from the official Pokémon TCG API.
              </p>
            </div>

            {/* Full Seed */}
            <div>
              <p className="text-[#57534E] text-[10px] uppercase tracking-wider font-bold mb-1.5">Full Seed (Cards + Packs)</p>
              <button
                onClick={() => handleSeed('full')}
                disabled={seedStatus === 'loading'}
                className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  seedStatus === 'loading'
                    ? 'bg-[#292524] text-[#57534E] cursor-not-allowed'
                    : seedStatus === 'success'
                      ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                      : seedStatus === 'error'
                        ? 'bg-red-500/20 border border-red-500/40 text-red-400 cursor-pointer'
                        : 'bg-[#CA8A04] text-black hover:brightness-110 cursor-pointer'
                }`}
              >
                {seedStatus === 'loading' ? (
                  <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Seeding (30–60s)...</>
                ) : seedStatus === 'success' ? (
                  <><Check className="w-3.5 h-3.5" /> Done!</>
                ) : seedStatus === 'error' ? (
                  <><AlertTriangle className="w-3.5 h-3.5" /> Failed — Retry?</>
                ) : (
                  <><Database className="w-3.5 h-3.5" /> Run Full Seed</>
                )}
              </button>
            </div>

            {/* Packs Only */}
            <div>
              <p className="text-[#57534E] text-[10px] uppercase tracking-wider font-bold mb-1.5">Quick Seed (Packs Metadata Only)</p>
              <button
                onClick={() => handleSeed('packs_only')}
                disabled={seedStatus === 'loading'}
                className="w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-[#1C1917] border border-[#44403C] text-[#A8A29E] hover:border-[#CA8A04]/40 hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Seed Packs Only (Fast)
              </button>
            </div>

            {/* System Audit Tool */}
            <div className="pt-2 border-t border-white/5">
              <p className="text-[#57534E] text-[10px] uppercase tracking-wider font-bold mb-1.5">System Integrity</p>
              <button
                onClick={() => window.open('/api/admin/seed', '_blank')}
                className="w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <SearchCode className="w-3.5 h-3.5" />
                Inspect Database Counts
              </button>
            </div>

            {seedMsg && (
              <p className={`text-xs font-medium ${seedStatus === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                {seedMsg}
              </p>
            )}
          </div>
        </motion.div>

        {/* Recent Pulls */}
        <motion.div
          className="bg-[#1C1917] border border-[#44403C] rounded-2xl p-6 lg:col-span-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 }}
        >
          <h2 className="font-['Righteous'] text-white text-lg flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-[#CA8A04]" />
            Recent Pull Activity
          </h2>
          <div className="space-y-2">
            {recentPulls.length === 0 && (
              <p className="text-[#57534E] text-sm text-center py-8">No pull history yet.</p>
            )}
            {recentPulls.map((pull: any, i: number) => {
              const card = pull.cards
              const rarity = RARITY_LABELS[card?.rarity_tier ?? 1]
              const timeAgo = pull.pulled_at
                ? new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
                    Math.round((new Date(pull.pulled_at).getTime() - Date.now()) / 60000), 'minute')
                : '—'
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0"
                >
                  <Star className={`w-3.5 h-3.5 flex-shrink-0 ${rarity?.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-semibold truncate">{card?.name ?? 'Unknown'}</p>
                    <p className={`text-[10px] ${rarity?.color}`}>{rarity?.label}</p>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-2">
                    {pull.is_pity && <span className="text-[9px] bg-violet-500/20 text-violet-400 border border-violet-500/30 rounded-full px-1.5 py-0.5 font-bold">PITY</span>}
                    {pull.is_duplicate && <span className="text-[9px] bg-[#44403C]/60 text-[#A8A29E] rounded-full px-1.5 py-0.5 font-bold">DUP</span>}
                    <span className="text-[#57534E] text-[10px]">{timeAgo}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>

      {/* Latest Users */}
      <motion.div
        className="bg-[#1C1917] border border-[#44403C] rounded-2xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <h2 className="font-['Righteous'] text-white text-lg flex items-center gap-2 mb-5">
          <Crown className="w-5 h-5 text-[#CA8A04]" />
          Newest Trainers
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {latestUsers.map((u: any, i: number) => (
            <div key={i} className="bg-[#0C0A09] border border-[#292524] rounded-xl p-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#CA8A04] to-[#B45309] flex items-center justify-center text-black font-black text-sm mb-3">
                {(u.username ?? u.email ?? '?')[0].toUpperCase()}
              </div>
              <p className="text-white text-sm font-bold truncate">{u.username ?? u.email?.split('@')[0]}</p>
              <p className="text-[#57534E] text-[10px] truncate mt-0.5">{u.email}</p>
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
                <Zap className="w-3 h-3 text-[#CA8A04]" />
                <span className="text-[#A8A29E] text-[10px]" suppressHydrationWarning>{(u.total_pulls ?? 0).toLocaleString()} pulls</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
