import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export const runtime = 'nodejs'
export const maxDuration = 60

const LANGS: Record<string, string> = {
  bn: 'Bengali (বাংলা)',
  hi: 'Hindi',
  ar: 'Arabic',
  es: 'Spanish',
  fr: 'French',
  'zh-CN': 'Simplified Chinese',
  pt: 'Portuguese',
  id: 'Indonesian',
}

const CACHE_CAP = 400
const memory = new Map<string, Record<string, string>>()

function remember(key: string, value: Record<string, string>) {
  if (memory.size >= CACHE_CAP) {
    const first = memory.keys().next().value
    if (first) memory.delete(first)
  }
  memory.set(key, value)
}

function parseSegments(raw: string): Record<string, string> {
  const out: Record<string, string> = {}
  // Lenient: "[0]", "[0 " or bare "0" line starts all map to index 0
  const re = /^\s*\[?(\d{1,4})\]?\s*(.*)$/gm
  let m: RegExpExecArray | null
  while ((m = re.exec(raw)) !== null) {
    const idx = m[1]
    const line = m[2].trim()
    if (!line) continue
    out[idx] = out[idx] ? `${out[idx]} ${line}` : line
  }
  return out
}

const SYSTEM = (lang: string) =>
  `You are a professional document translation engine. Translate every numbered segment from its source language into ${lang}.

Rules:
- Keep every "[n]" index prefix at the start of its line, in the same order. Never merge or drop segments.
- Output ONLY the translated segments — no introductions, notes, or blank lines between segments.
- Preserve numbers, dates, currency amounts, percentages, and proper nouns.
- Keep the tone formal and suitable for a policy briefing document.`

export async function POST(req: NextRequest) {
  let body: { text?: unknown; target?: unknown; count?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }

  const text = typeof body.text === 'string' ? body.text : ''
  const target = typeof body.target === 'string' ? body.target : ''
  const count = typeof body.count === 'number' ? body.count : 0

  if (!text.trim()) return NextResponse.json({ error: 'text is required' }, { status: 400 })
  const langName = LANGS[target]
  if (!langName) return NextResponse.json({ error: 'unsupported target language' }, { status: 400 })
  if (text.length > 24_000) return NextResponse.json({ error: 'text too long' }, { status: 413 })

  const key = `${target}:${text}`
  const hit = memory.get(key)
  if (hit) return NextResponse.json({ translations: hit, cached: true, complete: true })

  try {
    const zai = await ZAI.create()
    const messages = [
      { role: 'assistant' as const, content: SYSTEM(langName) },
      { role: 'user' as const, content: text },
    ]

    let last = ''
    let parsed: Record<string, string> = {}
    for (let attempt = 0; attempt < 2; attempt++) {
      const completion = await zai.chat.completions.create({
        messages,
        thinking: { type: 'disabled' },
      })
      last = completion.choices[0]?.message?.content ?? ''
      parsed = parseSegments(last)
      const need = count || Object.keys(parsed).length
      if (Object.keys(parsed).length >= Math.ceil(need * 0.9)) break
    }

    if (!Object.keys(parsed).length) {
      return NextResponse.json({ error: 'translation parse failed' }, { status: 502 })
    }

    const complete = count ? Object.keys(parsed).length >= count : true
    remember(key, parsed)
    return NextResponse.json({ translations: parsed, cached: false, complete })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'translation failed'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
