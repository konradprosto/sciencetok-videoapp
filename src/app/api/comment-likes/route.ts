import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { commentId } = await request.json()
  if (!commentId) {
    return NextResponse.json({ error: 'commentId required' }, { status: 400 })
  }

  const { data: comment, error: commentError } = await supabase
    .from('comments')
    .select('id, user_id, video_id, like_count')
    .eq('id', commentId)
    .single()

  if (commentError || !comment) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
  }

  const { data: existing } = await supabase
    .from('comment_likes')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('comment_id', commentId)
    .maybeSingle()

  if (existing) {
    await supabase
      .from('comment_likes')
      .delete()
      .eq('user_id', user.id)
      .eq('comment_id', commentId)

    return NextResponse.json({
      liked: false,
      likeCount: Math.max((comment.like_count || 1) - 1, 0),
    })
  }

  await supabase
    .from('comment_likes')
    .insert({ user_id: user.id, comment_id: commentId })

  if (comment.user_id !== user.id) {
    const { error: notificationError } = await admin
      .from('notifications')
      .upsert({
        recipient_id: comment.user_id,
        actor_id: user.id,
        type: 'comment_like',
        comment_id: comment.id,
        video_id: comment.video_id,
      }, {
        onConflict: 'actor_id,type,comment_id',
        ignoreDuplicates: true,
      })

    if (notificationError) {
      console.error('Failed to create comment like notification:', notificationError)
    }
  }

  return NextResponse.json({
    liked: true,
    likeCount: (comment.like_count || 0) + 1,
  })
}
