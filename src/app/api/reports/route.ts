import { NextResponse } from 'next/server'
import { REPORTS } from '@/lib/reports'

export async function GET() {
  return NextResponse.json({
    reports: REPORTS.map((r) => ({
      ...r,
      href: `/reports/${r.slug}`,
      fileUrl: `/report/${r.file}`,
    })),
  })
}
