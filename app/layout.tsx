import type { Metadata } from 'next'
import './globals.css'
import '@/styles/effects.css'

export const metadata: Metadata = {
  title: 'PokéVault TCG — Collect. Craft. Conquer.',
  description: 'Open virtual booster packs, build your Pokémon card collection, craft rare cards, and compete in the ultimate TCG gacha experience.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full font-sans">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Righteous&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        {children}
      </body>
    </html>
  )
}
