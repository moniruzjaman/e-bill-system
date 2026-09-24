'use client'

import Link from 'next/link'
import {
  ArrowLeft,
  Download,
  ExternalLink,
  Heart,
  Link2,
  List,
  Maximize,
  Minimize,
  Printer,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ReportMeta } from '@/lib/reports'

interface ReportToolbarProps {
  report: ReportMeta
  isFavorite: boolean
  isFullscreen: boolean
  tocOpen: boolean
  onToggleFavorite: () => void
  onToggleFullscreen: () => void
  onToggleToc: () => void
  onPrint: () => void
  onDownload: () => void
  onCopyLink: () => void
}

export function ReportToolbar({
  report,
  isFavorite,
  isFullscreen,
  tocOpen,
  onToggleFavorite,
  onToggleFullscreen,
  onToggleToc,
  onPrint,
  onDownload,
  onCopyLink,
}: ReportToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#006A4E]/15 bg-white px-3 py-2 sm:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <Button variant="ghost" size="sm" asChild className="min-h-11">
          <Link href="/" aria-label="Back to all reports">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Link>
        </Button>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[#004230]">{report.title}</p>
          <p className="truncate text-xs text-[#006A4E]">
            {report.typeLabel} · {report.language}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1">
        <ToolbarBtn
          label={tocOpen ? 'Hide contents' : 'Show contents'}
          onClick={onToggleToc}
          pressed={tocOpen}
        >
          <List className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn label={isFavorite ? 'Remove favorite' : 'Add favorite'} onClick={onToggleFavorite}>
          <Heart className={cn('h-4 w-4', isFavorite && 'fill-[#F42A41] text-[#F42A41]')} />
        </ToolbarBtn>
        <ToolbarBtn label="Print report" onClick={onPrint}>
          <Printer className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn label="Download HTML" onClick={onDownload}>
          <Download className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn label="Copy link" onClick={onCopyLink}>
          <Link2 className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          onClick={onToggleFullscreen}
        >
          {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </ToolbarBtn>
        <Button variant="outline" size="sm" asChild className="min-h-11">
          <a href={`/report/${report.file}`} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
            <span className="hidden sm:inline">Original</span>
          </a>
        </Button>
      </div>
    </div>
  )
}

function ToolbarBtn({
  label,
  onClick,
  pressed,
  children,
}: {
  label: string
  onClick: () => void
  pressed?: boolean
  children: React.ReactNode
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn('min-h-11 min-w-11', pressed && 'bg-[#e9f4f0] text-[#006A4E]')}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      onClick={onClick}
    >
      {children}
    </Button>
  )
}
