export type BugReportStatus = 'open' | 'in_review' | 'closed'

export interface BugReport {
  id: string
  reporter_id: string
  reporter_email: string
  reporter_username: string | null
  message: string
  page_path: string | null
  screenshot_path: string | null
  screenshot_url?: string | null
  user_agent: string | null
  status: BugReportStatus
  created_at: string
  updated_at: string
}
