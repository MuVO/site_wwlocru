import { useEffect } from 'react'
import type { Locale, Messages } from '../i18n'
import {
  formatHomePath,
  formatLocatorUrl,
  parseLocatorQuery,
  parseLocatorPath
} from '../locatorUrl'

function setLink(rel: string, href: string, hreflang?: string) {
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]:not([hreflang])`
  let link = document.head.querySelector<HTMLLinkElement>(selector)
  if (!link) {
    link = document.createElement('link')
    link.rel = rel
    if (hreflang) link.hreflang = hreflang
    document.head.append(link)
  }
  link.href = href
}

export function usePageLocale(
  locale: Locale,
  text: Messages,
  pathname: string,
  search: string
): void {
  useEffect(() => {
    document.documentElement.lang = locale
    document.title = text.pageTitle
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', text.pageDescription)
    document
      .querySelector('meta[property="og:title"]')
      ?.setAttribute('content', text.pageTitle)
    document
      .querySelector('meta[property="og:description"]')
      ?.setAttribute('content', text.pageDescription)
    document
      .querySelector('meta[property="og:locale"]')
      ?.setAttribute('content', locale === 'ru' ? 'ru_RU' : 'en_US')
    document
      .querySelector('meta[property="og:locale:alternate"]')
      ?.setAttribute('content', locale === 'ru' ? 'en_US' : 'ru_RU')
    document
      .querySelector('meta[name="twitter:title"]')
      ?.setAttribute('content', text.pageTitle)
    document
      .querySelector('meta[name="twitter:description"]')
      ?.setAttribute('content', text.pageDescription)

    const route = parseLocatorQuery(search) ?? parseLocatorPath(pathname)
    const pathFor = (language: Locale) =>
      route
        ? formatLocatorUrl(language, route.first, route.second)
        : formatHomePath(language)
    const origin = window.location.origin
    const canonical = `${origin}${pathFor(locale)}`
    setLink('canonical', canonical)
    setLink('alternate', `${origin}${pathFor('ru')}`, 'ru')
    setLink('alternate', `${origin}${pathFor('en')}`, 'en')
    setLink('alternate', `${origin}${pathFor('ru')}`, 'x-default')
    document
      .querySelector('meta[property="og:url"]')
      ?.setAttribute('content', canonical)
  }, [locale, pathname, search, text.pageDescription, text.pageTitle])
}
