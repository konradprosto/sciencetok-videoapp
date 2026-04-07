import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const unreadOnly = searchParams.get('unreadOnly') === 'true'
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50)

  let query = supabase
    .from('notifications')
    .select('id, type, created_at, read_at, comment_id, video_id, actor:profiles!notifications_actor_id_fkey(username, display_name, avatar_url), comments(content), videos(title)')
    .eq('recipient_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (unreadOnly) {
    query = query.is('read_at', null)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data || [])
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const now = new Date().toISOString()

  let query = supabase
    .from('notifications')
    .update({ read_at: now })
    .eq('recipient_id', user.id)
    .is('read_at', null)

  if (body.markAll !== true) {
    const ids = Array.isArray(body.notificationIds) ? body.notificationIds : []
    if (ids.length === 0) {
      return NextResponse.json({ error: 'notificationIds or markAll required' }, { status: 400 })
    }

    query = query.in('id', ids)
  }

  const { error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
