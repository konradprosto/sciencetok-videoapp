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
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5 text-xs font-medium text-muted-foreground">
        {comment.profiles?.display_name?.[0]?.toUpperCase() || comment.profiles?.username?.[0]?.toUpperCase() || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {comment.profiles?.display_name || comment.profiles?.username}
          </span>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>
        <p className="mt-1 text-sm text-foreground/80 whitespace-pre-wrap break-words">
          {comment.content}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={handleLike}
            aria-label={comment.user_has_liked ? 'Cofnij polubienie komentarza' : 'Polub komentarz'}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs transition-colors press-feedback ${
              comment.user_has_liked ? 'text-rose-400' : 'text-muted-foreground hover:text-rose-400'
            }`}
          >
            <Heart className={`h-4 w-4 ${comment.user_has_liked ? 'fill-current' : ''}`} />
            <span>{comment.like_count || 0}</span>
          </button>
          <button
            type="button"
            onClick={() => onReplyRequest?.(comment)}
            aria-label={`Odpowiedz na komentarz użytkownika ${comment.profiles?.username}`}
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs text-muted-foreground hover:text-primary transition-colors press-feedback"
          >
            <MessageCircle className="h-4 w-4" />
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
