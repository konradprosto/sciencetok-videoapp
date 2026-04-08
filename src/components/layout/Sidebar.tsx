'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Compass, Upload, User, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/auth/AuthProvider'

export function Sidebar() {
  const pathname = usePathname()
  const { user, isAdmin } = useAuth()
  const navItems = [
    { href: '/', label: 'Główna', icon: Home },
    { href: '/search', label: 'Szukaj', icon: Compass },
    { href: '/notifications', label: 'Powiadomienia', icon: Bell },
    ...(isAdmin ? [{ href: '/upload', label: 'Dodaj', icon: Upload }] : []),
  ]

  return (
    <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-white/8 bg-[#050506] p-4 gap-1">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#8A8F98] transition-all duration-200 hover:bg-white/5 hover:text-[#EDEDEF]',
            pathname === item.href && 'bg-white/5 font-medium text-[#EDEDEF] border-l-2 border-[#5E6AD2]'
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}
      {user && (
        <Link
          href={`/profile/${user.user_metadata?.username ?? user.id}`}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#8A8F98] transition-all duration-200 hover:bg-white/5 hover:text-[#EDEDEF]',
            pathname.startsWith('/profile') && 'bg-white/5 font-medium text-[#EDEDEF] border-l-2 border-[#5E6AD2]'
          )}
        >
          <User className="h-4 w-4" />
          Profil
        </Link>
      )}
    </aside>
  )
}
