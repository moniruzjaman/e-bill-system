import Link from 'next/link'
import { AppNav } from '@/components/app-nav'
import { Button } from '@/components/ui/button'

export default function ReportNotFound() {
  return (
    <div className="min-h-screen bg-[#faf9f5]">
      <AppNav />
      <main id="main" className="container mx-auto px-4 py-16 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F42A41]">Not found</p>
        <h2 className="mt-2 text-2xl font-bold text-[#004230]">This report is not in the suite</h2>
        <p className="mt-2 text-slate-600">Check the catalog for Burden to Bloom, criticism, editorial, and the ministerial email.</p>
        <Button asChild className="mt-6 bg-[#006A4E] hover:bg-[#004d39]">
          <Link href="/reports">Back to reports</Link>
        </Button>
      </main>
    </div>
  )
}
