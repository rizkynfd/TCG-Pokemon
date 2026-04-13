'use client'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useRef, useState } from 'react'
import Image from 'next/image'

export type PackVariant = 'mewtwo' | 'charizard' | 'pikachu' | 'standard'

interface BoosterPack3DProps {
  variant: PackVariant
  name: string
  imageUrl?: string | null
  logoUrl?: string | null
  isSelected?: boolean
  isHovered?: boolean
  onClick?: () => void
  disabled?: boolean
}

export const VARIANT_CONFIG: Record<PackVariant, {
  primary: string
  secondary: string
  accent: string
  glow: string
  bgGradient: string
  seriesColor: string
  tearColor: string
}> = {
  mewtwo: {
    primary: '#7B2FBE',
    secondary: '#1a0033',
    accent: '#E879F9',
    glow: 'rgba(168, 85, 247, 0.6)',
    bgGradient: 'linear-gradient(160deg, #4a1078 0%, #1e1b4b 40%, #0f0720 100%)',
    seriesColor: '#A855F7',
    tearColor: '#C084FC',
  },
  charizard: {
    primary: '#E3350E',
    secondary: '#3d0a00',
    accent: '#FB923C',
    glow: 'rgba(239, 68, 68, 0.6)',
    bgGradient: 'linear-gradient(160deg, #9a2a0a 0%, #450a00 40%, #0f0500 100%)',
    seriesColor: '#F97316',
    tearColor: '#FB923C',
  },
  pikachu: {
    primary: '#F59E0B',
    secondary: '#3d2e00',
    accent: '#FDE047',
    glow: 'rgba(234, 179, 8, 0.6)',
    bgGradient: 'linear-gradient(160deg, #92400e 0%, #451a03 40%, #0f0800 100%)',
    seriesColor: '#FBBF24',
    tearColor: '#FDE047',
  },
  standard: {
    primary: '#0EA5E9',
    secondary: '#0c1a2e',
    accent: '#38BDF8',
    glow: 'rgba(14, 165, 233, 0.5)',
    bgGradient: 'linear-gradient(160deg, #0c4a6e 0%, #082044 40%, #020b18 100%)',
    seriesColor: '#38BDF8',
    tearColor: '#7DD3FC',
  }
}

// Pokémon official logo SVG (text-based wordmark)
function PokemonLogo({ color = '#FFFFFF' }: { color?: string }) {
  return (
    <svg viewBox="0 0 200 50" className="w-full" aria-label="Pokémon">
      <text
        x="50%"
        y="38"
        textAnchor="middle"
        style={{
          fontFamily: "'Arial Black', 'Arial Bold', sans-serif",
          fontWeight: 900,
          fontSize: '36px',
          fill: color,
          stroke: '#000',
          strokeWidth: '2px',
          paintOrder: 'stroke fill',
          letterSpacing: '-1px',
        }}
      >
        Pokémon
      </text>
    </svg>
  )
}

// Metallic crimp strip (top or bottom)
function CrimpStrip({ position }: { position: 'top' | 'bottom' }) {
  const teethCount = 24
  const w = 100
  const amplitude = 5

  const points = Array.from({ length: teethCount + 1 }, (_, i) => {
    const x = (i / teethCount) * w
    const isEven = i % 2 === 0
    return position === 'top'
      ? `${x},${isEven ? 0 : amplitude}`
      : `${x},${isEven ? amplitude : 0}`
  })

  const path = position === 'top'
    ? `M${points.join('L')}L${w},20L0,20Z`
    : `M${points.join('L')}L${w},0L0,0Z`

  return (
    <svg
      viewBox={`0 0 ${w} 20`}
      preserveAspectRatio="none"
      className={`absolute left-0 right-0 w-full z-40 pointer-events-none ${position === 'top' ? '-top-[1px]' : '-bottom-[1px]'}`}
      style={{ height: '20px' }}
    >
      <defs>
        <linearGradient id={`crimp-grad-${position}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#888" />
          <stop offset="15%" stopColor="#ddd" />
          <stop offset="30%" stopColor="#aaa" />
          <stop offset="50%" stopColor="#eee" />
          <stop offset="70%" stopColor="#999" />
          <stop offset="85%" stopColor="#ccc" />
          <stop offset="100%" stopColor="#888" />
        </linearGradient>
        <linearGradient id={`crimp-shine-${position}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.4)" />
        </linearGradient>
      </defs>
      <path d={path} fill={`url(#crimp-grad-${position})`} />
      <path d={path} fill={`url(#crimp-shine-${position})`} opacity="0.5" />
    </svg>
  )
}

export default function BoosterPack3D({
  variant,
  name,
  imageUrl,
  logoUrl,
  isSelected,
  isHovered,
  onClick,
  disabled,
}: BoosterPack3DProps) {
  const config = VARIANT_CONFIG[variant]
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLocalHover, setIsLocalHover] = useState(false)

  /* ── Tilt physics ── */
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const mouseXSpring = useSpring(x, { stiffness: 120, damping: 18 })
  const mouseYSpring = useSpring(y, { stiffness: 120, damping: 18 })
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [12, -12])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-18, 18])
  const glareX  = useTransform(mouseXSpring, [-0.5, 0.5], ['0%', '100%'])
  const glareY  = useTransform(mouseYSpring, [-0.5, 0.5], ['0%', '100%'])
  const holoX   = useTransform(mouseXSpring, [-0.5, 0.5], ['60%', '40%'])
  const holoY   = useTransform(mouseYSpring, [-0.5, 0.5], ['60%', '40%'])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const r = containerRef.current.getBoundingClientRect()
    x.set((e.clientX - r.left) / r.width - 0.5)
    y.set((e.clientY - r.top) / r.height - 0.5)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
    setIsLocalHover(false)
  }

  /* ── Label text ── */
  const rawName = name.toUpperCase()
  const shortName = rawName.length > 18 ? rawName.slice(0, 18) + '…' : rawName

  return (
    <motion.div
      ref={containerRef}
      className={`relative cursor-pointer select-none ${disabled ? 'opacity-60 grayscale-[30%] cursor-not-allowed' : ''}`}
      style={{ perspective: '900px', aspectRatio: '4/7' }}
      onMouseMove={e => { if (!disabled) { handleMouseMove(e); setIsLocalHover(true) } }}
      onMouseLeave={handleMouseLeave}
      onClick={!disabled ? onClick : undefined}
      animate={{ scale: isSelected ? 1.06 : 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 22 }}
    >
      {/* Outer selection glow */}
      {isSelected && (
        <motion.div
          layoutId="pack-selection-glow"
          className="absolute -inset-6 rounded-full blur-3xl z-0 opacity-70"
          style={{ background: config.glow }}
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {/* 3D wrapper */}
      <motion.div
        className="relative w-full h-full"
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* ── MAIN PACK BODY ── */}
        <div
          className="absolute inset-0 rounded-sm overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.9)]"
          style={{ background: config.bgGradient }}
        >

          {/* === LAYER 1: Base gradient bg with noise texture === */}
          <div className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
              backgroundSize: '150px 150px',
            }}
          />

          {/* === LAYER 2: Pack artwork (full bleed) === */}
          {imageUrl && (
            <div className="absolute inset-0 z-[1]">
              <Image
                src={imageUrl}
                alt={name}
                fill
                className="object-cover"
                style={{ filter: 'brightness(1.15) contrast(1.1) saturate(1.3)' }}
                priority
                sizes="200px"
              />
              {/* Vignette overlay to make text readable */}
              <div className="absolute inset-0" style={{
                background: 'radial-gradient(ellipse 100% 80% at 50% 60%, transparent 30%, rgba(0,0,0,0.6) 100%)',
              }} />
            </div>
          )}

          {/* === LAYER 3: Color tint on top of image === */}
          <div
            className="absolute inset-0 z-[2] mix-blend-color opacity-20"
            style={{ background: config.primary }}
          />

          {/* === LAYER 4: Top branding strip === */}
          <div className="absolute top-0 left-0 right-0 z-[10]" style={{ height: '28%' }}>
            {/* Series color bar at very top */}
            <div
              className="absolute top-0 left-0 right-0 h-1"
              style={{ background: `linear-gradient(90deg, transparent, ${config.seriesColor}, transparent)` }}
            />

            {/* Logo area */}
            <div className="flex flex-col items-center pt-2 px-2">
              <div className="w-full" style={{ maxWidth: '75%' }}>
                <PokemonLogo color="#FFFFFF" />
              </div>
              <p className="text-[7px] font-black text-white/60 tracking-[0.25em] uppercase leading-none -mt-1">
                Trading Card Game
              </p>
              {/* Pocket badge */}
              <div
                className="mt-1.5 px-2 py-0.5 rounded text-[9px] font-black text-black tracking-widest shadow-lg"
                style={{ background: `linear-gradient(90deg, ${config.accent}, ${config.seriesColor})` }}
              >
                BOOSTER
              </div>
            </div>

            {/* Separator line */}
            <div
              className="absolute bottom-0 left-[5%] right-[5%] h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${config.seriesColor}, transparent)` }}
            />
          </div>

          {/* === LAYER 5: Central set logo === */}
          {logoUrl && (
            <div className="absolute z-[8] left-0 right-0 flex justify-center" style={{ top: '30%', height: '25%' }}>
              <div className="relative w-[55%] h-full drop-shadow-2xl">
                <Image
                  src={logoUrl}
                  alt=""
                  fill
                  className="object-contain"
                  style={{ filter: 'brightness(1.3) drop-shadow(0 4px 8px rgba(0,0,0,0.8))' }}
                  sizes="100px"
                />
              </div>
            </div>
          )}

          {/* === LAYER 6: Bottom name strip === */}
          <div className="absolute bottom-0 left-0 right-0 z-[10]" style={{ paddingBottom: '14px', paddingTop: '8px' }}>
            {/* Top separator */}
            <div
              className="mx-[4%] h-px mb-2"
              style={{ background: `linear-gradient(90deg, transparent, ${config.seriesColor}, transparent)` }}
            />

            {/* Set name */}
            <div className="flex flex-col items-center gap-1 px-2">
              <p
                className="text-[11px] font-black text-center text-white leading-tight tracking-wider drop-shadow-lg"
                style={{
                  textShadow: `0 0 10px ${config.accent}, 0 2px 4px rgba(0,0,0,0.8)`,
                  fontStyle: 'italic',
                }}
              >
                {shortName}
              </p>

              {/* "STANDARD" badge */}
              <div className="flex items-center gap-1">
                <div className="h-px w-4 bg-white/30" />
                <span className="text-[7px] font-black text-white/50 tracking-[0.3em] uppercase">STANDARD</span>
                <div className="h-px w-4 bg-white/30" />
              </div>
            </div>
          </div>

          {/* === LAYER 7: Left/right edge darkening (cylindrical effect) === */}
          <div className="absolute inset-y-0 left-0 w-[12%] z-[6]"
            style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.7), transparent)' }} />
          <div className="absolute inset-y-0 right-0 w-[12%] z-[6]"
            style={{ background: 'linear-gradient(270deg, rgba(0,0,0,0.7), transparent)' }} />

          {/* === LAYER 8: Holographic rainbow sheen (on hover) === */}
          <motion.div
            className="absolute inset-0 z-[15] pointer-events-none"
            style={{
              opacity: isLocalHover ? 0.35 : 0,
              background: `radial-gradient(ellipse 120% 120% at ${holoX} ${holoY},
                rgba(255,0,128,0.5) 0%,
                rgba(255,165,0,0.4) 20%,
                rgba(255,255,0,0.3) 35%,
                rgba(0,255,100,0.4) 50%,
                rgba(0,150,255,0.4) 65%,
                rgba(180,0,255,0.5) 80%,
                transparent 100%)`,
              mixBlendMode: 'screen',
              transition: 'opacity 0.3s ease',
            }}
          />

          {/* === LAYER 9: Glare highlight === */}
          <motion.div
            className="absolute inset-0 z-[16] pointer-events-none"
            style={{
              opacity: isLocalHover ? 0.25 : 0.08,
              background: `linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.9) ${glareX}, transparent 80%)`,
              backgroundSize: '300% 100%',
              transition: 'opacity 0.3s ease',
            }}
          />

          {/* === LAYER 10: subtle foil lines === */}
          <div className="absolute inset-0 z-[5] pointer-events-none opacity-10"
            style={{
              backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.4) 0px, transparent 1px, transparent 3px)',
              backgroundSize: '4px 100%',
            }}
          />
        </div>

        {/* ── CRIMP EDGES (metallic, torn style) ── */}
        <CrimpStrip position="top" />
        <CrimpStrip position="bottom" />

        {/* ── SIDE SHEEN (faux 3D depth) ── */}
        <div
          className="absolute inset-y-4 -right-1 w-2 z-50"
          style={{
            background: 'linear-gradient(180deg, #888 0%, #ccc 30%, #999 60%, #bbb 100%)',
            transform: 'translateZ(-2px) rotateY(90deg)',
            transformOrigin: 'left center',
            borderRadius: '0 2px 2px 0',
          }}
        />
      </motion.div>
    </motion.div>
  )
}
