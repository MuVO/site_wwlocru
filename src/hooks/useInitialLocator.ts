import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react'
import { encodeLocator } from '../locatorMath'
import { parseLocatorHash } from '../locatorUrl'

type SearchMode = 'search' | 'distance'
type MutableRef<T> = { current: T }

type UseInitialLocatorOptions = {
  initialHash: string
  locator: MutableRef<string>
  touched: MutableRef<boolean>
  setLocator: Dispatch<SetStateAction<string>>
  setSecondLocator: Dispatch<SetStateAction<string>>
  setSearchMode: Dispatch<SetStateAction<SearchMode>>
  onInitialSearch: (locator: string) => void
  onInitialDistance: (first: string, second: string) => void
  onGeolocated: (locator: string) => void
  onIpGeolocated: (locator: string) => void
  onLocationUnavailable: () => void
}

async function locateByIp(signal: AbortSignal): Promise<[number, number]> {
  const response = await fetch('https://ipapi.co/json/', { signal })
  if (!response.ok) throw new Error('IP location request failed')

  const result: { latitude?: unknown; longitude?: unknown; error?: unknown } =
    await response.json()
  if (
    result.error ||
    typeof result.latitude !== 'number' ||
    typeof result.longitude !== 'number' ||
    !Number.isFinite(result.latitude) ||
    !Number.isFinite(result.longitude) ||
    Math.abs(result.latitude) > 90 ||
    Math.abs(result.longitude) > 180
  ) {
    throw new Error('IP location response is invalid')
  }
  return [result.latitude, result.longitude]
}

export function useInitialLocator(options: UseInitialLocatorOptions): void {
  const latestOptions = useRef(options)
  latestOptions.current = options

  useEffect(() => {
    const current = latestOptions.current
    const hash = parseLocatorHash(current.initialHash)

    if (hash?.second) {
      current.locator.current = hash.first
      current.setLocator(hash.first)
      current.setSecondLocator(hash.second)
      current.setSearchMode('distance')
      current.onInitialDistance(hash.first, hash.second)
      return
    }

    if (hash?.first) {
      current.locator.current = hash.first
      current.setLocator(hash.first)
      current.onInitialSearch(hash.first)
    }
  }, [])

  useEffect(() => {
    const current = latestOptions.current
    if (parseLocatorHash(current.initialHash)) return

    let active = true
    const abortController = new AbortController()
    let timeout: number | undefined
    const ipFallback = async () => {
      timeout = window.setTimeout(() => abortController.abort(), 8_000)
      try {
        const locator = encodeLocator(
          await locateByIp(abortController.signal),
          2
        )
        if (timeout !== undefined) window.clearTimeout(timeout)
        const latest = latestOptions.current
        if (!active || latest.touched.current) return
        latest.locator.current = locator
        latest.setLocator(locator)
        latest.onIpGeolocated(locator)
      } catch {
        if (timeout !== undefined) window.clearTimeout(timeout)
        if (active && !latestOptions.current.touched.current)
          latestOptions.current.onLocationUnavailable()
      }
    }

    if (!navigator.geolocation) {
      void ipFallback()
    } else {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const latest = latestOptions.current
          if (!active || latest.touched.current) return
          const locator = encodeLocator([coords.latitude, coords.longitude])
          latest.locator.current = locator
          latest.setLocator(locator)
          latest.onGeolocated(locator)
        },
        () => {
          void ipFallback()
        },
        { enableHighAccuracy: false, maximumAge: 300_000, timeout: 10_000 }
      )
    }

    return () => {
      active = false
      if (timeout !== undefined) window.clearTimeout(timeout)
      abortController.abort()
    }
  }, [])
}
