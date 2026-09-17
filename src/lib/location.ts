import type { BirthLocation } from '../api/types'
import type { Place } from '../data/places'

export function placeToLocation(p: Place): BirthLocation {
  return { name: p.name, region: p.region, country: p.country, latitude: p.latitude, longitude: p.longitude, timeZone: p.timeZone }
}

export function locationLabel(l: BirthLocation): string {
  return [l.name, l.region, l.country].filter(Boolean).join(', ')
}
