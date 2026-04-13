'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, Zap, Clock } from 'lucide-react'
import type { EventConfig } from '@/lib/event-config'

interface EventBannerProps {
  event: EventConfig
}

function useCountdown(endDate: string) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const tick = () => {
      const diff = new Date(endDate).getTime() - Date.now()
      if (diff <= 0) { setTimeLeft('Ended'); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      setTimeLeft(d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m`)
    }
    tick()
    const id = setInterval(tick, 60000)
    return () => clearInterval(id)
  }, [endDate])

  return timeLeft
}

const BADGE_COLORS: Record<string, string> = {
  gold:  'bg-[#CA8A04]/20 text-[#CA8A04] border-[#CA8A04]/40',
  red:   'bg-red-500/20 text-red-400 border-red-500/40',
  blue:  'bg-blue-500/20 text-blue-400 border-blue-500/40',
  green: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
}

export default function EventBanner({ event }: EventBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const timeLeft = useCountdown(event.endDate)

  // Check localStorage dismissal and set mounted
  useEffect(() => {
    const wasDismissed = localStorage.getItem(`event_dismissed_${event.id}`)
    if (wasDismissed) setDismissed(true)
    setIsMounted(true)
  }, [event.id])

  const handleDismiss = () => {
    localStorage.setItem(`event_dismissed_${event.id}`, '1')
    setDismissed(true)
  }

  // Check if event is expired
  const isExpired = new Date(event.endDate).getTime() < Date.now()

  // Prevent hydration mismatch: don't render until mounted
  if (!isMounted || !event.enabled || isExpired || dismissed) return null

  const badgeClass = BADGE_COLORS[event.badgeColor] ?? BADGE_COLORS.gold

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.98 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#1C1917]/80 backdrop-blur-xl p-5 mb-6"
        >
          {/* Gradient accent bar */}
          <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${event.accentColor}`} />
          
          {/* Glow */}
          <div className={`absolute -top-12 left-1/4 w-72 h-32 bg-gradient-to-r ${event.accentColor} opacity-10 blur-3xl rounded-full pointer-events-none`} />

          <div className="flex items-start gap-4 relative">
            {/* Icon */}
            <div className={`flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${event.accentColor} flex items-center justify-center shadow-lg`}>
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className={`text-[9px] font-black tracking-[0.3em] uppercase px-2 py-0.5 rounded-full border ${badgeClass}`}>
                  {event.badgeLabel}
                </span>
                <div className="flex items-center gap-1 text-[#A8A29E] text-[10px] font-medium">
                  <Clock className="w-3 h-3" />
                  <span>Ends in <span className="text-white font-bold">{timeLeft}</span></span>
                </div>
              </div>

              <h3 className="font-['Righteous'] text-white text-lg leading-tight">
                {event.title} <span className="text-[#CA8A04]">—</span> {event.subtitle}
              </h3>
              <p className="text-[#A8A29E] text-xs mt-1 line-clamp-2">{event.description}</p>
            </div>

            {/* CTA + Dismiss */}
            <div className="flex-shrink-0 flex items-center gap-2">
              <Link
                href={event.ctaHref}
                className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r ${event.accentColor} text-white text-xs font-black uppercase tracking-wider shadow-lg hover:brightness-110 transition-all`}
              >
                {event.ctaLabel}
              </Link>
              <button
                onClick={handleDismiss}
                className="w-8 h-8 rounded-xl bg-white/5 text-[#A8A29E] hover:text-white hover:bg-white/10 transition-all flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mobile CTA */}
          <div className="sm:hidden mt-3">
            <Link
              href={event.ctaHref}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r ${event.accentColor} text-white text-xs font-black uppercase tracking-wider shadow-lg`}
            >
              {event.ctaLabel}
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
