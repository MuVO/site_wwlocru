import type { FormEventHandler } from 'react'
import type { Locale, Messages } from '../i18n'
import type { MagneticReading } from '../locatorMath'
import type { DistanceRoute } from '../locatorRoute'

export type SearchMode = 'search' | 'distance'
export type DistanceUnit = 'km' | 'mi'

type LocatorPanelProps = {
  t: Messages
  locale: Locale
  locator: string
  secondLocator: string
  searchMode: SearchMode
  modeMenuOpen: boolean
  distanceUnit: DistanceUnit
  distanceRoute: DistanceRoute | null
  magnetic: MagneticReading | null
  secondMagnetic: MagneticReading | null
  error: string
  onSubmit: FormEventHandler<HTMLFormElement>
  onLocatorChange: (value: string) => void
  onSecondLocatorChange: (value: string) => void
  onSecondLocatorBlur: () => void
  onToggleModeMenu: () => void
  onSearchMode: () => void
  onDistanceMode: () => void
  onDistanceUnitChange: (unit: DistanceUnit) => void
}

export function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="10.8" cy="10.8" r="6.7" />
      <path d="m16 16 5 5" />
    </svg>
  )
}

export function RulerIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m3 17 14-14 4 4L7 21l-4-4Z" />
      <path d="m14 6 4 4M11 9l2 2M8 12l4 4M5 15l2 2" />
    </svg>
  )
}

function MagneticReadingRow({
  label,
  locator,
  reading,
  t
}: {
  label?: string
  locator?: string
  reading: MagneticReading
  t: Messages
}) {
  return (
    <p className="magnetic-reading">
      {label && locator && (
        <span className="locator-label">
          {label}: <strong>{locator}</strong>
        </span>
      )}
      <span>
        {t.declination}:{' '}
        <strong>
          {reading.declination > 0 ? '+' : ''}
          {reading.declination.toFixed(2)}°
        </strong>
      </span>
      <span>
        {t.inclination}:{' '}
        <strong>
          {reading.inclination > 0 ? '+' : ''}
          {reading.inclination.toFixed(2)}°
        </strong>
      </span>
      <span className="model-label">
        <a
          href="https://www.ncei.noaa.gov/products/world-magnetic-model"
          target="_blank"
          rel="noreferrer"
          title="NOAA/NCEI and BGS World Magnetic Model"
        >
          {reading.model}
        </a>
        {reading.valid ? '' : ` · ${t.outsideModel}`}
      </span>
    </p>
  )
}

export function LocatorPanel(props: LocatorPanelProps) {
  const {
    t,
    locale,
    locator,
    secondLocator,
    searchMode,
    modeMenuOpen,
    distanceUnit,
    distanceRoute,
    magnetic,
    secondMagnetic,
    error,
    onSubmit,
    onLocatorChange,
    onSecondLocatorChange,
    onSecondLocatorBlur,
    onToggleModeMenu,
    onSearchMode,
    onDistanceMode,
    onDistanceUnitChange
  } = props

  return (
    <section className="locator-section" aria-label={t.searchLabel}>
      <p className="locator-hint">{t.searchHint}</p>
      <form className="search-form" onSubmit={onSubmit}>
        <div className="search-input-rows">
          <div
            className={`search-primary-row${searchMode === 'distance' ? ' distance-mode' : ''}`}
          >
            <label className="sr-only" htmlFor="locator">
              {t.searchLabel}
            </label>
            <input
              className="search-locator-input"
              id="locator"
              value={locator}
              onChange={(event) =>
                onLocatorChange(event.target.value.toUpperCase())
              }
              placeholder={t.searchLabel}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={24}
            />
            {searchMode === 'distance' && (
              <>
                <label className="sr-only" htmlFor="second-locator">
                  {t.secondLocator}
                </label>
                <input
                  className="search-locator-input second-locator-input"
                  id="second-locator"
                  value={secondLocator}
                  onChange={(event) =>
                    onSecondLocatorChange(event.target.value.toUpperCase())
                  }
                  onBlur={onSecondLocatorBlur}
                  placeholder={t.secondLocator}
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  maxLength={24}
                />
              </>
            )}
            <button
              className="primary-action"
              type="submit"
              aria-label={
                searchMode === 'distance' ? t.measureButton : t.searchButton
              }
            >
              {searchMode === 'distance' ? <RulerIcon /> : <SearchIcon />}
            </button>
            <button
              className="mode-menu-toggle"
              type="button"
              aria-label={
                locale === 'ru' ? 'Выбрать действие' : 'Choose action'
              }
              aria-haspopup="menu"
              aria-expanded={modeMenuOpen}
              onClick={onToggleModeMenu}
            >
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="m3 6 5 5 5-5" />
              </svg>
            </button>
          </div>
        </div>
        {modeMenuOpen && (
          <div className="search-mode-menu" role="menu">
            <button type="button" role="menuitem" onClick={onSearchMode}>
              <SearchIcon />
              <span>{t.searchMode}</span>
            </button>
            <button type="button" role="menuitem" onClick={onDistanceMode}>
              <RulerIcon />
              <span>{t.distanceMode}</span>
            </button>
          </div>
        )}
      </form>
      <p className="error-message" aria-live="polite">
        {error}
      </p>
      {distanceRoute && (
        <div className="distance-summary" aria-live="polite">
          <span>
            {t.distanceBetween}:{' '}
            <strong>
              {(
                distanceRoute.distanceMeters /
                (distanceUnit === 'km' ? 1000 : 1609.344)
              ).toLocaleString(locale === 'ru' ? 'ru-RU' : 'en-US', {
                maximumFractionDigits: 1
              })}{' '}
              {distanceUnit}
            </strong>
          </span>
          <div
            className="distance-units"
            role="group"
            aria-label={locale === 'ru' ? 'Единица измерения' : 'Distance unit'}
          >
            <button
              type="button"
              aria-label={t.kilometers}
              aria-pressed={distanceUnit === 'km'}
              onClick={() => onDistanceUnitChange('km')}
            >
              km
            </button>
            <button
              type="button"
              aria-label={t.miles}
              aria-pressed={distanceUnit === 'mi'}
              onClick={() => onDistanceUnitChange('mi')}
            >
              mi
            </button>
          </div>
        </div>
      )}
      {magnetic && (
        <div className="magnetic-readings" aria-live="polite">
          <MagneticReadingRow
            label={distanceRoute ? t.firstLocator : undefined}
            locator={distanceRoute?.first}
            reading={magnetic}
            t={t}
          />
          {distanceRoute && secondMagnetic && (
            <MagneticReadingRow
              label={t.secondLocator}
              locator={distanceRoute.second}
              reading={secondMagnetic}
              t={t}
            />
          )}
        </div>
      )}
    </section>
  )
}
