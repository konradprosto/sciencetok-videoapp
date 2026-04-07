import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: video, error } = await supabase
    .from('videos')
    .select('*, profiles!videos_user_id_fkey(username, display_name, avatar_url)')
    .eq('id', id)
    .single()

  if (error || !video) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 })
  }

  // Check if current user liked this video
  const { data: { user } } = await supabase.auth.getUser()
  let userHasLiked = false
  if (user) {
    const { data: like } = await supabase
      .from('likes')
      .select('user_id')
      .eq('user_id', user.id)
      .eq('video_id', id)
      .maybeSingle()
    userHasLiked = !!like
  }

  // Get comment count
  const { count } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('video_id', id)

  return NextResponse.json({
    ...video,
    user_has_liked: userHasLiked,
    comment_count: count || 0,
  })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { error } = await supabase.from('videos').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ deleted: true })
}
