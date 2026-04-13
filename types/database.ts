export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface ProfileRow {
  id: string
  username: string | null
  avatar_url: string | null
  title: string
  coins: number
  dust: number
  gems: number
  pity_rare: number
  pity_ultra: number
  total_pulls: number
  streak_days: number
  last_daily_claimed: string | null
  created_at: string
}

export interface CardRow {
  id: string
  name: string
  set_id: string
  set_name: string
  rarity: string
  rarity_tier: number
  type: string | null
  hp: number | null
  image_url: string
  image_url_hires: string | null
  dust_value: number
  is_available: boolean
  created_at: string
}

export interface PackRow {
  id: string
  name: string
  description: string | null
  image_url: string | null
  cost_coins: number
  cost_gems: number
  cards_count: number
  set_filter: string[] | null
  rarity_boost: Json | null
  is_limited: boolean
  limited_until: string | null
  is_active: boolean
  created_at: string
}

export interface InventoryRow {
  id: string
  user_id: string
  card_id: string
  quantity: number
  is_favorite: boolean
  in_wishlist: boolean
  flair_level: number
  obtained_at: string
}

export interface PullHistoryRow {
  id: string
  user_id: string
  pack_id: string
  card_id: string
  is_duplicate: boolean
  dust_received: number
  is_pity: boolean
  pulled_at: string
}

export interface QuestRow {
  id: string
  title: string
  description: string | null
  type: 'daily' | 'weekly' | 'achievement'
  condition_type: string
  condition_value: number
  reward_coins: number
  reward_dust: number
  reward_gems: number
  is_active: boolean
}

export interface UserQuestRow {
  id: string
  user_id: string
  quest_id: string
  progress: number
  is_completed: boolean
  claimed_at: string | null
  resets_at: string | null
  created_at: string
}

export interface TransactionRow {
  id: string
  user_id: string
  type: string
  coins_delta: number
  dust_delta: number
  gems_delta: number
  description: string | null
  metadata: Json | null
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow
        Insert: Partial<ProfileRow>
        Update: Partial<ProfileRow>
      }
      cards: {
        Row: CardRow
        Insert: Partial<CardRow>
        Update: Partial<CardRow>
      }
      packs: {
        Row: PackRow
        Insert: Partial<PackRow>
        Update: Partial<PackRow>
      }
      inventory: {
        Row: InventoryRow
        Insert: Partial<InventoryRow>
        Update: Partial<InventoryRow>
      }
      pull_history: {
        Row: PullHistoryRow
        Insert: Partial<PullHistoryRow>
        Update: Partial<PullHistoryRow>
      }
      quests: {
        Row: QuestRow
        Insert: Partial<QuestRow>
        Update: Partial<QuestRow>
      }
      user_quests: {
        Row: UserQuestRow
        Insert: Partial<UserQuestRow>
        Update: Partial<UserQuestRow>
      }
      transactions: {
        Row: TransactionRow
        Insert: Partial<TransactionRow>
        Update: Partial<TransactionRow>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Card = Database['public']['Tables']['cards']['Row']
export type Pack = Database['public']['Tables']['packs']['Row']
export type InventoryItem = Database['public']['Tables']['inventory']['Row']
export type PullHistory = Database['public']['Tables']['pull_history']['Row']
export type Quest = Database['public']['Tables']['quests']['Row']
export type UserQuest = Database['public']['Tables']['user_quests']['Row']
export type Transaction = Database['public']['Tables']['transactions']['Row']

export const RARITY_TIERS: Record<string, number> = {
  Common: 1,
  Uncommon: 2,
  Rare: 3,
  'Rare Holo': 3,
  'Rare Holo EX': 4,
  'Rare Ultra': 4,
  'Ultra Rare': 4,
  'Secret Rare': 5,
  'Hyper Rare': 5,
  'Special Illustration Rare': 5,
}

export const DUST_VALUES: Record<number, number> = {
  1: 5,
  2: 10,
  3: 25,
  4: 100,
  5: 400,
}
