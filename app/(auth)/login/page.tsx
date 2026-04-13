'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Mail, Lock, User, Eye, EyeOff, Package, Star, Shield, ArrowRight, Globe } from 'lucide-react'

type AuthMode = 'login' | 'register'

const FEATURES = [
  { icon: Package, text: 'Open virtual booster packs' },
  { icon: Star,    text: 'Collect rare Pokémon cards' },
  { icon: Zap,     text: 'Daily rewards & quests' },
  { icon: Shield,  text: 'Pity system guaranteed pulls' },
]

// Google wordmark SVG
function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

export default function LoginPage() {
  const [mode, setMode]               = useState<AuthMode>('login')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [username, setUsername]       = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]         = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError]             = useState('')
  const [success, setSuccess]         = useState('')

  const supabase = createClient()

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setError('')
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/callback` },
    })
    setGoogleLoading(false)
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!email || !password) { setError('Please fill in all fields.'); return }
    if (mode === 'register' && !username.trim()) { setError('Username is required.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }

    setLoading(true)

    try {
      if (mode === 'login') {
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
        if (signInErr) {
          setError(signInErr.message === 'Invalid login credentials'
            ? 'Incorrect email or password.'
            : signInErr.message)
          return
        }
        window.location.href = '/dashboard'
      } else {
        // Register
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, username: username.trim() }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error ?? 'Registration failed.'); return }
        setSuccess('Account created! Check your email to confirm, then log in.')
        setMode('login')
        setPassword('')
        setUsername('')
      }
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (next: AuthMode) => {
    setMode(next)
    setError('')
    setSuccess('')
    setEmail('')
    setPassword('')
    setUsername('')
  }

  return (
    <main className="min-h-screen flex bg-[#0C0A09] relative overflow-hidden">

      {/* ── Left Panel (desktop only) ── */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] min-h-screen bg-gradient-to-br from-[#1C1917] via-[#0C0A09] to-[#1a0f00] p-14 relative overflow-hidden">
        
        {/* Glow orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#CA8A04]/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-orange-900/10 blur-[100px] rounded-full" />

        {/* Floating TCG cards decoration */}
        {[
          { top: '20%', left: '10%', rotate: -12, delay: 0,   border: '#CA8A04' },
          { top: '35%', left: '55%', rotate: 8,   delay: 0.8, border: '#3B82F6' },
          { top: '60%', left: '20%', rotate: 5,   delay: 1.5, border: '#8B5CF6' },
          { top: '75%', left: '65%', rotate: -7,  delay: 0.4, border: '#CA8A04' },
        ].map((c, i) => (
          <motion.div
            key={i}
            className="absolute w-16 h-[88px] rounded-xl border opacity-25"
            style={{ top: c.top, left: c.left, borderColor: c.border, background: 'rgba(28,25,23,0.8)' }}
            animate={{ y: [0, -14, 0], rotate: [c.rotate, c.rotate + 2, c.rotate] }}
            transition={{ duration: 3.5 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: c.delay }}
          />
        ))}

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#CA8A04] to-[#B45309] flex items-center justify-center shadow-[0_0_20px_rgba(202,138,4,0.4)]">
              <Zap className="w-5 h-5 text-black fill-black" />
            </div>
            <span className="font-['Righteous'] text-2xl text-white">PokéVault</span>
          </div>
          <p className="text-[10px] font-black text-[#CA8A04] tracking-[0.3em] uppercase">TCG Collection Platform</p>
        </div>

        {/* Hero text */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="font-['Righteous'] text-5xl text-white leading-tight mb-4">
              Collect.<br />
              <span className="text-[#CA8A04]">Craft.</span><br />
              Conquer.
            </h2>
            <p className="text-[#A8A29E] text-base leading-relaxed max-w-xs">
              The ultimate Pokémon TCG digital experience. Build your dream collection and climb the ranks.
            </p>
          </div>

          {/* Feature pills */}
          <div className="space-y-3">
            {FEATURES.map(({ icon: Icon, text }, i) => (
              <motion.div
                key={text}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                <div className="w-8 h-8 rounded-lg bg-[#CA8A04]/15 border border-[#CA8A04]/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-[#CA8A04]" />
                </div>
                <span className="text-[#A8A29E] text-sm">{text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-[#44403C] text-xs">© 2026 PokéVault TCG. All rights reserved.</p>
      </div>

      {/* ── Right Panel (Auth Form) ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative">

        {/* Mobile logo */}
        <div className="lg:hidden flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#CA8A04] to-[#B45309] flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(202,138,4,0.5)]">
            <Zap className="w-6 h-6 text-black fill-black" />
          </div>
          <h1 className="font-['Righteous'] text-3xl text-[#CA8A04]">PokéVault</h1>
          <p className="text-[#A8A29E] text-xs mt-1">Collect. Craft. Conquer.</p>
        </div>

        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Mode tabs */}
          <div className="flex bg-[#1C1917] border border-[#44403C] rounded-2xl p-1 mb-8">
            {(['login', 'register'] as AuthMode[]).map(m => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  mode === m
                    ? 'bg-[#CA8A04] text-black shadow-lg'
                    : 'text-[#A8A29E] hover:text-white'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {/* Heading */}
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="mb-6"
            >
              <h2 className="font-['Righteous'] text-3xl text-white mb-1">
                {mode === 'login' ? 'Welcome back, Trainer' : 'Join the Vault'}
              </h2>
              <p className="text-[#A8A29E] text-sm">
                {mode === 'login'
                  ? 'Sign in to your collection.'
                  : 'Create your trainer account and start collecting.'}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Error / Success */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="mb-4 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email/Password form */}
          <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
            <AnimatePresence>
              {mode === 'register' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <label className="block text-xs font-bold text-[#A8A29E] uppercase tracking-wider mb-1.5">
                    Trainer Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#57534E]" />
                    <input
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="e.g. AshKetchum99"
                      maxLength={30}
                      className="w-full bg-[#1C1917] border border-[#44403C] rounded-xl pl-11 pr-4 py-3.5 text-white text-sm placeholder:text-[#57534E] focus:outline-none focus:border-[#CA8A04] focus:ring-1 focus:ring-[#CA8A04]/20 transition-all"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-xs font-bold text-[#A8A29E] uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#57534E]" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="trainer@example.com"
                  className="w-full bg-[#1C1917] border border-[#44403C] rounded-xl pl-11 pr-4 py-3.5 text-white text-sm placeholder:text-[#57534E] focus:outline-none focus:border-[#CA8A04] focus:ring-1 focus:ring-[#CA8A04]/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#A8A29E] uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#57534E]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? 'Min. 6 characters' : '••••••••'}
                  className="w-full bg-[#1C1917] border border-[#44403C] rounded-xl pl-11 pr-12 py-3.5 text-white text-sm placeholder:text-[#57534E] focus:outline-none focus:border-[#CA8A04] focus:ring-1 focus:ring-[#CA8A04]/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#57534E] hover:text-[#A8A29E] transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
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
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-[#292524]" />
            <span className="text-[#57534E] text-xs font-medium">or continue with</span>
            <div className="flex-1 h-px bg-[#292524]" />
          </div>

          {/* Google Button */}
          <motion.button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-900 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group cursor-pointer"
            whileHover={!googleLoading ? { scale: 1.01 } : {}}
            whileTap={!googleLoading ? { scale: 0.99 } : {}}
          >
            {!googleLoading && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-200/60 to-transparent -skew-x-12 pointer-events-none"
                animate={{ x: ['-200%', '200%'] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
              />
            )}

            {googleLoading ? (
              <motion.div
                className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              />
            ) : (
              <GoogleIcon size={20} />
            )}
            <span className="relative z-10">{googleLoading ? 'Redirecting...' : 'Continue with Google'}</span>
          </motion.button>

          <p className="text-[#44403C] text-xs text-center mt-6 leading-relaxed">
            By continuing, you agree to our{' '}
            <span className="text-[#CA8A04] cursor-pointer hover:underline">Terms of Service</span>
            {' '}and{' '}
            <span className="text-[#CA8A04] cursor-pointer hover:underline">Privacy Policy</span>.
          </p>
        </motion.div>
      </div>
    </main>
  )
}
