import { useEffect, useRef, useState, type FormEvent } from 'react'
import L from 'leaflet'
import terminator from '@joergdietrich/leaflet.terminator'
import 'leaflet/dist/leaflet.css'
import type { Geometry, YandexMapInstance } from './types'
import { centerOfGeometry, decodeLocator, distanceBetween, encodeLocator, isValidLocator, magneticReading, type Coordinates, type LocatorGeometry, type MagneticReading } from './locatorMath'
import { formatLocatorHash, parseLocatorHash } from './locatorUrl'
import { detectLocale, messages, type Locale } from './i18n'

const INITIAL_LOCATOR = 'MO05QE'
const MAP_API_KEY = import.meta.env.VITE_YANDEX_MAPS_API_KEY

function SearchIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.7" /><path d="m16 16 5 5" /></svg>
}

function RulerIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 17 14-14 4 4L7 21l-4-4Z" /><path d="m14 6 4 4M11 9l2 2M8 12l4 4M5 15l2 2" /></svg>
}

type SocialNetwork = 'vk' | 'ok' | 'telegram' | 'whatsapp' | 'facebook' | 'max' | 'copy'

function SocialIcon({ network }: { network: SocialNetwork }) {
  if (network === 'vk') return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3.3 7.2h3.1c.2 4.2 1.9 6 3.2 6.4V7.2h2.9v3.6c1.3-.1 2.7-1.8 3.2-3.6h2.9a7.2 7.2 0 0 1-2.9 4.7 7.5 7.5 0 0 1 3.5 4.9h-3.2c-.6-1.8-1.9-3.2-3.5-3.3v3.3h-.4c-5.3 0-8.4-3.6-8.8-9.6Z" /></svg>
  if (network === 'ok') return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3.5a4.2 4.2 0 1 0 0 8.4 4.2 4.2 0 0 0 0-8.4Zm0 2.7a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm-3.1 7.4a1.35 1.35 0 0 0-1.8.5 1.35 1.35 0 0 0 .5 1.8 8.1 8.1 0 0 0 2.4 1l-2.1 2.1a1.35 1.35 0 0 0 1.9 1.9l2.2-2.2 2.2 2.2a1.35 1.35 0 0 0 1.9-1.9L14 16.9a8.1 8.1 0 0 0 2.4-1 1.35 1.35 0 0 0-1.3-2.4 6.5 6.5 0 0 1-6.2.1Z" /></svg>
  if (network === 'telegram') return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m21.5 4.5-3.2 15c-.2 1.1-.8 1.4-1.7.9l-4.8-3.6-2.3 2.2c-.3.3-.5.5-1 .5l.4-4.9 8.9-8c.4-.4-.1-.6-.6-.2L6.2 13.5l-4.7-1.5c-1-.3-1-1 .2-1.5L20 3.4c.8-.3 1.7.2 1.5 1.1Z" /></svg>
  if (network === 'whatsapp') return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.2a9.6 9.6 0 0 0-8.2 14.6L2.5 22l5.3-1.4A9.6 9.6 0 1 0 12 2.2Zm0 2a7.6 7.6 0 0 1 0 15.2 7.5 7.5 0 0 1-3.8-1l-.4-.2-2.6.7.7-2.5-.3-.4A7.6 7.6 0 0 1 12 4.2Zm-3.1 3c-.2 0-.5.1-.7.4-.2.2-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.8 2.9 4.4 3.9 2.2.9 2.6.7 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2-.1-.1-.2-.2-.5-.3l-1.7-.8c-.2-.1-.4-.1-.6.2-.2.3-.7.8-.9 1-.2.2-.3.2-.6.1-.3-.1-1.1-.4-2-1.2-.7-.6-1.2-1.4-1.3-1.7-.1-.3 0-.4.1-.6l.4-.4.3-.5c.1-.2 0-.4 0-.5l-.8-1.8c-.2-.5-.4-.6-.7-.6Z" /></svg>
  if (network === 'facebook') return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.7 21v-8h2.8l.4-3.1h-3.2v-2c0-.9.3-1.5 1.6-1.5H17V3.6c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.1H7.5V13h2.8v8h3.4Z" /></svg>
  if (network === 'max') return <img className="max-social-icon" src="/max-logo.svg" alt="" />
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="8" width="14" height="13" rx="2" /><path d="M8 8V5.5A2.5 2.5 0 0 1 10.5 3h3A2.5 2.5 0 0 1 16 5.5V8M9 13h6M9 16h6" /></svg>
}

interface DistanceRoute {
  first: string
  second: string
  firstBounds: LocatorGeometry
  secondBounds: LocatorGeometry
  firstCenter: Coordinates
  secondCenter: Coordinates
  distanceMeters: number
}

function App() {
  const yandexNode = useRef<HTMLDivElement>(null)
  const openStreetMapNode = useRef<HTMLDivElement>(null)
  const mapRef = useRef<YandexMapInstance | null>(null)
  const mapViewRef = useRef({ center: [55.17, 61.4] as [number, number], zoom: 11 })
  const rectangleRef = useRef<unknown>(null)
  const secondRectangleRef = useRef<unknown>(null)
  const routeLineRef = useRef<unknown>(null)
  const openStreetMapRef = useRef<L.Map | null>(null)
  const openStreetMapRectangleRef = useRef<L.Rectangle | null>(null)
  const openStreetMapSecondRectangleRef = useRef<L.Rectangle | null>(null)
  const openStreetMapRouteRef = useRef<L.Polyline | null>(null)
  const terminatorRef = useRef<ReturnType<typeof terminator> | null>(null)
  const yandexTerminatorRef = useRef<unknown>(null)
  const [locale, setLocale] = useState<Locale>(detectLocale)
  const localeRef = useRef(locale)
  localeRef.current = locale
  const t = messages[locale]
  const [locator, setLocator] = useState(INITIAL_LOCATOR)
  const locatorRef = useRef(locator)
  locatorRef.current = locator
  const [secondLocator, setSecondLocator] = useState('')
  const [searchMode, setSearchMode] = useState<'search' | 'distance'>('search')
  const searchModeRef = useRef(searchMode)
  searchModeRef.current = searchMode
  const [modeMenuOpen, setModeMenuOpen] = useState(false)
  const [distanceUnit, setDistanceUnit] = useState<'km' | 'mi'>('km')
  const [distanceRoute, setDistanceRoute] = useState<DistanceRoute | null>(null)
  const [copyStatus, setCopyStatus] = useState('')
  const [mapProvider, setMapProvider] = useState<'yandex' | 'osm'>(MAP_API_KEY ? 'yandex' : 'osm')
  const [showTerminator, setShowTerminator] = useState(false)
  const [yandexReady, setYandexReady] = useState(false)
  const [osmReady, setOsmReady] = useState(false)
  const [error, setError] = useState('')
  const [mapStatus, setMapStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [magnetic, setMagnetic] = useState<MagneticReading | null>(null)
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [feedback, setFeedback] = useState({ name: '', email: '', comment: '' })

  useEffect(() => {
    document.documentElement.lang = locale
    document.title = t.pageTitle
    document.querySelector('meta[name="description"]')?.setAttribute('content', t.pageDescription)
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', t.pageTitle)
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', t.pageDescription)
    document.querySelector('meta[property="og:locale"]')?.setAttribute('content', locale === 'ru' ? 'ru_RU' : 'en_US')
    document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', t.pageTitle)
    document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', t.pageDescription)
    try { window.localStorage.setItem('wwloc-locale', locale) } catch { /* Storage is optional. */ }
  }, [locale, t.pageDescription, t.pageTitle])

  function updateMap(code: string, fitMap = true) {
    try {
      const bounds = decodeLocator(code)
      setMagnetic(magneticReading(centerOfGeometry(bounds)))
      const map = mapRef.current
      if (map) {
        if (fitMap) void map.setBounds(bounds, { checkZoomRange: true, zoomMargin: 70, duration: 400 })
        if (!rectangleRef.current && window.ymaps) {
          rectangleRef.current = new window.ymaps.Rectangle(bounds, {}, {
            fillColor: '#1747ff2b', fillOpacity: 0.2, strokeColor: '#1747ff', strokeWidth: 2,
          })
          map.geoObjects.add(rectangleRef.current)
        } else if (rectangleRef.current && 'geometry' in (rectangleRef.current as object)) {
          (rectangleRef.current as { geometry: { setCoordinates: (value: Geometry) => void } }).geometry.setCoordinates(bounds)
        }
      }
      const locatorBounds = L.latLngBounds(
        L.latLng(bounds[0][0], bounds[0][1]),
        L.latLng(bounds[1][0], bounds[1][1]),
      )
      openStreetMapRectangleRef.current?.setBounds(locatorBounds)
      if (fitMap) openStreetMapRef.current?.fitBounds(locatorBounds, { maxZoom: 13, padding: [36, 36], animate: true })
      setError('')
      window.history.replaceState(null, '', formatLocatorHash(code))
    } catch {
      setError(messages[localeRef.current].invalidLocator)
    }
  }

  function measureDistance(firstValue: string, secondValue: string, fitMap = true, reportError = true) {
    const first = firstValue.trim().toUpperCase()
    const second = secondValue.trim().toUpperCase()
    if (!isValidLocator(first)) {
      if (reportError) setError(messages[localeRef.current].invalidLocator)
      setDistanceRoute(null)
      return
    }
    if (!isValidLocator(second)) {
      if (reportError) setError(messages[localeRef.current].invalidSecondLocator)
      setDistanceRoute(null)
      return
    }

    const firstBounds = decodeLocator(first)
    const secondBounds = decodeLocator(second)
    const firstCenter = centerOfGeometry(firstBounds)
    const secondCenter = centerOfGeometry(secondBounds)
    const distanceMeters = distanceBetween(firstCenter, secondCenter).distance
    setLocator(first)
    setSecondLocator(second)
    setMagnetic(magneticReading(firstCenter))
    setDistanceRoute({ first, second, firstBounds, secondBounds, firstCenter, secondCenter, distanceMeters })
    setError('')
    window.history.replaceState(null, '', formatLocatorHash(first, second))

    if (fitMap) {
      const combined: Geometry = [
        [Math.min(firstBounds[0][0], secondBounds[0][0]), Math.min(firstBounds[0][1], secondBounds[0][1])],
        [Math.max(firstBounds[1][0], secondBounds[1][0]), Math.max(firstBounds[1][1], secondBounds[1][1])],
      ]
      if (mapProvider === 'yandex') {
        void mapRef.current?.setBounds(combined, { checkZoomRange: true, zoomMargin: 70, duration: 400 })
      } else {
        openStreetMapRef.current?.fitBounds(L.latLngBounds(
          L.latLng(combined[0][0], combined[0][1]),
          L.latLng(combined[1][0], combined[1][1]),
        ), { maxZoom: 13, padding: [36, 36], animate: true })
      }
    }
  }

  useEffect(() => {
    const removeYandexObject = (object: unknown) => {
      if (object && mapRef.current) mapRef.current.geoObjects.remove(object)
    }
    const clearSecondaryOverlays = () => {
      removeYandexObject(secondRectangleRef.current)
      removeYandexObject(routeLineRef.current)
      secondRectangleRef.current = null
      routeLineRef.current = null
      if (openStreetMapRef.current && openStreetMapSecondRectangleRef.current) {
        openStreetMapRef.current.removeLayer(openStreetMapSecondRectangleRef.current)
      }
      if (openStreetMapRef.current && openStreetMapRouteRef.current) {
        openStreetMapRef.current.removeLayer(openStreetMapRouteRef.current)
      }
      openStreetMapSecondRectangleRef.current = null
      openStreetMapRouteRef.current = null
    }

    if (!distanceRoute) {
      clearSecondaryOverlays()
      return
    }

    const { firstBounds, secondBounds, firstCenter, secondCenter } = distanceRoute
    if (mapRef.current && window.ymaps) {
      if (!rectangleRef.current) {
        rectangleRef.current = new window.ymaps.Rectangle(firstBounds, {}, {
          fillColor: '#1747ff2b', fillOpacity: 0.2, strokeColor: '#1747ff', strokeWidth: 2,
        })
        mapRef.current.geoObjects.add(rectangleRef.current)
      } else if ('geometry' in (rectangleRef.current as object)) {
        (rectangleRef.current as { geometry: { setCoordinates: (value: Geometry) => void } }).geometry.setCoordinates(firstBounds)
      }
      if (!secondRectangleRef.current) {
        secondRectangleRef.current = new window.ymaps.Rectangle(secondBounds, {}, {
          fillColor: '#ff9c2730', fillOpacity: 0.2, strokeColor: '#ff9c27', strokeWidth: 2,
        })
        mapRef.current.geoObjects.add(secondRectangleRef.current)
      } else if ('geometry' in (secondRectangleRef.current as object)) {
        (secondRectangleRef.current as { geometry: { setCoordinates: (value: Geometry) => void } }).geometry.setCoordinates(secondBounds)
      }
      const coordinates = [firstCenter, secondCenter].map(([lat, lng]) => [lat, lng])
      if (!routeLineRef.current) {
        routeLineRef.current = new window.ymaps.Polyline(coordinates, {}, {
          strokeColor: '#ff9c27', strokeWidth: 3, strokeOpacity: 0.95,
        })
        mapRef.current.geoObjects.add(routeLineRef.current)
      } else if ('geometry' in (routeLineRef.current as object)) {
        (routeLineRef.current as { geometry: { setCoordinates: (value: number[][]) => void } }).geometry.setCoordinates(coordinates)
      }
    }

    if (openStreetMapRef.current) {
      const firstRectangleBounds = L.latLngBounds(L.latLng(firstBounds[0][0], firstBounds[0][1]), L.latLng(firstBounds[1][0], firstBounds[1][1]))
      const secondRectangleBounds = L.latLngBounds(L.latLng(secondBounds[0][0], secondBounds[0][1]), L.latLng(secondBounds[1][0], secondBounds[1][1]))
      openStreetMapRectangleRef.current?.setBounds(firstRectangleBounds)
      if (!openStreetMapSecondRectangleRef.current) {
        openStreetMapSecondRectangleRef.current = L.rectangle(secondRectangleBounds, {
          color: '#ff9c27', weight: 2, fillColor: '#ff9c27', fillOpacity: 0.18,
        }).addTo(openStreetMapRef.current)
      } else openStreetMapSecondRectangleRef.current.setBounds(secondRectangleBounds)
      if (!openStreetMapRouteRef.current) {
        openStreetMapRouteRef.current = L.polyline([firstCenter, secondCenter], {
          color: '#ff9c27', weight: 3, opacity: 0.95,
        }).addTo(openStreetMapRef.current)
      } else openStreetMapRouteRef.current.setLatLngs([firstCenter, secondCenter])
    }
  }, [distanceRoute, osmReady, yandexReady])

  useEffect(() => {
    if (!MAP_API_KEY) {
      setMapStatus('error')
      return
    }

    const script = document.createElement('script')
    script.src = `https://api-maps.yandex.ru/2.1/?lang=${locale === 'ru' ? 'ru_RU' : 'en_US'}&apikey=${MAP_API_KEY}`
    script.async = true
    script.onload = () => {
      if (!window.ymaps) { setMapStatus('error'); return }
      window.ymaps.ready(() => {
        if (!yandexNode.current || !window.ymaps) return
        const map = new window.ymaps.Map(yandexNode.current, {
          center: [55.17, 61.4], zoom: 11,
          controls: ['zoomControl', 'searchControl', 'typeSelector'],
        }, { suppressMapOpenBlock: true, yandexMapDisablePoiInteractivity: true })
        mapRef.current = map
        setYandexReady(true)
        setMapStatus('ready')
        map.events.add('click', (event) => {
          const coords = event.get('coords') as number[] | undefined
          if (!coords) return
          const next = encodeLocator(coords as [number, number])
          if (searchModeRef.current === 'distance') {
            setSecondLocator(next)
            measureDistance(locatorRef.current, next, false, false)
          } else {
            setLocator(next)
            updateMap(next, false)
          }
        })
        const hash = parseLocatorHash(window.location.hash)
        if (hash?.second) {
          setLocator(hash.first)
          setSecondLocator(hash.second)
          setSearchMode('distance')
          measureDistance(hash.first, hash.second)
        } else {
          const initial = hash?.first ?? (window.location.hash.slice(1) || INITIAL_LOCATOR)
          setLocator(initial.toUpperCase())
          updateMap(initial)
        }
      })
    }
    script.onerror = () => setMapStatus('error')
    document.head.appendChild(script)
    return () => {
      script.remove()
      mapRef.current?.destroy()
      mapRef.current = null
      rectangleRef.current = null
      openStreetMapRef.current?.remove()
      openStreetMapRef.current = null
      openStreetMapRectangleRef.current = null
    }
    // Load the external map once using the initially detected locale.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (mapProvider === 'yandex') {
      void mapRef.current?.setCenter(mapViewRef.current.center, mapViewRef.current.zoom, { duration: 250 })
      return
    }
    if (!openStreetMapNode.current) return
    if (!openStreetMapRef.current) {
      const map = L.map(openStreetMapNode.current, { zoomControl: true, worldCopyJump: true })
        .setView(mapViewRef.current.center, mapViewRef.current.zoom)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map)
      map.on('click', (event) => {
        const next = encodeLocator([event.latlng.lat, event.latlng.lng])
        if (searchModeRef.current === 'distance') {
          setSecondLocator(next)
          measureDistance(locatorRef.current, next, false, false)
        } else {
          setLocator(next)
          updateMap(next, false)
        }
      })
      openStreetMapRef.current = map
      const bounds = decodeLocator(isValidLocator(locator) ? locator : INITIAL_LOCATOR)
      openStreetMapRectangleRef.current = L.rectangle(L.latLngBounds(
        L.latLng(bounds[0][0], bounds[0][1]),
        L.latLng(bounds[1][0], bounds[1][1]),
      ), { color: '#1747ff', weight: 2, fillColor: '#1747ff', fillOpacity: 0.16 }).addTo(map)
      map.on('moveend zoomend', () => {
        const center = map.getCenter()
        mapViewRef.current = { center: [center.lat, center.lng], zoom: map.getZoom() }
      })
      setOsmReady(true)
    }
    requestAnimationFrame(() => openStreetMapRef.current?.invalidateSize())
    // Initialize once on first selection; map and view remain alive while hidden.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapProvider])

  useEffect(() => {
    let refreshTimer: number | undefined

    const clearOverlays = () => {
      if (terminatorRef.current && openStreetMapRef.current) {
        openStreetMapRef.current.removeLayer(terminatorRef.current)
        terminatorRef.current = null
      }
      if (yandexTerminatorRef.current && mapRef.current) {
        mapRef.current.geoObjects.remove(yandexTerminatorRef.current)
        yandexTerminatorRef.current = null
      }
    }

    const drawOverlay = () => {
      clearOverlays()
      const night = terminator({
        time: new Date(), resolution: 2, longitudeRange: 360,
        color: '#18233d', weight: 1, opacity: 0.55,
        fillColor: '#10182a', fillOpacity: 0.42, interactive: false,
      })
      if (mapProvider === 'osm' && openStreetMapRef.current) {
        terminatorRef.current = night.addTo(openStreetMapRef.current)
      } else if (mapProvider === 'yandex' && mapRef.current && window.ymaps) {
        const rings = night.getLatLngs() as L.LatLng[][]
        const ring = (rings[0] ?? []).map(({ lat, lng }) => [lat, lng])
        yandexTerminatorRef.current = new window.ymaps.Polygon([ring], {}, {
          fillColor: '#10182a', fillOpacity: 0.42,
          strokeColor: '#18233d', strokeOpacity: 0.55, strokeWidth: 1,
          interactivityModel: 'default#silent',
        })
        mapRef.current.geoObjects.add(yandexTerminatorRef.current)
      }
    }

    if (!showTerminator) {
      clearOverlays()
      return
    }

    if ((mapProvider === 'osm' && osmReady) || (mapProvider === 'yandex' && yandexReady)) {
      drawOverlay()
      refreshTimer = window.setInterval(drawOverlay, 60_000)
    }
    return () => {
      if (refreshTimer !== undefined) window.clearInterval(refreshTimer)
      clearOverlays()
    }
  }, [mapProvider, osmReady, showTerminator, yandexReady])

  function runSearch(value = locator) {
    const next = value.trim().toUpperCase()
    setLocator(next)
    setDistanceRoute(null)
    updateMap(next)
  }

  function submitLocatorForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (searchMode === 'distance') measureDistance(locator, secondLocator)
    else runSearch()
  }

  function chooseSearchMode() {
    setModeMenuOpen(false)
    setSearchMode('search')
    setSecondLocator('')
    setDistanceRoute(null)
    runSearch()
  }

  function chooseDistanceMode() {
    setModeMenuOpen(false)
    setSearchMode('distance')
    setSecondLocator('')
    setDistanceRoute(null)
    setError('')
  }

  function switchMapProvider(nextProvider: 'yandex' | 'osm') {
    if (nextProvider === mapProvider) return
    if (mapProvider === 'yandex' && mapRef.current) {
      const center = mapRef.current.getCenter()
      mapViewRef.current = { center: [center[0], center[1]], zoom: mapRef.current.getZoom() }
    } else if (mapProvider === 'osm' && openStreetMapRef.current) {
      const center = openStreetMapRef.current.getCenter()
      mapViewRef.current = { center: [center.lat, center.lng], zoom: openStreetMapRef.current.getZoom() }
    }
    setMapProvider(nextProvider)
  }

  async function submitFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const endpoint = import.meta.env.VITE_FEEDBACK_API_URL
    if (!endpoint) {
      setFeedbackStatus('error')
      return
    }
    setFeedbackStatus('sending')
    try {
      const result = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...feedback, locale }),
      })
      if (!result.ok) throw new Error('Submission failed')
      setFeedbackStatus('sent')
      setFeedback({ name: '', email: '', comment: '' })
    } catch {
      setFeedbackStatus('error')
    }
  }

  async function copyShareLink() {
    const value = window.location.href
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value)
      } else {
        const field = document.createElement('textarea')
        field.value = value
        field.setAttribute('readonly', '')
        field.style.position = 'fixed'
        field.style.opacity = '0'
        document.body.appendChild(field)
        field.select()
        const copied = document.execCommand('copy')
        field.remove()
        if (!copied) throw new Error('Clipboard copy failed')
      }
      setCopyStatus(t.copied)
    } catch {
      setCopyStatus(t.copyError)
    }
  }

  const shareUrl = window.location.href
  const shareText = locale === 'ru'
    ? `WWLOC — QTH-локатор ${locator}${distanceRoute ? ` — расстояние до ${secondLocator}` : ''}`
    : `WWLOC — QTH locator ${locator}${distanceRoute ? ` — distance to ${secondLocator}` : ''}`
  const encodedShareText = encodeURIComponent(`${shareText} ${shareUrl}`)
  const socialLinks: Array<{ network: SocialNetwork; color: string; href?: string }> = [
    { network: 'vk', color: '#2787f5', href: `https://vk.com/share.php?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}` },
    { network: 'ok', color: '#f58220', href: `https://connect.ok.ru/offer?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}` },
    { network: 'telegram', color: '#2aabee', href: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}` },
    { network: 'whatsapp', color: '#25d366', href: `https://wa.me/?text=${encodedShareText}` },
    { network: 'facebook', color: '#1877f2', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` },
    { network: 'max', color: '#471aff', href: `https://max.ru/:share?text=${encodedShareText}` },
    { network: 'copy', color: '#565c68' },
  ]

  return <div className="app-shell" id="top">
    <header className="topbar">
      <a className="brand" href="#top" aria-label="WWLOC">WWL<span className="brand-globe" aria-hidden="true">◉</span>C</a>
      <div className="language-switch" role="group" aria-label={locale === 'ru' ? 'Язык сайта' : 'Website language'}>
        <button type="button" lang="ru" aria-pressed={locale === 'ru'} onClick={() => setLocale('ru')}>RU</button>
        <button type="button" lang="en" aria-pressed={locale === 'en'} onClick={() => setLocale('en')}>EN</button>
      </div>
    </header>

    <main id="main-content">
    <h1 className="sr-only">{t.pageTitle}</h1>
    <section className="locator-section" aria-label={t.searchLabel}>
      <p className="locator-hint">{t.searchHint}</p>
      <form className="search-form" onSubmit={submitLocatorForm}>
        <div className="search-input-rows">
          <div className={`search-primary-row${searchMode === 'distance' ? ' distance-mode' : ''}`}>
            <label className="sr-only" htmlFor="locator">{t.searchLabel}</label>
            <input className="search-locator-input" id="locator" value={locator} onChange={(event) => {
              const value = event.target.value.toUpperCase()
              setLocator(value)
              if (searchMode === 'distance') {
                if (isValidLocator(value) && isValidLocator(secondLocator)) measureDistance(value, secondLocator, true, false)
                else setDistanceRoute(null)
              }
            }} placeholder={t.searchLabel} autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={24} />
            {searchMode === 'distance' && <>
              <label className="sr-only" htmlFor="second-locator">{t.secondLocator}</label>
              <input className="search-locator-input second-locator-input" id="second-locator" value={secondLocator} onChange={(event) => {
                const value = event.target.value.toUpperCase()
                setSecondLocator(value)
                if (isValidLocator(locator) && isValidLocator(value)) measureDistance(locator, value, true, false)
                else setDistanceRoute(null)
              }} onBlur={() => {
                if (isValidLocator(locator) && isValidLocator(secondLocator)) measureDistance(locator, secondLocator, true, false)
              }} placeholder={t.secondLocator} autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={24} />
            </>}
            <button className="primary-action" type="submit" aria-label={searchMode === 'distance' ? t.measureButton : t.searchButton}>
              {searchMode === 'distance' ? <RulerIcon /> : <SearchIcon />}
            </button>
            <button className="mode-menu-toggle" type="button" aria-label={locale === 'ru' ? 'Выбрать действие' : 'Choose action'} aria-haspopup="menu" aria-expanded={modeMenuOpen} onClick={() => setModeMenuOpen(!modeMenuOpen)}>
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3 6 5 5 5-5" /></svg>
            </button>
          </div>
        </div>
        {modeMenuOpen && <div className="search-mode-menu" role="menu">
          <button type="button" role="menuitem" onClick={chooseSearchMode}><SearchIcon /><span>{t.searchMode}</span></button>
          <button type="button" role="menuitem" onClick={chooseDistanceMode}><RulerIcon /><span>{t.distanceMode}</span></button>
        </div>}
      </form>
      <p className="error-message" aria-live="polite">{error}</p>
      {distanceRoute && <div className="distance-summary" aria-live="polite">
        <span>{t.distanceBetween}: <strong>{(distanceRoute.distanceMeters / (distanceUnit === 'km' ? 1000 : 1609.344)).toLocaleString(locale === 'ru' ? 'ru-RU' : 'en-US', { maximumFractionDigits: 1 })} {distanceUnit}</strong></span>
        <div className="distance-units" role="group" aria-label={locale === 'ru' ? 'Единица измерения' : 'Distance unit'}>
          <button type="button" aria-label={t.kilometers} aria-pressed={distanceUnit === 'km'} onClick={() => setDistanceUnit('km')}>km</button>
          <button type="button" aria-label={t.miles} aria-pressed={distanceUnit === 'mi'} onClick={() => setDistanceUnit('mi')}>mi</button>
        </div>
      </div>}
      {magnetic && <p className="magnetic-reading" aria-live="polite">
        <span>{t.declination}: <strong>{magnetic.declination > 0 ? '+' : ''}{magnetic.declination.toFixed(2)}°</strong></span>
        <span>{t.inclination}: <strong>{magnetic.inclination > 0 ? '+' : ''}{magnetic.inclination.toFixed(2)}°</strong></span>
        <span className="model-label">{magnetic.model}{magnetic.valid ? '' : ` · ${t.outsideModel}`}</span>
      </p>}
    </section>

    <section className="map-section" aria-label={t.mapLabel}>
      <div className="map-canvas">
        <div className={`map-provider-layer${mapProvider === 'yandex' ? '' : ' map-provider-hidden'}`} aria-hidden={mapProvider !== 'yandex'}>
          <div className="map-frame" ref={yandexNode} role="application" aria-label={t.yandexMaps} />
        </div>
        <div className={`map-provider-layer${mapProvider === 'osm' ? '' : ' map-provider-hidden'}`} aria-hidden={mapProvider !== 'osm'}>
          <div className="map-frame" ref={openStreetMapNode} role="application" aria-label={t.openStreetMap} />
        </div>
        {mapProvider === 'yandex' && mapStatus !== 'ready' && <div className="map-placeholder" role="status">{mapStatus === 'error' ? t.mapError : t.mapLoading}</div>}
      </div>
      <div className="map-controls">
        <div className="map-source-control" role="group" aria-label={t.mapProviderLabel}>
          <button type="button" aria-pressed={mapProvider === 'yandex'} onClick={() => switchMapProvider('yandex')}>{t.yandexMaps}</button>
          <button type="button" aria-pressed={mapProvider === 'osm'} onClick={() => switchMapProvider('osm')}>{t.openStreetMap}</button>
        </div>
        <label className="terminator-control">
          <input type="checkbox" checked={showTerminator} onChange={(event) => setShowTerminator(event.target.checked)} />
          <span className="terminator-check" aria-hidden="true" />
          <span>{t.terminator}</span>
        </label>
      </div>
    </section>

    <section className="about-section" aria-labelledby="about-heading">
      <h2 id="about-heading">{t.aboutTitle}</h2>
      {t.aboutParagraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
      <p className="source-links">{locale === 'ru' ? 'Источники: ' : 'Sources: '}<a href="https://www.iaru-r1.org/wp-content/uploads/2026/02/VHF_Handbook_V10_03_final.pdf" target="_blank" rel="noreferrer">IARU Region 1 VHF Handbook</a> · <a href="https://www.qrz.ru/vhf/qth_h.pdf" target="_blank" rel="noreferrer">{locale === 'ru' ? 'история локаторной системы (QRZ.ru)' : 'locator system history (QRZ.ru)'}</a> · <a href="https://www.arrl.org/grid-squares" target="_blank" rel="noreferrer">ARRL: Grid Squares</a></p>
    </section>

    <section className="community-section">
      <h2>{t.shareTitle}</h2>
      <div className="social-links" aria-label={locale === 'ru' ? 'Поделиться' : 'Share'}>
        {socialLinks.map((link, index) => link.network === 'copy'
          ? <button key={link.network} type="button" onClick={copyShareLink} aria-label={t.share.replace('{network}', t.networks[index])} title={t.networks[index]} style={{ '--social-color': link.color } as React.CSSProperties}><SocialIcon network={link.network} /></button>
          : <a key={link.network} href={link.href} target="_blank" rel="noopener noreferrer" aria-label={t.share.replace('{network}', t.networks[index])} title={t.networks[index]} style={{ '--social-color': link.color } as React.CSSProperties}><SocialIcon network={link.network} /></a>)}
      </div>
      {copyStatus && <p className="share-status" aria-live="polite">{copyStatus}</p>}
      <h2 className="feedback-title">{t.feedbackTitle}</h2>
      <form className="feedback-card" onSubmit={submitFeedback}>
        <p>{t.feedbackIntro}</p>
        <label className="sr-only" htmlFor="feedback-name">{t.name}</label>
        <input id="feedback-name" value={feedback.name} onChange={(event) => setFeedback({ ...feedback, name: event.target.value })} placeholder={t.name} required />
        <label className="sr-only" htmlFor="feedback-email">{t.email}</label>
        <input id="feedback-email" type="email" value={feedback.email} onChange={(event) => setFeedback({ ...feedback, email: event.target.value })} placeholder={t.email} required />
        <label className="sr-only" htmlFor="feedback-comment">{t.comment}</label>
        <textarea id="feedback-comment" value={feedback.comment} onChange={(event) => setFeedback({ ...feedback, comment: event.target.value })} placeholder={t.comment} required rows={5} />
        <button className="send-button" type="submit" disabled={feedbackStatus === 'sending'}>{feedbackStatus === 'sending' ? t.sending : t.send}</button>
        <p className={`feedback-status ${feedbackStatus}`} aria-live="polite">
          {feedbackStatus === 'sent' ? t.sent : feedbackStatus === 'error' ? (import.meta.env.VITE_FEEDBACK_API_URL ? t.submitError : t.backendUnavailable) : ''}
        </p>
      </form>
    </section>
    </main>

    <footer className="footer">
      <div className="footer-row">
        <div className="footer-details">
          <span>{t.footer} <a href="mailto:r8abk@autoradio.club">R8ABK</a> <span aria-hidden="true">·</span> © 2016</span>
          <span>{t.design}</span>
        </div>
        <a className="credit-badge" href="https://letsmakeit.ru" target="_blank" rel="noopener noreferrer" aria-label={`${t.development} Let's make IT — ${locale === 'ru' ? 'открыть сайт' : 'visit website'}`}>
          <img src="/assets/lmi-mark.svg" alt="" width="18" height="18" loading="lazy" />
          <span className="credit-label">{t.development}</span>
          <span className="credit-name">Let's make IT</span>
        </a>
      </div>
    </footer>
  </div>
}

export default App
