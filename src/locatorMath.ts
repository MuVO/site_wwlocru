import { magneticField } from 'magvar'

export type Coordinates = [latitude: number, longitude: number]
export type LocatorGeometry = [southWest: Coordinates, northEast: Coordinates]
export interface DistanceResult {
  point: { start: Coordinates; final: Coordinates }
  distance: number
  azimuth: { start: number; final: number }
}
export interface PathPoint {
  name: string
  geometry: LocatorGeometry
  center: Coordinates
}
export interface PathResult {
  path: PathPoint[]
  distance: number
  start?: { point: Coordinates; azimuth: number }
  final?: { point: Coordinates; azimuth: number }
}
export interface MagneticReading {
  declination: number
  inclination: number
  decimalYear: number
  model: 'WMM2025'
  valid: boolean
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const MAX_PAIRS = 12
const EARTH_RADIUS_METERS = 6_371_000
const MODEL_START = 2025
const MODEL_END = 2030

function validateCoordinates([latitude, longitude]: Coordinates): void {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new RangeError('Координаты должны быть конечными числами')
  }
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new RangeError('Широта должна быть от −90 до 90°, долгота — от −180 до 180°')
  }
}

function precisionToRanks(precision = 3): number {
  if (!Number.isFinite(precision)) return 3
  return Math.min(MAX_PAIRS, Math.max(1, Math.trunc(precision)))
}

function stepForPair(pair: number): [latitude: number, longitude: number] {
  let latitude = 10
  let longitude = 20
  for (let rank = 1; rank <= pair; rank += 1) {
    const subdivisions = rank % 2 === 1 ? 10 : 24
    latitude /= subdivisions
    longitude /= subdivisions
  }
  return [latitude, longitude]
}

function componentIndex(character: string, rank: number): number {
  const isNumberRank = rank % 2 === 1
  if (isNumberRank) return Number(character)
  const index = LETTERS.indexOf(character.toUpperCase())
  if (index < 0) throw new Error('Некорректный символ QTH-локатора')
  return index
}

export function isValidLocator(locator: string): boolean {
  const value = locator.trim().toUpperCase()
  if (value.length < 2 || value.length % 2 !== 0 || value.length > MAX_PAIRS * 2) return false
  for (let pair = 0; pair < value.length / 2; pair += 1) {
    const characters = value.slice(pair * 2, pair * 2 + 2)
    const valid = pair === 0
      ? /^[A-R]{2}$/.test(characters)
      : pair % 2 === 1
        ? /^\d{2}$/.test(characters)
        : /^[A-X]{2}$/.test(characters)
    if (!valid) return false
  }
  return true
}

/** Encode [latitude, longitude] as an IARU/Maidenhead locator (1–12 pairs). */
export function encodeLocator(coordinates: Coordinates, precision = 3): string {
  validateCoordinates(coordinates)
  const ranks = precisionToRanks(precision)
  // The north/east poles are the exclusive upper edges of the final cells.
  let latitude = Math.min(coordinates[0], 90 - 1e-10) + 90
  let longitude = Math.min(coordinates[1], 180 - 1e-10) + 180
  let locator = ''

  for (let rank = 0; rank < ranks; rank += 1) {
    const [latStep, lonStep] = stepForPair(rank)
    const latIndex = Math.floor(latitude / latStep)
    const lonIndex = Math.floor(longitude / lonStep)
    if (rank % 2 === 0) {
      locator += LETTERS[lonIndex] + LETTERS[latIndex]
    } else {
      locator += `${lonIndex}${latIndex}`
    }
    latitude -= latIndex * latStep
    longitude -= lonIndex * lonStep
  }
  return locator
}

/** Decode a 2–24 character locator to [[south, west], [north, east]]. */
export function decodeLocator(locator: string): LocatorGeometry {
  const value = locator.trim().toUpperCase()
  if (!isValidLocator(value)) {
    throw new Error('Неверный формат QTH-локатора. Например: KO85BC')
  }

  let south = -90
  let west = -180
  const ranks = value.length / 2
  for (let rank = 0; rank < ranks; rank += 1) {
    const [latStep, lonStep] = stepForPair(rank)
    const longitudeIndex = componentIndex(value[rank * 2], rank)
    const latitudeIndex = componentIndex(value[rank * 2 + 1], rank)
    west += longitudeIndex * lonStep
    south += latitudeIndex * latStep
  }
  const [height, width] = stepForPair(ranks - 1)
  return [[south, west], [south + height, west + width]]
}

export function centerOfGeometry(geometry: LocatorGeometry): Coordinates {
  return [
    (geometry[0][0] + geometry[1][0]) / 2,
    (geometry[0][1] + geometry[1][1]) / 2,
  ]
}

/** Center of a locator's cell. */
export function centerOfLocator(locator: string): Coordinates {
  return centerOfGeometry(decodeLocator(locator))
}

/** Port of the Express centre helper: accepts a locator, point, or bounds. */
export function centerOf(
  location: string | Coordinates | LocatorGeometry,
  precision = 3,
): Coordinates {
  if (typeof location === 'string') return centerOfLocator(location)
  if (Array.isArray(location[0])) return centerOfGeometry(location as LocatorGeometry)
  return centerOfLocator(encodeLocator(location as Coordinates, precision))
}

function initialBearing(from: Coordinates, to: Coordinates): number {
  const toRadians = Math.PI / 180
  const lat1 = from[0] * toRadians
  const lat2 = to[0] * toRadians
  const deltaLongitude = (to[1] - from[1]) * toRadians
  const y = Math.sin(deltaLongitude) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2)
    - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLongitude)
  if (Math.abs(x) < 1e-15 && Math.abs(y) < 1e-15) return 0
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360
}

/** Great-circle distance (metres) and forward/reverse true bearings. */
export function distanceBetween(from: Coordinates, to: Coordinates): DistanceResult {
  validateCoordinates(from)
  validateCoordinates(to)
  const toRadians = Math.PI / 180
  const lat1 = from[0] * toRadians
  const lat2 = to[0] * toRadians
  const deltaLat = (to[0] - from[0]) * toRadians
  const deltaLon = (to[1] - from[1]) * toRadians
  const haversine = Math.sin(deltaLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2
  const arc = 2 * Math.atan2(Math.sqrt(Math.min(1, haversine)), Math.sqrt(Math.max(0, 1 - haversine)))
  return {
    point: { start: from, final: to },
    distance: arc * EARTH_RADIUS_METERS,
    azimuth: {
      start: initialBearing(from, to),
      final: initialBearing(to, from),
    },
  }
}

export function distanceBetweenLocators(from: string, to: string): DistanceResult {
  return distanceBetween(centerOfLocator(from), centerOfLocator(to))
}

/** Build the multi-stop path returned by the old /calc/distance route. */
export function calculatePath(locations: Array<string | Coordinates>, precision = 3): PathResult {
  const path = locations.map((location): PathPoint => {
    const name = typeof location === 'string'
      ? (isValidLocator(location) ? location.toUpperCase() : encodeLocator(parseCoordinatePair(location), precision))
      : encodeLocator(location, precision)
    const geometry = decodeLocator(name)
    return { name, geometry, center: centerOfGeometry(geometry) }
  })

  const result: PathResult = { path: [], distance: 0 }
  if (path.length < 2) return result
  result.path = path
  for (let index = 1; index < path.length; index += 1) {
    const segment = distanceBetween(path[index - 1].center, path[index].center)
    if (index === 1) result.start = { point: path[0].center, azimuth: segment.azimuth.start }
    result.final = { point: path[index].center, azimuth: segment.azimuth.final }
    result.distance += segment.distance
  }
  return result
}

function parseCoordinatePair(value: string): Coordinates {
  const parts = value.split(',', 2).map((part) => Number(part.trim()))
  if (parts.length !== 2 || parts.some((part) => !Number.isFinite(part))) {
    throw new Error(`Не удалось прочитать координаты: ${value}`)
  }
  const pair: Coordinates = [parts[0], parts[1]]
  validateCoordinates(pair)
  return pair
}

function dateToDecimalYear(date: Date): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 1)
  const end = Date.UTC(date.getUTCFullYear() + 1, 0, 1)
  return date.getUTCFullYear() + (date.getTime() - start) / (end - start)
}

/** WMM2025 magnetic declination (east-positive) and inclination (down-positive). */
export function magneticReading(
  coordinates: Coordinates,
  date: Date = new Date(),
  altitudeKm = 0,
): MagneticReading {
  validateCoordinates(coordinates)
  if (!Number.isFinite(altitudeKm) || altitudeKm < -1 || altitudeKm > 850) {
    throw new RangeError('Высота для WMM должна быть от −1 до 850 км')
  }
  const decimalYear = dateToDecimalYear(date)
  const field = magneticField(coordinates[0], coordinates[1], altitudeKm, decimalYear)
  return {
    declination: field.declination,
    inclination: field.inclination,
    decimalYear: field.decimalYear,
    model: 'WMM2025',
    valid: decimalYear >= MODEL_START && decimalYear < MODEL_END,
  }
}
