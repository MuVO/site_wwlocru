import { describe, expect, it } from 'vitest'
import { combineGeometryBounds } from './geometry'

describe('geometry helpers', () => {
  it('combines bounds into the smallest rectangle containing both', () => {
    expect(
      combineGeometryBounds(
        [
          [10, 20],
          [12, 23]
        ],
        [
          [8, 22],
          [15, 30]
        ]
      )
    ).toEqual([
      [8, 20],
      [15, 30]
    ])
  })
})
