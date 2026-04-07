'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { Send, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

interface CommentFormProps {
  videoId: string
  parentId?: string
  onSubmit?: (comment: any) => void
  onCancel?: () => void
  autoFocus?: boolean
}

export function CommentForm({ videoId, parentId, onSubmit, onCancel, autoFocus }: CommentFormProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-white/5 bg-[#0a0a0c] p-4">
        <p className="text-sm text-[#8A8F98]">
          <Link href="/login" className="text-[#5E6AD2] hover:underline">Zaloguj się</Link>
          , aby dodać komentarz
        </p>
      </div>
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
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#5E6AD2]/20 text-xs font-semibold text-[#5E6AD2]">
        {user.email?.[0]?.toUpperCase() || 'U'}
      </div>
      <div className="flex-1 space-y-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Napisz komentarz..."
          rows={2}
          autoFocus={autoFocus}
          className="w-full rounded-xl border border-white/8 bg-[#0a0a0c] px-4 py-2.5 text-sm placeholder:text-[#8A8F98]/50 focus:border-[#5E6AD2] focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] transition-colors resize-none"
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
            className="bg-[#5E6AD2] text-white hover:bg-[#4F5BC0] disabled:opacity-40"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>
    </form>
  )
}
