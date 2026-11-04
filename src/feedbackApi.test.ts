import { describe, expect, it, vi } from 'vitest'
import { sendFeedback } from './feedbackApi'

const values = {
  name: 'Ada Lovelace',
  email: 'ada@example.org',
  comment: 'Hello WWLOC'
}

describe('sendFeedback', () => {
  it('posts the feedback and selected locale as JSON', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 200 }))

    await sendFeedback(
      'https://api.example.org/feedback',
      values,
      'en',
      fetcher
    )

    expect(fetcher).toHaveBeenCalledWith('https://api.example.org/feedback', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...values, locale: 'en' })
    })
  })

  it('rejects unsuccessful responses', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 503 }))

    await expect(
      sendFeedback('https://api.example.org/feedback', values, 'ru', fetcher)
    ).rejects.toThrow('Feedback submission failed')
  })

  it('propagates network errors', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new Error('Network unavailable'))

    await expect(
      sendFeedback('https://api.example.org/feedback', values, 'ru', fetcher)
    ).rejects.toThrow('Network unavailable')
  })
})
