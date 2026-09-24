'use client'

import Link from 'next/link'
import {
  ArrowLeft,
  BookOpen,
  Check,
  Download,
  ExternalLink,
  Heart,
  Languages,
  Link2,
  List,
  Loader2,
  Maximize,
  Minimize,
  Printer,
  RotateCcw,
  Share2,
  Volume2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { LANGUAGES, languageLabel } from '@/lib/report-translate'
import type { ReportMeta } from '@/lib/reports'

export interface TranslateState {
  lang: string | null
  busy: { done: number; total: number } | null
  onPick: (code: string) => void
  onReset: () => void
}

export interface SpeechToolbarState {
  active: boolean
  paused: boolean
  onToggle: () => void
}

interface ReportToolbarProps {
  report: ReportMeta
  isFavorite: boolean
  isFullscreen: boolean
  tocOpen: boolean
  readingOn: boolean
  translate: TranslateState
  speech: SpeechToolbarState
  onToggleFavorite: () => void
  onToggleFullscreen: () => void
  onToggleToc: () => void
  onToggleReading: () => void
  onPrint: () => void
  onDownload: () => void
  onCopyLink: () => void
  onShare: () => void
}

export function ReportToolbar({
  report,
  isFavorite,
  isFullscreen,
  tocOpen,
  readingOn,
  translate,
  speech,
  onToggleFavorite,
  onToggleFullscreen,
  onToggleToc,
  onToggleReading,
  onPrint,
  onDownload,
  onCopyLink,
  onShare,
}: ReportToolbarProps) {
  const translating = translate.busy !== null

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
        {/* Translate */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={translating}
              aria-label={translate.lang ? `Translation: ${languageLabel(translate.lang)}` : 'Translate report'}
              title={translate.lang ? `Translating shown: ${languageLabel(translate.lang)}` : 'Translate report'}
              className={cn(
                'min-h-11 min-w-11',
                translate.lang && 'bg-[#e9f4f0] text-[#006A4E]'
              )}
            >
              {translating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Languages className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
            <DropdownMenuLabel>Translate report</DropdownMenuLabel>
            {translate.busy && (
              <DropdownMenuItem disabled className="text-xs text-[#006A4E]">
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Translating… {translate.busy.done}/{translate.busy.total || '…'}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {LANGUAGES.map((l) => (
              <DropdownMenuItem
                key={l.code}
                onClick={() => translate.onPick(l.code)}
                className={cn(translate.lang === l.code && 'bg-[#e9f4f0] font-semibold')}
              >
                {translate.lang === l.code ? (
                  <Check className="mr-2 h-4 w-4 text-[#006A4E]" />
                ) : (
                  <Languages className="mr-2 h-4 w-4 opacity-40" />
                )}
                {l.label}
              </DropdownMenuItem>
            ))}
            {translate.lang && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={translate.onReset}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Show original
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <ToolbarBtn label={readingOn ? 'Exit reading view' : 'Reading view'} onClick={onToggleReading} pressed={readingOn}>
          <BookOpen className="h-4 w-4" />
        </ToolbarBtn>

        <ToolbarBtn
          label={speech.active ? 'Stop reading aloud' : 'Read report aloud'}
          onClick={speech.onToggle}
          pressed={speech.active}
        >
          <Volume2 className={cn('h-4 w-4', speech.active && !speech.paused && 'animate-pulse')} />
        </ToolbarBtn>

        <ToolbarBtn label="Share report" onClick={onShare}>
          <Share2 className="h-4 w-4" />
        </ToolbarBtn>

        <ToolbarBtn label={tocOpen ? 'Hide contents' : 'Show contents'} onClick={onToggleToc} pressed={tocOpen}>
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
