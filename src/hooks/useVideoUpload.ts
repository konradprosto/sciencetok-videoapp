'use client'

import { useState, useCallback } from 'react'

interface UploadState {
  progress: number
  uploading: boolean
  error: string | null
  videoId: string | null
}

export function useVideoUpload() {
  const [state, setState] = useState<UploadState>({
    progress: 0,
    uploading: false,
    error: null,
    videoId: null,
  })

  const upload = useCallback(async (file: File, title: string, description: string) => {
    setState({ progress: 0, uploading: true, error: null, videoId: null })

    try {
      // 1. Get upload URL from our API
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create upload')
      }

      const { uploadUrl, videoId } = await res.json()

      // 2. Upload file directly to Mux with progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('PUT', uploadUrl)

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100)
            setState(prev => ({ ...prev, progress }))
          }
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve()
          } else {
            reject(new Error('Upload failed'))
          }
        }

        xhr.onerror = () => reject(new Error('Upload failed'))
        xhr.send(file)
      })

      // 3. Poll for processing completion
      setState(prev => ({ ...prev, progress: 100, videoId }))
      for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 3000))
        try {
          const statusRes = await fetch(`/api/videos/${videoId}/status`)
          const statusData = await statusRes.json()
          if (statusData.status === 'ready') {
            setState(prev => ({ ...prev, uploading: false }))
            return videoId
          }
          if (statusData.status === 'error') {
            throw new Error('Video processing failed')
          }
        } catch {}
      }
      setState(prev => ({ ...prev, uploading: false }))
      return videoId
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      setState(prev => ({ ...prev, uploading: false, error: message }))
      return null
    }
  }, [])

  const reset = useCallback(() => {
    setState({ progress: 0, uploading: false, error: null, videoId: null })
  }, [])

  return { ...state, upload, reset }
}
