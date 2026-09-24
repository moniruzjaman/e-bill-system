'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, Receipt } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AppNavProps {
  actions?: React.ReactNode
}

const links = [
  {
    href: '/',
    label: 'Reports',
    icon: FileText,
    match: (p: string) => p === '/' || p.startsWith('/reports'),
  },
  {
    href: '/e-bill',
    label: 'Billing Demo',
    icon: Receipt,
    match: (p: string) => p.startsWith('/e-bill'),
  },
]

export function AppNav({ actions }: AppNavProps) {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b border-[#006A4E]/15 bg-white/90 backdrop-blur-md">
      <div className="h-1.5 w-full bg-[#F42A41]" />
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="flex items-center gap-3 min-w-0" aria-label="E-Bill home">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#006A4E] shadow-md">
                <div className="h-4 w-4 rounded-full bg-[#F42A41]" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-bold leading-tight text-[#004230]">
                  E-Bill System
                </h1>
                <p className="truncate text-[11px] font-medium tracking-wide text-[#006A4E]">
                  Invoice &amp; Policy Briefing
                </p>
              </div>
            </Link>
          </div>

          <nav className="flex items-center gap-1" aria-label="Primary">
            {links.map((link) => {
              const Icon = link.icon
              const active = link.match(pathname)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'inline-flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors duration-200',
                    active
                      ? 'bg-[#006A4E] text-white'
                      : 'text-[#004230] hover:bg-[#e9f4f0] hover:text-[#006A4E]'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{link.label}</span>
                </Link>
              )
            })}
          </nav>

          {actions ? <div className="flex items-center gap-2">{actions}</div> : <div className="w-0 sm:w-[1px]" />}
        </div>
      </div>
    </header>
  )
}
