import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NotificationsPage } from '@/components/notifications/NotificationsPage'

export default async function NotificationsRoute() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <NotificationsPage />
}
