import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (error || !profile) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Get video count
  const { count: videoCount } = await supabase
    .from('videos')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', profile.id)
    .eq('status', 'ready')

  return NextResponse.json({
    ...profile,
    video_count: videoCount || 0,
  })
}
