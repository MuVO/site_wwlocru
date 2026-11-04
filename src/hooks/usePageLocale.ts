import { useEffect } from 'react'
import type { Locale, Messages } from '../i18n'

export function usePageLocale(locale: Locale, text: Messages): void {
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
      .querySelector('meta[name="twitter:title"]')
      ?.setAttribute('content', text.pageTitle)
    document
      .querySelector('meta[name="twitter:description"]')
      ?.setAttribute('content', text.pageDescription)

    try {
      window.localStorage.setItem('wwloc-locale', locale)
    } catch {
      // Storage is optional; the current locale remains available in React state.
    }
  }, [locale, text.pageDescription, text.pageTitle])
}
