import { useEffect, useRef, type RefObject } from 'react'
import L from 'leaflet'
import type { YandexMapInstance } from '../types'
import { decodeLocator, isValidLocator } from '../locatorMath'
import { parseLocatorHash } from '../locatorUrl'
import type { MapView, MapProvider } from './useMapProvider'
import { toLeafletBounds } from '../mapUtils'
import { combineGeometryBounds } from '../geometry'

type MutableRef<T> = { current: T }

type MapRefs = {
  yandex: MutableRef<YandexMapInstance | null>
  view: MutableRef<MapView>
  locatorRectangle: MutableRef<unknown>
  secondRectangle: MutableRef<unknown>
  routeLine: MutableRef<unknown>
  openStreetMap: MutableRef<L.Map | null>
  osmLocatorRectangle: MutableRef<L.Rectangle | null>
  osmSecondRectangle: MutableRef<L.Rectangle | null>
  osmRouteLine: MutableRef<L.Polyline | null>
}

type UseMapLifecycleOptions = {
  apiKey?: string
  locale: string
  provider: MapProvider
  yandexNode: RefObject<HTMLDivElement | null>
  osmNode: RefObject<HTMLDivElement | null>
  initialHash: string
  locator: MutableRef<string>
  refs: MapRefs
  setMapStatus: (status: 'loading' | 'ready' | 'error') => void
  setYandexReady: (ready: boolean) => void
  setOsmReady: (ready: boolean) => void
  onMapClick: (coordinates: [number, number]) => void
  onYandexReady: () => void
}

export function useMapLifecycle(options: UseMapLifecycleOptions): void {
  const latestOptions = useRef(options)
  latestOptions.current = options
  const { refs } = options

  useEffect(() => {
    const { apiKey, locale } = latestOptions.current
    if (!apiKey) {
      latestOptions.current.setMapStatus('error')
      return
    }

    let active = true
    const script = document.createElement('script')
    script.src = `https://api-maps.yandex.ru/2.1/?lang=${locale === 'ru' ? 'ru_RU' : 'en_US'}&apikey=${apiKey}`
    script.async = true
    script.onload = () => {
      if (!window.ymaps) {
        latestOptions.current.setMapStatus('error')
        return
      }

      window.ymaps.ready(() => {
        const current = latestOptions.current
        if (!active || !current.yandexNode.current || !window.ymaps) return
        const map = new window.ymaps.Map(
          current.yandexNode.current,
          {
            center: [55.17, 61.4],
            zoom: 11,
            controls: ['zoomControl', 'searchControl', 'typeSelector']
          },
          { suppressMapOpenBlock: true, yandexMapDisablePoiInteractivity: true }
        )
        current.refs.yandex.current = map
        current.setYandexReady(true)
        current.setMapStatus('ready')
        map.events.add('click', (event) => {
          const coordinates = event.get('coords') as
            [number, number] | undefined
          if (coordinates) latestOptions.current.onMapClick(coordinates)
        })
        latestOptions.current.onYandexReady()
      })
    }
    script.onerror = () => latestOptions.current.setMapStatus('error')
    document.head.appendChild(script)

    return () => {
      active = false
      script.remove()
      refs.yandex.current?.destroy()
      refs.yandex.current = null
      refs.locatorRectangle.current = null
      refs.secondRectangle.current = null
      refs.routeLine.current = null
      refs.openStreetMap.current?.remove()
      refs.openStreetMap.current = null
      refs.osmLocatorRectangle.current = null
      refs.osmSecondRectangle.current = null
      refs.osmRouteLine.current = null
    }
    // Yandex Maps is loaded once; latestOptions keeps event handlers current.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const current = latestOptions.current
    if (current.provider === 'yandex') {
      void refs.yandex.current?.setCenter(
        refs.view.current.center,
        refs.view.current.zoom,
        { duration: 250 }
      )
      return
    }
    if (!current.osmNode.current) return

    if (!refs.openStreetMap.current) {
      const map = L.map(current.osmNode.current, {
        zoomControl: true,
        worldCopyJump: true
      }).setView(refs.view.current.center, refs.view.current.zoom)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map)
      map.on('click', (event) =>
        latestOptions.current.onMapClick([event.latlng.lat, event.latlng.lng])
      )
      refs.openStreetMap.current = map

      const locator = isValidLocator(current.locator.current)
        ? current.locator.current
        : 'MO05QE'
      const bounds = decodeLocator(locator)
      refs.osmLocatorRectangle.current = L.rectangle(toLeafletBounds(bounds), {
        color: '#1747ff',
        weight: 2,
        fillColor: '#1747ff',
        fillOpacity: 0.16
      }).addTo(map)

      const route = parseLocatorHash(current.initialHash)
      const visibleBounds = route?.second
        ? combineGeometryBounds(
            decodeLocator(route.first),
            decodeLocator(route.second)
          )
        : bounds
      map.fitBounds(toLeafletBounds(visibleBounds), {
        maxZoom: 13,
        padding: [36, 36],
        animate: false
      })
      map.on('moveend zoomend', () => {
        const center = map.getCenter()
        refs.view.current = {
          center: [center.lat, center.lng],
          zoom: map.getZoom()
        }
      })
      current.setOsmReady(true)
    }

    requestAnimationFrame(() => refs.openStreetMap.current?.invalidateSize())
    // OSM is initialized once and kept alive while hidden.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.provider])
}
