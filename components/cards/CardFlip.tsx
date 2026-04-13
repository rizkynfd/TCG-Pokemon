'use client'
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion'
import { useRef, useState } from 'react'
import Image from 'next/image'
import { type PulledCardData } from '@/store/useGachaStore'
import { Star } from 'lucide-react'

const RARITY_CONFIG: Record<number, {
  glowClass: string
  labelColor: string
  bgGradient: string
  particleColor: string
  label: string
  eliteColor?: string
}> = {
  1: { glowClass: 'glow-common',   labelColor: 'text-gray-400',   bgGradient: 'from-gray-900/80 via-stone-900/80',   particleColor: '#78716C', label: 'Common' },
  2: { glowClass: 'glow-uncommon', labelColor: 'text-green-400',  bgGradient: 'from-green-950/80 via-stone-900/80',  particleColor: '#16A34A', label: 'Uncommon' },
  3: { glowClass: 'glow-rare',     labelColor: 'text-blue-400',   bgGradient: 'from-blue-950/80 via-stone-900/80',   particleColor: '#2563EB', label: 'Rare' },
  4: { glowClass: 'glow-ultra',    labelColor: 'text-violet-400', bgGradient: 'from-violet-950/80 via-stone-900/80', particleColor: '#9333EA', label: 'Ultra Rare' },
  5: { glowClass: 'glow-secret',   labelColor: 'text-orange-400', bgGradient: 'from-orange-950/80 via-stone-900/80', particleColor: '#EA580C', label: 'Secret Rare', eliteColor: '#F59E0B' },
}

// Utility to determine flair level and elite status based on rarity string
function getCardFlair(rarity: string | null, tier: number): { level: number; isElite: boolean; isSIR: boolean } {
  const r = (rarity || '').toLowerCase()
  const isSIR = r.includes('special illustration') || r.includes('illustration rare')
  const isSecret = r.includes('secret') || r.includes('hyper') || r.includes('gold')
  
  let level = tier
  if (isSIR) level = 5
  else if (isSecret) level = 4
  
  return { level, isElite: isSIR || isSecret, isSIR }
}

// Rainbow Animated Flowing Border for SIR
function EliteBorder({ isSIR }: { isSIR: boolean }) {
  return (
    <div 
      className="absolute inset-0 z-[45] pointer-events-none rounded-xl overflow-hidden p-[2px]"
      style={{
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'xor',
        maskComposite: 'exclude',
      }}
    >
      <motion.div 
        className={`absolute inset-[-100%] ${isSIR ? 'bg-[conic-gradient(from_0deg,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)]' : 'bg-[conic-gradient(from_0deg,#F59E0B,#FEF3C7,#F59E0B)]'}`}
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />
    </div>
  )
}

// Prismatic Texture for SR
function PrismaticOverlay({ mouseX, mouseY }: { mouseX: any, mouseY: any }) {
  const prismX = useTransform(mouseX, [-0.5, 0.5], ['-10%', '110%'])
  const prismY = useTransform(mouseY, [-0.5, 0.5], ['-10%', '110%'])
  
  return (
    <motion.div 
      className="absolute inset-0 z-30 pointer-events-none mix-blend-color-dodge opacity-40 translate-z-10"
      style={{ 
        backgroundImage: `linear-gradient(135deg, transparent 20%, #F59E0B 40%, #FEF3C7 50%, #F59E0B 60%, transparent 80%)`,
        backgroundSize: '250% 250%',
        backgroundPosition: `${prismX} ${prismY}`
      }}
    />
  )
}

interface CardFlipProps {
  cardData: PulledCardData
  isRevealed: boolean
  index: number
  onClick?: () => void
  size?: 'sm' | 'md' | 'lg'
  flairLevel?: number
  isInspecting?: boolean
}

// Sparkle Particle Component for Tier 2+
function FlairParticles({ color, xVal, yVal, isInspecting = false, isElite = false }: { color: string, xVal: any, yVal: any, isInspecting?: boolean, isElite?: boolean }) {
  const count = isInspecting ? (isElite ? 30 : 20) : (isElite ? 18 : 12)
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: (isInspecting ? 2 : 1) + Math.random() * (isElite ? 5 : 3),
    delay: Math.random() * 2
  }))

  const trailX = useTransform(xVal, [-0.5, 0.5], ['5%', '-5%'])
  const trailY = useTransform(yVal, [-0.5, 0.5], ['5%', '-5%'])

  return (
    <motion.div 
      className="absolute inset-0 pointer-events-none z-20 overflow-hidden"
      style={{ x: trailX, y: trailY }}
    >
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{ 
            left: `${p.x}%`, 
            top: `${p.y}%`, 
            width: p.size, 
            height: p.size, 
            backgroundColor: color,
            boxShadow: `0 0 10px ${color}`,
            filter: 'blur(0.5px)'
          }}
          animate={{
            y: [0, -80],
            opacity: [0, 1, 0],
            scale: [0.5, 1.8, 0.5],
            rotate: [0, 180]
          }}
          transition={{
            duration: 1.5 + Math.random() * 2,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut"
          }}
        />
      ))}
    </motion.div>
  )
}

// Micro-foil texture for premium feel
function FoilOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none mix-blend-soft-light opacity-20 z-10">
      <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/prism.png')]" />
    </div>
  )
}

// Environmental Map Reflection + Prismatic Shine
function EnvironmentalShine({ rotateX, rotateY, color = 'rgba(255,255,255,0.8)' }: { rotateX: any, rotateY: any, color?: string }) {
  const shineX = useTransform(rotateY, [-45, 45], ['100%', '0%'])
  const shineY = useTransform(rotateX, [-45, 45], ['100%', '0%'])
  
  return (
    <>
      {/* Primary Gloss Reflection */}
      <motion.div 
        className="absolute inset-0 z-40 pointer-events-none mix-blend-soft-light opacity-30"
        style={{ 
          background: `radial-gradient(circle at ${shineX} ${shineY}, ${color} 0%, transparent 60%)`,
        }}
      />
      {/* Prismatic Glint */}
      <motion.div 
        className="absolute inset-0 z-40 pointer-events-none mix-blend-color-dodge opacity-20"
        style={{ 
          background: `linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.4) 50%, transparent 60%)`,
          backgroundSize: '200% 200%',
          x: useTransform(rotateY, [-45, 45], ['-50%', '50%']),
          y: useTransform(rotateX, [-45, 45], ['-50%', '50%']),
        }}
      />
    </>
  )
}

// 3D Thickness Edge
function CardEdge() {
  return (
    <div className="absolute inset-0 z-0 bg-[#333] translate-z-[-1px] rounded-xl border border-white/5" />
  )
}

export default function CardFlip({ cardData, isRevealed, index, onClick, size = 'md', flairLevel: propFlairLevel, isInspecting = false }: CardFlipProps) {
  const { card, isDuplicate, dustReceived, isPity } = cardData
  
  // Calculate dynamic flair based on rarity string
  const { level: derivedLevel, isElite, isSIR } = getCardFlair(card.rarity, card.rarity_tier)
  const flairLevel = propFlairLevel !== undefined ? propFlairLevel : derivedLevel
  
  const config = RARITY_CONFIG[card.rarity_tier] ?? RARITY_CONFIG[1]
  const containerRef = useRef<HTMLDivElement>(null)

  // Tilt Logic
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 })
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 })

  // Larger rotation range for inspection
  const maxRot = isInspecting ? 45 : 15
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [maxRot, -maxRot])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-maxRot, maxRot])
  
  const shineX = useTransform(mouseXSpring, [-0.5, 0.5], ['0%', '100%'])
  const shineY = useTransform(mouseYSpring, [-0.5, 0.5], ['0%', '100%'])
  
  // Advanced flair interaction
  const holoPos = useTransform(mouseXSpring, [-0.5, 0.5], ['-20%', '120%'])

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top
    const xPct = (mouseX / width) - 0.5
    const yPct = (mouseY / height) - 0.5
    x.set(xPct)
    y.set(yPct)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  const sizeClasses = {
    sm: 'w-28 h-40',
    md: 'w-40 h-56',
    lg: 'w-64 h-80',
  }

  const imgSizes = {
    sm: { w: 112, h: 160 },
    md: { w: 160, h: 224 },
    lg: { w: 256, h: 320 },
  }

  const rotatedYValue = useTransform(rotateY, (v) => v + 180)

  return (
    <motion.div
      ref={containerRef}
      className={`relative cursor-pointer perspective-1000 ${sizeClasses[size]} group`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      <motion.div
        className="relative w-full h-full preserve-3d"
        style={{ 
          rotateX: isRevealed ? rotateX : 0, 
          rotateY: isRevealed ? rotatedYValue : rotateY,
        }}
        animate={{ rotateY: isRevealed ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 15 }}
      >
        {/* BACK — Premium "PokéVault" Design */}
        <div
          className="absolute inset-0 rounded-xl overflow-hidden border-2 border-yellow-600/30 bg-[#0C0A09]"
          style={{ 
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            opacity: (isRevealed && !isInspecting) ? 0 : 1
          }}
        >
          <div className="w-full h-full relative flex flex-col items-center justify-center p-4">
            <div className="absolute inset-2 border border-yellow-600/20 rounded-lg" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
            
            <motion.div 
              className="absolute inset-0 bg-gradient-to-tr from-yellow-500/0 via-yellow-500/10 to-transparent"
              style={{ x: shineX, y: shineY }}
            />

            <div className="relative z-10 flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-gradient-to-b from-[#CA8A04] to-[#854D0E] p-0.5 shadow-[0_0_20px_rgba(202,138,4,0.4)]">
                <div className="w-full h-full rounded-full bg-[#1C1917] flex items-center justify-center border border-yellow-500/20">
                  <div className="w-4 h-4 rounded-full bg-[#CA8A04] animate-pulse" />
                </div>
              </div>
              <div className="space-y-0.5 text-center">
                <p className="font-['Righteous'] text-[#CA8A04] text-[10px] tracking-[0.2em] leading-none">POKÉVAULT</p>
                <div className="h-0.5 w-12 bg-gradient-to-r from-transparent via-[#CA8A04] to-transparent mx-auto" />
                <p className="text-[#A8A29E] text-[8px] uppercase font-bold tracking-widest">Master Collection</p>
              </div>
            </div>
          </div>
        </div>

        {/* FRONT — Card Face */}
        <motion.div
          className={`absolute inset-0 rounded-xl overflow-hidden shadow-2xl ${config.glowClass}`}
          style={{ 
            transform: 'rotateY(180deg)', 
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            opacity: (isRevealed || isInspecting) ? 1 : 0,
            boxShadow: `
              0 0 ${isElite ? '60px' : '40px'} -10px ${isSIR ? 'rgba(255,0,234,0.3)' : (config.eliteColor || config.particleColor)}44,
              0 10px 30px -10px rgba(0,0,0,0.8)
            `
          }}
        >
          {/* ELITE DECORATIONS */}
          {isElite && <EliteBorder isSIR={isSIR} />}
          
          {/* Card Volume/Thickness Simulation (Silver Edge) */}
          <div className="absolute inset-0 border-[0.5px] border-white/20 rounded-xl z-50 pointer-events-none" />
          <div className="absolute inset-x-[-1px] inset-y-0 bg-[#cbd5e1] translate-z-[-2px] -z-10" />

          <div className={`w-full h-full bg-gradient-to-b ${config.bgGradient} to-[#000] relative overflow-hidden`}>
            
            {/* Environmental Lighting & Textures */}
            {(isInspecting || isElite) && (
              <>
                <EnvironmentalShine 
                  rotateX={rotateX} 
                  rotateY={rotateY} 
                  color={isSIR ? 'rgba(255,0,234,0.4)' : (config.eliteColor ? 'rgba(245,158,11,0.5)' : undefined)} 
                />
                <FoilOverlay />
              </>
            )}

            {/* FLAIR LEVEL 1: Glass Gloss Reflection */}
            <motion.div 
              className="absolute inset-0 z-20 pointer-events-none mix-blend-overlay opacity-30"
              style={{ 
                background: `linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 100%)`,
                backgroundSize: '200% 200%',
                x: shineX,
                opacity: flairLevel >= 1 ? 0.4 : 0
              }}
            />

            {/* FLAIR LEVEL 2: Star Particles */}
            {flairLevel >= 2 && (
              <FlairParticles 
                color={isSIR ? '#ff00ea' : (config.eliteColor || config.particleColor)} 
                xVal={mouseXSpring} 
                yVal={mouseYSpring} 
                isInspecting={isInspecting} 
                isElite={isElite}
              />
            )}

            {/* FLAIR LEVEL 3: Prismatic Holo Effect */}
            {flairLevel >= 3 && !isSIR && (
              <motion.div 
                className="absolute inset-0 z-30 pointer-events-none mix-blend-screen opacity-40"
                style={{ 
                  backgroundImage: `linear-gradient(110deg, transparent 25%, #ff00ea 35%, #00ccff 50%, #ff00ea 65%, transparent 75%)`,
                  backgroundSize: '300% 100%',
                  backgroundPosition: holoPos
                }}
              />
            )}
            
            {/* ELITE OVERLAYS */}
            {isSIR && flairLevel >= 4 && (
               <motion.div 
                 className="absolute inset-0 z-30 pointer-events-none mix-blend-screen opacity-40"
                 style={{ 
                   backgroundImage: `linear-gradient(135deg, transparent 25%, #ff00ea 30%, #00ccff 50%, #ff00ea 70%, transparent 75%)`,
                   backgroundSize: '300% 300%',
                   backgroundPosition: holoPos
                 }}
               />
            )}
            
            {isElite && !isSIR && (
              <PrismaticOverlay mouseX={mouseXSpring} mouseY={mouseYSpring} />
            )}

            {/* Default Shine Overlay */}
            <motion.div 
              className="absolute inset-0 z-10 pointer-events-none mix-blend-overlay"
              style={{ 
                background: `radial-gradient(circle at ${shineX} ${shineY}, rgba(255,255,255,0.4) 0%, transparent 60%)`,
              }}
            />

            {/* Card image */}
            <div className="absolute inset-0 z-40 transition-transform duration-700 group-hover:scale-105">
              {card.image_url ? (
                <div className="relative w-full h-full">
                  <Image
                    src={isInspecting && (card as any).image_url_hires ? (card as any).image_url_hires : card.image_url}
                    alt={card.name}
                    fill
                    className="object-contain scale-[1.02] brightness-110"
                    sizes={`${imgSizes[size].w * 1.5}px`}
                    priority
                  />
                  {/* Gloss mask to hide image border artifacts */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 pointer-events-none z-10" />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Star className={`w-12 h-12 ${config.labelColor} opacity-50`} />
                </div>
              )}
            </div>

            {/* Holo shine overlay for rare+ */}
            {card.rarity_tier >= 3 && !isElite && (
              <motion.div 
                className="absolute inset-0 holo-effect opacity-30 mix-blend-screen pointer-events-none"
                style={{ backgroundPosition: shineX }}
              />
            )}

            {/* Rarity badge overlay at bottom */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-3 pt-6 z-40">
              <p className="text-white font-['Righteous'] text-xs truncate mb-1">{card.name}</p>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold tracking-wider uppercase ${config.labelColor}`}>{card.rarity}</span>
                {isDuplicate && (
                  <span className="text-[10px] text-[#A8A29E] bg-white/5 px-1.5 py-0.5 rounded border border-white/10">+{dustReceived}✨</span>
                )}
              </div>
            </div>

            {/* Pity indicator */}
            {isPity && (
              <div className="absolute top-2 right-2 bg-yellow-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded shadow-lg animate-bounce z-50">
                PITY
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
