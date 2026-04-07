export type VideoStatus = 'processing' | 'ready' | 'error'

export interface Video {
  id: string
  user_id: string
  title: string
  description: string | null
  mux_asset_id: string | null
  mux_upload_id: string | null
  mux_playback_id: string | null
  status: VideoStatus
  duration: number | null
  thumbnail_url: string | null
  view_count: number
  like_count: number
  created_at: string
  // Joined fields
  profiles?: {
    username: string
    display_name: string | null
    avatar_url: string | null
  }
  user_has_liked?: boolean
  comment_count?: number
}

export interface VideoFeedResponse {
  videos: Video[]
  nextCursor: string | null
}
