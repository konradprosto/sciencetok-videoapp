'use client'

import { useRef, useCallback } from 'react'
import { useInfiniteVideos } from '@/hooks/useInfiniteVideos'
import { VideoCard } from './VideoCard'
import type { VideoFeedResponse } from '@/types/video'
import { VideoCardSkeleton } from '@/components/ui/skeleton'

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
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 mb-6">
          <svg className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold">Brak filmów</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-xs">
          Jeszcze nikt nie dodał żadnego filmu. Bądź pierwszy!
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors press-feedback"
        >
          Odśwież
        </button>
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
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <VideoCardSkeleton key={i} />
          ))}
        </div>
      )}
    </div>
  )
}
