'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useVideoUpload } from '@/hooks/useVideoUpload'
import { Button } from '@/components/ui/button'
import { Upload, CheckCircle, AlertCircle, Film, Loader2, X } from 'lucide-react'

export function VideoUploadForm() {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { progress, uploading, error, videoId, upload, reset } = useVideoUpload()

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped?.type.startsWith('video/')) {
      setFile(dropped)
      if (!title) setTitle(dropped.name.replace(/\.[^/.]+$/, ''))
    }
  }, [title])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
      if (!title) setTitle(selected.name.replace(/\.[^/.]+$/, ''))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !title.trim()) return
    const id = await upload(file, title, description)
    if (id) {
      setTimeout(() => router.push(`/video/${id}`), 2000)
    }
  }

  if (videoId) {
    return (
      <div className="mx-auto max-w-lg space-y-6 text-center">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/8 bg-[#0a0a0c] p-10">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle className="h-8 w-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-semibold">Film przesłany!</h2>
          <p className="text-sm text-[#8A8F98]">
            Twój film jest przetwarzany. Przekierowanie nastąpi automatycznie...
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-6">
      {/* Dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-200
          ${dragOver
            ? 'border-[#5E6AD2] bg-[#5E6AD2]/5'
            : file
              ? 'border-emerald-500/30 bg-emerald-500/5'
              : 'border-white/10 bg-[#0a0a0c] hover:border-white/20 hover:bg-[#0a0a0c]/80'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        {file ? (
          <div className="flex flex-col items-center gap-3">
            <Film className="h-10 w-10 text-emerald-400" />
            <div>
              <p className="font-medium">{file.name}</p>
              <p className="text-xs text-[#8A8F98]">
                {(file.size / (1024 * 1024)).toFixed(1)} MB
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setFile(null) }}
              className="text-xs text-[#8A8F98] hover:text-white transition-colors"
            >
              Zmień plik
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#5E6AD2]/10">
              <Upload className="h-6 w-6 text-[#5E6AD2]" />
            </div>
            <div>
              <p className="font-medium">Przeciągnij film tutaj</p>
              <p className="text-xs text-[#8A8F98]">lub kliknij, aby wybrać plik</p>
            </div>
          </div>
        )}
      </div>

      {/* Title */}
      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium">Tytuł</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nadaj tytuł swojemu filmowi"
          required
          className="w-full rounded-xl border border-white/8 bg-[#0a0a0c] px-4 py-3 text-sm placeholder:text-[#8A8F98]/50 focus:border-[#5E6AD2] focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] transition-colors"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label htmlFor="desc" className="text-sm font-medium">Opis <span className="text-[#8A8F98]">(opcjonalny)</span></label>
        <textarea
          id="desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="O czym jest ten film?"
          rows={3}
          className="w-full rounded-xl border border-white/8 bg-[#0a0a0c] px-4 py-3 text-sm placeholder:text-[#8A8F98]/50 focus:border-[#5E6AD2] focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] transition-colors resize-none"
        />
      </div>

      {/* Progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-[#8A8F98]">
            <span>{progress >= 100 ? 'Przetwarzanie wideo...' : 'Przesyłanie...'}</span>
            <span>{progress >= 100 ? '' : `${progress}%`}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#5E6AD2] to-[#7C85E0] transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        disabled={!file || !title.trim() || uploading}
        className="w-full h-11 rounded-xl bg-[#5E6AD2] text-white hover:bg-[#4F5BC0] disabled:opacity-40 transition-colors"
      >
        {uploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Przesyłanie...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Prześlij film
          </>
        )}
      </Button>
    </form>
  )
}
