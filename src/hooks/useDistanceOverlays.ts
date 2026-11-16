import { useEffect } from 'react'
import L from 'leaflet'
import type { DistanceRoute } from '../locatorRoute'
import type { Geometry, YandexMapInstance } from '../types'
import { toLeafletBounds } from '../mapUtils'

type MutableRef<T> = { current: T }

type UseDistanceOverlaysOptions = {
  route: DistanceRoute | null
  yandexReady: boolean
  osmReady: boolean
  yandexMap: MutableRef<YandexMapInstance | null>
  openStreetMap: MutableRef<L.Map | null>
  yandexLocatorRectangle: MutableRef<unknown>
  yandexSecondRectangle: MutableRef<unknown>
  yandexRouteLine: MutableRef<unknown>
  osmLocatorRectangle: MutableRef<L.Rectangle | null>
  osmSecondRectangle: MutableRef<L.Rectangle | null>
  osmRouteLine: MutableRef<L.Polyline | null>
}

export function useDistanceOverlays(options: UseDistanceOverlaysOptions): void {
  const {
    route,
    yandexReady,
    osmReady,
    yandexMap,
    openStreetMap,
    yandexLocatorRectangle,
    yandexSecondRectangle,
    yandexRouteLine,
    osmLocatorRectangle,
    osmSecondRectangle,
    osmRouteLine
  } = options

  useEffect(() => {
    const removeYandexObject = (object: unknown) => {
      if (object && yandexMap.current)
        yandexMap.current.geoObjects.remove(object)
    }

    const clearSecondaryOverlays = () => {
      removeYandexObject(yandexSecondRectangle.current)
      removeYandexObject(yandexRouteLine.current)
      yandexSecondRectangle.current = null
      yandexRouteLine.current = null

      if (openStreetMap.current && osmSecondRectangle.current) {
        openStreetMap.current.removeLayer(osmSecondRectangle.current)
      }
      if (openStreetMap.current && osmRouteLine.current) {
        openStreetMap.current.removeLayer(osmRouteLine.current)
      }
      osmSecondRectangle.current = null
      osmRouteLine.current = null
    }

    if (!route) {
      clearSecondaryOverlays()
      return
    }

    const { firstBounds, secondBounds, path } = route
    if (yandexReady && yandexMap.current && window.ymaps) {
      setYandexRectangle(
        yandexMap.current,
        yandexLocatorRectangle,
        firstBounds,
        {
          fillColor: '#1747ff2b',
          fillOpacity: 0.2,
          strokeColor: '#1747ff',
          strokeWidth: 2
        }
      )
      setYandexRectangle(
        yandexMap.current,
        yandexSecondRectangle,
        secondBounds,
        {
          fillColor: '#ef334033',
          fillOpacity: 0.2,
          strokeColor: '#ef3340',
          strokeWidth: 2
        }
      )

      const coordinates = path.map(([lat, lng]) => [lat, lng])
      if (!yandexRouteLine.current) {
        yandexRouteLine.current = new window.ymaps.Polyline(
          coordinates,
          {},
          {
            strokeColor: '#ef3340',
            strokeWidth: 3,
            strokeOpacity: 0.95
          }
        )
        yandexMap.current.geoObjects.add(yandexRouteLine.current)
      } else if ('geometry' in (yandexRouteLine.current as object)) {
        ;(
          yandexRouteLine.current as {
            geometry: { setCoordinates: (value: number[][]) => void }
          }
        ).geometry.setCoordinates(coordinates)
      }
    }

    if (osmReady && openStreetMap.current) {
      const firstCell = toLeafletBounds(firstBounds)
      const secondCell = toLeafletBounds(secondBounds)
      osmLocatorRectangle.current?.setBounds(firstCell)

      if (!osmSecondRectangle.current) {
        osmSecondRectangle.current = L.rectangle(secondCell, {
          color: '#ef3340',
          weight: 2,
          fillColor: '#ef3340',
          fillOpacity: 0.18
        }).addTo(openStreetMap.current)
      } else osmSecondRectangle.current.setBounds(secondCell)

      if (!osmRouteLine.current) {
        osmRouteLine.current = L.polyline(path, {
          color: '#ef3340',
          weight: 3,
          opacity: 0.95,
          smoothFactor: 0.1
        }).addTo(openStreetMap.current)
      } else osmRouteLine.current.setLatLngs(path)
    }
  }, [
    route,
    yandexReady,
    osmReady,
    yandexMap,
    openStreetMap,
    yandexLocatorRectangle,
    yandexSecondRectangle,
    yandexRouteLine,
    osmLocatorRectangle,
    osmSecondRectangle,
    osmRouteLine
  ])
}

function setYandexRectangle(
  map: YandexMapInstance,
  reference: MutableRef<unknown>,
  bounds: Geometry,
  options: Record<string, unknown>
): void {
  if (!reference.current && window.ymaps) {
    reference.current = new window.ymaps.Rectangle(bounds, {}, options)
    map.geoObjects.add(reference.current)
  } else if (reference.current && 'geometry' in (reference.current as object)) {
    ;(
      reference.current as {
        geometry: { setCoordinates: (value: Geometry) => void }
      }
    ).geometry.setCoordinates(bounds)
  }
}
