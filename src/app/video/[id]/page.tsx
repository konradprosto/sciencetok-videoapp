import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { VerticalFeed } from '@/components/video/VerticalFeed'
import { attachCommentCounts } from '@/lib/videos'

export default async function VideoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: video, error } = await supabase
    .from('videos')
    .select('*, profiles!videos_user_id_fkey(username, display_name, avatar_url)')
    .eq('id', id)
    .single()

  if (error || !video) {
    notFound()
  }

  const [videoWithCommentCount] = await attachCommentCounts(supabase, [video])

  return <VerticalFeed initialVideos={[videoWithCommentCount]} />
}
