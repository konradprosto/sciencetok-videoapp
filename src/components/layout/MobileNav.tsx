'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, Upload, User, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/auth/AuthProvider'
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications'

export function MobileNav() {
  const pathname = usePathname()
  const { user, isAdmin } = useAuth()
  const unreadCount = useUnreadNotifications(user?.id)

  const items = [
    { href: '/', label: 'Główna', icon: Home },
    { href: '/search', label: 'Szukaj', icon: Search },
    { href: user ? '/notifications' : '/login', label: 'Powiad.', icon: Bell },
    ...(isAdmin ? [{ href: '/upload', label: 'Dodaj', icon: Upload }] : []),
    {
      href: user ? `/profile/${user.user_metadata?.username ?? user.id}` : '/login',
      label: 'Profil',
      icon: User,
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-header border-t border-white/8 bg-background md:hidden" aria-label="Nawigacja mobilna">
      <div className="flex items-center justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            aria-current={pathname === item.href ? 'page' : undefined}
            className={cn(
              'flex flex-col items-center gap-1 px-3 py-1.5 text-xs transition-colors press-feedback',
              pathname === item.href
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <span className="relative">
              <item.icon className="h-5 w-5" />
              {item.label === 'Powiad.' && user && unreadCount > 0 && (
                <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </span>
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
