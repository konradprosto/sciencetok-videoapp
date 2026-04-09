'use client'

import { useMemo, useState } from 'react'
import type { Comment } from '@/types/comment'
import { Heart, MessageCircle } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'
import { LoginPromptModal } from '@/components/auth/LoginPromptModal'

interface CommentItemProps {
  comment: Comment
  onReplyRequest?: (comment: Comment) => void
  onLikeChange?: (commentId: string, liked: boolean, likeCount: number) => void
}

export function CommentItem({ comment, onReplyRequest, onLikeChange }: CommentItemProps) {
  const { user } = useAuth()
  const [now] = useState(() => Date.now())
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  const timeAgo = useMemo(() => {
    const seconds = Math.floor((now - new Date(comment.created_at).getTime()) / 1000)
    if (seconds < 60) return 'teraz'
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} godz.`
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)} dni`
    return new Date(comment.created_at).toLocaleDateString('pl-PL')
  }, [comment.created_at, now])

  const handleLike = async () => {
    if (!user) {
      setShowLoginPrompt(true)
      return
    }

    const res = await fetch('/api/comment-likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentId: comment.id }),
    })

    if (!res.ok) return

    const data = await res.json()
    onLikeChange?.(comment.id, Boolean(data.liked), Number(data.likeCount) || 0)
  }

  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5 text-xs font-medium text-[#8A8F98]">
        {comment.profiles?.display_name?.[0]?.toUpperCase() || comment.profiles?.username?.[0]?.toUpperCase() || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {comment.profiles?.display_name || comment.profiles?.username}
          </span>
          <span className="text-xs text-[#8A8F98]">{timeAgo}</span>
        </div>
        <p className="mt-1 text-sm text-[#EDEDEF]/80 whitespace-pre-wrap break-words">
          {comment.content}
        </p>
        <div className="mt-2 flex items-center gap-4">
          <button
            type="button"
            onClick={handleLike}
            className={`flex items-center gap-1 text-xs transition-colors ${
              comment.user_has_liked ? 'text-rose-400' : 'text-[#8A8F98] hover:text-rose-400'
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${comment.user_has_liked ? 'fill-current' : ''}`} />
            <span>{comment.like_count || 0}</span>
          </button>
          <button
            type="button"
            onClick={() => onReplyRequest?.(comment)}
            className="flex items-center gap-1 text-xs text-[#8A8F98] hover:text-[#5E6AD2] transition-colors"
          >
            <MessageCircle className="h-3 w-3" />
            Odpowiedz
          </button>
        </div>
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-4 border-l border-white/8 pl-4">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                onReplyRequest={onReplyRequest}
                onLikeChange={onLikeChange}
              />
            ))}
          </div>
        )}
      </div>
      <LoginPromptModal
        open={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        title="Zaloguj się, aby polubić komentarz"
        description="Serduszka pod komentarzami są dostępne dla zalogowanych użytkowników."
      />
    </div>
  )
}
