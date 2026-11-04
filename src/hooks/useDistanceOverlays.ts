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

    const { firstBounds, secondBounds, firstCenter, secondCenter } = route
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
          fillColor: '#ff9c2730',
          fillOpacity: 0.2,
          strokeColor: '#ff9c27',
          strokeWidth: 2
        }
      )

      const coordinates = [firstCenter, secondCenter].map(([lat, lng]) => [
        lat,
        lng
      ])
      if (!yandexRouteLine.current) {
        yandexRouteLine.current = new window.ymaps.Polyline(
          coordinates,
          {},
          {
            strokeColor: '#ff9c27',
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
          color: '#ff9c27',
          weight: 2,
          fillColor: '#ff9c27',
          fillOpacity: 0.18
        }).addTo(openStreetMap.current)
      } else osmSecondRectangle.current.setBounds(secondCell)

      if (!osmRouteLine.current) {
        osmRouteLine.current = L.polyline([firstCenter, secondCenter], {
          color: '#ff9c27',
          weight: 3,
          opacity: 0.95
        }).addTo(openStreetMap.current)
      } else osmRouteLine.current.setLatLngs([firstCenter, secondCenter])
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
