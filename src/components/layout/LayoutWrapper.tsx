'use client'

import { usePathname } from 'next/navigation'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isFullscreen = pathname === '/'

  if (isFullscreen) {
    return <>{children}</>
  }

  return (
    <>
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
      </div>
      <MobileNav />
    </>
  )
}
