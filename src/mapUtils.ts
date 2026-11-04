import L from 'leaflet'
import type { Geometry } from './types'

export function toLeafletBounds(bounds: Geometry): L.LatLngBounds {
  return L.latLngBounds(
    L.latLng(bounds[0][0], bounds[0][1]),
    L.latLng(bounds[1][0], bounds[1][1])
  )
}
