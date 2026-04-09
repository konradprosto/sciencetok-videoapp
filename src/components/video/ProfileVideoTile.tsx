import Image from 'next/image'
import Link from 'next/link'
import type { Video } from '@/types/video'
import { Eye, Play } from 'lucide-react'

interface ProfileVideoTileProps {
  video: Video
}

function formatCount(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toString()
}

export function ProfileVideoTile({ video }: ProfileVideoTileProps) {
  return (
    <Link href={`/video/${video.id}`} className="group block">
      <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-card">
        {video.thumbnail_url ? (
          <Image
            src={video.thumbnail_url}
            alt={video.title}
            fill
            sizes="(max-width: 768px) 33vw, 220px"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#0f1012]">
            <Play className="h-5 w-5 text-white/40" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 p-2">
          <div className="flex items-center gap-1 text-[11px] font-medium text-white/90">
            <Eye className="h-3.5 w-3.5" />
            <span>{formatCount(video.view_count || 0)}</span>
          </div>
          <p className="mt-1 line-clamp-2 text-xs font-medium leading-4 text-white">
            {video.title}
          </p>
        </div>
      </div>
    </Link>
  )
}
