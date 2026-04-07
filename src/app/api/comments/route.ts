import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { commentRatelimit } from '@/lib/ratelimit'
import { fetchCommentsTree } from '@/lib/comments'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const videoId = searchParams.get('videoId')

  if (!videoId) {
    return NextResponse.json({ error: 'videoId required' }, { status: 400 })
  }

  const comments = await fetchCommentsTree(supabase, videoId)

  return NextResponse.json(comments)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { success } = await commentRatelimit.limit(user.id)
  if (!success) {
    return NextResponse.json({ error: 'Too many comments. Slow down.' }, { status: 429 })
  }

  const { videoId, content, parentId } = await request.json()

  if (!videoId || !content?.trim()) {
    return NextResponse.json({ error: 'videoId and content required' }, { status: 400 })
  }

  let parentCommentUserId: string | null = null
  if (parentId) {
    const { data: parentComment, error: parentError } = await supabase
      .from('comments')
      .select('id, user_id, video_id')
      .eq('id', parentId)
      .single()

    if (parentError || !parentComment || parentComment.video_id !== videoId) {
      return NextResponse.json({ error: 'Invalid parent comment' }, { status: 400 })
    }

    parentCommentUserId = parentComment.user_id
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({
      video_id: videoId,
      user_id: user.id,
      content: content.trim(),
      parent_id: parentId || null,
    })
    .select('*, profiles!comments_user_id_fkey(username, display_name, avatar_url)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (parentCommentUserId && parentCommentUserId !== user.id) {
    await supabase
      .from('notifications')
      .upsert({
        recipient_id: parentCommentUserId,
        actor_id: user.id,
        type: 'comment_reply',
        comment_id: data.id,
        video_id: videoId,
      }, {
        onConflict: 'actor_id,type,comment_id',
      })
  }

  return NextResponse.json({
    ...data,
    like_count: data.like_count || 0,
    user_has_liked: false,
    replies: [],
  })
}
