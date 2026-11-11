/**
 * CROWDER branding — the single place to rebrand the site.
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
  name: 'CROWDER',
  /** Letters burned into the brand mark (logo) */
  initials: 'CR',
  tagline: 'Every part of the ranch, put to work.',
  family: 'The Farrell family',
  owner: 'Farrell',
  established: 1984,
  acres: 3200,

  // ⚠ Placeholder contact details and address: confirm with the owner.
  phone: '(303) 555-0148',
  email: 'office@crowderranch.com',
  hours: 'Mon–Sat, 6 am to 7 pm',

  location: {
    address: '24180 County Road 45',
    city: 'Kiowa',
    state: 'CO',
    stateName: 'Colorado',
    zip: '80117',
    county: 'Elbert County',
    /** Used by the freight estimator */
    lat: 39.347,
    lng: -104.465,
  },

  /**
   * Brand values used in copy and badges. "All Natural" is the owner's wording;
   * switch it off or reword it here once they confirm what they can stand behind.
   */
  values: {
    allNatural: {
      enabled: true,
      label: 'All Natural',
      text: 'Grass, hay, water, and time. No added hormones in the cattle, no synthetic fertilizer on the pasture, and nothing in our compost but manure and hay.',
    },
  },

  /**
   * The "About Farrell" story on the About page, the Meet the Rancher section,
   * and the home pages.
   *
   * ⚠ PLACEHOLDER COPY. Written for the demo from what we know: a family
   * operation, all-natural values, and Farrell's earlier organic fertilizer
   * business. Every line, year, and number needs the owner's OK. Set
   * `confirmed: true` once it has been checked.
   */
  story: {
    confirmed: false,
    heading: 'About Farrell',
    lede: 'Farrell has ranched this ground for more than forty years. Before beef went online, he built an organic fertilizer business from the manure most ranches haul off as waste. CROWDER puts both halves of that life to work.',
    generations: 2,
    sections: [
      {
        id: 'family',
        title: 'A family operation',
        text: 'Farrell runs the ranch with his family: cows, calves, hay, and the books. No investors and no hired manager. When you call, you get one of us.',
      },
      {
        id: 'land',
        title: 'The land',
        text: 'Shortgrass prairie and irrigated alfalfa meadows on the plains east of the Front Range. The cattle graze the native grass from spring to fall and eat our own hay through the winter.',
      },
      {
        id: 'natural',
        title: 'All natural, start to finish',
        text: 'Grass, hay, water, and time. We don’t use added hormones or synthetic fertilizer, and what the cattle leave behind goes back into the soil.',
      },
      {
        id: 'fertilizer',
        title: 'He’s built a fertilizer business before',
        text: 'Years before CROWDER, Farrell composted manure with alfalfa and sold it to Front Range gardeners, landscapers, and farms. That know-how is behind CROWDER Soil and our fuel logs.',
      },
    ],
    quote:
      'Every part of this ranch has a use: the beef, the hide, even the manure. My dad taught me not to waste anything, and it turns out nothing on a ranch has to go to waste.',
    timeline: [
      { year: '1984', text: 'The first 320 acres and forty Hereford cows on Elbert County shortgrass.' },
      { year: '1996', text: 'The herd moves to Angus and Angus-cross cows. The first irrigated alfalfa meadows go in.' },
      { year: '2005', text: 'Farrell starts composting manure with alfalfa and sells organic fertilizer to Front Range gardeners and farms.' },
      { year: '2012', text: 'Every calf gets an electronic ID tag at birth. The ranch is certified in Beef Quality Assurance.' },
      { year: '2024', text: 'A camera chute tunnel goes into Barn 2. Weights and scores now take seconds, with no scale crew.' },
      { year: '2026', text: 'CROWDER sells cattle, beef, Ranch Goods, soil, and fuel straight from the ranch, every one traced to the herd.' },
    ],
  },

  /** Prefix for ear-tag IDs, e.g. CRW-2417 */
  tagPrefix: 'CRW',

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

/** One-line location, e.g. "Kiowa, Colorado" */
export const ranchPlace = `${ranch.location.city}, ${ranch.location.stateName}`
