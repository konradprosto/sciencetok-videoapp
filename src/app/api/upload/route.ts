import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { mux } from '@/lib/mux'
import { uploadRatelimit } from '@/lib/ratelimit'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { success } = await uploadRatelimit.limit(user.id)
  if (!success) {
    return NextResponse.json({ error: 'Too many uploads. Try again later.' }, { status: 429 })
  }

  const { title, description } = await request.json()

  if (!title?.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  // Create Mux Direct Upload
  const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const upload = await mux.video.uploads.create({
    cors_origin: origin,
    new_asset_settings: {
      playback_policy: ['public'],
      encoding_tier: 'baseline',
    },
  })

  // Create video record in DB
  const { data: video, error: dbError } = await supabase
    .from('videos')
    .insert({
      user_id: user.id,
      title: title.trim(),
      description: description?.trim() || null,
      mux_upload_id: upload.id,
      status: 'processing',
    })
    .select()
    .single()

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({
    uploadUrl: upload.url,
    videoId: video.id,
  })
}
