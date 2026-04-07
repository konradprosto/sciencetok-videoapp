import { createClient } from '@/lib/supabase/server'
import { VideoFeed } from '@/components/video/VideoFeed'
import type { VideoFeedResponse } from '@/types/video'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: videos } = await supabase
    .from('videos')
    .select('*, profiles!videos_user_id_fkey(username, display_name, avatar_url)')
    .eq('status', 'ready')
    .order('created_at', { ascending: false })
    .limit(21)

  const items = videos || []
  const hasMore = items.length > 20
  const initialData: VideoFeedResponse = {
    videos: hasMore ? items.slice(0, 20) : items,
    nextCursor: hasMore ? items[19].created_at : null,
  }

  return (
    <div className="px-4 py-6 md:px-6 md:py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold md:text-3xl">Odkrywaj</h1>
        <p className="mt-1 text-sm text-[#8A8F98]">Najnowsze filmy z naszej społeczności</p>
      </div>
      <VideoFeed initialData={initialData} />
    </div>
  )
}
