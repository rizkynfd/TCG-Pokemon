'use client'
import { create } from 'zustand'

export interface PulledCardData {
  card: {
    id: string
    name: string
    rarity: string
    rarity_tier: number
    image_url: string
    image_url_hires: string | null
    type: string | null
    hp: number | null
    set_name: string
    dust_value: number
  }
  isDuplicate: boolean
  dustReceived: number
  isPity: boolean
}

type GachaPhase = 'idle' | 'selecting' | 'opening' | 'pulling-stack' | 'revealing' | 'results'

interface GachaStore {
  phase: GachaPhase
  selectedPackId: string | null
  packCount: number
  pulledCards: PulledCardData[]
  revealedIndex: number
  isLoading: boolean
  error: string | null

  setPhase: (phase: GachaPhase) => void
  selectPack: (packId: string) => void
  selectPackWithCount: (packId: string, count: number) => void
  startOpening: () => void
  setResults: (cards: PulledCardData[]) => void
  transitionToRevealing: () => void
  revealNext: () => void
  revealAll: () => void
  reset: () => void
  setError: (err: string | null) => void
}

export const useGachaStore = create<GachaStore>((set, get) => ({
  phase: 'idle',
  selectedPackId: null,
  packCount: 1,
  pulledCards: [],
  revealedIndex: 0,
  isLoading: false,
  error: null,

  setPhase: (phase) => set({ phase }),
  selectPack: (packId) => set({ selectedPackId: packId, phase: 'selecting', packCount: 1 }),
  selectPackWithCount: (packId, count) => set({ selectedPackId: packId, phase: 'selecting', packCount: count }),
  startOpening: () => set({ phase: 'opening', isLoading: true, error: null }),
  setResults: (cards) => set({
    pulledCards: cards,
    phase: 'pulling-stack',
    revealedIndex: 0,
    isLoading: false,
  }),
  transitionToRevealing: () => set({ phase: 'revealing' }),
  revealNext: () => {
    const { revealedIndex, pulledCards } = get()
    if (revealedIndex < pulledCards.length - 1) {
      set({ revealedIndex: revealedIndex + 1 })
    } else {
      set({ phase: 'results' })
    }
  },
  revealAll: () => set({ revealedIndex: get().pulledCards.length - 1, phase: 'results' }),
  reset: () => set({
    phase: 'idle',
    selectedPackId: null,
    packCount: 1,
    pulledCards: [],
    revealedIndex: 0,
    isLoading: false,
    error: null,
  }),
  setError: (error) => set({ error, isLoading: false }),
}))
