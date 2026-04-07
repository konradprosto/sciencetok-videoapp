import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { mux } from '@/lib/mux'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = getServiceClient()

  const { data: video } = await supabase
    .from('videos')
    .select('status, mux_upload_id, mux_playback_id')
    .eq('id', id)
    .single()

  if (!video) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // If already ready, return
  if (video.status === 'ready') {
    return NextResponse.json({ status: 'ready', playbackId: video.mux_playback_id })
  }

  // Poll Mux for status
  if (video.mux_upload_id) {
    try {
      const upload = await mux.video.uploads.retrieve(video.mux_upload_id)

      if (upload.asset_id) {
        const asset = await mux.video.assets.retrieve(upload.asset_id)

        if (asset.status === 'ready' && asset.playback_ids?.[0]?.id) {
          const playbackId = asset.playback_ids[0].id

          await supabase
            .from('videos')
            .update({
              mux_asset_id: asset.id,
              mux_playback_id: playbackId,
              duration: asset.duration,
              status: 'ready',
              thumbnail_url: `https://image.mux.com/${playbackId}/thumbnail.webp?width=640&height=360&fit_mode=smartcrop`,
            })
            .eq('id', id)

          return NextResponse.json({ status: 'ready', playbackId })
        }

        if (asset.status === 'errored') {
          await supabase.from('videos').update({ status: 'error' }).eq('id', id)
          return NextResponse.json({ status: 'error' })
        }
      }
    } catch {}
  }

  return NextResponse.json({ status: 'processing' })
}
