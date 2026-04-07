'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, Upload, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/auth/AuthProvider'

export function MobileNav() {
  const pathname = usePathname()
  const { user } = useAuth()

  const items = [
    { href: '/', label: 'Główna', icon: Home },
    { href: '/search', label: 'Szukaj', icon: Search },
    { href: '/upload', label: 'Dodaj', icon: Upload },
    {
      href: user ? `/profile/${user.user_metadata?.username ?? user.id}` : '/login',
      label: 'Profil',
      icon: User,
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/8 bg-[#050506] md:hidden">
      <div className="flex items-center justify-around py-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center gap-1 px-3 py-1 text-xs transition-colors',
              pathname === item.href
                ? 'text-[#5E6AD2]'
                : 'text-[#8A8F98] hover:text-[#EDEDEF]'
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
