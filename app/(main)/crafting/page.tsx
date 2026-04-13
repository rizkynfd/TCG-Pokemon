// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CraftingView from '@/components/collection/CraftingView'

export const metadata = {
  title: 'Crafting — PokéVault TCG',
  description: 'Craft rare Pokémon cards using dust.',
}

export default async function CraftingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, inventoryRes, cardsRes] = await Promise.all([
    supabase.from('profiles').select('dust').eq('id', user.id).single(),
    supabase.from('inventory').select('card_id').eq('user_id', user.id),
    supabase.from('cards').select('id, name, rarity, rarity_tier, image_url, dust_value, set_name, type').eq('is_available', true).order('rarity_tier', { ascending: false }),
  ])

  const dust = profileRes.data?.dust ?? 0
  const ownedCardIds = (inventoryRes.data ?? []).map((i: any) => i.card_id)
  const allCards = cardsRes.data ?? []

  return (
    <div className="min-h-screen bg-[#0C0A09]">
      <CraftingView
        dust={dust}
        craftableCards={allCards}
        ownedCardIds={ownedCardIds}
      />
    </div>
  )
}
