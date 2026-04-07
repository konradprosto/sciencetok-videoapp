import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { sessionId } = await request.json().catch(() => ({ sessionId: null }))

  const { data: { user } } = await supabase.auth.getUser()

  // Check for duplicate view in last hour
  if (sessionId) {
    const { data: existing } = await supabase
      .from('views')
      .select('id')
      .eq('video_id', id)
      .eq('session_id', sessionId)
      .gte('created_at', new Date(Date.now() - 3600000).toISOString())
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ counted: false })
    }
  }

  await supabase.from('views').insert({
    video_id: id,
    user_id: user?.id || null,
    session_id: sessionId,
  })

  // Increment view_count via raw SQL since we may not have an RPC function
  await supabase
    .from('videos')
    .update({ view_count: (await supabase.from('videos').select('view_count').eq('id', id).single()).data?.view_count + 1 || 1 })
    .eq('id', id)

  return NextResponse.json({ counted: true })
}
