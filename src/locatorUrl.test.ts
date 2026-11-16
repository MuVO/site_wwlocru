import { describe, expect, it } from 'vitest'
import {
  formatHomePath,
  formatLocatorHash,
  formatLocatorPath,
  formatLocatorUrl,
  localeFromPath,
  parseLocatorHash,
  parseLocatorPath,
  parseLocatorQuery
} from './locatorUrl'

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

describe('pathname routes', () => {
  it('parses Russian default and explicit English locator and distance routes', () => {
    expect(parseLocatorPath('/locator/mo05qe')).toEqual({ first: 'MO05QE' })
    expect(parseLocatorPath('/en/locator/MO05QE')).toEqual({ first: 'MO05QE' })
    expect(parseLocatorPath('/distance/mo05qe:ko85bc')).toEqual({
      first: 'MO05QE',
      second: 'KO85BC'
    })
    expect(parseLocatorPath('/en/distance/MO05QE:KO85BC/')).toEqual({
      first: 'MO05QE',
      second: 'KO85BC'
    })
  })

  it('rejects malformed route paths and formats localized paths', () => {
    expect(parseLocatorPath('/en/distance/MO05QE')).toBeNull()
    expect(parseLocatorPath('/locator/not-a-grid')).toBeNull()
    expect(formatLocatorPath('ru', 'mo05qe')).toBe('/locator/MO05QE')
    expect(formatLocatorPath('en', 'mo05qe', 'ko85bc')).toBe(
      '/en/distance/MO05QE:KO85BC'
    )
    expect(formatHomePath('ru')).toBe('/')
    expect(formatHomePath('en')).toBe('/en/')
  })

  it('uses Russian unless the URL explicitly selects English', () => {
    expect(localeFromPath('/locator/MO05QE')).toBe('ru')
    expect(localeFromPath('/en/distance/MO05QE:KO85BC')).toBe('en')
  })
})

describe('query-string routes', () => {
  it('parses localized locator and distance parameters', () => {
    expect(parseLocatorQuery('?locator=mo05qe')).toEqual({ first: 'MO05QE' })
    expect(parseLocatorQuery('?from=mo05qe&to=ko85bc')).toEqual({
      first: 'MO05QE',
      second: 'KO85BC'
    })
    expect(
      parseLocatorQuery('?from=MO05QE&to=KO85BC&utm_source=share')
    ).toEqual({
      first: 'MO05QE',
      second: 'KO85BC'
    })
  })

  it('rejects incomplete, invalid, or duplicate route parameters', () => {
    expect(parseLocatorQuery('?locator=invalid')).toBeNull()
    expect(parseLocatorQuery('?from=MO05QE')).toBeNull()
    expect(
      parseLocatorQuery('?locator=MO05QE&from=KO85BC&to=KO85BC')
    ).toBeNull()
    expect(parseLocatorQuery('?locator=MO05QE&locator=KO85BC')).toBeNull()
  })

  it('formats query routes under the localized landing pages', () => {
    expect(formatLocatorUrl('ru', 'mo05qe')).toBe('/?locator=MO05QE')
    expect(formatLocatorUrl('en', 'mo05qe')).toBe('/en/?locator=MO05QE')
    expect(formatLocatorUrl('ru', 'mo05qe', 'ko85bc')).toBe(
      '/?from=MO05QE&to=KO85BC'
    )
    expect(formatLocatorUrl('en', 'mo05qe', 'ko85bc')).toBe(
      '/en/?from=MO05QE&to=KO85BC'
    )
  })
})
