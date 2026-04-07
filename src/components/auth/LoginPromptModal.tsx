'use client'

import Link from 'next/link'
import { X, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LoginPromptModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
}

export function LoginPromptModal({
  open,
  onClose,
  title = 'Zaloguj się, aby kontynuować',
  description = 'Ta akcja wymaga konta. Po zalogowaniu wrócisz do przeglądania ScienceTok.'
}: LoginPromptModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm md:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0a0c] p-6 shadow-2xl shadow-black/40"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5E6AD2]">
              ScienceTok
            </p>
            <h2 className="mt-2 text-xl font-bold text-white">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-[#8A8F98]">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[#8A8F98] transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Zamknij modal logowania"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/login" className="flex-1" onClick={onClose}>
            <Button className="w-full bg-[#5E6AD2] text-white hover:bg-[#4F5BC0]">
              <LogIn className="h-4 w-4" />
              Zaloguj się
            </Button>
          </Link>
          <Link href="/register" className="flex-1" onClick={onClose}>
            <Button variant="outline" className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10">
              Załóż konto
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
