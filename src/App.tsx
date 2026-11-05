import { useRef, useState, type FormEvent } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { YandexMapInstance } from './types'
import {
  encodeLocator,
  isValidLocator,
  type MagneticReading
} from './locatorMath'
import { parseLocatorHash } from './locatorUrl'
import type { DistanceRoute } from './locatorRoute'
import { detectLocale, messages, type Locale } from './i18n'
import { AboutSection } from './components/AboutSection'
import { CommunitySection } from './components/CommunitySection'
import {
  LocatorPanel,
  type DistanceUnit,
  type SearchMode
} from './components/LocatorPanel'
import { MapSection } from './components/MapSection'
import { useTerminatorOverlay } from './hooks/useTerminatorOverlay'
import { usePageLocale } from './hooks/usePageLocale'
import { useMapLifecycle } from './hooks/useMapLifecycle'
import { useDistanceOverlays } from './hooks/useDistanceOverlays'
import { useInitialLocator } from './hooks/useInitialLocator'
import { useLocatorActions } from './hooks/useLocatorActions'
import { useFeedback } from './hooks/useFeedback'
import { useMapProvider } from './hooks/useMapProvider'

const INITIAL_LOCATOR = 'MO05QE'
const MAP_API_KEY = import.meta.env.VITE_YANDEX_MAPS_API_KEY

function App() {
  const yandexNode = useRef<HTMLDivElement>(null)
  const openStreetMapNode = useRef<HTMLDivElement>(null)
  const mapRef = useRef<YandexMapInstance | null>(null)
  const rectangleRef = useRef<unknown>(null)
  const secondRectangleRef = useRef<unknown>(null)
  const routeLineRef = useRef<unknown>(null)
  const openStreetMapRef = useRef<L.Map | null>(null)
  const openStreetMapRectangleRef = useRef<L.Rectangle | null>(null)
  const openStreetMapSecondRectangleRef = useRef<L.Rectangle | null>(null)
  const openStreetMapRouteRef = useRef<L.Polyline | null>(null)
  const [locale, setLocale] = useState<Locale>(detectLocale)
  const localeRef = useRef(locale)
  localeRef.current = locale
  const t = messages[locale]
  const [locator, setLocator] = useState(INITIAL_LOCATOR)
  const locatorRef = useRef(locator)
  locatorRef.current = locator
  const initialHashRef = useRef(window.location.hash)
  const locatorTouchedRef = useRef(false)
  const [secondLocator, setSecondLocator] = useState('')
  const [searchMode, setSearchMode] = useState<SearchMode>('search')
  const searchModeRef = useRef(searchMode)
  searchModeRef.current = searchMode
  const [modeMenuOpen, setModeMenuOpen] = useState(false)
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>('km')
  const [distanceRoute, setDistanceRoute] = useState<DistanceRoute | null>(null)
  const {
    provider: mapProvider,
    view: mapViewRef,
    selectProvider: switchMapProvider
  } = useMapProvider(Boolean(MAP_API_KEY), mapRef, openStreetMapRef)
  const [showTerminator, setShowTerminator] = useState(false)
  const [yandexReady, setYandexReady] = useState(false)
  const [osmReady, setOsmReady] = useState(false)
  const [error, setError] = useState('')
  const [mapStatus, setMapStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading'
  )
  const [magnetic, setMagnetic] = useState<MagneticReading | null>(null)
  const [secondMagnetic, setSecondMagnetic] = useState<MagneticReading | null>(
    null
  )
  const feedback = useFeedback(locale)

  usePageLocale(locale, t)

  const { updateMap, measureDistance } = useLocatorActions({
    locale: localeRef,
    provider: mapProvider,
    yandexMap: mapRef,
    yandexRectangle: rectangleRef,
    openStreetMap: openStreetMapRef,
    osmRectangle: openStreetMapRectangleRef,
    setLocator,
    setSecondLocator,
    setRoute: setDistanceRoute,
    setMagnetic,
    setSecondMagnetic,
    setError
  })

  useInitialLocator({
    initialHash: initialHashRef.current,
    locator: locatorRef,
    touched: locatorTouchedRef,
    setLocator,
    setSecondLocator,
    setSearchMode,
    onInitialSearch: updateMap,
    onInitialDistance: measureDistance,
    onGeolocated: updateMap
  })

  function handleMapClick(coordinates: [number, number]) {
    const next = encodeLocator(coordinates)
    locatorTouchedRef.current = true
    if (searchModeRef.current === 'distance') {
      setSecondLocator(next)
      measureDistance(locatorRef.current, next, false, false)
    } else {
      setLocator(next)
      updateMap(next, false)
    }
  }

  function handleYandexReady() {
    const initialRoute = parseLocatorHash(initialHashRef.current)
    if (initialRoute?.second)
      measureDistance(initialRoute.first, initialRoute.second)
    else updateMap(locatorRef.current)
  }

  useDistanceOverlays({
    route: distanceRoute,
    yandexReady,
    osmReady,
    yandexMap: mapRef,
    openStreetMap: openStreetMapRef,
    yandexLocatorRectangle: rectangleRef,
    yandexSecondRectangle: secondRectangleRef,
    yandexRouteLine: routeLineRef,
    osmLocatorRectangle: openStreetMapRectangleRef,
    osmSecondRectangle: openStreetMapSecondRectangleRef,
    osmRouteLine: openStreetMapRouteRef
  })

  useMapLifecycle({
    apiKey: MAP_API_KEY,
    locale,
    provider: mapProvider,
    yandexNode,
    osmNode: openStreetMapNode,
    initialHash: initialHashRef.current,
    locator: locatorRef,
    refs: {
      yandex: mapRef,
      view: mapViewRef,
      locatorRectangle: rectangleRef,
      secondRectangle: secondRectangleRef,
      routeLine: routeLineRef,
      openStreetMap: openStreetMapRef,
      osmLocatorRectangle: openStreetMapRectangleRef,
      osmSecondRectangle: openStreetMapSecondRectangleRef,
      osmRouteLine: openStreetMapRouteRef
    },
    setMapStatus,
    setYandexReady,
    setOsmReady,
    onMapClick: handleMapClick,
    onYandexReady: handleYandexReady
  })

  useTerminatorOverlay({
    provider: mapProvider,
    enabled: showTerminator,
    yandexReady,
    osmReady,
    yandexMap: mapRef,
    openStreetMap: openStreetMapRef
  })

  function runSearch(value = locator) {
    locatorTouchedRef.current = true
    const next = value.trim().toUpperCase()
    setLocator(next)
    setDistanceRoute(null)
    updateMap(next)
  }

  function submitLocatorForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (searchMode === 'distance') measureDistance(locator, secondLocator)
    else runSearch()
  }

  function chooseSearchMode() {
    setModeMenuOpen(false)
    setSearchMode('search')
    setSecondLocator('')
    setDistanceRoute(null)
    runSearch()
  }

  function chooseDistanceMode() {
    locatorTouchedRef.current = true
    setModeMenuOpen(false)
    setSearchMode('distance')
    setSecondLocator('')
    setDistanceRoute(null)
    setError('')
  }

  return (
    <div className="app-shell" id="top">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="WWLOC">
          WWL
          <span className="brand-globe" aria-hidden="true">
            ◉
          </span>
          C
        </a>
        <div
          className="language-switch"
          role="group"
          aria-label={locale === 'ru' ? 'Язык сайта' : 'Website language'}
        >
          <button
            type="button"
            lang="ru"
            aria-pressed={locale === 'ru'}
            onClick={() => setLocale('ru')}
          >
            RU
          </button>
          <button
            type="button"
            lang="en"
            aria-pressed={locale === 'en'}
            onClick={() => setLocale('en')}
          >
            EN
          </button>
        </div>
      </header>

      <main id="main-content">
        <h1 className="sr-only">{t.pageTitle}</h1>
        <LocatorPanel
          t={t}
          locale={locale}
          locator={locator}
          secondLocator={secondLocator}
          searchMode={searchMode}
          modeMenuOpen={modeMenuOpen}
          distanceUnit={distanceUnit}
          distanceRoute={distanceRoute}
          magnetic={magnetic}
          secondMagnetic={secondMagnetic}
          error={error}
          onSubmit={submitLocatorForm}
          onLocatorChange={(value) => {
            locatorTouchedRef.current = true
            setLocator(value)
            if (searchMode === 'distance') {
              if (isValidLocator(value) && isValidLocator(secondLocator))
                measureDistance(value, secondLocator, true, false)
              else {
                setDistanceRoute(null)
                setSecondMagnetic(null)
              }
            }
          }}
          onSecondLocatorChange={(value) => {
            locatorTouchedRef.current = true
            setSecondLocator(value)
            if (isValidLocator(locator) && isValidLocator(value))
              measureDistance(locator, value, true, false)
            else {
              setDistanceRoute(null)
              setSecondMagnetic(null)
            }
          }}
          onSecondLocatorBlur={() => {
            if (isValidLocator(locator) && isValidLocator(secondLocator))
              measureDistance(locator, secondLocator, true, false)
          }}
          onToggleModeMenu={() => setModeMenuOpen(!modeMenuOpen)}
          onSearchMode={chooseSearchMode}
          onDistanceMode={chooseDistanceMode}
          onDistanceUnitChange={setDistanceUnit}
        />

        <MapSection
          t={t}
          provider={mapProvider}
          status={mapStatus}
          yandexNode={yandexNode}
          openStreetMapNode={openStreetMapNode}
          onProviderChange={switchMapProvider}
          showTerminator={showTerminator}
          onTerminatorChange={setShowTerminator}
        />
        <AboutSection t={t} locale={locale} />
        <CommunitySection
          t={t}
          locale={locale}
          locator={locator}
          secondLocator={secondLocator}
          isDistanceMode={Boolean(distanceRoute)}
          feedback={feedback.values}
          feedbackStatus={feedback.status}
          apiConfigured={feedback.apiConfigured}
          onFeedbackChange={feedback.updateField}
          onFeedbackSubmit={feedback.submit}
        />
      </main>

      <footer className="footer">
        <div className="footer-row">
          <div className="footer-details">
            <span>
              {t.footer} <a href="mailto:r8abk@autoradio.club">R8ABK</a>{' '}
              <span aria-hidden="true">·</span> © 2016–{new Date().getFullYear()}
            </span>
            <span>{t.design}</span>
          </div>
          <a
            className="credit-badge"
            href="https://letsmakeit.ru"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${t.development} Let's make IT — ${locale === 'ru' ? 'открыть сайт' : 'visit website'}`}
          >
            <img
              src="/assets/icons/lmi-mark.svg"
              alt=""
              width="18"
              height="18"
              loading="lazy"
            />
            <span className="credit-label">{t.development}</span>
            <span className="credit-name">Let's make IT</span>
          </a>
        </div>
      </footer>
    </div>
  )
}

export default App
