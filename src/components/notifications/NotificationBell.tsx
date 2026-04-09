'use client'

import Link from 'next/link'
import { Bell } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { useAuth } from '@/components/auth/AuthProvider'
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications'
import { cn } from '@/lib/utils'

export function NotificationBell({ className }: { className?: string }) {
  const { user } = useAuth()
  const unreadCount = useUnreadNotifications(user?.id)

  return (
    <Link
      href={user ? '/notifications' : '/login'}
      className={buttonVariants({ variant: 'ghost', size: 'icon', className: cn('relative', className) })}
    >
      <Bell className="h-5 w-5" />
      {user && unreadCount > 0 && (
        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  )
}
