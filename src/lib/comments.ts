import type { SupabaseClient } from '@supabase/supabase-js'
import type { Comment } from '@/types/comment'

type CommentRow = Omit<Comment, 'replies' | 'user_has_liked'> & {
  profiles?: Comment['profiles']
}

type RawCommentRow = Omit<CommentRow, 'profiles'> & {
  profiles?: Array<NonNullable<Comment['profiles']>> | Comment['profiles']
}

function sortCommentTree(comments: Comment[], root = false): Comment[] {
  const sorted = [...comments].sort((a, b) => {
    const left = new Date(a.created_at).getTime()
    const right = new Date(b.created_at).getTime()
    return root ? right - left : left - right
  })

  return sorted.map((comment) => ({
    ...comment,
    replies: sortCommentTree(comment.replies || []),
  }))
}

export function countComments(comments: Comment[]): number {
  return comments.reduce((total, comment) => total + 1 + countComments(comment.replies || []), 0)
}

export function insertCommentIntoTree(comments: Comment[], newComment: Comment): Comment[] {
  if (!newComment.parent_id) {
    return [newComment, ...comments]
  }

  return comments.map((comment) => {
    if (comment.id === newComment.parent_id) {
      return {
        ...comment,
        replies: [...(comment.replies || []), newComment],
      }
    }

    return {
      ...comment,
      replies: insertCommentIntoTree(comment.replies || [], newComment),
    }
  })
}

export function updateCommentInTree(
  comments: Comment[],
  commentId: string,
  updater: (comment: Comment) => Comment
): Comment[] {
  return comments.map((comment) => {
    if (comment.id === commentId) {
      return updater(comment)
    }

    return {
      ...comment,
      replies: updateCommentInTree(comment.replies || [], commentId, updater),
    }
  })
}

export async function fetchCommentsTree(
  supabase: SupabaseClient,
  videoId: string
): Promise<Comment[]> {
  const { data: rows, error } = await supabase
    .from('comments')
    .select('id, video_id, user_id, parent_id, content, created_at, like_count, profiles!comments_user_id_fkey(username, display_name, avatar_url)')
    .eq('video_id', videoId)
    .order('created_at', { ascending: true })
    .limit(300)

  if (error || !rows) {
    return []
  }

  const typedRows = rows as unknown as RawCommentRow[]
  const { data: { user } } = await supabase.auth.getUser()

  let likedCommentIds = new Set<string>()
  if (user && typedRows.length > 0) {
    const { data: likes } = await supabase
      .from('comment_likes')
      .select('comment_id')
      .eq('user_id', user.id)
      .in('comment_id', typedRows.map((comment) => comment.id))

    likedCommentIds = new Set((likes || []).map((like) => like.comment_id))
  }

  const commentMap = new Map<string, Comment>()
  for (const row of typedRows) {
    commentMap.set(row.id, {
      ...row,
      profiles: Array.isArray(row.profiles) ? row.profiles[0] : row.profiles,
      like_count: row.like_count || 0,
      user_has_liked: likedCommentIds.has(row.id),
      replies: [],
    })
  }

  const roots: Comment[] = []
  for (const comment of commentMap.values()) {
    if (comment.parent_id && commentMap.has(comment.parent_id)) {
      commentMap.get(comment.parent_id)!.replies!.push(comment)
    } else {
      roots.push(comment)
    }
  }

  return sortCommentTree(roots, true)
}
