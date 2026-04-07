import type { SupabaseClient } from '@supabase/supabase-js'
import type { Video } from '@/types/video'

export async function attachCommentCounts(
  supabase: SupabaseClient,
  videos: Video[] | null | undefined
): Promise<Video[]> {
  if (!videos?.length) return []

  const videoIds = videos.map((video) => video.id)
  const { data: comments, error } = await supabase
    .from('comments')
    .select('video_id')
    .in('video_id', videoIds)

  if (error || !comments) {
    return videos.map((video) => ({ ...video, comment_count: video.comment_count || 0 }))
  }

  const counts = comments.reduce<Record<string, number>>((acc, comment) => {
    acc[comment.video_id] = (acc[comment.video_id] || 0) + 1
    return acc
  }, {})

  return videos.map((video) => ({
    ...video,
    comment_count: counts[video.id] || 0,
  }))
}
