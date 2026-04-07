import Image from 'next/image'
import Link from 'next/link'
import type { Video } from '@/types/video'
import { Eye, Heart, Clock } from 'lucide-react'

interface VideoCardProps {
  video: Video
}

function formatDuration(seconds: number | null) {
  if (!seconds) return ''
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatCount(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toString()
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'teraz'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min temu`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} godz. temu`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} dni temu`
  return new Date(date).toLocaleDateString('pl-PL')
}

export function VideoCard({ video }: VideoCardProps) {
  return (
    <Link href={`/video/${video.id}`} className="group block">
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden rounded-xl bg-[#0a0a0c] border border-white/5 group-hover:border-white/10 transition-all duration-300">
        {video.thumbnail_url ? (
          <Image
            src={video.thumbnail_url}
            alt={video.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="h-10 w-10 rounded-full bg-white/5 animate-pulse" />
          </div>
        )}
        {/* Duration badge */}
        {video.duration && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/80 px-1.5 py-0.5 text-xs font-medium backdrop-blur-sm">
            <Clock className="h-3 w-3" />
            {formatDuration(video.duration)}
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Info */}
      <div className="mt-3 flex gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#5E6AD2]/15 text-xs font-semibold text-[#5E6AD2]">
          {video.profiles?.display_name?.[0]?.toUpperCase() || video.profiles?.username?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium leading-tight line-clamp-2 group-hover:text-white transition-colors">
            {video.title}
          </h3>
          <p className="mt-1 text-xs text-[#8A8F98]">
            {video.profiles?.display_name || video.profiles?.username}
          </p>
          <div className="mt-0.5 flex items-center gap-3 text-xs text-[#8A8F98]">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {formatCount(video.view_count)}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              {formatCount(video.like_count)}
            </span>
            <span>{timeAgo(video.created_at)}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
