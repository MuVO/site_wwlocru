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

    const initial = (
      hash?.first ??
      (current.initialHash.slice(1) || 'MO05QE')
    ).toUpperCase()
    current.locator.current = initial
    current.setLocator(initial)
    current.onInitialSearch(initial)
  }, [])

  useEffect(() => {
    const current = latestOptions.current
    if (parseLocatorHash(current.initialHash) || !navigator.geolocation) return

    let active = true
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
        // Geolocation is optional; keep the URL/default locator on failure.
      },
      { enableHighAccuracy: false, maximumAge: 300_000, timeout: 10_000 }
    )

    return () => {
      active = false
    }
  }, [])
}
