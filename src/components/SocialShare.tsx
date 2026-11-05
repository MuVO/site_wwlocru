import { useState } from 'react'
import type { CSSProperties } from 'react'
import type { Locale, Messages } from '../i18n'

type SocialNetwork =
  'vk' | 'ok' | 'telegram' | 'whatsapp' | 'facebook' | 'max' | 'copy'
type ShareLink = { network: SocialNetwork; color: string; href?: string }
type SocialShareProps = {
  locale: Locale
  locator: string
  secondLocator: string
  isDistanceMode: boolean
  t: Messages
}

function SocialIcon({ network }: { network: SocialNetwork }) {
  if (network === 'vk')
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M3.3 7.2h3.1c.2 4.2 1.9 6 3.2 6.4V7.2h2.9v3.6c1.3-.1 2.7-1.8 3.2-3.6h2.9a7.2 7.2 0 0 1-2.9 4.7 7.5 7.5 0 0 1 3.5 4.9h-3.2c-.6-1.8-1.9-3.2-3.5-3.3v3.3h-.4c-5.3 0-8.4-3.6-8.8-9.6Z"
        />
      </svg>
    )
  if (network === 'ok')
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 3.5a4.2 4.2 0 1 0 0 8.4 4.2 4.2 0 0 0 0-8.4Zm0 2.7a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm-3.1 7.4a1.35 1.35 0 0 0-1.8.5 1.35 1.35 0 0 0 .5 1.8 8.1 8.1 0 0 0 2.4 1l-2.1 2.1a1.35 1.35 0 0 0 1.9 1.9l2.2-2.2 2.2 2.2a1.35 1.35 0 0 0 1.9-1.9L14 16.9a8.1 8.1 0 0 0 2.4-1 1.35 1.35 0 0 0-1.3-2.4 6.5 6.5 0 0 1-6.2.1Z"
        />
      </svg>
    )
  if (network === 'telegram')
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="m21.5 4.5-3.2 15c-.2 1.1-.8 1.4-1.7.9l-4.8-3.6-2.3 2.2c-.3.3-.5.5-1 .5l.4-4.9 8.9-8c.4-.4-.1-.6-.6-.2L6.2 13.5l-4.7-1.5c-1-.3-1-1 .2-1.5L20 3.4c.8-.3 1.7.2 1.5 1.1Z"
        />
      </svg>
    )
  if (network === 'whatsapp')
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 2.2a9.6 9.6 0 0 0-8.2 14.6L2.5 22l5.3-1.4A9.6 9.6 0 1 0 12 2.2Zm0 2a7.6 7.6 0 0 1 0 15.2 7.5 7.5 0 0 1-3.8-1l-.4-.2-2.6.7.7-2.5-.3-.4A7.6 7.6 0 0 1 12 4.2Zm-3.1 3c-.2 0-.5.1-.7.4-.2.2-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.8 2.9 4.4 3.9 2.2.9 2.6.7 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2-.1-.1-.2-.2-.5-.3l-1.7-.8c-.2-.1-.4-.1-.6.2-.2.3-.7.8-.9 1-.2.2-.3.2-.6.1-.3-.1-1.1-.4-2-1.2-.7-.6-1.2-1.4-1.3-1.7-.1-.3 0-.4.1-.6l.4-.4.3-.5c.1-.2 0-.4 0-.5l-.8-1.8c-.2-.5-.4-.6-.7-.6Z"
        />
      </svg>
    )
  if (network === 'facebook')
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M13.7 21v-8h2.8l.4-3.1h-3.2v-2c0-.9.3-1.5 1.6-1.5H17V3.6c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.1H7.5V13h2.8v8h3.4Z"
        />
      </svg>
    )
  if (network === 'max')
    return (
      <img
        className="max-social-icon"
        src="/assets/icons/max-logo.svg"
        alt=""
      />
    )
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="8" y="8" width="12" height="13" rx="2" />
      <path d="M16 8V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h2" />
    </svg>
  )
}

async function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }

  const field = document.createElement('textarea')
  field.value = value
  field.setAttribute('readonly', '')
  field.style.position = 'fixed'
  field.style.opacity = '0'
  document.body.appendChild(field)
  try {
    field.select()
    if (!document.execCommand('copy')) throw new Error('Clipboard copy failed')
  } finally {
    field.remove()
  }
}

function createShareLinks(url: string, text: string): ShareLink[] {
  const encodedUrl = encodeURIComponent(url)
  const encodedText = encodeURIComponent(text)
  const encodedMessage = encodeURIComponent(`${text} ${url}`)

  return [
    {
      network: 'vk',
      color: '#2787f5',
      href: `https://vk.com/share.php?url=${encodedUrl}&title=${encodedText}`
    },
    {
      network: 'ok',
      color: '#f58220',
      href: `https://connect.ok.ru/offer?url=${encodedUrl}&title=${encodedText}`
    },
    {
      network: 'telegram',
      color: '#2aabee',
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`
    },
    {
      network: 'whatsapp',
      color: '#25d366',
      href: `https://wa.me/?text=${encodedMessage}`
    },
    {
      network: 'facebook',
      color: '#1877f2',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
    },
    {
      network: 'max',
      color: '#471aff',
      href: `https://max.ru/:share?text=${encodedMessage}`
    },
    { network: 'copy', color: '#565c68' }
  ]
}

export function SocialShare({
  locale,
  locator,
  secondLocator,
  isDistanceMode,
  t
}: SocialShareProps) {
  const [copyStatus, setCopyStatus] = useState('')
  const url = window.location.href
  const text =
    locale === 'ru'
      ? `WWLOC — QTH-локатор ${locator}${isDistanceMode ? ` — расстояние до ${secondLocator}` : ''}`
      : `WWLOC — QTH locator ${locator}${isDistanceMode ? ` — distance to ${secondLocator}` : ''}`
  const links = createShareLinks(url, text)

  async function handleCopy() {
    try {
      await copyText(url)
      setCopyStatus(t.copied)
    } catch {
      setCopyStatus(t.copyError)
    }
  }

  return (
    <>
      <h2>{t.shareTitle}</h2>
      <div
        className="social-links"
        aria-label={locale === 'ru' ? 'Поделиться' : 'Share'}
      >
        {links.map((link, index) => {
          const label = t.share.replace('{network}', t.networks[index])
          const style = { '--social-color': link.color } as CSSProperties
          const icon = <SocialIcon network={link.network} />

          return link.network === 'copy' ? (
            <button
              key={link.network}
              type="button"
              onClick={handleCopy}
              aria-label={label}
              title={t.networks[index]}
              style={style}
            >
              {icon}
            </button>
          ) : (
            <a
              key={link.network}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              title={t.networks[index]}
              style={style}
            >
              {icon}
            </a>
          )
        })}
      </div>
      {copyStatus && (
        <p className="share-status" aria-live="polite">
          {copyStatus}
        </p>
      )}
    </>
  )
}
