'use client'

import { useState } from 'react'
import type { Comment } from '@/types/comment'
import { CommentForm } from './CommentForm'
import { MessageCircle } from 'lucide-react'

interface CommentItemProps {
  comment: Comment
  onReply?: (comment: any) => void
}

export function CommentItem({ comment, onReply }: CommentItemProps) {
  const [showReply, setShowReply] = useState(false)

  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return 'teraz'
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} godz.`
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)} dni`
    return new Date(date).toLocaleDateString('pl-PL')
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
          <span className="text-xs text-[#8A8F98]">{timeAgo(comment.created_at)}</span>
        </div>
        <p className="mt-1 text-sm text-[#EDEDEF]/80 whitespace-pre-wrap break-words">
          {comment.content}
        </p>
        <button
          onClick={() => setShowReply(!showReply)}
          className="mt-1.5 flex items-center gap-1 text-xs text-[#8A8F98] hover:text-[#5E6AD2] transition-colors"
        >
          <MessageCircle className="h-3 w-3" />
          Odpowiedz
        </button>
        {showReply && (
          <div className="mt-3">
            <CommentForm
              videoId={comment.video_id}
              parentId={comment.id}
              autoFocus
              onCancel={() => setShowReply(false)}
              onSubmit={(newComment) => {
                setShowReply(false)
                onReply?.(newComment)
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
