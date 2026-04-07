'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { useAuth } from '@/components/auth/AuthProvider'
import { cn } from '@/lib/utils'

export function NotificationBell({ className }: { className?: string }) {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user) return

    let cancelled = false

    const fetchUnread = async () => {
      const res = await fetch('/api/notifications?unreadOnly=true&limit=50')
      if (!res.ok || cancelled) return
      const data = await res.json()
      if (!cancelled) {
        setUnreadCount(Array.isArray(data) ? data.length : 0)
      }
    }

    fetchUnread()
    const interval = window.setInterval(fetchUnread, 30000)
    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [user])

  return (
    <Link
      href={user ? '/notifications' : '/login'}
      className={buttonVariants({ variant: 'ghost', size: 'icon', className: cn('relative', className) })}
    >
      <Bell className="h-5 w-5" />
      {user && unreadCount > 0 && (
        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#5E6AD2] px-1 text-[10px] font-semibold text-white">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  )
}
