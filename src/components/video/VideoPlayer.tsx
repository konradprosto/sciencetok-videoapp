'use client'

import MuxPlayer from '@mux/mux-player-react'
import { useEffect, useRef } from 'react'

interface VideoPlayerProps {
  playbackId: string
  videoId: string
  title?: string
}

export function VideoPlayer({ playbackId, videoId, title }: VideoPlayerProps) {
  const hasTrackedView = useRef(false)

  useEffect(() => {
    if (hasTrackedView.current) return
    hasTrackedView.current = true

    const sessionId = typeof window !== 'undefined'
      ? sessionStorage.getItem('session_id') || (() => {
          const id = crypto.randomUUID()
          sessionStorage.setItem('session_id', id)
          return id
        })()
      : null

    const timer = setTimeout(() => {
      fetch(`/api/videos/${videoId}/views`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      }).catch(() => {})
    }, 3000)

    return () => clearTimeout(timer)
  }, [videoId])

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
      <MuxPlayer
        playbackId={playbackId}
        metadata={{ video_title: title }}
        streamType="on-demand"
        accentColor="#5E6AD2"
        style={{ width: '100%', height: '100%', ['--media-object-fit' as string]: 'contain' } as Record<string, string>}
      />
    </div>
  )
}
