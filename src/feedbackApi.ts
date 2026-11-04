import type { Locale } from './i18n'

export type FeedbackValues = { name: string; email: string; comment: string }

export async function sendFeedback(
  endpoint: string,
  values: FeedbackValues,
  locale: Locale,
  fetcher: typeof fetch = fetch
): Promise<void> {
  const response = await fetcher(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...values, locale })
  })

  if (!response.ok) throw new Error('Feedback submission failed')
}
