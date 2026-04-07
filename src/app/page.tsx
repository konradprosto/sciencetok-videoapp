import { createClient } from '@/lib/supabase/server'
import { VerticalFeed } from '@/components/video/VerticalFeed'
import { attachCommentCounts } from '@/lib/videos'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: videos } = await supabase
    .from('videos')
    .select('*, profiles!videos_user_id_fkey(username, display_name, avatar_url)')
    .eq('status', 'ready')
    .order('created_at', { ascending: false })
    .limit(10)

  const videosWithCommentCounts = await attachCommentCounts(supabase, videos)

  return <VerticalFeed initialVideos={videosWithCommentCounts} />
}
