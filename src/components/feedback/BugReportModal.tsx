'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePathname } from 'next/navigation'
import { AlertCircle, Bug, ImagePlus, Loader2, Send, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BugReportModalProps {
  open: boolean
  onClose: () => void
}

const MAX_SCREENSHOT_SIZE_MB = 5

export function BugReportModal({ open, onClose }: BugReportModalProps) {
  const pathname = usePathname()
  const [message, setMessage] = useState('')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!open) {
      setMessage('')
      setScreenshot(null)
      setSubmitting(false)
      setError(null)
      setSuccess(false)
    }
  }, [open])

  const screenshotPreviewUrl = useMemo(() => {
    if (!screenshot) return null
    return URL.createObjectURL(screenshot)
  }, [screenshot])

  useEffect(() => {
    return () => {
      if (screenshotPreviewUrl) {
        URL.revokeObjectURL(screenshotPreviewUrl)
      }
    }
  }, [screenshotPreviewUrl])

  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (!open || !mounted) return null

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!message.trim() || submitting) return

    setSubmitting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.set('message', message.trim())
      formData.set('pagePath', pathname)
      if (screenshot) {
        formData.set('screenshot', screenshot)
      }

      const response = await fetch('/api/bug-reports', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Nie udało się wysłać zgłoszenia.')
      }

      setSuccess(true)
      setMessage('')
      setScreenshot(null)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Nie udało się wysłać zgłoszenia.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleScreenshotChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Możesz dodać tylko obraz jako screenshot.')
      return
    }

    if (file.size > MAX_SCREENSHOT_SIZE_MB * 1024 * 1024) {
      setError(`Screenshot może mieć maksymalnie ${MAX_SCREENSHOT_SIZE_MB} MB.`)
      return
    }

    setError(null)
    setScreenshot(file)
  }

  return createPortal(
    <div
      className="fixed inset-0 z-modal flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm md:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl border border-white/10 bg-card p-6 shadow-2xl shadow-black/40"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              ScienceTok
            </p>
            <h2 className="mt-2 text-xl font-bold text-white">Zgłoś błąd</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Opisz, co nie działa. Jeśli chcesz, dodaj screenshot, a zgłoszenie trafi od razu do admina.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Zamknij zgłoszenie błędu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {success ? (
          <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-emerald-500/20 p-2 text-emerald-300">
                <Bug className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium text-white">Zgłoszenie wysłane</p>
                <p className="mt-1 text-sm text-subtle">
                  Dzięki. Admin zobaczy to w panelu zgłoszeń razem z adresem strony i screenshotem.
                </p>
              </div>
            </div>
            <Button
              type="button"
              className="mt-4 w-full bg-primary text-white hover:bg-primary-hover"
              onClick={onClose}
            >
              Zamknij
            </Button>
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="bug-report-message" className="text-sm font-medium text-white">
                Co się zepsuło?
              </label>
              <textarea
                id="bug-report-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Np. po kliknięciu komentarzy aplikacja się rozjeżdża albo przycisk nic nie robi."
                rows={5}
                className="w-full rounded-2xl border border-white/10 bg-background px-4 py-3 text-base text-white placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary md:text-sm"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <p>
                  Aktualna strona: <span className="text-subtle">{pathname}</span>
                </p>
                {message.trim().length > 0 && message.trim().length < 10 && (
                  <p className="text-amber-400">
                    Jeszcze {10 - message.trim().length} znaków
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Screenshot <span className="text-muted-foreground">(opcjonalnie)</span></label>
              <label className="flex cursor-pointer flex-col gap-3 rounded-2xl border border-dashed border-white/10 bg-background p-4 transition-colors hover:border-white/20 hover:bg-white/[0.03]">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary-light">
                    <ImagePlus className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Dodaj zrzut ekranu</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG lub WebP do {MAX_SCREENSHOT_SIZE_MB} MB</p>
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleScreenshotChange}
                />
                {screenshot && screenshotPreviewUrl && (
                  <div className="overflow-hidden rounded-2xl border border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={screenshotPreviewUrl} alt="Podgląd screena" className="h-40 w-full object-cover" />
                    <div className="flex items-center justify-between bg-black/30 px-3 py-2 text-xs text-subtle">
                      <span className="truncate">{screenshot.name}</span>
                      <button
                        type="button"
                        className="rounded-full px-2 py-1 text-muted-foreground transition-colors hover:bg-white/5 hover:text-white"
                        onClick={(event) => {
                          event.preventDefault()
                          setScreenshot(null)
                        }}
                      >
                        Usuń
                      </button>
                    </div>
                  </div>
                )}
              </label>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10"
                onClick={onClose}
              >
                Anuluj
              </Button>
              <Button
                type="submit"
                className="w-full bg-primary text-white hover:bg-primary-hover"
                disabled={submitting || message.trim().length < 10}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Wyślij zgłoszenie
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  )
}
