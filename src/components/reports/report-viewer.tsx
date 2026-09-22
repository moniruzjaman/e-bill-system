'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useReportPrefs } from '@/hooks/use-report-prefs'
import { reportSrc, type ReportMeta } from '@/lib/reports'
import { ReportToolbar } from '@/components/reports/report-toolbar'
import { cn } from '@/lib/utils'

interface TocItem {
  id: string
  text: string
  level: number
}

interface ReportViewerProps {
  report: ReportMeta
}

export function ReportViewer({ report }: ReportViewerProps) {
  const { toast } = useToast()
  const { isFavorite, toggleFavorite, markRecent } = useReportPrefs()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const shellRef = useRef<HTMLDivElement>(null)
  const [toc, setToc] = useState<TocItem[]>([])
  const [tocOpen, setTocOpen] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    markRecent(report.slug)
  }, [markRecent, report.slug])

  useEffect(() => {
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  const parseToc = useCallback(() => {
    const doc = iframeRef.current?.contentDocument
    if (!doc) return
    const headings = Array.from(doc.querySelectorAll('h1, h2, h3'))
    const items: TocItem[] = []
    headings.forEach((el, i) => {
      const text = (el.textContent || '').replace(/\s+/g, ' ').trim()
      if (!text || text.length < 3) return
      if (!el.id) el.id = `sec-${i}`
      items.push({
        id: el.id,
        text: text.slice(0, 120),
        level: Number(el.tagName[1]),
      })
    })
    setToc(items)
    setLoaded(true)
  }, [])

  const scrollToHeading = (id: string) => {
    const doc = iframeRef.current?.contentDocument
    const el = doc?.getElementById(id)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const onPrint = () => {
    const win = iframeRef.current?.contentWindow
    if (!win) {
      toast({ title: 'Print unavailable', description: 'Report has not finished loading.', variant: 'destructive' })
      return
    }
    win.focus()
    win.print()
  }

  const onDownload = async () => {
    try {
      const res = await fetch(reportSrc(report))
      if (!res.ok) throw new Error('download failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = report.file
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast({ title: 'Downloaded', description: report.file })
    } catch {
      toast({ title: 'Download failed', description: 'Could not save the HTML file.', variant: 'destructive' })
    }
  }

  const onCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast({ title: 'Link copied', description: 'Viewer URL is on the clipboard.' })
    } catch {
      toast({ title: 'Copy failed', variant: 'destructive' })
    }
  }

  const onToggleFullscreen = async () => {
    const el = shellRef.current
    if (!el) return
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else {
        await el.requestFullscreen()
      }
    } catch {
      toast({ title: 'Fullscreen unavailable', variant: 'destructive' })
    }
  }

  return (
    <div
      ref={shellRef}
      className="relative flex min-h-[calc(100dvh-5.5rem)] flex-col bg-[#faf9f5]"
    >
      <ReportToolbar
        report={report}
        isFavorite={isFavorite(report.slug)}
        isFullscreen={isFullscreen}
        tocOpen={tocOpen}
        onToggleFavorite={() => toggleFavorite(report.slug)}
        onToggleFullscreen={onToggleFullscreen}
        onToggleToc={() => setTocOpen((v) => !v)}
        onPrint={onPrint}
        onDownload={onDownload}
        onCopyLink={onCopyLink}
      />
      <div className="flex min-h-0 flex-1">
        {tocOpen && (
          <aside className="absolute inset-y-0 left-0 z-20 w-72 overflow-y-auto border-r border-[#006A4E]/15 bg-white p-4 shadow-lg lg:static lg:z-0 lg:w-64 lg:shadow-none">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[#006A4E]">
              Contents
            </p>
            {toc.length === 0 ? (
              <p className="text-sm text-slate-500">
                {loaded ? 'No headings found.' : 'Loading headings…'}
              </p>
            ) : (
              <nav aria-label="Table of contents" className="space-y-1">
                {toc.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      scrollToHeading(item.id)
                      if (window.matchMedia('(max-width: 1023px)').matches) setTocOpen(false)
                    }}
                    className={cn(
                      'block w-full rounded-md px-2 py-1.5 text-left text-sm text-[#004230] hover:bg-[#e9f4f0] hover:text-[#006A4E]',
                      item.level === 1 && 'font-semibold',
                      item.level === 3 && 'pl-5 text-xs text-slate-600'
                    )}
                  >
                    {item.text}
                  </button>
                ))}
              </nav>
            )}
          </aside>
        )}
        <div className="relative min-h-[70vh] min-w-0 flex-1 bg-[#eef2ef]">
          {!loaded && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#eef2ef]">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#006A4E] border-t-transparent" />
            </div>
          )}
          <iframe
            ref={iframeRef}
            title={report.title}
            src={reportSrc(report)}
            className="absolute inset-0 h-full w-full border-0 bg-white"
            onLoad={parseToc}
          />
        </div>
      </div>
    </div>
  )
}
