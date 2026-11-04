import type { FormEventHandler } from 'react'
import type { Messages } from '../i18n'
import type { FeedbackValues } from '../feedbackApi'

export type FeedbackStatus = 'idle' | 'sending' | 'sent' | 'error'
type FeedbackField = keyof FeedbackValues

type FeedbackFormProps = {
  t: Messages
  values: FeedbackValues
  status: FeedbackStatus
  apiConfigured: boolean
  onChange: (field: FeedbackField, value: string) => void
  onSubmit: FormEventHandler<HTMLFormElement>
}

export function FeedbackForm({
  t,
  values,
  status,
  apiConfigured,
  onChange,
  onSubmit
}: FeedbackFormProps) {
  const statusMessage =
    status === 'sent'
      ? t.sent
      : status === 'error'
        ? apiConfigured
          ? t.submitError
          : t.backendUnavailable
        : ''

  return (
    <>
      <h2 className="feedback-title">{t.feedbackTitle}</h2>
      <form className="feedback-card" onSubmit={onSubmit}>
        <p>{t.feedbackIntro}</p>
        <label className="sr-only" htmlFor="feedback-name">
          {t.name}
        </label>
        <input
          id="feedback-name"
          value={values.name}
          onChange={(event) => onChange('name', event.target.value)}
          placeholder={t.name}
          required
        />
        <label className="sr-only" htmlFor="feedback-email">
          {t.email}
        </label>
        <input
          id="feedback-email"
          type="email"
          value={values.email}
          onChange={(event) => onChange('email', event.target.value)}
          placeholder={t.email}
          required
        />
        <label className="sr-only" htmlFor="feedback-comment">
          {t.comment}
        </label>
        <textarea
          id="feedback-comment"
          value={values.comment}
          onChange={(event) => onChange('comment', event.target.value)}
          placeholder={t.comment}
          required
          rows={5}
        />
        <button
          className="send-button"
          type="submit"
          disabled={status === 'sending'}
        >
          {status === 'sending' ? t.sending : t.send}
        </button>
        <p className={`feedback-status ${status}`} aria-live="polite">
          {statusMessage}
        </p>
      </form>
    </>
  )
}
