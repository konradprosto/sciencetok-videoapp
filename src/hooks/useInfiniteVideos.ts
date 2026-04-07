'use client'

import useSWRInfinite from 'swr/infinite'
import type { VideoFeedResponse } from '@/types/video'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useInfiniteVideos(initialData?: VideoFeedResponse) {
  const { data, error, size, setSize, isValidating, mutate } = useSWRInfinite<VideoFeedResponse>(
    (pageIndex, previousPageData) => {
      if (previousPageData && !previousPageData.nextCursor) return null
      if (pageIndex === 0) return '/api/videos?limit=20'
      return `/api/videos?limit=20&cursor=${previousPageData!.nextCursor}`
    },
    fetcher,
    {
      fallbackData: initialData ? [initialData] : undefined,
      revalidateFirstPage: false,
    }
  )

  const videos = data ? data.flatMap(page => page.videos) : []
  const isLoadingMore = isValidating && data && typeof data[size - 1] === 'undefined'
  const isEmpty = data?.[0]?.videos?.length === 0
  const hasMore = data ? data[data.length - 1]?.nextCursor !== null : false

  return {
    videos,
    error,
    isLoadingMore,
    isEmpty,
    hasMore,
    loadMore: () => setSize(size + 1),
    isValidating,
    mutate,
  }
}
