"use client"

import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import PackSelector from './PackSelector'
import CardReveal from './CardReveal'
import { useGachaStore } from '@/store/useGachaStore'
import { Zap, Package, Sparkles } from 'lucide-react'
import Image from 'next/image'
import { useSound, SFX } from '@/hooks/useSound'
import { PackVariant, VARIANT_CONFIG } from './BoosterPack3D'

interface Pack {
  id: string
  name: string
  description: string | null
  image_url: string | null
  cost_coins: number
  cost_gems: number
  cards_count: number
  is_limited: boolean
  limited_until: string | null
  is_active: boolean
  set_filter?: string[] | null
}

interface PackOpeningProps {
  packs: Pack[]
  initialPackId?: string | null
  profile: { coins: number; gems: number } | null
  onProfileRefresh?: () => void
}

// Particle burst for opening animation
function ParticleBurst({ active }: { active: boolean }) {
  if (!active) return null
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    angle: (i / 20) * 360,
    distance: 80 + Math.random() * 80,
    size: 2 + Math.random() * 4,
    color: i % 5 === 0 ? '#CA8A04' : i % 5 === 1 ? '#9333EA' : i % 5 === 2 ? '#2563EB' : i % 5 === 3 ? '#16A34A' : '#EA580C',
  }))

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{ width: p.size, height: p.size, backgroundColor: p.color }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
          animate={{
            x: Math.cos(p.angle * Math.PI / 180) * p.distance,
            y: Math.sin(p.angle * Math.PI / 180) * p.distance,
            opacity: 0,
            scale: 1,
          }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

// Cinematic pack opening animation (Pocket Style: Swipe up to Rip)
function PackOpeningAnimation({ packName, packImage, onDone }: { packName: string; packImage?: string | null; onDone: () => void }) {
  const { play } = useSound()
  const [ripped, setRipped] = useState(false)
  const [tearDir, setTearDir] = useState(1) // 1 for right, -1 for left
  const ripThreshold = 80

  const getPackData = (name: string) => {
    const n = name.toLowerCase()
    if (n.includes('mewtwo')) return { variant: 'mewtwo' as const, image: '/images/packs/mewtwo_genetic_apex.png' }
    if (n.includes('charizard')) return { variant: 'charizard' as const, image: '/images/packs/charizard_genetic_apex.png' }
    if (n.includes('pikachu')) return { variant: 'pikachu' as const, image: '/images/packs/pikachu_genetic_apex.png' }
    return { variant: 'standard' as const, image: packImage }
  }

  const packData = getPackData(packName)
  const variant = packData.variant
  const config = VARIANT_CONFIG[variant]
  
  const x = useMotionValue(0)
  // Dynamic rotate to simulate peeling fold based on drag distance
  const peelRotateY = useTransform(x, [-200, 200], [-45, 45])

  // Parallax Tilt & Holographic tracking
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  
  const springConfig = { damping: 30, stiffness: 200, mass: 0.5 }
  const smoothX = useSpring(mouseX, springConfig)
  const smoothY = useSpring(mouseY, springConfig)

  // Tilt ranges: up to 15 degrees
  const tiltX = useTransform(smoothY, [-0.5, 0.5], [15, -15])
  const tiltY = useTransform(smoothX, [-0.5, 0.5], [-15, 15])
  
  // Holographic glare offset
  const glareX = useTransform(smoothX, [-0.5, 0.5], ['-100%', '100%'])
  const glareY = useTransform(smoothY, [-0.5, 0.5], ['-100%', '100%'])

  const handlePointerMove = (e: React.PointerEvent) => {
    // Normalize coordinates (-0.5 to 0.5) relative to the viewport
    const { clientX, clientY } = e
    const { innerWidth, innerHeight } = window
    mouseX.set(clientX / innerWidth - 0.5)
    mouseY.set(clientY / innerHeight - 0.5)
  }

  const handlePointerLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  const handleDragEnd = (_: any, info: any) => {
    if (Math.abs(info.offset.x) > ripThreshold && !ripped) {
      const direction = info.offset.x > 0 ? 1 : -1
      setTearDir(direction)
      setRipped(true)
      mouseX.set(0) // neutralize parallax on rip
      mouseY.set(0)
      play(SFX.RIP, 0.8)
      setTimeout(onDone, 2000) // Increased delay to enjoy the blast animation
    }
  }

  return (
    <div 
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0C0A09]/95 backdrop-blur-md overflow-hidden"
      onPointerMove={!ripped ? handlePointerMove : undefined}
      onPointerLeave={!ripped ? handlePointerLeave : undefined}
    >
      {/* Background radial burst */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-0"
        style={{ background: `radial-gradient(circle at center, ${config.glow}44 0%, transparent 70%)` }}
        animate={{ opacity: ripped ? 0.8 : 0.4 }}
      />

      <div className="relative w-72 h-96 perspective-1000 z-10">
        <AnimatePresence>
          {!ripped && (
              <motion.div 
                className="absolute -top-16 left-0 right-0 text-center z-50 cursor-pointer"
                animate={{ x: [-10, 10, -10] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  if (!ripped) {
                    setTearDir(Math.random() > 0.5 ? 1 : -1)
                    setRipped(true)
                    play(SFX.RIP)
                    setTimeout(onDone, 2000)
                  }
                }}
              >
                <div className="flex flex-col items-center gap-2">
                  <span className="text-yellow-500 font-['Righteous'] text-xs tracking-tighter uppercase opacity-80 drop-shadow-md">Swipe or Tap to Open</span>
                  <div className="w-16 h-1 bg-zinc-700/80 rounded-full overflow-hidden flex items-center">
                    <motion.div 
                      className="w-1/2 h-full bg-yellow-500 shadow-[0_0_8px_#CA8A04]" 
                      animate={{ x: ['-20%', '120%', '-20%'] }} 
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </div>
                </div>
              </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          className="relative w-full h-full"
          style={{ rotateX: tiltX, rotateY: tiltY, transformStyle: "preserve-3d" }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          {/* Volumetric Light Burst effect triggered exactly when ripped */}
          <AnimatePresence>
            {ripped && (
              <motion.div
                className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[150%] h-[150%] origin-bottom z-10 pointer-events-none mix-blend-screen"
                style={{ background: `radial-gradient(ellipse at top, rgba(255,255,255,1) 0%, ${config.glow} 20%, transparent 70%)` }}
                initial={{ opacity: 0, scaleY: 0, scaleX: 0.2 }}
                animate={{ opacity: [0, 1, 0.4], scaleY: [0, 1.2, 1], scaleX: [0.2, 1, 1] }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                exit={{ opacity: 0 }}
              />
            )}
          </AnimatePresence>

          {/* Pack Body (Fixed Bottom) */}
          <div className={`absolute inset-x-0 bottom-0 top-[20%] bg-gradient-to-b ${config.bgGradient} border-2 border-white/20 border-t-0 rounded-b-md shadow-[0_30px_60px_rgba(0,0,0,0.8)] overflow-hidden`}>
            
            {/* Full Bleed Artwork */}
            <div className="absolute inset-0 z-0">
               {packData.image ? (
                 <Image src={packData.image} alt="" fill className="object-cover brightness-110 contrast-125 saturate-150" priority />
               ) : (
                 <div className="absolute inset-0 bg-black/40" />
               )}
               <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
            </div>

            {/* Cylindrical Bulge Effect */}
            <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/60 to-transparent z-10" />
            <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/60 to-transparent z-10" />

            {/* The "Card Peek" Interior behind the tear line */}
            <div className="absolute inset-x-0 top-0 h-12 bg-black/40 flex justify-center pt-2 z-0">
               <div className="w-[85%] h-full bg-[#0C0A09] border-x-4 border-t-8 border-yellow-600/10 rounded-t-xl opacity-40" />
            </div>

            {/* PHYSICAL WRINKLES */}
            <div className="absolute inset-0 z-30 opacity-20 pointer-events-none mix-blend-overlay">
               <svg width="100%" height="100%" viewBox="0 0 100 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 20 Q 50 18, 100 20" stroke="white" strokeWidth="0.5" strokeOpacity="0.5" />
                  <path d="M10 50 Q 30 55, 10 70" stroke="white" strokeWidth="0.3" strokeOpacity="0.3" />
                  <path d="M90 120 Q 70 125, 90 140" stroke="white" strokeWidth="0.3" strokeOpacity="0.3" />
               </svg>
            </div>
            
            {/* Holographic Glare Layer */}
            <motion.div 
               className="absolute inset-0 z-20 mix-blend-overlay pointer-events-none opacity-40"
               style={{ 
                 background: `linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.8) ${glareX}, transparent 100%)`,
                 width: '240%',
                 left: '-70%'
               }}
            />
            
            {/* Branding Overlay (Pocket Style) */}
            <div className="absolute top-4 left-4 right-4 z-40 flex justify-between items-start">
               <div className="flex flex-col">
                  <p className="text-[10px] font-black italic text-white leading-none tracking-tighter drop-shadow-md">Pokémon</p>
                  <p className="text-[14px] font-['Righteous'] text-white italic mt-0.5 drop-shadow-lg">Pocket</p>
               </div>
               <div className="bg-black/90 px-1 py-0.5 rounded border border-white/20 shadow-xl">
                  <span className="text-[10px] text-white font-black leading-none">A1</span>
               </div>
            </div>

            {/* Logo Area */}
            <div className="absolute bottom-12 left-0 right-0 h-10 flex flex-col items-center justify-center z-40">
                <svg viewBox="0 0 200 60" className="w-[80%] drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
                  <text x="50%" y="25" textAnchor="middle" className="fill-white font-black text-[18px] tracking-[0.2em] italic">GENETIC</text>
                  <text x="50%" y="52" textAnchor="middle" className="fill-white font-black text-[32px] tracking-[0.1em] italic">APEX</text>
                </svg>
                <div className="relative mt-2 px-6 py-0.5">
                   <div className="absolute inset-0 bg-black/90 skew-x-[-20deg] border-x-2 border-white/40 rounded-sm" />
                   <p className="relative z-10 text-[9px] font-black text-white italic tracking-widest uppercase">{variant}</p>
                </div>
            </div>
            
            {/* Bottom Crimp */}
            <div className="absolute bottom-0 left-0 right-0 h-5 z-50 bg-[#c0c0c0] pointer-events-none"
                 style={{ 
                   clipPath: 'polygon(0% 0%, 100% 0%, 100% 80%, 96% 100%, 92% 80%, 88% 100%, 84% 80%, 80% 100%, 76% 80%, 72% 100%, 68% 80%, 64% 100%, 60% 80%, 56% 100%, 52% 80%, 48% 100%, 44% 80%, 40% 100%, 36% 80%, 32% 100%, 28% 80%, 24% 100%, 20% 80%, 16% 100%, 12% 80%, 8% 100%, 4% 80%, 0% 100%)',
                   background: 'linear-gradient(to right, #7a7a7a, #e0e0e0 20%, #7a7a7a 40%, #e0e0e0 60%, #7a7a7a 80%, #e0e0e0)',
                   backgroundSize: '30% 100%'
                 }}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/60" />
            </div>
          </div>

          {/* Draggable Foil Top Breakaway Wrapper */}
          <motion.div
            className="absolute inset-x-0 top-0 h-[21%] z-30 cursor-grab active:cursor-grabbing rounded-t-sm overflow-hidden preserve-3d"
            style={{ x, rotateY: peelRotateY, transformOrigin: 'bottom center' }}
            drag={ripped ? false : "x"}
            dragConstraints={{ left: -300, right: 300 }}
            dragElastic={0.4}
            onDragEnd={handleDragEnd}
            animate={
              ripped 
               ? { 
                   x: tearDir * 600, 
                   y: -200, 
                   rotateZ: tearDir * 60, 
                   opacity: 0,
                   transition: { duration: 0.7, ease: "anticipate" } 
                 } 
               : { x: 0, rotateZ: 0, y: 0 }
            }
          >
            {/* Front of the peel */}
            <div className={`absolute inset-0 flex flex-col items-center justify-center border-2 border-b-0 border-white/20 backface-hidden`}>
               {/* Background art for the peel top */}
               <div className="absolute inset-0 z-0">
                  {packData.image ? (
                    <Image src={packData.image} alt="" fill className="object-cover brightness-110 contrast-125 saturate-150" />
                  ) : (
                    <div className={`absolute inset-0 bg-gradient-to-b ${config.bgGradient}`} />
                  )}
                  <div className="absolute inset-0 bg-black/20" />
               </div>

               {/* Top Brand Banner */}
               <div className="absolute top-4 left-0 right-0 flex flex-col items-center z-20">
                  <span className="text-[12px] font-black italic text-white tracking-widest drop-shadow-md leading-none">POKÉMON</span>
                  <span className="text-[14px] font-['Righteous'] text-white italic mt-1 drop-shadow-lg">Pocket</span>
               </div>
               
               {/* Top Crimp */}
               <div className="absolute top-0 left-0 right-0 h-5 z-40 bg-[#c0c0c0]"
                    style={{ 
                      clipPath: 'polygon(0% 20%, 4% 0%, 8% 20%, 12% 0%, 16% 20%, 20% 0%, 24% 20%, 28% 0%, 32% 20%, 36% 0%, 40% 20%, 44% 0%, 48% 20%, 52% 0%, 56% 20%, 60% 0%, 64% 20%, 68% 0%, 72% 20%, 76% 0%, 80% 20%, 84% 0%, 88% 20%, 92% 0%, 96% 20%, 100% 0%, 100% 100%, 0% 100%)',
                      background: 'linear-gradient(to right, #7a7a7a, #e0e0e0 20%, #7a7a7a 40%, #e0e0e0 60%, #7a7a7a 80%, #e0e0e0)',
                      backgroundSize: '30% 100%'
                    }}>
                 <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-transparent to-black/40" />
               </div>

               {/* Jagged Bottom Edge on the draggable foil */}
               <div 
                 className="absolute bottom-0 w-full h-[8px] opacity-100 z-30 pointer-events-none"
                 style={{
                   background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 10' preserveAspectRatio='none'%3E%3Cpath fill='%23c0c0c0' d='M0,0 L5,10 L10,0 L15,10 L20,0 L25,10 L30,0 L35,10 L40,0 L45,10 L50,0 L55,10 L60,0 L65,10 L70,0 L75,10 L80,0 L85,10 L90,0 L95,10 L100,0 L100,-10 L0,-10 Z'/%3E%3C/svg%3E")`,
                   backgroundSize: '10% 100%'
                 }}
               />
               <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/40 z-40" />
            </div>

            {/* Silver Interior Backface (Visible when rotated due to 3D peel) */}
            <div className="absolute inset-0 bg-gradient-to-tr from-gray-400 via-gray-100 to-gray-500 rotate-y-180 backface-hidden flex items-center justify-center opacity-90 border-2 border-gray-300">
              <div className="w-full h-[2px] bg-gray-300 shadow-md" />
            </div>
          </motion.div>

          {ripped && <ParticleBurst active={true} />}
        </motion.div>
      </div>

      <motion.div className="text-center mt-20 z-10" animate={{ opacity: ripped ? 0 : 1 }}>
        <h3 className="font-['Righteous'] text-2xl text-[#CA8A04] tracking-widest uppercase">{packName}</h3>
        <p className="text-[#A8A29E] text-sm font-medium mt-2">The pack is heavy with potential...</p>
      </motion.div>
    </div>
  )
}

// Interactive phase where users pull the card stack out of the ripped pack
function CardStackPulling({ packName, packImage, onDone, packCount = 1 }: { packName: string; packImage?: string | null; onDone: () => void, packCount?: number }) {
  const y = useMotionValue(0)
  const { play } = useSound()

  const getPackData = (name: string) => {
    const n = name.toLowerCase()
    if (n.includes('mewtwo')) return { variant: 'mewtwo' as const, image: '/images/packs/mewtwo_genetic_apex.png' }
    if (n.includes('charizard')) return { variant: 'charizard' as const, image: '/images/packs/charizard_genetic_apex.png' }
    if (n.includes('pikachu')) return { variant: 'pikachu' as const, image: '/images/packs/pikachu_genetic_apex.png' }
    return { variant: 'standard' as const, image: packImage }
  }

  const packData = getPackData(packName)
  const variant = packData.variant
  const config = VARIANT_CONFIG[variant]

  const handleDragEnd = (_: any, info: any) => {
    // Reveal cards if user pulls stack up high enough/fast enough
    if (info.offset.y < -120 || info.velocity.y < -500) {
      play(SFX.POP, 0.7)
      onDone()
    }
  }

  // Calculate stack thickness based on packCount
  // 1 pack = 5 cards, 10 packs = 50 cards
  const totalCards = packCount * 5
  // We limit visual cards in stack to 12 for performance/clarity
  const visualCardsCount = Math.min(12, totalCards)
  const stackIndices = Array.from({ length: visualCardsCount }, (_, i) => i).reverse()

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0C0A09]/95 backdrop-blur-md overflow-hidden">
      <div className="relative w-72 h-96 perspective-1000">
        
        {/* Draggable Card Stack */}
        <motion.div
          className="absolute inset-x-0 top-[10%] bottom-[80%] flex justify-center cursor-grab active:cursor-grabbing z-10"
          style={{ y }}
          drag="y"
          dragConstraints={{ top: -300, bottom: 0 }}
          dragElastic={0.2}
          dragDirectionLock
          onDragStart={() => play(SFX.SWISH, 0.3)}
          onDragEnd={handleDragEnd}
        >
          {/* Card Back stack representing cards */}
          {stackIndices.map((i) => (
            <div 
              key={i} 
              className="absolute top-0 w-[85%] aspect-[2.5/3.5] rounded-xl overflow-hidden shadow-2xl transition-transform"
              style={{ 
                transform: `rotateZ(${i % 2 === 0 ? i * 0.5 : -i * 0.5}deg) translateY(-${i * (packCount > 1 ? 3 : 6)}px)`, 
                zIndex: 20 - i,
                background: "linear-gradient(135deg, #1C1917 0%, #0C0A09 100%)",
                border: "2px solid rgba(202, 138, 4, 0.4)"
              }}
            >
              <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
              <div className="absolute inset-1 border-[1.5px] border-yellow-600/10 rounded-lg flex items-center justify-center">
                 <div className="w-16 h-16 rounded-full border border-yellow-600/20 flex items-center justify-center bg-black/40">
                    <span className="text-yellow-600/50 font-black italic text-[10px]">PokéVault</span>
                 </div>
              </div>
            </div>
          ))}
          
          {/* Indicator for bulk pull */}
          {packCount > 1 && (
            <div className="absolute -top-12 bg-[#CA8A04] text-black px-4 py-1 rounded-full font-black text-xs z-50 shadow-xl border border-white/20 whitespace-nowrap">
              {packCount} PACKS IN BUNDLE
            </div>
          )}
        </motion.div>

        {/* Static Cut Pack Bottom Layer (Blocks the card stack visually) */}
        <div className={`absolute inset-x-0 bottom-0 top-[20%] bg-gradient-to-b ${config.bgGradient} border-2 border-white/20 border-t-0 rounded-b-md shadow-[0_30px_60px_rgba(0,0,0,0.8)] overflow-hidden z-20 pointer-events-none`}>
          <div className="absolute inset-x-0 top-0 h-10 shadow-[inset_0_15px_15px_-10px_rgba(0,0,0,0.8)] z-30" />
          
          {/* Full Bleed Artwork */}
          <div className="absolute inset-0 z-0 opacity-70">
             {packData.image ? (
               <Image src={packData.image} alt="" fill className="object-cover brightness-110 contrast-125 saturate-150" />
             ) : (
               <div className="absolute inset-0 bg-black/40" />
             )}
             <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
          </div>
          
          {/* Logo Area */}
          <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center justify-center z-20">
              <svg viewBox="0 0 200 60" className="w-[80%] drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
                <text x="50%" y="25" textAnchor="middle" className="fill-white font-black text-[18px] tracking-[0.2em] italic">GENETIC</text>
                <text x="50%" y="52" textAnchor="middle" className="fill-white font-black text-[32px] tracking-[0.1em] italic">APEX</text>
              </svg>
          </div>
          
          <div 
            className="absolute top-0 w-full h-[8px] opacity-90 drop-shadow-md z-30"
            style={{
              background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 10' preserveAspectRatio='none'%3E%3Cpath fill='%231C1917' d='M0,10 L5,0 L10,10 L15,0 L20,10 L25,0 L30,10 L35,0 L40,10 L45,0 L50,10 L55,0 L60,10 L65,0 L70,10 L75,0 L80,10 L85,0 L90,10 L95,0 L100,10 L100,20 L0,20 Z'/%3E%3C/svg%3E")`,
              backgroundSize: '10% 100%'
            }}
          />
        </div>
      </div>

      <motion.div className="text-center mt-20" animate={{ y: [-5, 5, -5] }} transition={{ repeat: Infinity, duration: 2 }}>
        <h3 className="font-['Righteous'] text-xl text-[#CA8A04] tracking-widest uppercase">Cards Secured</h3>
        <p className="text-[#A8A29E] text-sm font-medium mt-1">Swipe the cards up to reveal!</p>
      </motion.div>
    </div>
  )
}

export default function PackOpening({ packs, initialPackId, profile, onProfileRefresh }: PackOpeningProps) {
  const {
    phase,
    selectedPackId,
    packCount,
    pulledCards,
    isLoading,
    error,
    selectPack,
    selectPackWithCount,
    startOpening,
    setResults,
    transitionToRevealing,
    setError,
    reset,
  } = useGachaStore()

  const router = useRouter()
  const openingDone = useRef(false)

  // Pre-select if packId passed via URL
  useEffect(() => {
    if (initialPackId && !selectedPackId) {
      selectPack(initialPackId)
    }
  }, [initialPackId, selectedPackId, selectPack])

  const handleOpen = async () => {
    if (!selectedPackId) return
    openingDone.current = false
    startOpening()
  }

  const executeGachaAfterAnimation = async () => {
    if (openingDone.current) return
    openingDone.current = true

    try {
      const res = await fetch('/api/gacha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId: selectedPackId, count: packCount }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Gacha failed')
      
      setResults(data.cards)
      onProfileRefresh?.()
      
      // DIRECT BYPASS: Go straight to revealing cards
      transitionToRevealing()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setError(msg)
    }
  }

  return (
    <div className="relative min-h-screen">
      <AnimatePresence mode="wait">
        {/* Pack Selection Screen */}
        {(phase === 'idle' || phase === 'selecting') && (
          <motion.div
            key="selector"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -40 }}
            className="flex justify-center"
          >
            <PackSelector
              packs={packs}
              selectedPackId={selectedPackId}
              profile={profile}
              onSelect={selectPack}
              onSelectWithCount={selectPackWithCount}
              onOpen={handleOpen}
              isLoading={isLoading}
            />
          </motion.div>
        )}

        {/* Cinematic Opening Animation */}
        {phase === 'opening' && (
          <PackOpeningAnimation
            key="opening-anim"
            packName={packs.find(p => p.id === selectedPackId)?.name ?? 'Pack'}
            packImage={packs.find(p => p.id === selectedPackId)?.image_url}
            onDone={executeGachaAfterAnimation}
          />
        )}

        {/* Phase 2: Pulling out the card stack after the top is ripped */}
        {phase === 'pulling-stack' && (
          <motion.div
            key="pulling-stack-anim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <CardStackPulling
              packName={packs.find(p => p.id === selectedPackId)?.name ?? 'Pack'}
              packImage={packs.find(p => p.id === selectedPackId)?.image_url}
              packCount={packCount}
              onDone={() => transitionToRevealing()}
            />
          </motion.div>
        )}

        {/* Card Reveal */}
        {(phase === 'revealing' || phase === 'results') && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <CardReveal
              cards={pulledCards}
              onPlayAgain={reset}
              onComplete={reset}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-red-900/90 border border-red-700 text-red-200 px-6 py-3 rounded-xl text-sm z-50 flex items-center gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <Package className="w-4 h-4 text-red-400 flex-shrink-0" />
            {error}
            <button onClick={() => setError(null)} className="text-red-400 hover:text-white ml-2">✕</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
