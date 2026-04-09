'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth/AuthProvider'
import { buttonVariants } from '@/components/ui/button'
import { User, LogOut, ChevronDown, Bug, Inbox } from 'lucide-react'
import { BugReportModal } from '@/components/feedback/BugReportModal'

export function UserMenu() {
  const { user, loading, isAdmin } = useAuth()
  const [open, setOpen] = useState(false)
  const [showBugReportModal, setShowBugReportModal] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setOpen(false)
    router.push('/')
    router.refresh()
  }

  if (loading) return <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />

  if (!user) {
    return (
      <Link href="/login" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
        Zaloguj się
      </Link>
    )
  }

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen(!open)}
          aria-label="Menu użytkownika"
          aria-expanded={open}
          className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm hover:bg-muted transition-colors press-feedback"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
            {user.email?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <ChevronDown className="h-3 w-3" />
        </button>
        {open && (
          <div className="absolute right-0 z-dropdown mt-2 w-56 rounded-md border bg-popover p-1 shadow-md">
            <Link
              href={`/profile/${user.user_metadata?.username ?? user.id}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent transition-colors"
            >
              <User className="h-4 w-4" />
              Profil
            </Link>
            {isAdmin && (
              <Link
                href="/admin/bug-reports"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent transition-colors"
              >
                <Inbox className="h-4 w-4" />
                Zgłoszenia
              </Link>
            )}
            <button
              onClick={() => {
                setOpen(false)
                setShowBugReportModal(true)
              }}
              className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent transition-colors"
            >
              <Bug className="h-4 w-4" />
              Zgłoś problem
            </button>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent transition-colors text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Wyloguj się
            </button>
          </div>
        )}
      </div>
      <BugReportModal open={showBugReportModal} onClose={() => setShowBugReportModal(false)} />
    </>
  )
}
