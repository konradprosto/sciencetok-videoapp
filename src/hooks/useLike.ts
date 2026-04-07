'use client'

import { useState, useCallback } from 'react'

export function useLike(videoId: string, initialLiked: boolean, initialCount: number) {
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)

  const toggleLike = useCallback(async () => {
    if (loading) return

    // Optimistic update
    setLiked(prev => !prev)
    setCount(prev => liked ? prev - 1 : prev + 1)
    setLoading(true)

    try {
      const res = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId }),
      })

      if (!res.ok) {
        // Revert on error
        setLiked(prev => !prev)
        setCount(prev => liked ? prev + 1 : prev - 1)
      }
    } catch {
      // Revert on error
      setLiked(prev => !prev)
      setCount(prev => liked ? prev + 1 : prev - 1)
    } finally {
      setLoading(false)
    }
  }, [videoId, liked, loading])

  return { liked, count, toggleLike, loading }
}
