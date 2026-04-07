'use client'

import { useState, useEffect } from 'react'
import type { Comment } from '@/types/comment'
import { CommentItem } from './CommentItem'
import { createClient } from '@/lib/supabase/client'

interface CommentListProps {
  videoId: string
  initialComments: Comment[]
}

export function CommentList({ videoId, initialComments }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments)

  // Realtime subscription for new comments
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`comments:${videoId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `video_id=eq.${videoId}`,
        },
        async (payload) => {
          // Fetch the full comment with profile
          const { data } = await supabase
            .from('comments')
            .select('*, profiles!comments_user_id_fkey(username, display_name, avatar_url)')
            .eq('id', payload.new.id)
            .single()

          if (data && !data.parent_id) {
            setComments(prev => [data, ...prev])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [videoId])

  const handleReply = (reply: Comment) => {
    // For now, replies just get appended
  }

  if (comments.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-[#8A8F98]">Brak komentarzy. Bądź pierwszy!</p>
      </div>
    )
  }

  return (
    <div id="comments" className="space-y-6">
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} onReply={handleReply} />
      ))}
    </div>
  )
}
