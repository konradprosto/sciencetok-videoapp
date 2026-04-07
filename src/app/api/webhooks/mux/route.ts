import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: Request) {
  const supabase = getServiceClient()
  const body = await request.json()
  const headersList = await headers()

  // In production, verify webhook signature with MUX_WEBHOOK_SECRET
  // For now, basic check
  const webhookId = headersList.get('mux-webhook-id')
  if (!webhookId) {
    return NextResponse.json({ error: 'Missing webhook headers' }, { status: 401 })
  }

  const { type, data } = body

  switch (type) {
    case 'video.asset.ready': {
      const assetId = data.id
      const playbackId = data.playback_ids?.[0]?.id
      const duration = data.duration
      const uploadId = data.upload_id

      // Find video by upload_id and update
      const { error } = await supabase
        .from('videos')
        .update({
          mux_asset_id: assetId,
          mux_playback_id: playbackId,
          duration,
          status: 'ready',
          thumbnail_url: playbackId
            ? `https://image.mux.com/${playbackId}/thumbnail.webp?width=640&height=360&fit_mode=smartcrop`
            : null,
        })
        .eq('mux_upload_id', uploadId)

      if (error) {
        console.error('Webhook update error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      break
    }
    case 'video.asset.errored': {
      const uploadId = data.upload_id
      await supabase
        .from('videos')
        .update({ status: 'error' })
        .eq('mux_upload_id', uploadId)
      break
    }
    case 'video.upload.asset_created': {
      const assetId = data.asset_id
      const uploadId = data.id
      await supabase
        .from('videos')
        .update({ mux_asset_id: assetId })
        .eq('mux_upload_id', uploadId)
      break
    }
  }

  return NextResponse.json({ received: true })
}
