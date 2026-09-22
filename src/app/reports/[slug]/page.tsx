import { notFound } from 'next/navigation'
import { AppNav } from '@/components/app-nav'
import { ReportViewer } from '@/components/reports/report-viewer'
import { getReport, REPORTS } from '@/lib/reports'

export function generateStaticParams() {
  return REPORTS.map((r) => ({ slug: r.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const report = getReport(slug)
  if (!report) return { title: 'Report not found' }
  return {
    title: `${report.title} — E-Bill Reports`,
    description: report.summary,
  }
}

export default async function ReportViewerPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const report = getReport(slug)
  if (!report) notFound()

  return (
    <div className="min-h-screen bg-[#faf9f5]">
      <AppNav />
      <div id="main">
        <ReportViewer report={report} />
      </div>
    </div>
  )
}
