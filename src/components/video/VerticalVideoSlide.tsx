'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import MuxPlayer from '@mux/mux-player-react'
import type MuxPlayerElement from '@mux/mux-player'
import type { Video } from '@/types/video'
import type { Comment } from '@/types/comment'
import Link from 'next/link'
import { Heart, MessageCircle, Share2, Play, Volume2, VolumeX, X, Bell, Home, Search, Upload, User as UserIcon } from 'lucide-react'
import { CommentForm } from '@/components/comments/CommentForm'
import { CommentItem } from '@/components/comments/CommentItem'
import { useAuth } from '@/components/auth/AuthProvider'
import { LoginPromptModal } from '@/components/auth/LoginPromptModal'
import { countComments, insertCommentIntoTree, updateCommentInTree } from '@/lib/comments'
import { cn } from '@/lib/utils'

interface VerticalVideoSlideProps {
  video: Video
  index: number
  isActive: boolean
  globalMuted: boolean
  onMutedChange: (muted: boolean) => void
}

export function VerticalVideoSlide({ video, index, isActive, globalMuted, onMutedChange }: VerticalVideoSlideProps) {
  const playerRef = useRef<MuxPlayerElement | null>(null)
  const { user, isAdmin } = useAuth()
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(video.like_count || 0)
  const [paused, setPaused] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentCount, setCommentCount] = useState(video.comment_count || 0)
  const [replyTarget, setReplyTarget] = useState<Comment | null>(null)

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

  const closeComments = useCallback(() => {
    setShowComments(false)
    setReplyTarget(null)
  }, [])

  const toggleComments = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!showComments) {
      loadComments()
    }
    setShowComments((current) => {
      if (current) {
        setReplyTarget(null)
      }
      return !current
    })
  }

  const handleCommentSubmit = (comment: Comment) => {
    setComments(prev => insertCommentIntoTree(prev, comment))
    setCommentCount(prev => prev + 1)
  }

  const handleReply = (comment: Comment) => {
    setComments(prev => insertCommentIntoTree(prev, comment))
    setCommentCount(prev => prev + 1)
    setReplyTarget(null)
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
      <div
        className={cn(
          'relative h-full w-full overflow-hidden bg-black transition-[transform,border-radius,box-shadow] duration-300 ease-out',
          showComments && 'origin-top scale-[0.84] -translate-y-[26%] rounded-[28px] shadow-[0_24px_80px_rgba(0,0,0,0.45)]'
        )}
      >
        {/* Video Player */}
        {video.mux_playback_id ? (
          <MuxPlayer
            ref={playerRef}
            playbackId={video.mux_playback_id}
            streamType="on-demand"
            autoPlay={isActive}
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
        <div
          className={cn(
            'absolute right-3 bottom-32 flex flex-col items-center gap-5 z-20 transition-all duration-200',
            showComments && 'pointer-events-none translate-x-6 opacity-0'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Avatar */}
          <Link href={`/profile/${video.profiles?.username}`} className="mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#5E6AD2] text-white text-lg font-bold ring-2 ring-white shadow-lg">
              {video.profiles?.display_name?.[0]?.toUpperCase() || video.profiles?.username?.[0]?.toUpperCase() || '?'}
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
        <div
          className={cn(
            'absolute bottom-[calc(env(safe-area-inset-bottom,0px)+5.75rem)] left-4 right-20 z-20 pointer-events-none transition-all duration-200',
            showComments && 'pointer-events-none translate-y-4 opacity-0'
          )}
        >
          <Link href={`/profile/${video.profiles?.username}`} className="pointer-events-auto">
            <p className="font-bold text-white text-base drop-shadow-lg">
              @{video.profiles?.username}
            </p>
          </Link>
          <h3 className="mt-2 text-sm text-white font-medium drop-shadow-lg line-clamp-2">
            {video.title}
          </h3>
          {video.description && (
            <p className="mt-2 text-xs text-white/70 line-clamp-2 drop-shadow-lg">
              {video.description}
            </p>
          )}
        </div>

        {/* Top navigation overlay */}
        <div
          className={cn(
            'absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 pt-[env(safe-area-inset-top,12px)] pb-2 transition-all duration-200',
            showComments && 'pointer-events-none -translate-y-3 opacity-0'
          )}
          onClick={(e) => e.stopPropagation()}
        >
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
        <div
          className={cn(
            'absolute bottom-0 left-0 right-0 z-30 flex items-center justify-around py-2 pb-[env(safe-area-inset-bottom,8px)] bg-gradient-to-t from-black/80 to-transparent transition-all duration-200',
            showComments && 'pointer-events-none translate-y-4 opacity-0'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <Link href="/" className="flex flex-col items-center gap-0.5 px-4 py-1">
            <Home className="h-6 w-6 text-white" />
            <span className="text-[10px] text-white font-medium">Glowna</span>
          </Link>
          <Link href="/search" className="flex flex-col items-center gap-0.5 px-4 py-1">
            <Search className="h-6 w-6 text-white/60" />
            <span className="text-[10px] text-white/60 font-medium">Szukaj</span>
          </Link>
          <Link href={user ? '/notifications' : '/login'} className="flex flex-col items-center gap-0.5 px-4 py-1">
            <Bell className="h-6 w-6 text-white/60" />
            <span className="text-[10px] text-white/60 font-medium">Powiad.</span>
          </Link>
          {isAdmin && (
            <Link href="/upload" className="flex flex-col items-center gap-0.5 px-4 py-1">
              <Upload className="h-6 w-6 text-white/60" />
              <span className="text-[10px] text-white/60 font-medium">Dodaj</span>
            </Link>
          )}
          <Link href={user ? '/profile/me' : '/login'} className="flex flex-col items-center gap-0.5 px-4 py-1">
            <UserIcon className="h-6 w-6 text-white/60" />
            <span className="text-[10px] text-white/60 font-medium">Profil</span>
          </Link>
        </div>
      </div>

      <button
        type="button"
        aria-label="Zamknij komentarze"
        onClick={(e) => {
          e.stopPropagation()
          closeComments()
        }}
        className={cn(
          'absolute inset-0 z-30 bg-black/0 transition-colors duration-300',
          showComments ? 'pointer-events-auto bg-black/35' : 'pointer-events-none'
        )}
      />

      {/* Comments panel - anchored bottom sheet with video preserved above */}
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 z-40 flex h-[54dvh] min-h-[24rem] max-h-[54dvh] flex-col rounded-t-[28px] border-t border-white/10 bg-[#0a0a0c]/96 backdrop-blur-xl transition-transform duration-300 ease-out sm:h-[56dvh] sm:max-h-[56dvh]',
          showComments ? 'translate-y-0' : 'translate-y-full pointer-events-none'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 px-4 pt-2">
          <div className="mx-auto h-1.5 w-12 rounded-full bg-white/10" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
          <h3 className="text-white font-semibold text-sm">
            Komentarze ({commentCount})
          </h3>
          <button onClick={(e) => {
            e.stopPropagation()
            closeComments()
          }} className="p-1 rounded-full hover:bg-white/10">
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
                onReplyRequest={setReplyTarget}
                onLikeChange={handleCommentLikeChange}
              />
            ))
          )}
        </div>

        {/* Comment form */}
        <div className="shrink-0 border-t border-white/10 px-4 py-3 pb-[env(safe-area-inset-bottom,12px)]">
          <CommentForm
            videoId={video.id}
            parentId={replyTarget?.id}
            replyLabel={replyTarget?.profiles?.username || replyTarget?.profiles?.display_name || null}
            onClearReply={() => setReplyTarget(null)}
            onSubmit={replyTarget ? handleReply : handleCommentSubmit}
          />
        </div>
      </div>

      <LoginPromptModal
        open={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        title="Zaloguj się, aby polubić film"
        description="Polubienia i inne interakcje zapisujemy tylko dla zalogowanych użytkowników."
      />
    </div>
  )
}
