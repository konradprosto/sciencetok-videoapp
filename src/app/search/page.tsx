'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { VideoCard } from '@/components/video/VideoCard'
import { Search as SearchIcon, Loader2, X } from 'lucide-react'
import type { Video } from '@/types/video'
import { useScrollRestoration } from '@/hooks/useScrollRestoration'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [results, setResults] = useState<Video[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useScrollRestoration()

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([])
      setSearched(false)
      return
    }

    setLoading(true)
    setSearched(true)

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`)
      if (res.ok) {
        const data = await res.json()
        setResults(data.videos || [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const q = searchParams.get('q')
    if (q) {
      setQuery(q)
      search(q)
    }
  }, [searchParams, search])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      search(query.trim())
    }
  }

  return (
    <div className="px-4 py-6 md:px-6 md:py-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-2xl font-bold">Szukaj</h1>

        {/* Search input */}
        <form onSubmit={handleSubmit} className="relative mb-8">
          <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Szukaj filmów..."
            className="w-full rounded-2xl border border-white/8 bg-card pl-12 pr-12 py-3.5 text-sm placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setResults([]); setSearched(false) }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : searched && results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-lg font-medium">Brak wyników</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Nie znaleziono filmów dla &quot;{searchParams.get('q')}&quot;
            </p>
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
              <SearchIcon className="h-7 w-7 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              Wpisz frazę, aby wyszukać filmy
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
