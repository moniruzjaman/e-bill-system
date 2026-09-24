'use client'

export const LANGUAGES: Array<{ code: string; label: string }> = [
  { code: 'bn', label: 'বাংলা — Bengali' },
  { code: 'hi', label: 'हिन्दी — Hindi' },
  { code: 'ar', label: 'العربية — Arabic' },
  { code: 'es', label: 'Español — Spanish' },
  { code: 'fr', label: 'Français — French' },
  { code: 'zh-CN', label: '中文 — Chinese' },
  { code: 'pt', label: 'Português — Portuguese' },
  { code: 'id', label: 'Bahasa Indonesia' },
]

export function languageLabel(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.label ?? code
}

const BLOCK_SELECTOR = 'h1,h2,h3,h4,h5,p,li,td,th,figcaption,blockquote,dd,dt'
const CHUNK_CHARS = 1500
const CONCURRENCY = 3

/** Leaf-level text blocks of the report document. */
export function collectBlocks(doc: Document): HTMLElement[] {
  return Array.from(doc.querySelectorAll<HTMLElement>(BLOCK_SELECTOR)).filter((el) => {
    if (el.closest('script,style,noscript')) return false
    if (el.querySelector(BLOCK_SELECTOR)) return false // keep leaves only
    return ((el.textContent || '').replace(/\s+/g, ' ').trim().length >= 2)
  })
}

function originalText(doc: Document, el: HTMLElement): string {
  const orig = el.dataset.rbOriginal
  if (orig !== undefined && orig !== el.innerHTML) {
    const d = doc.createElement('div')
    d.innerHTML = orig
    return (d.textContent || '').replace(/\s+/g, ' ').trim()
  }
  return (el.textContent || '').replace(/\s+/g, ' ').trim()
}

interface Chunk {
  indices: number[]
  text: string
}

function buildChunks(texts: string[]): Chunk[] {
  const chunks: Chunk[] = []
  let indices: number[] = []
  let parts: string[] = []
  let size = 0
  texts.forEach((t, i) => {
    const seg = `[${i}] ${t}\n`
    if (size + seg.length > CHUNK_CHARS && indices.length) {
      chunks.push({ indices, text: parts.join('') })
      indices = []
      parts = []
      size = 0
    }
    indices.push(i)
    parts.push(seg)
    size += seg.length
  })
  if (indices.length) chunks.push({ indices, text: parts.join('') })
  return chunks
}

function cacheKey(slug: string, lang: string) {
  return `tr:${slug}:${lang}`
}

function loadStore(slug: string, lang: string): Record<string, string> {
  try {
    return JSON.parse(sessionStorage.getItem(cacheKey(slug, lang)) || '{}')
  } catch {
    return {}
  }
}

export interface TranslateResult {
  applied: number
  failed: number
}

/** Translate every text block of the report document into `lang`. */
export async function translateDocument(opts: {
  doc: Document
  slug: string
  lang: string
  onProgress?: (done: number, total: number) => void
  signal?: AbortSignal
}): Promise<TranslateResult> {
  const { doc, slug, lang, onProgress, signal } = opts
  const els = collectBlocks(doc)
  if (!els.length) return { applied: 0, failed: 0 }

  // Stash pristine markup once so "show original" is always exact.
  els.forEach((el) => {
    if (el.dataset.rbOriginal === undefined) el.dataset.rbOriginal = el.innerHTML
  })

  const store = loadStore(slug, lang)
  const texts = els.map((el) => originalText(doc, el))
  const chunks = buildChunks(texts).filter(
    (c) => !c.indices.every((i) => store[String(i)] !== undefined)
  )

  let done = 0
  const total = chunks.length
  onProgress?.(0, total)

  let cursor = 0
  const worker = async () => {
    while (cursor < chunks.length) {
      if (signal?.aborted) return
      const chunk = chunks[cursor++]
      try {
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: chunk.text,
            target: lang,
            count: chunk.indices.length,
          }),
          signal,
        })
        if (!res.ok) throw new Error(`translate ${res.status}`)
        const data = (await res.json()) as { translations: Record<string, string> }
        for (const i of chunk.indices) {
          const t = data.translations[String(i)]
          if (t) store[String(i)] = t
        }
      } catch {
        /* network/parse issue → those blocks keep their original text */
      }
      done++
      onProgress?.(done, total)
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, chunks.length) }, worker))

  let applied = 0
  let failed = 0
  els.forEach((el, i) => {
    const t = store[String(i)]
    if (t) {
      el.textContent = t
      el.dataset.rbLang = lang
      applied++
    } else {
      failed++
    }
  })

  try {
    sessionStorage.setItem(cacheKey(slug, lang), JSON.stringify(store))
  } catch {
    /* storage full — cache is best-effort */
  }
  return { applied, failed }
}

/** Restore the pristine report markup. */
export function restoreOriginal(doc: Document) {
  doc.querySelectorAll<HTMLElement>('[data-rb-original]').forEach((el) => {
    el.innerHTML = el.dataset.rbOriginal || el.innerHTML
    delete el.dataset.rbLang
  })
}

/** Language currently applied to the document, if any. */
export function appliedLanguage(doc: Document | null): string | null {
  if (!doc) return null
  const el = doc.querySelector<HTMLElement>('[data-rb-lang]')
  return el?.dataset.rbLang ?? null
}
