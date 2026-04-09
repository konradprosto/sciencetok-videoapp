'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/**
 * Saves and restores scroll position for the given scrollable element.
 * Uses sessionStorage keyed by pathname + search params.
 * Call with a ref to the scrollable container, or omit for window scroll.
 */
export function useScrollRestoration(containerRef?: React.RefObject<HTMLElement | null>) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const key = `scroll:${pathname}?${searchParams.toString()}`
  const restored = useRef(false)

  // Restore scroll position after content renders
  useEffect(() => {
    if (restored.current) return

    const saved = sessionStorage.getItem(key)
    if (!saved) return

    const scrollY = parseInt(saved, 10)
    if (isNaN(scrollY)) return

    // Wait for content to render before restoring
    const timer = requestAnimationFrame(() => {
      if (containerRef?.current) {
        containerRef.current.scrollTop = scrollY
      } else {
        window.scrollTo(0, scrollY)
      }
      restored.current = true
    })

    return () => cancelAnimationFrame(timer)
  }, [key, containerRef])

  // Save scroll position before navigating away
  useEffect(() => {
    const save = () => {
      const scrollY = containerRef?.current
        ? containerRef.current.scrollTop
        : window.scrollY
      sessionStorage.setItem(key, String(Math.round(scrollY)))
    }

    // Save on any click that might trigger navigation (Link clicks)
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a')
      if (anchor && anchor.href) save()
    }

    document.addEventListener('click', handleClick, true)
    window.addEventListener('beforeunload', save)

    return () => {
      save() // Save when component unmounts (navigating away)
      document.removeEventListener('click', handleClick, true)
      window.removeEventListener('beforeunload', save)
    }
  }, [key, containerRef])
}
