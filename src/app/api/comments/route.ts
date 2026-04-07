import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { commentRatelimit } from '@/lib/ratelimit'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const videoId = searchParams.get('videoId')
  const parentId = searchParams.get('parentId')

  if (!videoId) {
    return NextResponse.json({ error: 'videoId required' }, { status: 400 })
  }

  let query = supabase
    .from('comments')
    .select('*, profiles!comments_user_id_fkey(username, display_name, avatar_url)')
    .eq('video_id', videoId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (parentId) {
    query = query.eq('parent_id', parentId)
  } else {
    query = query.is('parent_id', null)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
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

  return NextResponse.json(data)
}
