'use client'

import { useCallback, useSyncExternalStore } from 'react'

const FAVORITES_KEY = 'ebill-report-favorites'
const RECENTS_KEY = 'ebill-report-recents'
const MAX_RECENTS = 8

const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', listener)
  }
  return () => {
    listeners.delete(listener)
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', listener)
    }
  }
}

function readList(key: string): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

function writeList(key: string, value: string[]) {
  window.localStorage.setItem(key, JSON.stringify(value))
  emit()
}

function getFavoritesSnapshot() {
  return JSON.stringify(readList(FAVORITES_KEY))
}

function getRecentsSnapshot() {
  return JSON.stringify(readList(RECENTS_KEY))
}

const emptySnapshot = '[]'

export function useReportPrefs() {
  const favoritesJson = useSyncExternalStore(subscribe, getFavoritesSnapshot, () => emptySnapshot)
  const recentsJson = useSyncExternalStore(subscribe, getRecentsSnapshot, () => emptySnapshot)
  const favorites: string[] = JSON.parse(favoritesJson)
  const recents: string[] = JSON.parse(recentsJson)

  const isFavorite = useCallback((slug: string) => favorites.includes(slug), [favorites])

  const toggleFavorite = useCallback((slug: string) => {
    const prev = readList(FAVORITES_KEY)
    const next = prev.includes(slug) ? prev.filter((s) => s !== slug) : [slug, ...prev]
    writeList(FAVORITES_KEY, next)
  }, [])

  const markRecent = useCallback((slug: string) => {
    const prev = readList(RECENTS_KEY)
    const next = [slug, ...prev.filter((s) => s !== slug)].slice(0, MAX_RECENTS)
    writeList(RECENTS_KEY, next)
  }, [])

  return { favorites, recents, ready: true, isFavorite, toggleFavorite, markRecent }
}
