'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Bell, Heart, MessageCircle, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Notification } from '@/types/notification'

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'teraz'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min temu`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} godz. temu`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} dni temu`
  return new Date(date).toLocaleDateString('pl-PL')
}

function notificationCopy(notification: Notification) {
  const actorName = notification.actor?.display_name || notification.actor?.username || 'Ktoś'
  if (notification.type === 'comment_like') {
    return `${actorName} polubił(a) Twój komentarz`
  }
  return `${actorName} odpowiedział(a) na Twój komentarz`
}

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const unreadCount = useMemo(() => notifications.filter((item) => !item.read_at).length, [notifications])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const res = await fetch('/api/notifications?limit=50')
      if (!res.ok || cancelled) {
        setLoading(false)
        return
      }

      const data = await res.json()
      if (!cancelled) {
        setNotifications(Array.isArray(data) ? data : [])
        setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((item) => !item.read_at).map((item) => item.id)
    if (unreadIds.length === 0) return

    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAll: true }),
    })

    const now = new Date().toISOString()
    setNotifications((current) => current.map((item) => ({ ...item, read_at: item.read_at || now })))
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Powiadomienia</h1>
          <p className="mt-1 text-sm text-[#8A8F98]">
            Odpowiedzi na komentarze i serduszka pod Twoimi wypowiedziami.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={markAllAsRead}
          disabled={unreadCount === 0}
          className="border-white/10 bg-white/5 text-white hover:bg-white/10"
        >
          <CheckCheck className="h-4 w-4" />
          Oznacz wszystko
        </Button>
      </div>

      {loading ? (
        <div className="mt-8 rounded-2xl border border-white/8 bg-[#0a0a0c] p-8 text-center text-sm text-[#8A8F98]">
          Ładowanie powiadomień...
        </div>
      ) : notifications.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-white/8 bg-[#0a0a0c] p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#5E6AD2]/10">
            <Bell className="h-6 w-6 text-[#5E6AD2]" />
          </div>
          <p className="mt-4 text-sm text-[#8A8F98]">Na razie nie masz żadnych powiadomień.</p>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {notifications.map((notification) => (
            <Link
              key={notification.id}
              href={`/video/${notification.video_id}`}
              className={`block rounded-2xl border p-4 transition-colors ${
                notification.read_at
                  ? 'border-white/6 bg-[#0a0a0c]'
                  : 'border-[#5E6AD2]/30 bg-[#5E6AD2]/8'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/6 text-[#5E6AD2]">
                  {notification.type === 'comment_like' ? (
                    <Heart className="h-4 w-4" />
                  ) : (
                    <MessageCircle className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-white">
                      {notificationCopy(notification)}
                    </p>
                    <span className="shrink-0 text-xs text-[#8A8F98]">{timeAgo(notification.created_at)}</span>
                  </div>
                  {notification.comments?.content && (
                    <p className="mt-2 line-clamp-2 text-sm text-[#8A8F98]">
                      &quot;{notification.comments.content}&quot;
                    </p>
                  )}
                  {notification.videos?.title && (
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[#8A8F98]">
                      Film: {notification.videos.title}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
