'use client'

import { useLike } from '@/hooks/useLike'
import { useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { LoginPromptModal } from '@/components/auth/LoginPromptModal'
import { Heart, MessageCircle, Share2 } from 'lucide-react'

interface VideoActionsProps {
  videoId: string
  initialLikeCount: number
  initialHasLiked: boolean
  commentCount: number
}

export function VideoActions({ videoId, initialLikeCount, initialHasLiked, commentCount }: VideoActionsProps) {
  const { user } = useAuth()
  const { liked, count, toggleLike } = useLike(videoId, initialHasLiked, initialLikeCount)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  const handleLike = () => {
    if (!user) {
      setShowLoginPrompt(true)
      return
    }

    toggleLike()
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/video/${videoId}`
    if (navigator.share) {
      await navigator.share({ title: 'ScienceTok', url }).catch(() => {})
    } else {
      await navigator.clipboard.writeText(url)
    }
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleLike}
        className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm transition-all duration-200 ${
          liked
            ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
            : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white'
        }`}
      >
        <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
        <span>{count}</span>
      </button>

      <a
        href="#comments"
        className="flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-2 text-sm text-muted-foreground hover:bg-white/10 hover:text-white transition-colors"
      >
        <MessageCircle className="h-4 w-4" />
        <span>{commentCount}</span>
      </a>

      <button
        onClick={handleShare}
        className="flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-2 text-sm text-muted-foreground hover:bg-white/10 hover:text-white transition-colors"
      >
        <Share2 className="h-4 w-4" />
      </button>

      <LoginPromptModal
        open={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        title="Zaloguj się, aby polubić film"
        description="Polubienia zapisujemy na Twoim koncie, więc ta akcja wymaga zalogowania."
      />
    </div>
  )
}
