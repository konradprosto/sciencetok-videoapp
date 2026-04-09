import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/admin'
import type { BugReportStatus } from '@/types/bug-report'

const MAX_SCREENSHOT_SIZE_BYTES = 5 * 1024 * 1024

function sanitizeFileName(fileName: string) {
  return fileName.toLowerCase().replace(/[^a-z0-9.-]+/g, '-')
}

export async function GET() {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await admin
    .from('bug_reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const reports = await Promise.all((data || []).map(async (report) => {
    if (!report.screenshot_path) {
      return { ...report, screenshot_url: null }
    }

    const { data: signed, error: signedError } = await admin.storage
      .from('bug-reports')
      .createSignedUrl(report.screenshot_path, 60 * 60)

    return {
      ...report,
      screenshot_url: signedError ? null : signed?.signedUrl ?? null,
    }
  }))

  return NextResponse.json(reports)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const message = formData.get('message')
  const pagePath = formData.get('pagePath')
  const screenshot = formData.get('screenshot')
  const userAgent = request.headers.get('user-agent')

  if (typeof message !== 'string' || message.trim().length < 10) {
    return NextResponse.json({ error: 'Opisz problem w minimum 10 znakach.' }, { status: 400 })
  }

  let screenshotPath: string | null = null

  if (screenshot instanceof File && screenshot.size > 0) {
    if (!screenshot.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Screenshot musi być obrazem.' }, { status: 400 })
    }

    if (screenshot.size > MAX_SCREENSHOT_SIZE_BYTES) {
      return NextResponse.json({ error: 'Screenshot może mieć maksymalnie 5 MB.' }, { status: 400 })
    }

    const fileExt = screenshot.name.split('.').pop() || 'png'
    screenshotPath = `${user.id}/${crypto.randomUUID()}-${sanitizeFileName(screenshot.name || `screenshot.${fileExt}`)}`
    const arrayBuffer = await screenshot.arrayBuffer()

    const { error: uploadError } = await admin.storage
      .from('bug-reports')
      .upload(screenshotPath, arrayBuffer, {
        contentType: screenshot.type,
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }
  }

  const { error } = await admin
    .from('bug_reports')
    .insert({
      reporter_id: user.id,
      reporter_email: user.email,
      reporter_username: user.user_metadata?.username ?? null,
      message: message.trim(),
      page_path: typeof pagePath === 'string' ? pagePath : null,
      screenshot_path: screenshotPath,
      user_agent: userAgent,
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { reportId, status } = await request.json().catch(() => ({}))
  const allowedStatuses: BugReportStatus[] = ['open', 'in_review', 'closed']

  if (typeof reportId !== 'string' || !allowedStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const { error } = await admin
    .from('bug_reports')
    .update({ status })
    .eq('id', reportId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
