'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { NOTIFICATIONS_CHANGED_EVENT } from '@/lib/notifications'

export function useUnreadNotifications(userId?: string) {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!userId) {
      return
    }

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

    void fetchUnread()

    const handleNotificationsChanged = () => {
      void fetchUnread()
    }

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`,
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
  }, [userId])

  return userId ? unreadCount : 0
}
