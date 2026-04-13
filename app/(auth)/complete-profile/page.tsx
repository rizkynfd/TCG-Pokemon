'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Zap, User, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function CompleteProfilePage() {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [error, setError] = useState('')
  const [userEmail, setUserEmail] = useState('')
  
  const supabase = createClient()
  const router   = useRouter()

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      setUserEmail(user.email ?? '')

      // Check if already has a properly set username
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()

      // Pre-fill with current username
      const profileData = profile as { username: string } | null
      if (profileData?.username) setUsername(profileData.username)
      setCheckingAuth(false)
    }
    check()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const trimmed = username.trim()
    if (trimmed.length < 3 || trimmed.length > 30) {
      setError('Username must be 3–30 characters.')
      return
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setError('Only letters, numbers, and underscores allowed.')
      return
    }

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      // Check uniqueness
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .ilike('username', trimmed)
        .neq('id', user.id)
        .maybeSingle()

      if (existing) {
        setError('Username is already taken. Try another.')
        return
      }

      const { error: updateErr } = await (supabase
        .from('profiles') as any)
        .update({ username: trimmed })
        .eq('id', user.id)

      if (updateErr) {
        setError('Failed to update. Please try again.')
        return
      }

      router.replace('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#0C0A09] flex items-center justify-center">
        <motion.div
          className="w-8 h-8 border-2 border-[#CA8A04]/30 border-t-[#CA8A04] rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0C0A09] relative overflow-hidden p-4">
      {/* BG orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#CA8A04]/8 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-orange-900/10 blur-3xl pointer-events-none" />

      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Card */}
        <div className="bg-[#1C1917]/80 backdrop-blur-xl border border-[#44403C] rounded-3xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <motion.div
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#CA8A04] to-[#B45309] flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(202,138,4,0.4)]"
              animate={{ boxShadow: ['0 0 20px rgba(202,138,4,0.3)', '0 0 40px rgba(202,138,4,0.6)', '0 0 20px rgba(202,138,4,0.3)'] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Zap className="w-7 h-7 text-black fill-black" />
            </motion.div>
            <h1 className="font-['Righteous'] text-2xl text-[#CA8A04] mb-1">Almost There!</h1>
            <p className="text-[#A8A29E] text-sm text-center">
              Welcome, <span className="text-white font-medium">{userEmail}</span>!<br />
              Choose your Trainer username.
            </p>
          </div>

          {/* Steps indicator */}
          <div className="flex items-center gap-2 mb-8">
            <div className="flex items-center gap-1.5 flex-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="text-emerald-400 text-xs font-bold">Google Connected</span>
            </div>
            <div className="w-8 h-px bg-[#44403C]" />
            <div className="flex items-center gap-1.5 flex-1 justify-end">
              <span className="text-[#CA8A04] text-xs font-bold">Set Username</span>
              <div className="w-4 h-4 rounded-full border-2 border-[#CA8A04] flex-shrink-0" />
            </div>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-[#A8A29E] uppercase tracking-wider mb-2">
                Trainer Username
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#57534E]" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="AshKetchum99"
                  maxLength={30}
                  className="w-full bg-[#0C0A09] border border-[#44403C] rounded-xl pl-11 pr-4 py-3.5 text-white text-sm placeholder:text-[#57534E] focus:outline-none focus:border-[#CA8A04] focus:ring-1 focus:ring-[#CA8A04]/20 transition-all font-medium"
                  autoFocus
                />
              </div>
              <p className="text-[#57534E] text-[11px] mt-1.5 pl-1">
                3–30 characters. Letters, numbers, underscores only.
              </p>
            </div>

            <motion.button
              type="submit"
              disabled={loading || !username.trim()}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-[#CA8A04] to-[#F59E0B] text-black font-black text-sm uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:brightness-110 shadow-[0_0_20px_rgba(202,138,4,0.25)]"
              whileHover={!loading ? { scale: 1.01 } : {}}
              whileTap={!loading ? { scale: 0.99 } : {}}
            >
              {loading ? (
                <motion.div
                  className="w-5 h-5 border-2 border-black/40 border-t-black rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                />
              ) : (
                'Enter the Vault'
              )}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </main>
  )
}
