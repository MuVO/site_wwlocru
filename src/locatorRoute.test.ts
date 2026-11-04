import { describe, expect, it } from 'vitest'
import { createDistanceRoute, combinedRouteBounds } from './locatorRoute'

describe('locator distance routes', () => {
  it('normalizes locators and computes center-to-center distance', () => {
    const route = createDistanceRoute('mo05qe', 'ko85bc')
    expect(route).not.toBeNull()
    expect(route?.first).toBe('MO05QE')
    expect(route?.second).toBe('KO85BC')
    expect(route?.distanceMeters).toBeGreaterThan(0)
  })

  it('returns null when either locator is invalid', () => {
    expect(createDistanceRoute('invalid', 'KO85BC')).toBeNull()
    expect(createDistanceRoute('MO05QE', '')).toBeNull()
  })

  it('combines full bounds of both locator cells', () => {
    const route = createDistanceRoute('MO05QE', 'KO85BC')!
    const bounds = combinedRouteBounds(route)
    expect(bounds[0][0]).toBe(
      Math.min(route.firstBounds[0][0], route.secondBounds[0][0])
    )
    expect(bounds[0][1]).toBe(
      Math.min(route.firstBounds[0][1], route.secondBounds[0][1])
    )
    expect(bounds[1][0]).toBe(
      Math.max(route.firstBounds[1][0], route.secondBounds[1][0])
    )
    expect(bounds[1][1]).toBe(
      Math.max(route.firstBounds[1][1], route.secondBounds[1][1])
    )
  })
})
