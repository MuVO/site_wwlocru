import { describe, expect, it } from 'vitest'
import {
  calculatePath,
  centerOf,
  centerOfGeometry,
  centerOfLocator,
  decodeLocator,
  distanceBetween,
  distanceBetweenLocators,
  encodeLocator,
  isValidLocator,
  magneticReading
} from './locatorMath'

describe('Maidenhead / QTH locator conversions', () => {
  it('encodes and decodes the Chelyabinsk locator used by the prototype', () => {
    const locator = 'MO05QE'
    const geometry = decodeLocator(locator)
    expect(encodeLocator([55.18, 61.38])).toBe(locator)
    expect(geometry[0][0]).toBeCloseTo(55 + 10 / 60, 10)
    expect(geometry[0][1]).toBeCloseTo(61 + 20 / 60, 10)
    expect(geometry[1][0]).toBeCloseTo(55 + 12.5 / 60, 10)
    expect(geometry[1][1]).toBeCloseTo(61 + 25 / 60, 10)
  })

  it('supports all locator precisions up to 12 characters', () => {
    const point: [number, number] = [55.187, 61.374]
    for (const precision of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
      const locator = encodeLocator(point, precision)
      expect(locator).toHaveLength(precision * 2)
      expect(isValidLocator(locator)).toBe(true)
      const center = centerOfLocator(locator)
      expect(encodeLocator(center, precision)).toBe(locator)
    }
  })

  it('handles world limits, including the exclusive north/east upper edges', () => {
    expect(encodeLocator([-90, -180], 1)).toBe('AA')
    expect(encodeLocator([90, 180], 1)).toBe('RR')
    expect(decodeLocator('RR')[1][0]).toBeLessThanOrEqual(90)
    expect(decodeLocator('RR')[1][1]).toBeLessThanOrEqual(180)
    expect(() => encodeLocator([90.1, 0])).toThrow(RangeError)
    expect(() => encodeLocator([0, -181])).toThrow(RangeError)
  })

  it('rejects malformed and incomplete locators', () => {
    for (const locator of ['', 'M005qe', 'ZZ00aa', 'MO05q1', 'MO05qe12345']) {
      expect(isValidLocator(locator)).toBe(false)
      expect(() => decodeLocator(locator)).toThrow()
    }
  })

  it('accepts mixed-case notation and extended even-length IARU locators', () => {
    expect(isValidLocator('JN18du55ix')).toBe(true)
    expect(decodeLocator('JN18du55ix')).toEqual(decodeLocator('JN18DU55IX'))
    expect(encodeLocator(centerOfLocator('JN18DU55IX'), 5)).toBe('JN18DU55IX')
    expect(isValidLocator('JN18DU55IX4')).toBe(false)
    expect(isValidLocator('JN18DU55IX00'.repeat(3))).toBe(false)
  })

  it('centres both locator cells and explicit geometry bounds', () => {
    const bounds = decodeLocator('MO05qe')
    expect(centerOfLocator('MO05qe')).toEqual(centerOfGeometry(bounds))
    expect(centerOf(bounds)).toEqual(centerOfGeometry(bounds))
    expect(centerOf('MO05qe')).toEqual(centerOfGeometry(bounds))
    expect(centerOf([55.18, 61.38])).toEqual(centerOfLocator('MO05qe'))
  })
})

describe('great-circle distance and bearings', () => {
  it('calculates one degree along the equator and reverse bearings', () => {
    const result = distanceBetween([0, 0], [0, 1])
    expect(result.distance).toBeCloseTo(111_194.93, 1)
    expect(result.azimuth.start).toBeCloseTo(90, 8)
    expect(result.azimuth.final).toBeCloseTo(270, 8)
  })

  it('handles identical coordinates and locator-to-locator distance', () => {
    const same = distanceBetween([37, -122], [37, -122])
    expect(same.distance).toBe(0)
    expect(same.azimuth.start).toBe(0)
    expect(distanceBetweenLocators('MO05qe', 'MO05qe').distance).toBe(0)
  })

  it('builds a multi-stop route with segment distances', () => {
    const route = calculatePath(['MO05qe', 'MO06qe', [56.2, 61.5]])
    expect(route.path).toHaveLength(3)
    expect(route.path.map((point) => point.name)).toEqual([
      'MO05QE',
      'MO06QE',
      'MO06SE'
    ])
    expect(route.distance).toBeGreaterThan(0)
    expect(route.start?.azimuth).toBeDefined()
    expect(route.final?.azimuth).toBeDefined()
    expect(calculatePath(['MO05qe']).distance).toBe(0)
  })
})

describe('WMM2025 magnetic field', () => {
  it('matches NOAA/NCEI 2025 test values for declination and inclination', () => {
    const result = magneticReading([80, 0], new Date('2025-01-01T00:00:00Z'))
    expect(result.declination).toBeCloseTo(1.28, 2)
    expect(result.inclination).toBeCloseTo(83.21, 2)
    expect(result.model).toBe('WMM2025')
    expect(result.valid).toBe(true)
  })

  it('computes the current magnetic field at a locator centre', () => {
    const result = magneticReading(centerOfLocator('MO05qe'))
    expect(Number.isFinite(result.declination)).toBe(true)
    expect(Number.isFinite(result.inclination)).toBe(true)
    expect(result.valid).toBe(true)
  })
})
