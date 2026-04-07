'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="mx-auto w-full max-w-sm space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Zaloguj się</h1>
        <p className="text-muted-foreground text-sm">
          Wpisz swoje dane, aby się zalogować
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jan@example.com"
            required
            className="w-full rounded-xl border border-white/8 bg-[#0a0a0c] px-3 py-2 text-sm text-[#EDEDEF] placeholder:text-[#8A8F98] focus:border-[#5E6AD2] focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] transition-colors"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">Hasło</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-xl border border-white/8 bg-[#0a0a0c] px-3 py-2 text-sm text-[#EDEDEF] placeholder:text-[#8A8F98] focus:border-[#5E6AD2] focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] transition-colors"
          />
        </div>
        {error && (
          <p className="text-destructive text-sm">{error}</p>
        )}
        <Button type="submit" className="w-full bg-[#5E6AD2] hover:bg-[#4F5BC0] text-white transition-colors" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Zaloguj się
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Nie masz konta?{' '}
        <Link href="/register" className="text-primary underline">
          Zarejestruj się
        </Link>
      </p>
    </div>
  )
}
