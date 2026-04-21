'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Package,
  BookOpen,
  Hammer,
  ShoppingBag,
  ScrollText,
  History,
  User,
  LogOut,
  Zap,
  Crown,
  Shield
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/pack-opening', label: 'Open Packs',   icon: Package },
  { href: '/collection',   label: 'Collection',   icon: BookOpen },
  { href: '/crafting',     label: 'Crafting',     icon: Hammer },
  { href: '/shop',         label: 'Shop',         icon: ShoppingBag },
  { href: '/quest',        label: 'Quests',       icon: ScrollText },
  { href: '/history',      label: 'History',      icon: History },
  { href: '/admin',        label: 'Admin',        icon: Shield },
]

export default function Navbar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Filter items: Remove '/admin' if not an admin
  const filteredNavItems = NAV_ITEMS.filter(item => {
    if (item.href === '/admin' && !isAdmin) return false
    return true
  })

  return (
    <>
      {/* Desktop Sidebar Upgrade */}
      <aside className="hidden lg:flex flex-col w-72 min-h-screen bg-[#0C0A09]/80 backdrop-blur-3xl border-r border-white/5 fixed left-0 top-0 z-40">
        
        {/* Luxury Logo */}
        <Link href="/dashboard" className="group flex items-center gap-4 px-8 py-10 transition-all">
          <div className="relative">
            <div className="absolute -inset-2 bg-[#CA8A04]/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#CA8A04] to-[#B45309] flex items-center justify-center shadow-[0_0_20px_rgba(202,138,4,0.4)]">
              <Zap className="w-6 h-6 text-black fill-black" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-['Righteous'] text-2xl text-white tracking-tight">PokéVault</span>
            <span className="text-[10px] font-black text-[#CA8A04] tracking-[0.3em] uppercase leading-none">Standard Edition</span>
          </div>
        </Link>

        {/* Pro Membership Teaser */}
        <div className="px-6 mb-6">
          <div className="bg-gradient-to-br from-[#CA8A04]/10 to-transparent border border-[#CA8A04]/20 rounded-2xl p-4 relative overflow-hidden group/pro">
            <div className="absolute top-0 right-0 p-2 opacity-20 transform translate-x-1 translate-y-[-10%] group-hover/pro:scale-110 transition-transform">
               <Crown className="w-12 h-12 text-[#CA8A04]" />
            </div>
            <p className="text-[10px] font-black text-[#CA8A04] uppercase tracking-widest mb-1">Vault Membership</p>
            <p className="text-white text-xs font-bold leading-tight mb-3">Unlock Master Collections & Legacy Sets</p>
            <button className="w-full py-2 bg-[#CA8A04] text-black text-[10px] font-black rounded-lg hover:brightness-110 transition-all uppercase tracking-widest shadow-lg">Upgrade Now</button>
          </div>
        </div>

        {/* Global Navigation */}
        <nav className="flex-1 px-4 space-y-1">
          <div className="px-4 py-2 text-[10px] font-black text-[#57534E] uppercase tracking-[0.2em] mb-2">Main Menu</div>
          {filteredNavItems.map(({ href, label, icon: Icon }) => {
            const active = pathname.toLowerCase() === href.toLowerCase() || 
                          pathname.toLowerCase().startsWith(href.toLowerCase() + '/')
            return (
              <Link
                key={href}
                href={href}
                className="relative block"
              >
                <div className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${
                  active
                    ? 'bg-white text-black shadow-[0_10px_30px_rgba(255,255,255,0.05)]'
                    : 'text-[#A8A29E] hover:text-white hover:bg-white/5'
                }`}>
                  <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-[#CA8A04]' : 'text-current opacity-60'}`} />
                  <span className="tracking-tight">{label}</span>
                  {active && (
                    <motion.div 
                      layoutId="nav-active"
                      className="absolute left-0 w-1 h-6 bg-[#CA8A04] rounded-full" 
                    />
                  )}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-6 border-t border-white/5 space-y-4">
           <Link href="/profile" className="flex items-center gap-3 p-2 rounded-2xl hover:bg-white/5 transition-all">
              <div className="w-10 h-10 rounded-xl bg-[#1C1917] border border-white/10 flex items-center justify-center">
                <User className="w-5 h-5 text-[#A8A29E]" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white leading-none">Trainer Profile</span>
                <span className="text-[10px] font-medium text-[#57534E]">View your records</span>
              </div>
           </Link>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl text-xs font-black text-[#A8A29E] hover:text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20 uppercase tracking-widest"
          >
            <LogOut className="w-4 h-4" />
            Deauthenticate
          </button>
        </div>
      </aside>

      {/* Modern Mobile Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0C0A09]/90 backdrop-blur-2xl border-t border-white/5 z-[60] px-2 pb-6 pt-3">
        <div className="flex items-center gap-6 overflow-x-auto overflow-y-visible no-scrollbar w-full px-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <style dangerouslySetInnerHTML={{__html: `\n            .no-scrollbar::-webkit-scrollbar {\n              display: none;\n            }\n          `}} />
          {filteredNavItems.map(({ href, label, icon: Icon }) => {
            const active = pathname.toLowerCase() === href.toLowerCase() || 
                          pathname.toLowerCase().startsWith(href.toLowerCase() + '/')
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex flex-col items-center gap-1.5 px-3 py-2 rounded-2xl transition-all ${
                  active ? 'text-[#CA8A04]' : 'text-[#A8A29E]'
                }`}
              >
                <Icon className={`w-6 h-6 ${active ? 'scale-110' : 'opacity-60'} transition-transform`} />
                <span className={`text-[9px] font-black uppercase tracking-tighter ${active ? 'opacity-100' : 'opacity-40'}`}>{label}</span>
                {active && (
                  <motion.div 
                    layoutId="mobile-nav-active"
                    className="absolute -top-1 w-8 h-1 bg-[#CA8A04] rounded-full shadow-[0_0_10px_#CA8A04]" 
                  />
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
