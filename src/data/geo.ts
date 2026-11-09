/**
 * Geography for the freight estimator: the lower 48 states with approximate
 * center points, and the first-3-digit ZIP ranges for each state.
 * Accurate enough for a haul estimate, not for routing.
 */

export interface UsState {
  abbr: string
  name: string
  lat: number
  lng: number
}

export const US_STATES: UsState[] = [
  { abbr: 'AL', name: 'Alabama', lat: 32.8, lng: -86.8 },
  { abbr: 'AZ', name: 'Arizona', lat: 34.3, lng: -111.7 },
  { abbr: 'AR', name: 'Arkansas', lat: 34.9, lng: -92.4 },
  { abbr: 'CA', name: 'California', lat: 37.2, lng: -119.5 },
  { abbr: 'CO', name: 'Colorado', lat: 39.0, lng: -105.5 },
  { abbr: 'CT', name: 'Connecticut', lat: 41.6, lng: -72.7 },
  { abbr: 'DE', name: 'Delaware', lat: 39.0, lng: -75.5 },
  { abbr: 'FL', name: 'Florida', lat: 28.6, lng: -82.4 },
  { abbr: 'GA', name: 'Georgia', lat: 32.7, lng: -83.4 },
  { abbr: 'ID', name: 'Idaho', lat: 44.4, lng: -114.6 },
  { abbr: 'IL', name: 'Illinois', lat: 40.0, lng: -89.2 },
  { abbr: 'IN', name: 'Indiana', lat: 39.9, lng: -86.3 },
  { abbr: 'IA', name: 'Iowa', lat: 42.1, lng: -93.5 },
  { abbr: 'KS', name: 'Kansas', lat: 38.5, lng: -98.4 },
  { abbr: 'KY', name: 'Kentucky', lat: 37.5, lng: -85.3 },
  { abbr: 'LA', name: 'Louisiana', lat: 31.1, lng: -92.0 },
  { abbr: 'ME', name: 'Maine', lat: 45.4, lng: -69.2 },
  { abbr: 'MD', name: 'Maryland', lat: 39.0, lng: -76.8 },
  { abbr: 'MA', name: 'Massachusetts', lat: 42.3, lng: -71.8 },
  { abbr: 'MI', name: 'Michigan', lat: 44.3, lng: -85.4 },
  { abbr: 'MN', name: 'Minnesota', lat: 46.3, lng: -94.3 },
  { abbr: 'MS', name: 'Mississippi', lat: 32.7, lng: -89.7 },
  { abbr: 'MO', name: 'Missouri', lat: 38.4, lng: -92.5 },
  { abbr: 'MT', name: 'Montana', lat: 47.0, lng: -109.6 },
  { abbr: 'NE', name: 'Nebraska', lat: 41.5, lng: -99.8 },
  { abbr: 'NV', name: 'Nevada', lat: 39.3, lng: -116.6 },
  { abbr: 'NH', name: 'New Hampshire', lat: 43.7, lng: -71.6 },
  { abbr: 'NJ', name: 'New Jersey', lat: 40.2, lng: -74.7 },
  { abbr: 'NM', name: 'New Mexico', lat: 34.4, lng: -106.1 },
  { abbr: 'NY', name: 'New York', lat: 42.9, lng: -75.5 },
  { abbr: 'NC', name: 'North Carolina', lat: 35.6, lng: -79.4 },
  { abbr: 'ND', name: 'North Dakota', lat: 47.5, lng: -100.5 },
  { abbr: 'OH', name: 'Ohio', lat: 40.3, lng: -82.8 },
  { abbr: 'OK', name: 'Oklahoma', lat: 35.6, lng: -97.5 },
  { abbr: 'OR', name: 'Oregon', lat: 43.9, lng: -120.6 },
  { abbr: 'PA', name: 'Pennsylvania', lat: 40.9, lng: -77.8 },
  { abbr: 'RI', name: 'Rhode Island', lat: 41.7, lng: -71.5 },
  { abbr: 'SC', name: 'South Carolina', lat: 33.9, lng: -80.9 },
  { abbr: 'SD', name: 'South Dakota', lat: 44.4, lng: -100.2 },
  { abbr: 'TN', name: 'Tennessee', lat: 35.9, lng: -86.4 },
  { abbr: 'TX', name: 'Texas', lat: 31.5, lng: -99.3 },
  { abbr: 'UT', name: 'Utah', lat: 39.3, lng: -111.7 },
  { abbr: 'VT', name: 'Vermont', lat: 44.1, lng: -72.7 },
  { abbr: 'VA', name: 'Virginia', lat: 37.5, lng: -78.9 },
  { abbr: 'WA', name: 'Washington', lat: 47.4, lng: -120.5 },
  { abbr: 'WV', name: 'West Virginia', lat: 38.6, lng: -80.6 },
  { abbr: 'WI', name: 'Wisconsin', lat: 44.6, lng: -89.9 },
  { abbr: 'WY', name: 'Wyoming', lat: 43.0, lng: -107.6 },
]

/** [first ZIP3, last ZIP3, state]. Washington DC (200–205) maps to Maryland. */
const ZIP3_RANGES: [number, number, string][] = [
  [10, 27, 'MA'],
  [28, 29, 'RI'],
  [30, 38, 'NH'],
  [39, 49, 'ME'],
  [50, 59, 'VT'],
  [60, 69, 'CT'],
  [70, 89, 'NJ'],
  [100, 149, 'NY'],
  [150, 196, 'PA'],
  [197, 199, 'DE'],
  [200, 219, 'MD'],
  [220, 246, 'VA'],
  [247, 268, 'WV'],
  [270, 289, 'NC'],
  [290, 299, 'SC'],
  [300, 319, 'GA'],
  [320, 349, 'FL'],
  [350, 369, 'AL'],
  [370, 385, 'TN'],
  [386, 397, 'MS'],
  [398, 399, 'GA'],
  [400, 427, 'KY'],
  [430, 459, 'OH'],
  [460, 479, 'IN'],
  [480, 499, 'MI'],
  [500, 528, 'IA'],
  [530, 549, 'WI'],
  [550, 567, 'MN'],
  [570, 577, 'SD'],
  [580, 588, 'ND'],
  [590, 599, 'MT'],
  [600, 629, 'IL'],
  [630, 658, 'MO'],
  [660, 679, 'KS'],
  [680, 693, 'NE'],
  [700, 714, 'LA'],
  [716, 729, 'AR'],
  [730, 749, 'OK'],
  [750, 799, 'TX'],
  [800, 816, 'CO'],
  [820, 831, 'WY'],
  [832, 838, 'ID'],
  [840, 847, 'UT'],
  [850, 865, 'AZ'],
  [870, 884, 'NM'],
  [885, 885, 'TX'],
  [889, 898, 'NV'],
  [900, 961, 'CA'],
  [970, 979, 'OR'],
  [980, 994, 'WA'],
]

/** State for a 5-digit ZIP in the lower 48, or undefined. */
export function stateForZip(zip: string): UsState | undefined {
  if (!/^\d{5}$/.test(zip)) return undefined
  const zip3 = Number(zip.slice(0, 3))
  const abbr = ZIP3_RANGES.find(([lo, hi]) => zip3 >= lo && zip3 <= hi)?.[2]
  return US_STATES.find((s) => s.abbr === abbr)
}
