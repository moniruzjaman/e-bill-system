import { AppNav } from '@/components/app-nav'
import { ReportCatalog } from '@/components/reports/report-catalog'

export const metadata = {
  title: 'Reports — E-Bill System',
  description: 'Policy briefing suite for Bangladesh fertilizer management.',
}

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e9f4f0] via-[#faf9f5] to-[#fdecEE]">
      <AppNav />
      <main id="main" className="container mx-auto px-4 py-8">
        <ReportCatalog />
      </main>
    </div>
  )
}
