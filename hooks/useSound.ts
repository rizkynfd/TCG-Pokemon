'use client'

import { useCallback, useRef } from 'react'

export const SFX = {
  // Option A: Physical & Tactile Sounds
  RIP: 'https://assets.mixkit.co/active_storage/sfx/2384/2384-preview.mp3', // Snappy Paper Rip
  FLIP: 'https://assets.mixkit.co/active_storage/sfx/2002/2002-preview.mp3', // Crisp Card Flip/Snap
  REVEAL: 'https://assets.mixkit.co/active_storage/sfx/270/270-preview.mp3', // Standard Reveal
  SWISH: 'https://assets.mixkit.co/active_storage/sfx/1122/1122-preview.mp3', // Fast air swish
  POP: 'https://assets.mixkit.co/active_storage/sfx/3005/3005-preview.mp3', // Satisfying UI Pop
  RARE: 'https://assets.mixkit.co/active_storage/sfx/2344/2344-preview.mp3', // Magic Shimmer (Rare)
  ULTRA: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3', // Impactful (Ultra)
  LEGENDARY: 'https://assets.mixkit.co/active_storage/sfx/2908/2908-preview.mp3', // Epic (Secret Rare)
}

export function useSound() {
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({})

  const play = useCallback((url: string, volume = 0.5) => {
    if (typeof window === 'undefined') return

    let audio = audioRefs.current[url]
    if (!audio) {
      audio = new Audio(url)
      audioRefs.current[url] = audio
    }

    audio.volume = volume
    audio.currentTime = 0
    audio.play().catch(err => console.log('Audio play failed:', err))
  }, [])

  return { play }
}
