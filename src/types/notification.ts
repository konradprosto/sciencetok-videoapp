export type NotificationType = 'comment_reply' | 'comment_like'

export interface Notification {
  id: string
  type: NotificationType
  created_at: string
  read_at: string | null
  comment_id: string
  video_id: string
  actor?: {
    username: string
    display_name: string | null
    avatar_url: string | null
  } | null
  comments?: {
    content: string
  } | null
  videos?: {
    title: string
  } | null
}
