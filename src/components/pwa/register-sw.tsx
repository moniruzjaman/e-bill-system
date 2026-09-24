'use client'

import { useEffect } from 'react'

/**
 * Registers the service worker in production builds.
 * When a new worker is installed while one already controls the page,
 * the page reloads once the updated worker takes control.
 */
export function RegisterSW() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return
    if (process.env.NODE_ENV !== 'production') return

    let refreshing = false
    let updateReady = false

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing || !updateReady) return
      refreshing = true
      window.location.reload()
    })

    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        reg.addEventListener('updatefound', () => {
          const next = reg.installing
          if (!next) return
          next.addEventListener('statechange', () => {
            if (next.state === 'installed' && navigator.serviceWorker.controller) {
              updateReady = true
              next.postMessage({ type: 'SKIP_WAITING' })
            }
          })
        })
      })
      .catch(() => {
        /* registration failed — site still works online */
      })
  }, [])

  return null
}
