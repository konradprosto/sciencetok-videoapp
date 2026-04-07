export interface Comment {
  id: string
  video_id: string
  user_id: string
  parent_id: string | null
  content: string
  created_at: string
  profiles?: {
    username: string
    display_name: string | null
    avatar_url: string | null
  }
  replies?: Comment[]
}
