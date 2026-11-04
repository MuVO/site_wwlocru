import { describe, expect, it } from 'vitest'
import { formatLocatorHash, parseLocatorHash } from './locatorUrl'

describe('locator URL hashes', () => {
  it('parses search and distance hashes case-insensitively', () => {
    expect(parseLocatorHash('#ab12cd')).toEqual({ first: 'AB12CD' })
    expect(parseLocatorHash('ab12cd:ef34gh')).toEqual({
      first: 'AB12CD',
      second: 'EF34GH'
    })
  })

  it('rejects malformed locator hashes', () => {
    expect(parseLocatorHash('#AB12CD:')).toBeNull()
    expect(parseLocatorHash('#AB12CD:KO85BC:FN31PR')).toBeNull()
    expect(parseLocatorHash('#not-a-locator')).toBeNull()
  })

  it('formats canonical uppercase search and distance hashes', () => {
    expect(formatLocatorHash('mo05qe')).toBe('#MO05QE')
    expect(formatLocatorHash('mo05qe', 'ko85bc')).toBe('#MO05QE:KO85BC')
  })
})
