import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function MyProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  if (error || !profile?.username) {
    notFound()
  }

  redirect(`/profile/${profile.username}`)
}
