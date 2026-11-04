import type { FormEventHandler } from 'react'
import type { Locale, Messages } from '../i18n'
import type { FeedbackStatus } from './FeedbackForm'
import type { FeedbackValues } from '../feedbackApi'
import { FeedbackForm } from './FeedbackForm'
import { SocialShare } from './SocialShare'

type CommunitySectionProps = {
  t: Messages
  locale: Locale
  locator: string
  secondLocator: string
  isDistanceMode: boolean
  feedback: FeedbackValues
  feedbackStatus: FeedbackStatus
  apiConfigured: boolean
  onFeedbackChange: (field: keyof FeedbackValues, value: string) => void
  onFeedbackSubmit: FormEventHandler<HTMLFormElement>
}

export function CommunitySection(props: CommunitySectionProps) {
  const {
    t,
    locale,
    locator,
    secondLocator,
    isDistanceMode,
    feedback,
    feedbackStatus,
    apiConfigured,
    onFeedbackChange,
    onFeedbackSubmit
  } = props

  return (
    <section className="community-section">
      <SocialShare
        locale={locale}
        locator={locator}
        secondLocator={secondLocator}
        isDistanceMode={isDistanceMode}
        t={t}
      />
      <FeedbackForm
        t={t}
        values={feedback}
        status={feedbackStatus}
        apiConfigured={apiConfigured}
        onChange={onFeedbackChange}
        onSubmit={onFeedbackSubmit}
      />
    </section>
  )
}
