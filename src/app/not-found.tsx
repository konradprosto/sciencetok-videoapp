import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <h2 className="text-xl font-semibold">404 — Nie znaleziono</h2>
      <p className="text-muted-foreground text-sm">
        Strona, której szukasz, nie istnieje.
      </p>
      <Link href="/" className={buttonVariants({ variant: 'outline' })}>
        Wróć na stronę główną
      </Link>
    </div>
  )
}
