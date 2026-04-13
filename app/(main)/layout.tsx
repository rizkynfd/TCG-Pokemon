import Navbar from '@/components/layout/Navbar'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)

  const isAdmin = ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? '')

  return (
    <div className="flex min-h-screen bg-[#0C0A09]">
      <Navbar isAdmin={isAdmin} />
      {/* Main content — offset by sidebar width on desktop */}
      <main className="flex-1 lg:ml-64 pb-20 lg:pb-0 min-h-screen">
        {children}
      </main>
    </div>
  )
}
