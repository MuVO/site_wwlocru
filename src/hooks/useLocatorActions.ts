import { useCallback, type Dispatch, type SetStateAction } from 'react'
import L from 'leaflet'
import type { Locale } from '../i18n'
import { messages } from '../i18n'
import {
  centerOfGeometry,
  decodeLocator,
  isValidLocator,
  magneticReading,
  type MagneticReading
} from '../locatorMath'
import { formatLocatorPath } from '../locatorUrl'
import {
  combinedRouteBounds,
  createDistanceRoute,
  type DistanceRoute
} from '../locatorRoute'
import type { Geometry, YandexMapInstance } from '../types'
import { toLeafletBounds } from '../mapUtils'

type MutableRef<T> = { current: T }
type MapProvider = 'yandex' | 'osm'

type UseLocatorActionsOptions = {
  locale: MutableRef<Locale>
  provider: MapProvider
  yandexMap: MutableRef<YandexMapInstance | null>
  yandexRectangle: MutableRef<unknown>
  openStreetMap: MutableRef<L.Map | null>
  osmRectangle: MutableRef<L.Rectangle | null>
  setLocator: Dispatch<SetStateAction<string>>
  setSecondLocator: Dispatch<SetStateAction<string>>
  setRoute: Dispatch<SetStateAction<DistanceRoute | null>>
  setMagnetic: Dispatch<SetStateAction<MagneticReading | null>>
  setSecondMagnetic: Dispatch<SetStateAction<MagneticReading | null>>
  setError: Dispatch<SetStateAction<string>>
}

export function useLocatorActions(options: UseLocatorActionsOptions) {
  const {
    locale,
    provider,
    yandexMap,
    yandexRectangle,
    openStreetMap,
    osmRectangle,
    setLocator,
    setSecondLocator,
    setRoute,
    setMagnetic,
    setSecondMagnetic,
    setError
  } = options

  const updateMap = useCallback(
    (code: string, fitMap = true, updateUrl = true) => {
      try {
        const bounds = decodeLocator(code)
        setMagnetic(magneticReading(centerOfGeometry(bounds)))
        setSecondMagnetic(null)

        const map = yandexMap.current
        if (map) {
          if (fitMap)
            void map.setBounds(bounds, {
              checkZoomRange: true,
              zoomMargin: 70,
              duration: 400
            })
          if (!yandexRectangle.current && window.ymaps) {
            yandexRectangle.current = new window.ymaps.Rectangle(
              bounds,
              {},
              {
                fillColor: '#1747ff2b',
                fillOpacity: 0.2,
                strokeColor: '#1747ff',
                strokeWidth: 2
              }
            )
            map.geoObjects.add(yandexRectangle.current)
          } else if (
            yandexRectangle.current &&
            'geometry' in (yandexRectangle.current as object)
          ) {
            ;(
              yandexRectangle.current as {
                geometry: { setCoordinates: (value: Geometry) => void }
              }
            ).geometry.setCoordinates(bounds)
          }
        }

        const locatorBounds = toLeafletBounds(bounds)
        if (osmRectangle.current) {
          osmRectangle.current.setBounds(locatorBounds)
        } else if (openStreetMap.current) {
          osmRectangle.current = L.rectangle(locatorBounds, {
            color: '#1747ff',
            weight: 2,
            fillColor: '#1747ff',
            fillOpacity: 0.16
          }).addTo(openStreetMap.current)
        }
        if (fitMap)
          openStreetMap.current?.fitBounds(locatorBounds, {
            maxZoom: 13,
            padding: [36, 36],
            animate: true
          })
        setError('')
        if (updateUrl)
          window.history.replaceState(
            null,
            '',
            formatLocatorPath(locale.current, code)
          )
      } catch {
        setError(messages[locale.current].invalidLocator)
      }
    },
    [
      locale,
      openStreetMap,
      osmRectangle,
      setError,
      setMagnetic,
      setSecondMagnetic,
      yandexMap,
      yandexRectangle
    ]
  )

  const measureDistance = useCallback(
    (
      firstValue: string,
      secondValue: string,
      fitMap = true,
      reportError = true
    ) => {
      const route = createDistanceRoute(firstValue, secondValue)
      if (!route) {
        if (reportError) {
          const error = !isValidLocator(firstValue.trim())
            ? messages[locale.current].invalidLocator
            : messages[locale.current].invalidSecondLocator
          setError(error)
        }
        setRoute(null)
        setSecondMagnetic(null)
        return
      }

      setLocator(route.first)
      setSecondLocator(route.second)
      setMagnetic(magneticReading(route.firstCenter))
      setSecondMagnetic(magneticReading(route.secondCenter))
      setRoute(route)
      setError('')
      window.history.replaceState(
        null,
        '',
        formatLocatorPath(locale.current, route.first, route.second)
      )

      if (!fitMap) return
      const combined = combinedRouteBounds(route)
      if (provider === 'yandex') {
        void yandexMap.current?.setBounds(combined, {
          checkZoomRange: true,
          zoomMargin: 70,
          duration: 400
        })
      } else {
        openStreetMap.current?.fitBounds(toLeafletBounds(combined), {
          maxZoom: 13,
          padding: [36, 36],
          animate: true
        })
      }
    },
    [
      locale,
      openStreetMap,
      provider,
      setError,
      setLocator,
      setMagnetic,
      setRoute,
      setSecondLocator,
      setSecondMagnetic,
      yandexMap
    ]
  )

  return { updateMap, measureDistance }
}
