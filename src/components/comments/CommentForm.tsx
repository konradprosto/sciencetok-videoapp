'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { LoginPromptModal } from '@/components/auth/LoginPromptModal'
import { Button } from '@/components/ui/button'
import { Send, Loader2, CornerUpLeft, X } from 'lucide-react'
import type { Comment } from '@/types/comment'

interface CommentFormProps {
  videoId: string
  parentId?: string
  replyLabel?: string | null
  onSubmit?: (comment: Comment) => void
  onCancel?: () => void
  onClearReply?: () => void
  autoFocus?: boolean
}

export function CommentForm({
  videoId,
  parentId,
  replyLabel,
  onSubmit,
  onCancel,
  onClearReply,
  autoFocus,
}: CommentFormProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const { user } = useAuth()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!replyLabel || !textareaRef.current) return
    textareaRef.current.focus()
  }, [replyLabel])

  if (!user) {
    return (
      <>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-card p-4">
          <p className="text-sm text-muted-foreground">Zaloguj się, aby dodać komentarz</p>
          <Button
            type="button"
            size="sm"
            className="bg-primary text-white hover:bg-primary-hover"
            onClick={() => setShowLoginPrompt(true)}
          >
            Zaloguj się
          </Button>
        </div>
        <LoginPromptModal
          open={showLoginPrompt}
          onClose={() => setShowLoginPrompt(false)}
          title="Zaloguj się, aby komentować"
          description="Komentowanie i odpowiadanie na komentarze wymaga zalogowania."
        />
      </>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || loading) return

    setLoading(true)
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, content: content.trim(), parentId }),
      })

      if (res.ok) {
        const comment = await res.json()
        setContent('')
        onSubmit?.(comment)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
        {user.email?.[0]?.toUpperCase() || 'U'}
      </div>
      <div className="flex-1 space-y-2">
        {replyLabel && (
          <div className="flex items-center justify-between rounded-full border border-primary/20 bg-primary/10 px-3 py-2 text-xs text-primary-light">
            <div className="flex items-center gap-2">
              <CornerUpLeft className="h-3.5 w-3.5" />
              <span>Odpowiadasz użytkownikowi @{replyLabel}</span>
            </div>
            <button
              type="button"
              onClick={onClearReply}
              className="rounded-full p-1 text-primary-light/70 transition-colors hover:bg-white/5 hover:text-white"
              aria-label="Anuluj odpowiedź"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={replyLabel ? `Napisz odpowiedź do @${replyLabel}...` : 'Napisz komentarz...'}
          rows={2}
          autoFocus={autoFocus}
          className="w-full rounded-2xl border border-white/8 bg-card px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors resize-none"
        />
        <div className="flex items-center justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              Anuluj
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            disabled={!content.trim() || loading}
            className="bg-primary text-white hover:bg-primary-hover disabled:opacity-40"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>
    </form>
  )
}
