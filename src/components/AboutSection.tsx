import type { Locale, Messages } from '../i18n'

export function AboutSection({ t, locale }: { t: Messages; locale: Locale }) {
  return (
    <section className="about-section" aria-labelledby="about-heading">
      <h2 id="about-heading">{t.aboutTitle}</h2>
      {t.aboutParagraphs.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
      <p className="source-links">
        {locale === 'ru' ? 'Источники: ' : 'Sources: '}
        <a
          href="https://www.iaru-r1.org/wp-content/uploads/2026/02/VHF_Handbook_V10_03_final.pdf"
          target="_blank"
          rel="noreferrer"
        >
          IARU Region 1 VHF Handbook
        </a>
        {' · '}
        <a
          href="https://www.qrz.ru/vhf/qth_h.pdf"
          target="_blank"
          rel="noreferrer"
        >
          {locale === 'ru'
            ? 'история локаторной системы (QRZ.ru)'
            : 'locator system history (QRZ.ru)'}
        </a>
        {' · '}
        <a
          href="https://www.arrl.org/grid-squares"
          target="_blank"
          rel="noreferrer"
        >
          ARRL: Grid Squares
        </a>
      </p>
    </section>
  )
}
