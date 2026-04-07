'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import MuxPlayer from '@mux/mux-player-react'
import type MuxPlayerElement from '@mux/mux-player'
import type { Video } from '@/types/video'
import type { Comment } from '@/types/comment'
import Link from 'next/link'
import { Heart, MessageCircle, Share2, Plus, Play, Volume2, VolumeX, X } from 'lucide-react'
import { CommentForm } from '@/components/comments/CommentForm'
import { CommentItem } from '@/components/comments/CommentItem'
import { useAuth } from '@/components/auth/AuthProvider'
import { LoginPromptModal } from '@/components/auth/LoginPromptModal'
import { countComments, insertCommentIntoTree, updateCommentInTree } from '@/lib/comments'

interface VerticalVideoSlideProps {
  video: Video
  index: number
  isActive: boolean
  globalMuted: boolean
  onMutedChange: (muted: boolean) => void
}

export function VerticalVideoSlide({ video, index, isActive, globalMuted, onMutedChange }: VerticalVideoSlideProps) {
  const playerRef = useRef<MuxPlayerElement | null>(null)
  const { user } = useAuth()
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(video.like_count || 0)
  const [paused, setPaused] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentCount, setCommentCount] = useState(video.comment_count || 0)

  // Auto play/pause based on visibility
  useEffect(() => {
    const player = playerRef.current
    if (!player) return

    if (isActive) {
      player.muted = globalMuted
      player.play?.().catch(() => {})
    } else {
      player.pause?.()
    }
  }, [isActive, globalMuted])

  // Sync muted state to player when globalMuted changes
  useEffect(() => {
    const player = playerRef.current
    if (!player || !isActive) return
    player.muted = globalMuted
  }, [globalMuted, isActive])

  const toggleLike = async () => {
    if (!user) {
      setShowLoginPrompt(true)
      return
    }

    setLiked(!liked)
    setLikeCount(prev => liked ? prev - 1 : prev + 1)
    fetch('/api/likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId: video.id }),
    }).catch(() => {
      setLiked(!liked)
      setLikeCount(prev => liked ? prev + 1 : prev - 1)
    })
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/video/${video.id}`
    if (navigator.share) {
      await navigator.share({ title: video.title, url }).catch(() => {})
    } else {
      await navigator.clipboard.writeText(url)
    }
  }

  const togglePlayPause = () => {
    const player = playerRef.current
    if (!player) return
    if (player.paused) {
      player.play?.()
      setPaused(false)
    } else {
      player.pause?.()
      setPaused(true)
    }
  }

  const toggleMuted = () => {
    onMutedChange(!globalMuted)
  }

  const loadComments = useCallback(async () => {
    if (loadingComments) return
    setLoadingComments(true)
    try {
      const res = await fetch(`/api/comments?videoId=${video.id}`)
      if (res.ok) {
        const data = await res.json()
        const nextComments = Array.isArray(data) ? data : []
        setComments(nextComments)
        setCommentCount(countComments(nextComments))
      }
    } finally {
      setLoadingComments(false)
    }
  }, [video.id, loadingComments])

  const toggleComments = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!showComments) {
      loadComments()
    }
    setShowComments(!showComments)
  }

  const handleCommentSubmit = (comment: Comment) => {
    setComments(prev => insertCommentIntoTree(prev, comment))
    setCommentCount(prev => prev + 1)
  }

  const handleReply = (comment: Comment) => {
    setComments(prev => insertCommentIntoTree(prev, comment))
    setCommentCount(prev => prev + 1)
  }

  const handleCommentLikeChange = (commentId: string, liked: boolean, likeCount: number) => {
    setComments((prev) => updateCommentInTree(prev, commentId, (comment) => ({
      ...comment,
      user_has_liked: liked,
      like_count: likeCount,
    })))
  }

  const formatCount = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
    return n.toString()
  }

  return (
    <div
      data-index={index}
      className="relative h-dvh w-full snap-start snap-always flex items-center justify-center bg-black"
      onClick={togglePlayPause}
    >
      {/* Video Player */}
      {video.mux_playback_id ? (
        <MuxPlayer
          ref={playerRef}
          playbackId={video.mux_playback_id}
          streamType="on-demand"
          autoPlay={isActive ? 'muted' : false}
          muted={globalMuted}
          loop
          playsInline
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            inset: 0,
            ['--media-object-fit' as string]: 'contain',
            ['--controls' as string]: 'none',
          } as Record<string, string>}
          className="absolute inset-0"
        />
      ) : (
        <div className="flex items-center justify-center h-full w-full">
          <p className="text-white/50">Przetwarzanie...</p>
        </div>
      )}

      {/* Pause indicator */}
      {paused && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm">
            <Play className="h-10 w-10 text-white ml-1" fill="white" />
          </div>
        </div>
      )}

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60 pointer-events-none z-10" />

      {/* Right side action bar */}
      <div className="absolute right-3 bottom-32 flex flex-col items-center gap-5 z-20" onClick={(e) => e.stopPropagation()}>
        {/* Avatar */}
        <Link href={`/profile/${video.profiles?.username}`} className="relative mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#5E6AD2] text-white text-lg font-bold ring-2 ring-white shadow-lg">
            {video.profiles?.display_name?.[0]?.toUpperCase() || video.profiles?.username?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-[#5E6AD2]">
            <Plus className="h-3 w-3 text-white" />
          </div>
        </Link>

        {/* Like */}
        <button onClick={toggleLike} className="flex flex-col items-center gap-1">
          <div className={`flex h-12 w-12 items-center justify-center rounded-full transition-all duration-200 ${liked ? 'bg-red-500/20' : 'bg-white/10 backdrop-blur-sm'}`}>
            <Heart className={`h-7 w-7 transition-all duration-200 ${liked ? 'text-red-500 fill-red-500 scale-110' : 'text-white'}`} />
          </div>
          <span className="text-xs font-semibold text-white drop-shadow-lg">{formatCount(likeCount)}</span>
        </button>

        {/* Comment - opens inline panel instead of navigating */}
        <button onClick={toggleComments} className="flex flex-col items-center gap-1">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
            <MessageCircle className="h-7 w-7 text-white" />
          </div>
          <span className="text-xs font-semibold text-white drop-shadow-lg">{formatCount(commentCount)}</span>
        </button>

        {/* Share */}
        <button onClick={handleShare} className="flex flex-col items-center gap-1">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
            <Share2 className="h-6 w-6 text-white" />
          </div>
          <span className="text-xs font-semibold text-white drop-shadow-lg">Udostepnij</span>
        </button>

        {/* Mute toggle */}
        <button onClick={toggleMuted} className="flex flex-col items-center gap-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
            {globalMuted ? <VolumeX className="h-5 w-5 text-white" /> : <Volume2 className="h-5 w-5 text-white" />}
          </div>
        </button>
      </div>

      {/* Bottom info overlay */}
      <div className="absolute bottom-4 left-4 right-20 z-20 pointer-events-none">
        <Link href={`/profile/${video.profiles?.username}`} className="pointer-events-auto">
          <p className="font-bold text-white text-base drop-shadow-lg">
            @{video.profiles?.username}
          </p>
        </Link>
        <h3 className="mt-1 text-sm text-white font-medium drop-shadow-lg line-clamp-2">
          {video.title}
        </h3>
        {video.description && (
          <p className="mt-1 text-xs text-white/70 line-clamp-1 drop-shadow-lg">
            {video.description}
          </p>
        )}
      </div>

      {/* Top navigation overlay */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 pt-[env(safe-area-inset-top,12px)] pb-2" onClick={(e) => e.stopPropagation()}>
        <Link href="/" className="text-lg font-bold text-white drop-shadow-lg">
          ScienceTok
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/search" className="p-2">
            <svg className="h-6 w-6 text-white drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="absolute bottom-0 left-0 right-0 z-30 flex items-center justify-around py-2 pb-[env(safe-area-inset-bottom,8px)] bg-gradient-to-t from-black/80 to-transparent" onClick={(e) => e.stopPropagation()}>
        <Link href="/" className="flex flex-col items-center gap-0.5 px-4 py-1">
          <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
          <span className="text-[10px] text-white font-medium">Glowna</span>
        </Link>
        <Link href="/search" className="flex flex-col items-center gap-0.5 px-4 py-1">
          <svg className="h-6 w-6 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <span className="text-[10px] text-white/60 font-medium">Szukaj</span>
        </Link>
        <Link href="/upload" className="flex flex-col items-center gap-0.5 px-4 py-1">
          <div className="flex h-8 w-12 items-center justify-center rounded-lg bg-[#5E6AD2]">
            <Plus className="h-5 w-5 text-white" />
          </div>
        </Link>
        <Link href={user ? '/profile/me' : '/login'} className="flex flex-col items-center gap-0.5 px-4 py-1">
          <svg className="h-6 w-6 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
          <span className="text-[10px] text-white/60 font-medium">Profil</span>
        </Link>
      </div>

      {/* Comments panel - slides up from bottom, video keeps playing */}
      {showComments && (
        <div
          className="absolute inset-x-0 bottom-0 z-40 flex flex-col bg-[#0a0a0c]/95 backdrop-blur-lg rounded-t-2xl max-h-[60vh] animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
            <h3 className="text-white font-semibold text-sm">
              Komentarze ({commentCount})
            </h3>
            <button onClick={toggleComments} className="p-1 rounded-full hover:bg-white/10">
              <X className="h-5 w-5 text-white/70" />
            </button>
          </div>

          {/* Comments list */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
            {loadingComments ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
              </div>
            ) : comments.length === 0 ? (
              <p className="text-center text-sm text-white/50 py-8">Brak komentarzy. Badz pierwszy!</p>
            ) : (
              comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onReply={handleReply}
                  onLikeChange={handleCommentLikeChange}
                />
              ))
            )}
          </div>

          {/* Comment form */}
          <div className="shrink-0 border-t border-white/10 px-4 py-3 pb-[env(safe-area-inset-bottom,12px)]">
            <CommentForm videoId={video.id} onSubmit={handleCommentSubmit} />
          </div>
        </div>
      )}

      <LoginPromptModal
        open={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        title="Zaloguj się, aby polubić film"
        description="Polubienia i inne interakcje zapisujemy tylko dla zalogowanych użytkowników."
      />
    </div>
  )
}
