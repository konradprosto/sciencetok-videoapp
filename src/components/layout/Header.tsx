import Link from 'next/link'
import { Upload, Search } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { UserMenu } from '@/components/auth/UserMenu'

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-[#050506]/95 backdrop-blur supports-[backdrop-filter]:bg-[#050506]/80 shadow-[0_1px_12px_rgba(94,106,210,0.08)]">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="bg-gradient-to-r from-[#5E6AD2] to-[#8B5CF6] bg-clip-text text-transparent">VideoApp</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/search" className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'hidden sm:flex' })}>
            <Search className="h-5 w-5" />
          </Link>
          <Link href="/upload" className={buttonVariants({ variant: 'ghost', size: 'icon' })}>
            <Upload className="h-5 w-5" />
          </Link>
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
