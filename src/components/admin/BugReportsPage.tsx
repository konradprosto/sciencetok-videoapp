'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bug, CheckCircle2, Clock3, ExternalLink, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { BugReport, BugReportStatus } from '@/types/bug-report'

const STATUS_META: Record<BugReportStatus, { label: string; tone: string; icon: typeof Clock3 }> = {
  open: {
    label: 'Nowe',
    tone: 'border-amber-500/20 bg-amber-500/10 text-amber-200',
    icon: Bug,
  },
  in_review: {
    label: 'W trakcie',
    tone: 'border-[#5E6AD2]/20 bg-[#5E6AD2]/10 text-[#C7CCFF]',
    icon: Clock3,
  },
  closed: {
    label: 'Zamknięte',
    tone: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200',
    icon: CheckCircle2,
  },
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'przed chwilą'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min temu`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} godz. temu`
  return `${Math.floor(seconds / 86400)} dni temu`
}

export function BugReportsPage() {
  const [reports, setReports] = useState<BugReport[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const response = await fetch('/api/bug-reports')
      if (!response.ok || cancelled) {
        setLoading(false)
        return
      }

      const data = await response.json()
      if (!cancelled) {
        setReports(Array.isArray(data) ? data : [])
        setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const openCount = useMemo(() => reports.filter((report) => report.status !== 'closed').length, [reports])

  const updateStatus = async (reportId: string, status: BugReportStatus) => {
    setUpdatingId(reportId)
    try {
      const response = await fetch('/api/bug-reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, status }),
      })

      if (!response.ok) return

      setReports((current) => current.map((report) => (
        report.id === reportId ? { ...report, status } : report
      )))
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Zgłoszenia błędów</h1>
          <p className="mt-2 text-sm text-[#8A8F98]">
            Minimalny inbox do łapania bugów od użytkowników, razem ze screenshotami i kontekstem strony.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-right">
          <p className="text-xs uppercase tracking-[0.2em] text-[#8A8F98]">Otwarte</p>
          <p className="mt-1 text-2xl font-semibold text-white">{openCount}</p>
        </div>
      </div>

      {loading ? (
        <div className="mt-8 flex items-center justify-center rounded-3xl border border-white/10 bg-[#0a0a0c] px-6 py-12 text-[#8A8F98]">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-white/10 bg-[#0a0a0c] p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#5E6AD2]/10 text-[#C7CCFF]">
            <Bug className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm text-[#8A8F98]">Na razie nie ma żadnych zgłoszeń.</p>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {reports.map((report) => {
            const meta = STATUS_META[report.status]
            const StatusIcon = meta.icon

            return (
              <article key={report.id} className="rounded-3xl border border-white/10 bg-[#0a0a0c] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${meta.tone}`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {meta.label}
                      </span>
                      <span className="text-xs text-[#8A8F98]">{timeAgo(report.created_at)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{report.reporter_username || report.reporter_email}</p>
                      <p className="text-xs text-[#8A8F98]">{report.reporter_email}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={updatingId === report.id || report.status === 'open'}
                      className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                      onClick={() => updateStatus(report.id, 'open')}
                    >
                      Nowe
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={updatingId === report.id || report.status === 'in_review'}
                      className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                      onClick={() => updateStatus(report.id, 'in_review')}
                    >
                      W trakcie
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={updatingId === report.id || report.status === 'closed'}
                      className="bg-[#5E6AD2] text-white hover:bg-[#4F5BC0]"
                      onClick={() => updateStatus(report.id, 'closed')}
                    >
                      Zamknij
                    </Button>
                  </div>
                </div>

                <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-[#D7DAE1]">
                  {report.message}
                </p>

                <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_240px]">
                  <div className="space-y-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-sm">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-[#8A8F98]">Strona</p>
                      <p className="mt-1 text-[#D7DAE1]">{report.page_path || 'brak danych'}</p>
                    </div>
                    {report.user_agent && (
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-[#8A8F98]">Przeglądarka</p>
                        <p className="mt-1 break-words text-[#D7DAE1]">{report.user_agent}</p>
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                    {report.screenshot_url ? (
                      <a
                        href={report.screenshot_url}
                        target="_blank"
                        rel="noreferrer"
                        className="group block overflow-hidden rounded-2xl border border-white/8"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={report.screenshot_url} alt="Załączony screenshot zgłoszenia" className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
                        <div className="flex items-center justify-between px-3 py-2 text-xs text-[#C8CDD5]">
                          <span>Otwórz screenshot</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </div>
                      </a>
                    ) : (
                      <div className="flex h-full min-h-40 items-center justify-center rounded-2xl border border-dashed border-white/8 px-4 text-center text-sm text-[#8A8F98]">
                        Brak załączonego screena
                      </div>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
