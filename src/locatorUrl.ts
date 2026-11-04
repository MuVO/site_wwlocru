import { isValidLocator } from './locatorMath'

export interface LocatorHash {
  first: string
  second?: string
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
