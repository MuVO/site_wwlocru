import type { Geometry } from './types'

export function combineGeometryBounds(
  first: Geometry,
  second: Geometry
): Geometry {
  return [
    [Math.min(first[0][0], second[0][0]), Math.min(first[0][1], second[0][1])],
    [Math.max(first[1][0], second[1][0]), Math.max(first[1][1], second[1][1])]
  ]
}
