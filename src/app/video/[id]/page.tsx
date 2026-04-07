import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { VideoPlayer } from '@/components/video/VideoPlayer'
import { VideoActions } from '@/components/video/VideoActions'
import { CommentList } from '@/components/comments/CommentList'
import { CommentForm } from '@/components/comments/CommentForm'
import Link from 'next/link'
import { Eye, Calendar } from 'lucide-react'

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

  // Check if user liked
  const { data: { user } } = await supabase.auth.getUser()
  let userHasLiked = false
  if (user) {
    const { data: like } = await supabase
      .from('likes')
      .select('user_id')
      .eq('user_id', user.id)
      .eq('video_id', id)
      .maybeSingle()
    userHasLiked = !!like
  }

  const { count: commentCount } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('video_id', id)

  const { data: comments } = await supabase
    .from('comments')
    .select('*, profiles!comments_user_id_fkey(username, display_name, avatar_url)')
    .eq('video_id', id)
    .is('parent_id', null)
    .order('created_at', { ascending: false })
    .limit(20)

  const date = new Date(video.created_at).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:py-10">
      {/* Player */}
      {video.mux_playback_id ? (
        <VideoPlayer
          playbackId={video.mux_playback_id}
          videoId={video.id}
          title={video.title}
        />
      ) : (
        <div className="flex aspect-video items-center justify-center rounded-2xl bg-[#0a0a0c] border border-white/8">
          <p className="text-[#8A8F98]">Film jest przetwarzany...</p>
        </div>
      )}

      {/* Info */}
      <div className="mt-6 space-y-4">
        <h1 className="text-xl font-bold md:text-2xl">{video.title}</h1>

        <div className="flex items-center justify-between">
          <Link
            href={`/profile/${video.profiles?.username}`}
            className="flex items-center gap-3 group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#5E6AD2]/20 text-sm font-semibold text-[#5E6AD2] group-hover:bg-[#5E6AD2]/30 transition-colors">
              {video.profiles?.display_name?.[0]?.toUpperCase() || video.profiles?.username?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="font-medium text-sm group-hover:text-[#5E6AD2] transition-colors">
                {video.profiles?.display_name || video.profiles?.username}
              </p>
              <p className="text-xs text-[#8A8F98]">@{video.profiles?.username}</p>
            </div>
          </Link>

          <VideoActions
            videoId={video.id}
            initialLikeCount={video.like_count || 0}
            initialHasLiked={userHasLiked}
            commentCount={commentCount || 0}
          />
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 text-xs text-[#8A8F98]">
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {video.view_count || 0} wyświetleń
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {date}
          </span>
        </div>

        {/* Description */}
        {video.description && (
          <div className="rounded-xl bg-[#0a0a0c] border border-white/5 p-4">
            <p className="text-sm text-[#8A8F98] whitespace-pre-wrap">{video.description}</p>
          </div>
        )}

        {/* Comments */}
        <div className="mt-8 space-y-6">
          <h2 className="text-lg font-semibold">
            Komentarze ({commentCount || 0})
          </h2>
          <CommentForm videoId={video.id} />
          <CommentList videoId={video.id} initialComments={comments || []} />
        </div>
      </div>
    </div>
  )
}
