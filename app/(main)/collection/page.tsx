// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BinderView from '@/components/collection/BinderView'

export const metadata = {
  title: 'My Collection — PokéVault TCG',
  description: 'View your full Pokémon TCG card collection.',
}

export default async function CollectionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [inventoryResult, cardCountResult] = await Promise.all([
    supabase
      .from('inventory')
      .select('id, quantity, is_favorite, in_wishlist, flair_level, cards(*)')
      .eq('user_id', user.id)
      .order('quantity', { ascending: false }),
    supabase
      .from('cards')
      .select('*', { count: 'exact', head: true })
      .eq('is_available', true),
  ])

  const inventory = (inventoryResult.data ?? []).map((item: any) => ({
    ...item.cards,
    inventoryId: item.id,
    quantity: item.quantity,
    is_favorite: item.is_favorite,
    in_wishlist: item.in_wishlist,
    flair_level: item.flair_level,
  }))

  const totalCards = cardCountResult.count ?? 0

  return (
    <div className="min-h-screen bg-[#0C0A09]">
      <BinderView inventory={inventory} totalCards={totalCards} />
    </div>
  )
}
