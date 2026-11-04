import { useState, type FormEvent } from 'react'
import type { Locale } from '../i18n'
import { sendFeedback, type FeedbackValues } from '../feedbackApi'
import type { FeedbackStatus } from '../components/FeedbackForm'

const EMPTY_FEEDBACK: FeedbackValues = { name: '', email: '', comment: '' }
const FEEDBACK_ENDPOINT = import.meta.env.VITE_FEEDBACK_API_URL

export function useFeedback(locale: Locale) {
  const [status, setStatus] = useState<FeedbackStatus>('idle')
  const [values, setValues] = useState<FeedbackValues>(EMPTY_FEEDBACK)

  function updateField(field: keyof FeedbackValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!FEEDBACK_ENDPOINT) {
      setStatus('error')
      return
    }

    setStatus('sending')
    try {
      await sendFeedback(FEEDBACK_ENDPOINT, values, locale)
      setStatus('sent')
      setValues(EMPTY_FEEDBACK)
    } catch {
      setStatus('error')
    }
  }

  return {
    values,
    status,
    apiConfigured: Boolean(FEEDBACK_ENDPOINT),
    updateField,
    submit
  }
}
