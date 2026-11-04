import type { RefObject } from 'react'
import type { Messages } from '../i18n'

type MapProvider = 'yandex' | 'osm'
type MapStatus = 'loading' | 'ready' | 'error'

type MapSectionProps = {
  t: Messages
  provider: MapProvider
  status: MapStatus
  yandexNode: RefObject<HTMLDivElement | null>
  openStreetMapNode: RefObject<HTMLDivElement | null>
  onProviderChange: (provider: MapProvider) => void
  showTerminator: boolean
  onTerminatorChange: (visible: boolean) => void
}

export function MapSection({
  t,
  provider,
  status,
  yandexNode,
  openStreetMapNode,
  onProviderChange,
  showTerminator,
  onTerminatorChange
}: MapSectionProps) {
  return (
    <section className="map-section" aria-label={t.mapLabel}>
      <div className="map-canvas">
        <div
          className={`map-provider-layer${provider === 'yandex' ? '' : ' map-provider-hidden'}`}
          aria-hidden={provider !== 'yandex'}
        >
          <div
            className="map-frame"
            ref={yandexNode}
            role="application"
            aria-label={t.yandexMaps}
          />
        </div>
        <div
          className={`map-provider-layer${provider === 'osm' ? '' : ' map-provider-hidden'}`}
          aria-hidden={provider !== 'osm'}
        >
          <div
            className="map-frame"
            ref={openStreetMapNode}
            role="application"
            aria-label={t.openStreetMap}
          />
        </div>
        {provider === 'yandex' && status !== 'ready' && (
          <div className="map-placeholder" role="status">
            {status === 'error' ? t.mapError : t.mapLoading}
          </div>
        )}
      </div>
      <div className="map-controls">
        <div
          className="map-source-control"
          role="group"
          aria-label={t.mapProviderLabel}
        >
          <button
            type="button"
            aria-pressed={provider === 'yandex'}
            onClick={() => onProviderChange('yandex')}
          >
            {t.yandexMaps}
          </button>
          <button
            type="button"
            aria-pressed={provider === 'osm'}
            onClick={() => onProviderChange('osm')}
          >
            {t.openStreetMap}
          </button>
        </div>
        <label className="terminator-control">
          <input
            type="checkbox"
            checked={showTerminator}
            onChange={(event) => onTerminatorChange(event.target.checked)}
          />
          <span className="terminator-check" aria-hidden="true" />
          <span>{t.terminator}</span>
        </label>
      </div>
    </section>
  )
}
