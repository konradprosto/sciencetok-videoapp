'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { useAuth } from '@/components/auth/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import { NOTIFICATIONS_CHANGED_EVENT } from '@/lib/notifications'
import { cn } from '@/lib/utils'

export function NotificationBell({ className }: { className?: string }) {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user) return

    const supabase = createClient()

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
    const handleNotificationsChanged = () => {
      fetchUnread()
    }

    const channel = supabase
      .channel(`notifications-bell:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}`,
        },
        handleNotificationsChanged
      )
      .subscribe()

    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, handleNotificationsChanged)
    const interval = window.setInterval(fetchUnread, 30000)

    return () => {
      cancelled = true
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, handleNotificationsChanged)
      window.clearInterval(interval)
      void supabase.removeChannel(channel)
    }
  }, [user])

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
