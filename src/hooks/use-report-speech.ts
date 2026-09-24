'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { collectBlocks } from '@/lib/report-translate'
import { highlightSpoken } from '@/lib/report-reading'

const RATES = [0.75, 1, 1.25, 1.5]

export interface SpeechInfo {
  active: boolean
  speaking: boolean
  paused: boolean
  rate: number
  index: number
  total: number
  supported: boolean
}

/**
 * Read-aloud engine over the Web Speech API.
 * Speaks the report block-by-block (inside the iframe document),
 * highlighting the current block and auto-scrolling to it.
 */
export function useReportSpeech(getDoc: () => Document | null) {
  const [info, setInfo] = useState<SpeechInfo>({
    active: false,
    speaking: false,
    paused: false,
    rate: 1,
    index: 0,
    total: 0,
    supported: typeof window !== 'undefined' && 'speechSynthesis' in window,
  })

  const blocksRef = useRef<HTMLElement[]>([])
  const idxRef = useRef(0)
  const rateRef = useRef(1)
  const stoppedRef = useRef(true)

  const pickVoice = useCallback((bengali: boolean): SpeechSynthesisVoice | null => {
    const voices = window.speechSynthesis.getVoices()
    const want = bengali ? 'bn' : 'en'
    const exact = voices.filter((v) => v.lang.toLowerCase().startsWith(want))
    return exact.find((v) => v.localService) || exact[0] || null
  }, [])

  const speakAt = useCallback(
    (i: number) => {
      const doc = getDoc()
      if (!doc || stoppedRef.current) return
      const blocks = blocksRef.current
      if (i >= blocks.length) {
        stoppedRef.current = true
        highlightSpoken(doc, null)
        setInfo((s) => ({ ...s, active: false, speaking: false, paused: false }))
        return
      }
      idxRef.current = i
      const el = blocks[i]
      const text = (el.textContent || '').replace(/\s+/g, ' ').trim()
      if (!text) {
        speakAt(i + 1)
        return
      }
      highlightSpoken(doc, el)
      const bengali = /[\u0980-\u09FF]/.test(text)
      const utter = new SpeechSynthesisUtterance(text)
      utter.lang = bengali ? 'bn-BD' : 'en-US'
      const voice = pickVoice(bengali)
      if (voice) utter.voice = voice
      utter.rate = rateRef.current
      utter.onend = () => {
        if (!stoppedRef.current) speakAt(i + 1)
      }
      utter.onerror = () => {
        if (!stoppedRef.current) speakAt(i + 1)
      }
      setInfo((s) => ({ ...s, speaking: true, paused: false, index: i }))
      window.speechSynthesis.speak(utter)
    },
    [getDoc, pickVoice]
  )

  const start = useCallback(() => {
    if (!('speechSynthesis' in window)) return
    const doc = getDoc()
    if (!doc) return
    window.speechSynthesis.cancel()
    stoppedRef.current = false
    blocksRef.current = collectBlocks(doc)
    setInfo((s) => ({ ...s, active: true, total: blocksRef.current.length, index: 0 }))
    speakAt(0)
  }, [getDoc, speakAt])

  const stop = useCallback(() => {
    stoppedRef.current = true
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    const doc = getDoc()
    if (doc) highlightSpoken(doc, null)
    setInfo((s) => ({ ...s, active: false, speaking: false, paused: false }))
  }, [getDoc])

  const togglePause = useCallback(() => {
    if (!('speechSynthesis' in window)) return
    const synth = window.speechSynthesis
    if (synth.paused) {
      synth.resume()
      setInfo((s) => ({ ...s, paused: false }))
    } else if (synth.speaking) {
      synth.pause()
      setInfo((s) => ({ ...s, paused: true }))
    }
  }, [])

  const cycleRate = useCallback(() => {
    const next = RATES[(RATES.indexOf(rateRef.current) + 1) % RATES.length]
    rateRef.current = next
    setInfo((s) => ({ ...s, rate: next }))
    // Restart the current block so the new rate takes effect immediately.
    if (!stoppedRef.current) {
      window.speechSynthesis.cancel()
      speakAt(idxRef.current)
    }
    return next
  }, [speakAt])

  const skip = useCallback(
    (dir: 1 | -1) => {
      if (stoppedRef.current) return
      window.speechSynthesis.cancel()
      speakAt(Math.min(Math.max(idxRef.current + dir, 0), blocksRef.current.length - 1))
    },
    [speakAt]
  )

  useEffect(() => {
    return () => {
      stoppedRef.current = true
      if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    }
  }, [])

  return { info, start, stop, togglePause, cycleRate, skip }
}
