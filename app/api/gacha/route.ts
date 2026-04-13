import { createClient } from '@/lib/supabase/server'
import { performGachaRoll } from '@/lib/gacha/engine_v2'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { packId, count } = await request.json()
    if (!packId) {
      return NextResponse.json({ error: 'packId is required' }, { status: 400 })
    }

    console.log(`[GACHA API] Starting roll for User: ${user.id}, Pack: ${packId}, Count: ${count}`)
    
    const result = await performGachaRoll(user.id, packId, count || 1)
    
    if ('error' in result) {
      console.error(`[GACHA API] Business Logic Error:`, result.error)
    } else {
      console.log(`[GACHA API] Success! Pulled ${result.cards.length} cards.`)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error(`[GACHA API] CRITICAL SYSTEM ERROR:`, error)
    const message = error instanceof Error ? error.message : 'Gacha roll failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
