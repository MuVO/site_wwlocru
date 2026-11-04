declare module 'magvar' {
  export interface WmmField {
    declination: number
    inclination: number
    x: number
    y: number
    z: number
    h: number
    f: number
    decimalYear: number
  }

  export function magneticField(
    latitude: number,
    longitude: number,
    altitudeKm?: number,
    when?: number | Date
  ): WmmField
}
