'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Clock, Heart, Search } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { REPORTS, REPORT_TYPES, searchReports, type ReportMeta, type ReportType } from '@/lib/reports'
import { useReportPrefs } from '@/hooks/use-report-prefs'
import { cn } from '@/lib/utils'

const typeTone: Record<ReportType, string> = {
  'policy-brief': 'bg-[#e9f4f0] text-[#006A4E] border-[#b9d8cd]',
  'special-report': 'bg-[#fdecEE] text-[#c8121f] border-[#f8a1ac]',
  'op-ed': 'bg-[#fdf9ed] text-[#8a6a25] border-[#eac96a]',
  'ministerial-email': 'bg-[#e9f4f0] text-[#004230] border-[#006A4E]/30',
}

export function ReportCatalog() {
  const [query, setQuery] = useState('')
  const [type, setType] = useState<ReportType | 'all'>('all')
  const { favorites, recents, ready, isFavorite, toggleFavorite } = useReportPrefs()

  const filtered = useMemo(() => searchReports(query, type), [query, type])
  const favoriteReports = useMemo(
    () => favorites.map((s) => REPORTS.find((r) => r.slug === s)).filter(Boolean) as ReportMeta[],
    [favorites]
  )
  const recentReports = useMemo(
    () => recents.map((s) => REPORTS.find((r) => r.slug === s)).filter(Boolean) as ReportMeta[],
    [recents]
  )

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F42A41]">Briefing suite</p>
        <h2 className="mt-1 text-3xl font-bold text-[#004230]">Policy reports</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Four original briefings on Bangladesh fertiliser policy — search, favourite, print, and
          read in a full in-app viewer without leaving E-Bill.
        </p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, tags, author…"
            aria-label="Search reports"
            className="h-11 pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by type">
          {REPORT_TYPES.map((t) => (
            <Button
              key={t.value}
              type="button"
              size="sm"
              variant={type === t.value ? 'default' : 'outline'}
              className={cn(
                'min-h-11',
                type === t.value && 'bg-[#006A4E] text-white hover:bg-[#004d39]'
              )}
              onClick={() => setType(t.value)}
            >
              {t.label}
            </Button>
          ))}
        </div>
      </div>

      {ready && favoriteReports.length > 0 && (
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#006A4E]">
            <Heart className="h-4 w-4 fill-[#F42A41] text-[#F42A41]" />
            Favorites
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {favoriteReports.map((r) => (
              <ReportCard key={r.slug} report={r} favorite onToggleFavorite={toggleFavorite} />
            ))}
          </div>
        </section>
      )}

      {ready && recentReports.length > 0 && (
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#006A4E]">
            <Clock className="h-4 w-4" />
            Recently opened
          </h3>
          <div className="flex flex-wrap gap-2">
            {recentReports.map((r) => (
              <Link
                key={r.slug}
                href={`/reports/${r.slug}`}
                className="inline-flex min-h-11 items-center rounded-full border border-[#006A4E]/20 bg-white px-3 py-1.5 text-sm font-medium text-[#004230] hover:bg-[#e9f4f0]"
              >
                {r.title.length > 42 ? `${r.title.slice(0, 42)}…` : r.title}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="sr-only">All matching reports</h3>
        {filtered.length === 0 ? (
          <Card className="border-[#006A4E]/15">
            <CardContent className="py-12 text-center text-slate-500">
              No reports match that search.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((r) => (
              <ReportCard
                key={r.slug}
                report={r}
                favorite={isFavorite(r.slug)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function ReportCard({
  report,
  favorite,
  onToggleFavorite,
}: {
  report: ReportMeta
  favorite: boolean
  onToggleFavorite: (slug: string) => void
}) {
  return (
    <Card className="border-[#006A4E]/15 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <Badge className={cn('border font-semibold', typeTone[report.type])}>{report.typeLabel}</Badge>
          <button
            type="button"
            aria-label={favorite ? 'Remove favorite' : 'Add favorite'}
            onClick={() => onToggleFavorite(report.slug)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md hover:bg-[#e9f4f0]"
          >
            <Heart className={cn('h-4 w-4', favorite ? 'fill-[#F42A41] text-[#F42A41]' : 'text-slate-400')} />
          </button>
        </div>
        <CardTitle className="text-lg leading-snug text-[#004230]">
          <Link href={`/reports/${report.slug}`} className="hover:text-[#006A4E]">
            {report.title}
          </Link>
        </CardTitle>
        {report.titleBn && (
          <p className="text-sm font-medium text-[#006A4E]">{report.titleBn}</p>
        )}
        <CardDescription>{report.summary}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {report.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-[11px]">
              {tag}
            </Badge>
          ))}
        </div>
        <Button asChild size="sm" className="bg-[#006A4E] hover:bg-[#004d39]">
          <Link href={`/reports/${report.slug}`}>Open viewer</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
