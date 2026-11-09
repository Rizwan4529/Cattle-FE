/**
 * Ranch branding — the single place to rebrand the site.
 *
 * Change the name, contact details, location, fonts, and the full light/dark
 * color palette here. Colors are injected as CSS variables at startup
 * (see src/lib/brand-theme.ts), so every shadcn/ui component, chart, and
 * illustration picks them up automatically.
 */

export interface ThemeTokens {
  background: string
  foreground: string
  card: string
  cardForeground: string
  popover: string
  popoverForeground: string
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  muted: string
  mutedForeground: string
  accent: string
  accentForeground: string
  destructive: string
  border: string
  input: string
  ring: string
  /** "Available" / healthy states */
  success: string
  successForeground: string
  /** "Offer pending" states */
  warning: string
  warningForeground: string
  /** Ear-tag yellow used for tag IDs */
  tag: string
  tagForeground: string
  /** Deep leather tone used for the footer and printed records */
  leather: string
  leatherForeground: string
  /** Price-up / price-down text on the leather background */
  leatherUp: string
  leatherDown: string
  /** Illustration scene colors (sky, far hills, pasture) */
  sceneSky: string
  sceneHill: string
  sceneGround: string
  chart1: string
  chart2: string
  chart3: string
  chart4: string
  chart5: string
}

export const ranch = {
  name: 'Heritage Creek Ranch',
  /** Letters burned into the brand mark (logo) */
  initials: 'HC',
  tagline: 'Ranch-direct cattle from southwest Missouri',
  family: 'The Harmon family',
  owner: 'Walt Harmon',
  established: 1962,
  acres: 2400,

  phone: '(417) 555-0148',
  email: 'office@heritagecreekranch.com',
  hours: 'Mon–Sat, 6 am to 7 pm',

  location: {
    address: '18420 County Road 211',
    city: 'Bolivar',
    state: 'MO',
    stateName: 'Missouri',
    zip: '65613',
    county: 'Polk County',
    /** Used by the freight estimator */
    lat: 37.614,
    lng: -93.41,
  },

  /** Prefix for ear-tag IDs, e.g. HCR-2417 */
  tagPrefix: 'HCR',

  commerce: {
    /** Share of the purchase price due at checkout */
    depositRate: 0.1,
  },

  fonts: {
    heading: "'Rokkitt Variable', 'Rockwell', Georgia, serif",
    body: "'Public Sans Variable', system-ui, 'Segoe UI', sans-serif",
  },

  theme: {
    radius: '0.75rem',
    light: {
      background: '#F1E9D9',
      foreground: '#26221F',
      card: '#FBF8F2',
      cardForeground: '#26221F',
      popover: '#FBF8F2',
      popoverForeground: '#26221F',
      primary: '#8B2E1F',
      primaryForeground: '#FBF3EA',
      secondary: '#E4D7C0',
      secondaryForeground: '#3E2C1C',
      muted: '#E8DECB',
      mutedForeground: '#665A4E',
      accent: '#E2D3BA',
      accentForeground: '#3E2C1C',
      destructive: '#B3261E',
      border: '#D9CBB3',
      input: '#CDBDA2',
      ring: '#8B2E1F',
      success: '#4F6B49',
      successForeground: '#F4F7F1',
      warning: '#B87A12',
      warningForeground: '#1F1607',
      tag: '#F2C230',
      tagForeground: '#2A2108',
      leather: '#2E2219',
      leatherForeground: '#EDE3D2',
      leatherUp: '#A9C99D',
      leatherDown: '#F0A08C',
      sceneSky: '#E9DFCB',
      sceneHill: '#C9C29A',
      sceneGround: '#B3B07E',
      chart1: '#8B2E1F',
      chart2: '#5F7A58',
      chart3: '#B87A12',
      chart4: '#6B4A2F',
      chart5: '#4F6B7A',
    },
    dark: {
      background: '#1B1815',
      foreground: '#EFE7DA',
      card: '#25211C',
      cardForeground: '#EFE7DA',
      popover: '#25211C',
      popoverForeground: '#EFE7DA',
      // Lightened from #D0634B so small link text passes 4.5:1 on dark cards.
      primary: '#E07A62',
      primaryForeground: '#1B1009',
      secondary: '#352D25',
      secondaryForeground: '#EFE7DA',
      muted: '#2E2822',
      mutedForeground: '#B5A894',
      accent: '#3A3128',
      accentForeground: '#EFE7DA',
      destructive: '#EC7A60',
      border: '#3D352C',
      input: '#4A4036',
      ring: '#D0634B',
      success: '#8FAE84',
      successForeground: '#121A10',
      warning: '#E0A93E',
      warningForeground: '#1F1607',
      tag: '#E9B92A',
      tagForeground: '#2A2108',
      leather: '#13100D',
      leatherForeground: '#E8DFD0',
      leatherUp: '#A9C99D',
      leatherDown: '#F0A08C',
      sceneSky: '#3A332B',
      sceneHill: '#4A4A35',
      sceneGround: '#55573A',
      chart1: '#D0634B',
      chart2: '#8FAE84',
      chart3: '#E0A93E',
      chart4: '#B88A62',
      chart5: '#7FA3B5',
    },
  } satisfies { radius: string; light: ThemeTokens; dark: ThemeTokens },
} as const

/** `tel:` link for the ranch phone number */
export const ranchPhoneHref = `tel:+1${ranch.phone.replace(/\D/g, '')}`

/** One-line location, e.g. "Bolivar, Missouri" */
export const ranchPlace = `${ranch.location.city}, ${ranch.location.stateName}`
