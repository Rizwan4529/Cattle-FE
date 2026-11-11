/** Towns near the ranch where the 3-digit area is too coarse for the store locator. */
export const CO_ZIP5: Record<string, { lat: number; lng: number; area: string }> = {
  '80117': { lat: 39.347, lng: -104.465, area: 'Kiowa' },
  '80107': { lat: 39.36, lng: -104.6, area: 'Elizabeth' },
  '80106': { lat: 39.22, lng: -104.54, area: 'Elbert' },
  '80116': { lat: 39.39, lng: -104.75, area: 'Franktown' },
  '80104': { lat: 39.37, lng: -104.86, area: 'Castle Rock' },
  '80134': { lat: 39.52, lng: -104.76, area: 'Parker' },
  '80138': { lat: 39.52, lng: -104.7, area: 'Parker' },
  '80132': { lat: 39.09, lng: -104.87, area: 'Monument' },
  '80908': { lat: 39.01, lng: -104.7, area: 'Black Forest' },
  '80831': { lat: 38.95, lng: -104.55, area: 'Peyton' },
  '80828': { lat: 39.26, lng: -103.69, area: 'Limon' },
  '80601': { lat: 39.98, lng: -104.82, area: 'Brighton' },
}

/**
 * Rough centers of Colorado's 3-digit ZIP areas, for delivery distance and
 * the store locator. Good to a few miles, which is all a mock quote needs.
 */
export const CO_ZIP3: Record<string, { lat: number; lng: number; area: string }> = {
  '800': { lat: 39.74, lng: -104.99, area: 'Denver' },
  '801': { lat: 39.5, lng: -104.8, area: 'South metro and Elbert County' },
  '802': { lat: 39.73, lng: -104.96, area: 'Denver' },
  '803': { lat: 40.02, lng: -105.25, area: 'Boulder' },
  '804': { lat: 39.74, lng: -105.4, area: 'Foothills' },
  '805': { lat: 40.4, lng: -105.07, area: 'Longmont, Loveland, Fort Collins' },
  '806': { lat: 40.42, lng: -104.71, area: 'Greeley' },
  '807': { lat: 40.62, lng: -103.21, area: 'Sterling and the northeast plains' },
  '808': { lat: 39.0, lng: -104.2, area: 'Colorado Springs east and the plains' },
  '809': { lat: 38.86, lng: -104.79, area: 'Colorado Springs' },
  '810': { lat: 38.25, lng: -104.61, area: 'Pueblo' },
  '811': { lat: 37.47, lng: -105.87, area: 'San Luis Valley' },
  '812': { lat: 38.53, lng: -106.0, area: 'Salida and the Arkansas Valley' },
  '813': { lat: 37.27, lng: -107.88, area: 'Durango' },
  '814': { lat: 38.48, lng: -107.88, area: 'Montrose and Delta' },
  '815': { lat: 39.06, lng: -108.55, area: 'Grand Junction' },
  '816': { lat: 39.55, lng: -107.32, area: 'Glenwood Springs' },
}
