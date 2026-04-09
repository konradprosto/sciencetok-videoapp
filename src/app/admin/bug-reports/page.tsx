import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin'
import { BugReportsPage } from '@/components/admin/BugReportsPage'

export default async function AdminBugReportsRoute() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  if (!isAdminEmail(user.email)) {
    redirect('/')
  }

  return <BugReportsPage />
}
