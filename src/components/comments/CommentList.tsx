'use client'

import { useState, useEffect } from 'react'
import type { Comment } from '@/types/comment'
import { CommentItem } from './CommentItem'
import { createClient } from '@/lib/supabase/client'
import { countComments, insertCommentIntoTree, updateCommentInTree } from '@/lib/comments'

interface CommentListProps {
  videoId: string
  initialComments: Comment[]
  onCountChange?: (count: number) => void
}

export function CommentList({ videoId, initialComments, onCountChange }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments)

  useEffect(() => {
    setComments(initialComments)
  }, [initialComments])

  useEffect(() => {
    onCountChange?.(countComments(comments))
  }, [comments, onCountChange])

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
            setComments(prev => insertCommentIntoTree(prev, {
              ...data,
              like_count: data.like_count || 0,
              user_has_liked: false,
              replies: [],
            }))
          } else if (data) {
            setComments(prev => insertCommentIntoTree(prev, {
              ...data,
              like_count: data.like_count || 0,
              user_has_liked: false,
              replies: [],
            }))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [videoId])

  const handleReply = (reply: Comment) => {
    setComments((prev) => insertCommentIntoTree(prev, reply))
  }

  const handleLikeChange = (commentId: string, liked: boolean, likeCount: number) => {
    setComments((prev) => updateCommentInTree(prev, commentId, (comment) => ({
      ...comment,
      user_has_liked: liked,
      like_count: likeCount,
    })))
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
        <CommentItem
          key={comment.id}
          comment={comment}
          onReply={handleReply}
          onLikeChange={handleLikeChange}
        />
      ))}
    </div>
  )
}
