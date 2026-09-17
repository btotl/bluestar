export interface Place {
  id: string
  /** Town or city */
  name: string
  /** State / region, may be empty */
  region: string
  country: string
  latitude: number
  longitude: number
  /** IANA time zone */
  timeZone: string
}

export const DEFAULT_PLACE_ID = 'bellingen'

export const PLACES: readonly Place[] = [
  { id: 'bellingen', name: 'Bellingen', region: 'New South Wales', country: 'Australia', latitude: -30.4519, longitude: 152.8986, timeZone: 'Australia/Sydney' },
  { id: 'coffs-harbour', name: 'Coffs Harbour', region: 'New South Wales', country: 'Australia', latitude: -30.2963, longitude: 153.1135, timeZone: 'Australia/Sydney' },
  { id: 'byron-bay', name: 'Byron Bay', region: 'New South Wales', country: 'Australia', latitude: -28.6474, longitude: 153.602, timeZone: 'Australia/Sydney' },
  { id: 'sydney', name: 'Sydney', region: 'New South Wales', country: 'Australia', latitude: -33.8688, longitude: 151.2093, timeZone: 'Australia/Sydney' },
  { id: 'newcastle', name: 'Newcastle', region: 'New South Wales', country: 'Australia', latitude: -32.9283, longitude: 151.7817, timeZone: 'Australia/Sydney' },
  { id: 'melbourne', name: 'Melbourne', region: 'Victoria', country: 'Australia', latitude: -37.8136, longitude: 144.9631, timeZone: 'Australia/Melbourne' },
  { id: 'brisbane', name: 'Brisbane', region: 'Queensland', country: 'Australia', latitude: -27.4698, longitude: 153.0251, timeZone: 'Australia/Brisbane' },
  { id: 'gold-coast', name: 'Gold Coast', region: 'Queensland', country: 'Australia', latitude: -28.0167, longitude: 153.4, timeZone: 'Australia/Brisbane' },
  { id: 'canberra', name: 'Canberra', region: 'Australian Capital Territory', country: 'Australia', latitude: -35.2809, longitude: 149.13, timeZone: 'Australia/Sydney' },
  { id: 'hobart', name: 'Hobart', region: 'Tasmania', country: 'Australia', latitude: -42.8821, longitude: 147.3272, timeZone: 'Australia/Hobart' },
  { id: 'adelaide', name: 'Adelaide', region: 'South Australia', country: 'Australia', latitude: -34.9285, longitude: 138.6007, timeZone: 'Australia/Adelaide' },
  { id: 'perth', name: 'Perth', region: 'Western Australia', country: 'Australia', latitude: -31.9523, longitude: 115.8613, timeZone: 'Australia/Perth' },
  { id: 'darwin', name: 'Darwin', region: 'Northern Territory', country: 'Australia', latitude: -12.4634, longitude: 130.8456, timeZone: 'Australia/Darwin' },
  { id: 'auckland', name: 'Auckland', region: '', country: 'New Zealand', latitude: -36.8509, longitude: 174.7645, timeZone: 'Pacific/Auckland' },
  { id: 'wellington', name: 'Wellington', region: '', country: 'New Zealand', latitude: -41.2924, longitude: 174.7787, timeZone: 'Pacific/Auckland' },
  { id: 'tokyo', name: 'Tokyo', region: '', country: 'Japan', latitude: 35.6762, longitude: 139.6503, timeZone: 'Asia/Tokyo' },
  { id: 'singapore', name: 'Singapore', region: '', country: 'Singapore', latitude: 1.3521, longitude: 103.8198, timeZone: 'Asia/Singapore' },
  { id: 'hong-kong', name: 'Hong Kong', region: '', country: 'China', latitude: 22.3193, longitude: 114.1694, timeZone: 'Asia/Hong_Kong' },
  { id: 'mumbai', name: 'Mumbai', region: 'Maharashtra', country: 'India', latitude: 19.076, longitude: 72.8777, timeZone: 'Asia/Kolkata' },
  { id: 'london', name: 'London', region: 'England', country: 'United Kingdom', latitude: 51.5074, longitude: -0.1278, timeZone: 'Europe/London' },
  { id: 'paris', name: 'Paris', region: '', country: 'France', latitude: 48.8566, longitude: 2.3522, timeZone: 'Europe/Paris' },
  { id: 'berlin', name: 'Berlin', region: '', country: 'Germany', latitude: 52.52, longitude: 13.405, timeZone: 'Europe/Berlin' },
  { id: 'reykjavik', name: 'Reykjavík', region: '', country: 'Iceland', latitude: 64.1466, longitude: -21.9426, timeZone: 'Atlantic/Reykjavik' },
  { id: 'new-york', name: 'New York', region: 'New York', country: 'United States', latitude: 40.7128, longitude: -74.006, timeZone: 'America/New_York' },
  { id: 'los-angeles', name: 'Los Angeles', region: 'California', country: 'United States', latitude: 34.0522, longitude: -118.2437, timeZone: 'America/Los_Angeles' },
  { id: 'chicago', name: 'Chicago', region: 'Illinois', country: 'United States', latitude: 41.8781, longitude: -87.6298, timeZone: 'America/Chicago' },
  { id: 'toronto', name: 'Toronto', region: 'Ontario', country: 'Canada', latitude: 43.6532, longitude: -79.3832, timeZone: 'America/Toronto' },
  { id: 'mexico-city', name: 'Mexico City', region: '', country: 'Mexico', latitude: 19.4326, longitude: -99.1332, timeZone: 'America/Mexico_City' },
  { id: 'sao-paulo', name: 'São Paulo', region: '', country: 'Brazil', latitude: -23.5505, longitude: -46.6333, timeZone: 'America/Sao_Paulo' },
  { id: 'buenos-aires', name: 'Buenos Aires', region: '', country: 'Argentina', latitude: -34.6037, longitude: -58.3816, timeZone: 'America/Argentina/Buenos_Aires' },
  { id: 'cape-town', name: 'Cape Town', region: 'Western Cape', country: 'South Africa', latitude: -33.9249, longitude: 18.4241, timeZone: 'Africa/Johannesburg' },
  { id: 'nairobi', name: 'Nairobi', region: '', country: 'Kenya', latitude: -1.2921, longitude: 36.8219, timeZone: 'Africa/Nairobi' },
  { id: 'cairo', name: 'Cairo', region: '', country: 'Egypt', latitude: 30.0444, longitude: 31.2357, timeZone: 'Africa/Cairo' },
]

export function findPlace(id: string): Place | undefined {
  return PLACES.find((p) => p.id === id)
}

export function searchPlaces(query: string): Place[] {
  const q = query.trim().toLowerCase()
  if (!q) return [...PLACES]
  return PLACES.filter((p) => `${p.name} ${p.region} ${p.country}`.toLowerCase().includes(q))
}
