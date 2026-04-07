import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { videoId } = await request.json()

  if (!videoId) {
    return NextResponse.json({ error: 'videoId required' }, { status: 400 })
  }

  // Check if already liked
  const { data: existing } = await supabase
    .from('likes')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('video_id', videoId)
    .maybeSingle()

  if (existing) {
    // Unlike
    await supabase
      .from('likes')
      .delete()
      .eq('user_id', user.id)
      .eq('video_id', videoId)

    return NextResponse.json({ liked: false })
  } else {
    // Like
    await supabase
      .from('likes')
      .insert({ user_id: user.id, video_id: videoId })

    return NextResponse.json({ liked: true })
  }
}
