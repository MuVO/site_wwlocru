import { isValidLocator } from './locatorMath'

export interface LocatorHash {
  first: string
  second?: string
}

export type LocatorPath = LocatorHash

export function parseLocatorPath(pathname: string): LocatorPath | null {
  const match = pathname.match(
    /^\/(?:(en|ru)\/)?(locator|distance)\/([^/]+)\/?$/i
  )
  if (!match) return null

  const mode = match[2].toLowerCase()
  const value = match[3].split(':')
  if (mode === 'locator' && value.length === 1 && isValidLocator(value[0])) {
    return { first: value[0].toUpperCase() }
  }
  if (
    mode === 'distance' &&
    value.length === 2 &&
    value.every(isValidLocator)
  ) {
    return { first: value[0].toUpperCase(), second: value[1].toUpperCase() }
  }
  return null
}

export function localeFromPath(pathname: string): 'ru' | 'en' {
  return /^\/en(?:\/|$)/i.test(pathname) ? 'en' : 'ru'
}

export function parseLocatorQuery(search: string): LocatorPath | null {
  const params = new URLSearchParams(search)
  const locatorValues = params.getAll('locator')
  const fromValues = params.getAll('from')
  const toValues = params.getAll('to')

  if (
    locatorValues.length === 1 &&
    fromValues.length === 0 &&
    toValues.length === 0 &&
    isValidLocator(locatorValues[0])
  ) {
    return { first: locatorValues[0].toUpperCase() }
  }
  if (
    locatorValues.length === 0 &&
    fromValues.length === 1 &&
    toValues.length === 1 &&
    isValidLocator(fromValues[0]) &&
    isValidLocator(toValues[0])
  ) {
    return {
      first: fromValues[0].toUpperCase(),
      second: toValues[0].toUpperCase()
    }
  }
  return null
}

export function formatLocatorPath(
  locale: 'ru' | 'en',
  first: string,
  second?: string
): string {
  const prefix = locale === 'en' ? '/en' : ''
  return second
    ? `${prefix}/distance/${first.toUpperCase()}:${second.toUpperCase()}`
    : `${prefix}/locator/${first.toUpperCase()}`
}

export function formatLocatorUrl(
  locale: 'ru' | 'en',
  first: string,
  second?: string
): string {
  const home = formatHomePath(locale)
  return second
    ? `${home}?from=${first.toUpperCase()}&to=${second.toUpperCase()}`
    : `${home}?locator=${first.toUpperCase()}`
}

export function formatHomePath(locale: 'ru' | 'en'): string {
  return locale === 'en' ? '/en/' : '/'
}

export function parseLocatorHash(hash: string): LocatorHash | null {
  const parts = hash.replace(/^#/, '').split(':')
  if (parts.length === 1 && isValidLocator(parts[0])) {
    return { first: parts[0].toUpperCase() }
  }
  if (parts.length === 2 && parts.every(isValidLocator)) {
    return { first: parts[0].toUpperCase(), second: parts[1].toUpperCase() }
  }
  return null
}

export function formatLocatorHash(first: string, second?: string): string {
  return `#${first.toUpperCase()}${second ? `:${second.toUpperCase()}` : ''}`
}
