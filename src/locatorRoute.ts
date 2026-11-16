import {
  centerOfGeometry,
  decodeLocator,
  distanceBetween,
  isValidLocator,
  type DistanceResult,
  type Coordinates,
  type LocatorGeometry
} from './locatorMath'
import type { Geometry } from './types'

export interface DistanceRoute {
  first: string
  second: string
  firstBounds: LocatorGeometry
  secondBounds: LocatorGeometry
  firstCenter: Coordinates
  secondCenter: Coordinates
  distanceMeters: number
  azimuth: DistanceResult['azimuth']
}

export function createDistanceRoute(
  firstValue: string,
  secondValue: string
): DistanceRoute | null {
  const first = firstValue.trim().toUpperCase()
  const second = secondValue.trim().toUpperCase()
  if (!isValidLocator(first) || !isValidLocator(second)) return null

  const firstBounds = decodeLocator(first)
  const secondBounds = decodeLocator(second)
  const firstCenter = centerOfGeometry(firstBounds)
  const secondCenter = centerOfGeometry(secondBounds)
  const distance = distanceBetween(firstCenter, secondCenter)

  return {
    first,
    second,
    firstBounds,
    secondBounds,
    firstCenter,
    secondCenter,
    distanceMeters: distance.distance,
    azimuth: distance.azimuth
  }
}

export function combinedRouteBounds(route: DistanceRoute): Geometry {
  return [
    [
      Math.min(route.firstBounds[0][0], route.secondBounds[0][0]),
      Math.min(route.firstBounds[0][1], route.secondBounds[0][1])
    ],
    [
      Math.max(route.firstBounds[1][0], route.secondBounds[1][0]),
      Math.max(route.firstBounds[1][1], route.secondBounds[1][1])
    ]
  ]
}
