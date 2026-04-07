import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileVideoTile } from '@/components/video/ProfileVideoTile'
import { Film, Calendar } from 'lucide-react'

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (error || !profile) {
    notFound()
  }

  const { data: videos } = await supabase
    .from('videos')
    .select('*, profiles!videos_user_id_fkey(username, display_name, avatar_url)')
    .eq('user_id', profile.id)
    .eq('status', 'ready')
    .order('created_at', { ascending: false })
    .limit(50)

  const { count: videoCount } = await supabase
    .from('videos')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', profile.id)
    .eq('status', 'ready')

  const joinDate = new Date(profile.created_at).toLocaleDateString('pl-PL', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="px-4 py-6 md:px-6 md:py-10">
      {/* Profile header */}
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col items-center gap-6 rounded-2xl border border-white/5 bg-[#0a0a0c] p-8 md:flex-row md:items-start md:p-10">
          {/* Avatar */}
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#5E6AD2] to-[#7C85E0] text-3xl font-bold text-white shadow-lg shadow-[#5E6AD2]/20">
            {profile.display_name?.[0]?.toUpperCase() || profile.username?.[0]?.toUpperCase() || '?'}
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold">
              {profile.display_name || profile.username}
            </h1>
            <p className="text-sm text-[#8A8F98]">@{profile.username}</p>

            {profile.bio && (
              <p className="mt-3 text-sm text-[#EDEDEF]/70 max-w-lg">{profile.bio}</p>
            )}

            <div className="mt-4 flex items-center justify-center gap-6 md:justify-start">
              <div className="text-center">
                <p className="text-lg font-semibold">{videoCount || 0}</p>
                <p className="text-xs text-[#8A8F98]">Filmów</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#8A8F98]">
                <Calendar className="h-3.5 w-3.5" />
                Dołączył(a) {joinDate}
              </div>
            </div>
          </div>
        </div>

        {/* Videos */}
        <div className="mt-8">
          <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold">
            <Film className="h-5 w-5 text-[#5E6AD2]" />
            Filmy
          </h2>
          {videos && videos.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 md:gap-3">
              {videos.map((video) => (
                <ProfileVideoTile key={video.id} video={video} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-[#8A8F98]">Ten użytkownik nie ma jeszcze żadnych filmów</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
