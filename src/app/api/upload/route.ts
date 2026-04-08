import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { mux } from '@/lib/mux'
import { uploadRatelimit } from '@/lib/ratelimit'
import { isAdminEmail } from '@/lib/admin'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { success } = await uploadRatelimit.limit(user.id)
  if (!success) {
    return NextResponse.json({ error: 'Too many uploads. Try again later.' }, { status: 429 })
  }

  const { fileName, description } = await request.json()
  const normalizedTitle = typeof fileName === 'string'
    ? fileName.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ').trim()
    : ''

  if (!normalizedTitle) {
    return NextResponse.json({ error: 'Video file name is required' }, { status: 400 })
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
      title: normalizedTitle,
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
