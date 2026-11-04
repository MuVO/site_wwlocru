import { useEffect, useRef, type RefObject } from 'react'
import L from 'leaflet'
import terminator from '@joergdietrich/leaflet.terminator'
import type { YandexMapInstance } from '../types'

type MapProvider = 'yandex' | 'osm'

type UseTerminatorOverlayOptions = {
  provider: MapProvider
  enabled: boolean
  yandexReady: boolean
  osmReady: boolean
  yandexMap: RefObject<YandexMapInstance | null>
  openStreetMap: RefObject<L.Map | null>
}

export function useTerminatorOverlay({
  provider,
  enabled,
  yandexReady,
  osmReady,
  yandexMap,
  openStreetMap
}: UseTerminatorOverlayOptions): void {
  const leafletLayer = useRef<ReturnType<typeof terminator> | null>(null)
  const yandexLayer = useRef<unknown>(null)

  useEffect(() => {
    const clearOverlays = () => {
      if (leafletLayer.current && openStreetMap.current) {
        openStreetMap.current.removeLayer(leafletLayer.current)
      }
      leafletLayer.current = null

      if (yandexLayer.current && yandexMap.current) {
        yandexMap.current.geoObjects.remove(yandexLayer.current)
      }
      yandexLayer.current = null
    }

    if (!enabled) {
      clearOverlays()
      return
    }

    const providerReady = provider === 'osm' ? osmReady : yandexReady
    if (!providerReady) return

    const drawOverlay = () => {
      clearOverlays()
      const night = terminator({
        time: new Date(),
        resolution: 2,
        longitudeRange: 360,
        color: '#18233d',
        weight: 1,
        opacity: 0.55,
        fillColor: '#10182a',
        fillOpacity: 0.42,
        interactive: false
      })

      if (provider === 'osm' && openStreetMap.current) {
        leafletLayer.current = night.addTo(openStreetMap.current)
      } else if (provider === 'yandex' && yandexMap.current && window.ymaps) {
        const rings = night.getLatLngs() as L.LatLng[][]
        const coordinates = (rings[0] ?? []).map(({ lat, lng }) => [lat, lng])
        yandexLayer.current = new window.ymaps.Polygon(
          [coordinates],
          {},
          {
            fillColor: '#10182a',
            fillOpacity: 0.42,
            strokeColor: '#18233d',
            strokeOpacity: 0.55,
            strokeWidth: 1,
            interactivityModel: 'default#silent'
          }
        )
        yandexMap.current.geoObjects.add(yandexLayer.current)
      }
    }

    drawOverlay()
    const refreshTimer = window.setInterval(drawOverlay, 60_000)
    return () => {
      window.clearInterval(refreshTimer)
      clearOverlays()
    }
  }, [enabled, openStreetMap, osmReady, provider, yandexMap, yandexReady])
}
