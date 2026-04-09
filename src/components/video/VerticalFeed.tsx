'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { Video } from '@/types/video'
import { VerticalVideoSlide } from './VerticalVideoSlide'

interface VerticalFeedProps {
  initialVideos: Video[]
}

export function VerticalFeed({ initialVideos }: VerticalFeedProps) {
  const [videos, setVideos] = useState<Video[]>(initialVideos)
  const [activeIndex, setActiveIndex] = useState(0)
  const [globalMuted, setGlobalMuted] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Load more videos
  const loadMore = useCallback(async () => {
    if (videos.length === 0) return
    const lastVideo = videos[videos.length - 1]
    const res = await fetch(`/api/videos?limit=10&cursor=${lastVideo.created_at}`)
    const data = await res.json()
    if (data.videos?.length) {
      setVideos(prev => [...prev, ...data.videos])
    }
  }, [videos])

  // Detect active video via IntersectionObserver
  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'))
            setActiveIndex(index)
            // Load more when near the end
            if (index >= videos.length - 3) {
              loadMore()
            }
          }
        })
      },
      { root: container, threshold: 0.6 }
    )

    container.querySelectorAll('[data-index]').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [videos, loadMore])

  if (videos.length === 0) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-feed">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 mb-6">
          <svg className="h-12 w-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white">Brak filmow</h2>
        <p className="mt-2 text-sm text-white/50">Dodaj pierwszy film!</p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-feed flex justify-center bg-black">
      <div
        ref={scrollRef}
        className="h-full w-full md:max-w-[480px] snap-y snap-mandatory overflow-y-auto"
      >
        {videos.map((video, index) => (
          <VerticalVideoSlide
            key={video.id}
            video={video}
            index={index}
            isActive={index === activeIndex}
            globalMuted={globalMuted}
            onMutedChange={setGlobalMuted}
          />
        ))}
      </div>
    </div>
  )
}
