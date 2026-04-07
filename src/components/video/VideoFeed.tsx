'use client'

import { useRef, useCallback } from 'react'
import { useInfiniteVideos } from '@/hooks/useInfiniteVideos'
import { VideoCard } from './VideoCard'
import type { VideoFeedResponse } from '@/types/video'
import { Loader2 } from 'lucide-react'

interface VideoFeedProps {
  initialData?: VideoFeedResponse
}

export function VideoFeed({ initialData }: VideoFeedProps) {
  const { videos, isLoadingMore, isEmpty, hasMore, loadMore } = useInfiniteVideos(initialData)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const lastVideoRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoadingMore) return
    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore()
      }
    }, { threshold: 0.1 })

    if (node) observerRef.current.observe(node)
  }, [isLoadingMore, hasMore, loadMore])

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#5E6AD2]/10 mb-6">
          <svg className="h-10 w-10 text-[#5E6AD2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold">Brak filmów</h3>
        <p className="mt-2 text-sm text-[#8A8F98] max-w-xs">
          Jeszcze nikt nie dodał żadnego filmu. Bądź pierwszy!
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {videos.map((video, i) => (
          <div
            key={video.id}
            ref={i === videos.length - 1 ? lastVideoRef : undefined}
          >
            <VideoCard video={video} />
          </div>
        ))}
      </div>
      {isLoadingMore && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-[#8A8F98]" />
        </div>
      )}
    </div>
  )
}
