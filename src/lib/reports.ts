export type ReportType = 'policy-brief' | 'special-report' | 'op-ed' | 'ministerial-email'

export interface ReportMeta {
  slug: string
  file: string
  title: string
  titleBn?: string
  subtitle: string
  type: ReportType
  typeLabel: string
  language: string
  tags: string[]
  summary: string
  author: string
  date: string
}

export const REPORTS: ReportMeta[] = [
  {
    slug: 'burden-to-bloom',
    file: 'fertizer_burden_to_bloom.html',
    title: 'Fertilizer Management — Burden to Bloom',
    titleBn: 'সার ব্যবস্থাপনা: সংকট থেকে সমৃদ্ধি',
    subtitle: 'A strategic framework for transforming Bangladesh’s agricultural input system.',
    type: 'policy-brief',
    typeLabel: 'Policy Brief',
    language: 'EN / BN',
    tags: ['subsidy', 'Krishak Card', 'roadmap', 'Ministry of Agriculture'],
    summary:
      'Comprehensive briefing covering the fiscal burden, comparative lessons from India, China, Vietnam and the Philippines, and a ministerial path from leakage to bloom.',
    author: 'Ministry of Agriculture briefing',
    date: '2026',
  },
  {
    slug: 'criticism',
    file: 'criticism.html',
    title: "Bangladesh’s Fertiliser Crisis: The Problem Is Not Only Supply, but the System",
    titleBn: 'সার সংকট: সমস্যা শুধু সরবরাহের নয়, ব্যবস্থারও',
    subtitle: 'Special report on warehouse-to-farm-gate failure.',
    type: 'special-report',
    typeLabel: 'Special Report',
    language: 'EN / BN',
    tags: ['distribution', 'governance', 'field reports', 'leakage'],
    summary:
      'Official stocks look comfortable, yet farmers queue and pay above the official price. Investigates last-mile failure, six structural vulnerabilities, and five reform priorities.',
    author: 'Abu Md. Moniruzjaman',
    date: '2026',
  },
  {
    slug: 'editorial',
    file: 'editorial.html',
    title: "From Abundant Supply to Every Farmer’s Hands: Bangladesh’s Path to Bloom",
    titleBn: 'প্রাচুর্য থেকে সমৃদ্ধি — সার ব্যবস্থাপনায় শেষ মাইলের সুন্দর সম্ভাবনা',
    subtitle: 'Constructive op-ed on distribution excellence.',
    type: 'op-ed',
    typeLabel: 'Op-Ed',
    language: 'EN / BN',
    tags: ['op-ed', '2026 dealer policy', 'seven actions'],
    summary:
      'National stocks and a Tk 17,001-crore subsidy are already in place. The next chapter is last-mile integrity — seven actions to complete the journey from stock management to farmer security.',
    author: 'Abu Md. Moniruzjaman',
    date: '2026',
  },
  {
    slug: 'minister-email',
    file: 'minister-email.html',
    title: 'Fertilizer Management: The Path to Bloom — Ministerial Action Plan',
    titleBn: 'সবার আগে বাংলাদেশ',
    subtitle: 'Official briefing email for the Honourable Minister.',
    type: 'ministerial-email',
    typeLabel: 'Ministerial Email',
    language: 'EN / BN',
    tags: ['minister', 'action plan', 'biometric', 'dealer policy'],
    summary:
      'A biometric, land-linked fertilizer distribution plan that recovers Tk 2,000–3,000 crore annually — seven actions requiring ministerial signature.',
    author: 'Ministry of Agriculture',
    date: '2026',
  },
]

export const REPORT_TYPES: { value: ReportType | 'all'; label: string }[] = [
  { value: 'all', label: 'All types' },
  { value: 'policy-brief', label: 'Policy Brief' },
  { value: 'special-report', label: 'Special Report' },
  { value: 'op-ed', label: 'Op-Ed' },
  { value: 'ministerial-email', label: 'Ministerial Email' },
]

export function getReport(slug: string): ReportMeta | undefined {
  return REPORTS.find((r) => r.slug === slug)
}

export function reportSrc(report: ReportMeta): string {
  return `/report/${report.file}`
}

export function searchReports(
  query: string,
  type: ReportType | 'all',
  reports: ReportMeta[] = REPORTS
): ReportMeta[] {
  const q = query.trim().toLowerCase()
  return reports.filter((r) => {
    const typeOk = type === 'all' || r.type === type
    if (!typeOk) return false
    if (!q) return true
    const hay = [
      r.title,
      r.titleBn ?? '',
      r.subtitle,
      r.summary,
      r.author,
      r.typeLabel,
      r.language,
      ...r.tags,
    ]
      .join(' ')
      .toLowerCase()
    return hay.includes(q)
  })
}
