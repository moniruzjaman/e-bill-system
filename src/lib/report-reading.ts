'use client'

export type ReaderTheme = 'light' | 'sepia' | 'dark'

const STYLE_ID = 'rb-reading-style'
const PROGRESS_ID = 'rb-progress'

const CSS = `
html[data-rb-reading] body {
  max-width: 46rem !important;
  margin-inline: auto !important;
  padding: 2.5rem 1.5rem 7rem !important;
  font-family: Georgia, 'Times New Roman', 'Noto Serif', serif !important;
  font-size: var(--rb-fs, 18px) !important;
  line-height: 1.78 !important;
}
html[data-rb-reading] body > * { max-width: 100%; }
html[data-rb-reading] img, html[data-rb-reading] video, html[data-rb-reading] svg,
html[data-rb-reading] table { max-width: 100% !important; height: auto !important; }
html[data-rb-reading="sepia"] { background: #f4ecd8 !important; }
html[data-rb-reading="sepia"] body { background: #f4ecd8 !important; color: #433422 !important; }
html[data-rb-reading="sepia"] body h1, html[data-rb-reading="sepia"] body h2,
html[data-rb-reading="sepia"] body h3, html[data-rb-reading="sepia"] body h4 { color: #2f2418 !important; }
html[data-rb-reading="sepia"] body a { color: #1a6b46 !important; }
html[data-rb-reading="sepia"] body table, html[data-rb-reading="sepia"] body td,
html[data-rb-reading="sepia"] body th, html[data-rb-reading="sepia"] body blockquote,
html[data-rb-reading="sepia"] body pre, html[data-rb-reading="sepia"] body code {
  background-color: transparent !important;
}
html[data-rb-reading="dark"] { background: #101613 !important; }
html[data-rb-reading="dark"] body { background: #101613 !important; color: #d7e2da !important; }
html[data-rb-reading="dark"] body h1, html[data-rb-reading="dark"] body h2,
html[data-rb-reading="dark"] body h3, html[data-rb-reading="dark"] body h4 { color: #f2f7f3 !important; }
html[data-rb-reading="dark"] body a { color: #7fd0a4 !important; }
html[data-rb-reading="dark"] body table, html[data-rb-reading="dark"] body td,
html[data-rb-reading="dark"] body th, html[data-rb-reading="dark"] body blockquote,
html[data-rb-reading="dark"] body pre, html[data-rb-reading="dark"] body code {
  background-color: transparent !important;
}
html[data-rb-reading="dark"] body img,
html[data-rb-reading="dark"] body svg { filter: brightness(.85) contrast(1.05); }
#rb-progress {
  position: fixed; top: 0; left: 0; height: 3px; width: 0;
  background: linear-gradient(90deg, #006A4E, #28A745); z-index: 2147483647;
  transition: width .12s linear;
}
.rb-speak-highlight { outline: 3px solid rgba(40,167,69,.55) !important; outline-offset: 4px !important; border-radius: 3px; background: rgba(40,167,69,.10) !important; }
`

function ensureStyle(doc: Document) {
  let style = doc.getElementById(STYLE_ID) as HTMLStyleElement | null
  if (!style) {
    style = doc.createElement('style')
    style.id = STYLE_ID
    style.textContent = CSS
    doc.head.appendChild(style)
  }
  return style
}

function onScroll(doc: Document) {
  const win = doc.defaultView
  const bar = doc.getElementById(PROGRESS_ID)
  if (!win || !bar) return
  const max = win.scrollY + win.innerHeight
  const total = doc.documentElement.scrollHeight
  bar.style.width = `${Math.min(100, Math.max(2, (max / Math.max(total, 1)) * 100))}%`
}

export function applyReadingMode(
  doc: Document | null,
  opts: { on: boolean; theme: ReaderTheme; fontSize: number }
) {
  if (!doc || !doc.documentElement) return
  ensureStyle(doc)
  const { on, theme, fontSize } = opts

  if (on) {
    doc.documentElement.dataset.rbReading = theme
    doc.documentElement.style.setProperty('--rb-fs', `${fontSize}px`)
    let bar = doc.getElementById(PROGRESS_ID)
    if (!bar) {
      bar = doc.createElement('div')
      bar.id = PROGRESS_ID
      doc.body.appendChild(bar)
    }
    const win = doc.defaultView
    if (win) {
      win.removeEventListener('scroll', progressHandler)
      win.addEventListener('scroll', progressHandler, { passive: true })
    }
    onScroll(doc)
  } else {
    delete doc.documentElement.dataset.rbReading
    doc.getElementById(PROGRESS_ID)?.remove()
    doc.defaultView?.removeEventListener('scroll', progressHandler)
  }
}

const progressHandler = (e: Event) => onScroll(e.target as Document)

/** Highlight the block currently being spoken (used by read-aloud). */
export function highlightSpoken(doc: Document, el: HTMLElement | null) {
  doc.querySelectorAll<HTMLElement>('.rb-speak-highlight').forEach((n) => {
    n.classList.remove('rb-speak-highlight')
    n.removeAttribute('style')
  })
  if (el) {
    el.classList.add('rb-speak-highlight')
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}
