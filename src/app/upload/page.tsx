import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { VideoUploadForm } from '@/components/video/VideoUploadForm'

export default async function UploadPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="px-4 py-10 md:py-16">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">Dodaj nowy film</h1>
          <p className="mt-2 text-sm text-[#8A8F98]">
            Prześlij film, aby podzielić się nim ze światem
          </p>
        </div>
        <VideoUploadForm />
      </div>
    </div>
  )
}
