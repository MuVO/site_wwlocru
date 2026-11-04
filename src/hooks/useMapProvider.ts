import { useRef, useState } from 'react'
import L from 'leaflet'
import type { YandexMapInstance } from '../types'

export type MapProvider = 'yandex' | 'osm'
export type MapView = { center: [number, number]; zoom: number }
type MutableRef<T> = { current: T }

export function useMapProvider(
  hasYandexApiKey: boolean,
  yandexMap: MutableRef<YandexMapInstance | null>,
  openStreetMap: MutableRef<L.Map | null>
) {
  const [provider, setProvider] = useState<MapProvider>(
    hasYandexApiKey ? 'yandex' : 'osm'
  )
  const view = useRef<MapView>({ center: [55.17, 61.4], zoom: 11 })

  function selectProvider(nextProvider: MapProvider) {
    if (nextProvider === provider) return

    if (provider === 'yandex' && yandexMap.current) {
      const center = yandexMap.current.getCenter()
      view.current = {
        center: [center[0], center[1]],
        zoom: yandexMap.current.getZoom()
      }
    } else if (provider === 'osm' && openStreetMap.current) {
      const center = openStreetMap.current.getCenter()
      view.current = {
        center: [center.lat, center.lng],
        zoom: openStreetMap.current.getZoom()
      }
    }

    setProvider(nextProvider)
  }

  return { provider, view, selectProvider }
}
