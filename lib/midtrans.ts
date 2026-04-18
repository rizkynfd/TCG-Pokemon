// @ts-nocheck
import MidtransClient from 'midtrans-client'

// Singleton Snap client — reused across API calls
export const snap = new MidtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY!,
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY!,
})

// Price map (in IDR) for each gem bundle id
export const GEM_BUNDLE_PRICES: Record<string, { gems: number; priceIdr: number; name: string }> = {
  starter: { gems: 80,   priceIdr: 15_000,  name: 'Starter Pack'  },
  popular: { gems: 280,  priceIdr: 50_000,  name: 'Popular Pack'  },
  value:   { gems: 600,  priceIdr: 100_000, name: 'Value Pack'    },
  mega:    { gems: 1280, priceIdr: 200_000, name: 'Mega Pack'     },
}
