import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { attachCommentCounts } from '@/lib/videos'

const hasRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)

async function getRedis() {
  if (!hasRedis) return null
  const { createRedis } = await import('@/lib/redis')
  return createRedis()
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const cursor = searchParams.get('cursor')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

  // If requesting first page (no cursor), try cache
  const r = await getRedis()
  if (!cursor && r) {
    try {
      const cached = await r.get('feed:latest')
      if (cached) {
        return NextResponse.json(cached)
      }
    } catch {}
  }

  let query = supabase
    .from('videos')
    .select('*, profiles!videos_user_id_fkey(username, display_name, avatar_url)')
    .eq('status', 'ready')
    .order('created_at', { ascending: false })
    .limit(limit + 1)

  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  const { data: videos, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const hasMore = videos.length > limit
  const items = hasMore ? videos.slice(0, limit) : videos
  const itemsWithCommentCounts = await attachCommentCounts(supabase, items)

  const response = {
    videos: itemsWithCommentCounts,
    nextCursor: hasMore ? items[items.length - 1].created_at : null,
  }

  // Cache first page for 30 seconds
  if (!cursor && r) {
    try {
      await r.set('feed:latest', response, { ex: 30 })
    } catch {}
  }

  return NextResponse.json(response)
}
