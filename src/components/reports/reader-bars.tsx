'use client'

import { Maximize2, Minus, Moon, Pause, Play, Plus, Square, Sun, Volume2, X, Coffee } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ReaderTheme } from '@/lib/report-reading'
import type { SpeechInfo } from '@/hooks/use-report-speech'

const THEME_ORDER: ReaderTheme[] = ['sepia', 'dark', 'light']

export function ReadingBar({
  theme,
  fontSize,
  onTheme,
  onFont,
  onExit,
}: {
  theme: ReaderTheme
  fontSize: number
  onTheme: (t: ReaderTheme) => void
  onFont: (delta: 1 | -1) => void
  onExit: () => void
}) {
  const ThemeIcon = theme === 'dark' ? Moon : theme === 'sepia' ? Coffee : Sun
  const nextTheme = THEME_ORDER[(THEME_ORDER.indexOf(theme) + 1) % THEME_ORDER.length]
  const themeLabel = nextTheme === 'dark' ? 'Dark' : nextTheme === 'sepia' ? 'Sepia' : 'Light'

  return (
    <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-[#006A4E]/20 bg-white/95 p-1 shadow-lg backdrop-blur">
      <PillBtn label="Smaller text" onClick={() => onFont(-1)} disabled={fontSize <= 14}>
        <Minus className="h-4 w-4" />
      </PillBtn>
      <span className="min-w-10 text-center text-xs font-bold text-[#004230]" aria-live="polite">
        A{fontSize}
      </span>
      <PillBtn label="Larger text" onClick={() => onFont(1)} disabled={fontSize >= 26}>
        <Plus className="h-4 w-4" />
      </PillBtn>
      <span className="mx-1 h-5 w-px bg-[#006A4E]/20" />
      <PillBtn label={`Switch to ${themeLabel} theme`} onClick={() => onTheme(nextTheme)}>
        <ThemeIcon className="h-4 w-4" />
      </PillBtn>
      <PillBtn label="Exit reading view" onClick={onExit}>
        <X className="h-4 w-4" />
      </PillBtn>
    </div>
  )
}

export function SpeechBar({
  info,
  onTogglePause,
  onStop,
  onRate,
  onSkip,
}: {
  info: SpeechInfo
  onTogglePause: () => void
  onStop: () => void
  onRate: () => void
  onSkip: (dir: 1 | -1) => void
}) {
  return (
    <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-[#006A4E]/20 bg-white/95 p-1 shadow-lg backdrop-blur">
      <PillBtn label="Previous section" onClick={() => onSkip(-1)}>
        <Maximize2 className="h-3.5 w-3.5 rotate-[-90deg]" />
      </PillBtn>
      <PillBtn label={info.paused ? 'Resume reading aloud' : 'Pause'} onClick={onTogglePause}>
        {info.paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
      </PillBtn>
      <PillBtn label="Stop reading aloud" onClick={onStop}>
        <Square className="h-3.5 w-3.5" />
      </PillBtn>
      <PillBtn label="Next section" onClick={() => onSkip(1)}>
        <Maximize2 className="h-3.5 w-3.5 rotate-90" />
      </PillBtn>
      <span className="mx-1 h-5 w-px bg-[#006A4E]/20" />
      <button
        type="button"
        onClick={onRate}
        aria-label={`Speech rate ${info.rate}x, tap to change`}
        title={`Speech rate ${info.rate}× — tap to change`}
        className="min-h-9 min-w-11 rounded-full px-2 text-xs font-bold text-[#006A4E] hover:bg-[#e9f4f0]"
      >
        {info.rate}×
      </button>
      <span className="min-w-12 text-center text-[11px] font-semibold text-[#004230]" aria-live="polite">
        {info.total ? `${info.index + 1}/${info.total}` : ''}
      </span>
    </div>
  )
}

export function SpeechPulse({ active }: { active: boolean }) {
  return (
    <Volume2
      className={cn('h-4 w-4', active && 'animate-pulse text-[#006A4E]')}
      aria-hidden
    />
  )
}

function PillBtn({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      disabled={disabled}
      aria-label={label}
      title={label}
      onClick={onClick}
      className="min-h-9 min-w-9 rounded-full text-[#004230] hover:bg-[#e9f4f0] hover:text-[#006A4E] disabled:opacity-40"
    >
      {children}
    </Button>
  )
}
