import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query?.trim()) {
    return NextResponse.json({ videos: [] })
  }

  const supabase = await createClient()

  // Search by title (using ilike for simple text search)
  const { data: videos, error } = await supabase
    .from('videos')
    .select('*, profiles!videos_user_id_fkey(username, display_name, avatar_url)')
    .eq('status', 'ready')
    .ilike('title', `%${query.trim()}%`)
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ videos: videos || [] })
}
