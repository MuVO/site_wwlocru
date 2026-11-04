export type Geometry = [[number, number], [number, number]]

export interface YandexMapInstance {
  setBounds: (
    bounds: Geometry,
    options?: Record<string, unknown>
  ) => Promise<unknown>
  setCenter: (
    center: [number, number],
    zoom?: number,
    options?: Record<string, unknown>
  ) => Promise<unknown>
  getCenter: () => [number, number]
  getZoom: () => number
  destroy: () => void
  geoObjects: {
    add: (object: unknown) => void
    remove: (object: unknown) => void
  }
  events: {
    add: (
      event: string,
      callback: (event: { get: (key: string) => unknown }) => void
    ) => void
  }
}

export interface YandexMapsApi {
  ready: (callback: () => void) => void
  Map: new (
    element: HTMLElement,
    state: Record<string, unknown>,
    options?: Record<string, unknown>
  ) => YandexMapInstance
  Rectangle: new (
    geometry: Geometry,
    properties?: object,
    options?: object
  ) => unknown
  Polygon: new (
    geometry: number[][][],
    properties?: object,
    options?: object
  ) => unknown
  Polyline: new (
    geometry: number[][],
    properties?: object,
    options?: object
  ) => unknown
}

declare global {
  interface Window {
    ymaps?: YandexMapsApi
  }
}
