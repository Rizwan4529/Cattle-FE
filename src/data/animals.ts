import type {
  Animal,
  AnimalSex,
  CalfAtSide,
  CoatColor,
  HealthEvent,
  Pregnancy,
  ScanRecord,
  WeighIn,
} from './types'

/**
 * Mock herd: 44 head across 10 lots plus a few unlisted animals.
 *
 * Each group below describes a set of animals; individual values (weights,
 * dates, RFIDs, scan confidence) are generated from a fixed seed so the herd
 * is identical on every load.
 */

export const DEMO_TODAY = '2026-11-06'

const VET = 'Dr. Ellen Price, DVM'
const RANCH_HAND = 'Walt Harmon'
export const CHUTE_STATION = 'Barn 2 chute tunnel'

// ---------------------------------------------------------------------------
// Deterministic helpers
// ---------------------------------------------------------------------------

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(2417)
const between = (min: number, max: number) => min + rand() * (max - min)
const int = (min: number, max: number) => Math.round(between(min, max))
const pick = <T,>(items: readonly T[]) => items[Math.floor(rand() * items.length)]

const DAY = 86_400_000
const toDate = (iso: string) => new Date(`${iso}T12:00:00Z`)
const iso = (d: Date) => d.toISOString().slice(0, 10)
const addDays = (date: string, days: number) => iso(new Date(toDate(date).getTime() + days * DAY))
const daysBetween = (a: string, b: string) => Math.round((toDate(b).getTime() - toDate(a).getTime()) / DAY)
const dateBetween = ([from, to]: [string, string]) => addDays(from, int(0, daysBetween(from, to)))
const isPast = (date: string) => date <= DEMO_TODAY

const rfid = () => `840003${Array.from({ length: 9 }, () => int(0, 9)).join('')}`

// ---------------------------------------------------------------------------
// Herd groups
// ---------------------------------------------------------------------------

export type Program = 'calf' | 'yearling' | 'bred-heifer' | 'cow' | 'bull'

export interface HerdGroup {
  tags: number[]
  breed: string
  sex: AnimalSex
  /** A single color, or a list cycled across the group */
  coat: CoatColor | CoatColor[]
  born: [string, string]
  weight: [number, number]
  frame: [number, number]
  bcs: [number, number]
  program: Program
  lastScan: string
  sires: string[]
  weanDate?: string
  pregnancy?: { bredTo: string; bred: [string, string] }
  calf?: { tags: number[]; born: [string, string]; weight: [number, number] }
  registry?: string
  notes: string[]
}

export const COMMERCIAL_SIRES = ['HCR Ridgeline 2105', 'HCR Big Sky 1903', 'Harmon Boundary 708']

const groups: HerdGroup[] = [
  // Lot 101: Black Angus steers
  {
    tags: [2411, 2412, 2414, 2417, 2419, 2420],
    breed: 'Angus',
    sex: 'steer',
    coat: 'black',
    born: ['2026-02-24', '2026-03-28'],
    weight: [608, 676],
    frame: [5, 6],
    bcs: [5, 6],
    program: 'calf',
    weanDate: '2026-09-04',
    lastScan: '2026-11-02',
    sires: COMMERCIAL_SIRES,
    notes: ['', 'Easy keeper, top of the pen on gain.', '', 'Calm in the chute.'],
  },
  // Lot 102: Red Angus heifers
  {
    tags: [2431, 2433, 2434, 2436, 2438],
    breed: 'Red Angus',
    sex: 'heifer',
    coat: 'red',
    born: ['2026-02-20', '2026-03-20'],
    weight: [558, 622],
    frame: [5, 5],
    bcs: [5, 6],
    program: 'calf',
    weanDate: '2026-09-04',
    lastScan: '2026-11-02',
    sires: ['Creekside Lineman 44', 'HCR Red Ember 1810'],
    notes: ['Open, never exposed.', 'Replacement quality, good udder on dam.', 'Open, never exposed.'],
  },
  // Lot 103: Black Baldy bred heifers
  {
    tags: [2507, 2511, 2512, 2518],
    breed: 'Angus × Hereford',
    sex: 'heifer',
    coat: 'black-baldy',
    born: ['2025-02-18', '2025-03-15'],
    weight: [985, 1075],
    frame: [5, 6],
    bcs: [6, 6],
    program: 'bred-heifer',
    lastScan: '2026-10-30',
    sires: ['Harmon Boundary 708', 'HCR Patriot 1612'],
    pregnancy: { bredTo: 'HCR Easy Calver 2210 (calving-ease Angus)', bred: ['2026-05-26', '2026-06-08'] },
    notes: ['AI bred, one service.', 'Bangs vaccinated.', 'Gentle, halter-started as a calf.', ''],
  },
  // Lot 104: cow-calf pairs
  {
    tags: [2104, 2117, 2209],
    breed: 'Angus cross',
    sex: 'cow',
    coat: ['black', 'black-baldy', 'black'],
    born: ['2020-03-01', '2022-03-20'],
    weight: [1260, 1390],
    frame: [5, 6],
    bcs: [5, 6],
    program: 'cow',
    lastScan: '2026-10-28',
    sires: ['HCR Big Sky 1903', 'Creekside Lineman 44'],
    calf: { tags: [2642, 2645, 2649], born: ['2026-09-02', '2026-09-24'], weight: [165, 225] },
    notes: ['Exposed back to an Angus bull since Nov 1.', 'Raised a heavy calf every year.', 'Sound feet and udder.'],
  },
  // Lot 105: registered Angus yearling bulls
  {
    tags: [2502, 2505],
    breed: 'Registered Angus',
    sex: 'bull',
    coat: 'black',
    born: ['2025-01-14', '2025-02-10'],
    weight: [1265, 1390],
    frame: [6, 7],
    bcs: [6, 6],
    program: 'bull',
    lastScan: '2026-10-30',
    sires: ['HCR Patriot 1612', 'HCR Ridgeline 2105'],
    registry: 'AAA',
    notes: ['Calving-ease EPDs in the top 25% of the breed.', 'Docile, walks the alley quietly.'],
  },
  // Lot 106: Charolais-cross feeder steers
  {
    tags: [2441, 2443, 2444, 2447, 2448],
    breed: 'Charolais cross',
    sex: 'steer',
    coat: ['charolais', 'charolais', 'smoke', 'charolais', 'smoke'],
    born: ['2026-01-28', '2026-02-26'],
    weight: [742, 818],
    frame: [6, 7],
    bcs: [5, 6],
    program: 'calf',
    weanDate: '2026-08-21',
    lastScan: '2026-10-31',
    sires: ['HCR White Cap 1907'],
    notes: ['Big-framed, lots of stretch.', '', 'Bunk-broke.'],
  },
  // Lot 107: Hereford stocker heifers
  {
    tags: [2452, 2455, 2457, 2459],
    breed: 'Hereford',
    sex: 'heifer',
    coat: 'hereford',
    born: ['2026-03-10', '2026-04-05'],
    weight: [492, 552],
    frame: [4, 5],
    bcs: [5, 5],
    program: 'calf',
    weanDate: '2026-09-11',
    lastScan: '2026-11-03',
    sires: ['HCR Domino 1714'],
    notes: ['Good grass heifers.', 'Pigmented eyes.', ''],
  },
  // Lot 108: Black Angus yearling steers (sold)
  {
    tags: [2522, 2525, 2527, 2530],
    breed: 'Angus',
    sex: 'steer',
    coat: 'black',
    born: ['2025-03-02', '2025-04-01'],
    weight: [852, 912],
    frame: [6, 6],
    bcs: [6, 6],
    program: 'yearling',
    weanDate: '2025-09-10',
    lastScan: '2026-10-12',
    sires: COMMERCIAL_SIRES,
    notes: ['Off fescue pasture.', ''],
  },
  // Lot 109: polled Hereford herd bull
  {
    tags: [2307],
    breed: 'Registered Polled Hereford',
    sex: 'bull',
    coat: 'hereford',
    born: ['2023-02-08', '2023-02-08'],
    weight: [1860, 1860],
    frame: [6, 6],
    bcs: [6, 6],
    program: 'bull',
    lastScan: '2026-10-30',
    sires: ['HCR Domino 1714'],
    registry: 'AHA',
    notes: ['Two seasons on our cows. Selling only to avoid breeding his own daughters.'],
  },
  // Lot 110: mixed stocker steers, newly weaned
  {
    tags: [2461, 2463, 2466, 2468],
    breed: 'Angus cross',
    sex: 'steer',
    coat: ['black', 'black-baldy', 'smoke', 'red'],
    born: ['2026-04-02', '2026-04-28'],
    weight: [458, 506],
    frame: [5, 5],
    bcs: [5, 5],
    program: 'calf',
    weanDate: '2026-10-22',
    lastScan: '2026-11-04',
    sires: COMMERCIAL_SIRES,
    notes: ['Weaned two weeks ago, still settling in.', 'First round of shots given at weaning.'],
  },
  // Unlisted: replacement heifers kept back
  {
    tags: [2421, 2424],
    breed: 'Angus',
    sex: 'heifer',
    coat: 'black',
    born: ['2026-02-22', '2026-03-10'],
    weight: [585, 640],
    frame: [5, 6],
    bcs: [5, 6],
    program: 'calf',
    weanDate: '2026-09-04',
    lastScan: '2026-11-02',
    sires: ['HCR Ridgeline 2105'],
    notes: ['Kept back as a replacement.'],
  },
  // Unlisted: spring-calving bred cows
  {
    tags: [1912, 2011, 2115],
    breed: 'Angus',
    sex: 'cow',
    coat: 'black',
    born: ['2019-02-15', '2021-03-15'],
    weight: [1290, 1420],
    frame: [5, 6],
    bcs: [5, 6],
    program: 'cow',
    lastScan: '2026-10-28',
    sires: ['HCR Big Sky 1903'],
    pregnancy: { bredTo: 'HCR Ridgeline 2105', bred: ['2026-06-20', '2026-07-12'] },
    notes: ['Core of the cow herd.'],
  },
  // Unlisted: steer held back
  {
    tags: [2402],
    breed: 'Angus',
    sex: 'steer',
    coat: 'black',
    born: ['2026-03-04', '2026-03-04'],
    weight: [590, 590],
    frame: [5, 5],
    bcs: [5, 5],
    program: 'calf',
    weanDate: '2026-09-04',
    lastScan: '2026-11-02',
    sires: ['HCR Big Sky 1903'],
    notes: ['Held back until his foot rot treatment withdrawal clears.'],
  },
]

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

let eventSeq = 0
const event = (date: string, type: HealthEvent['type'], detail: string, product?: string, by = RANCH_HAND): HealthEvent => ({
  id: `h${++eventSeq}`,
  date,
  type,
  product,
  detail,
  by,
})

function healthFor(group: HerdGroup, sex: AnimalSex, birthDate: string, pregnancy?: Pregnancy): HealthEvent[] {
  const events: HealthEvent[] = []
  const add = (e: HealthEvent) => {
    if (isPast(e.date)) events.push(e)
  }

  switch (group.program) {
    case 'calf':
    case 'yearling': {
      const branding = addDays(birthDate, int(40, 55))
      add(event(branding, 'vaccination', 'Clostridial 7-way, 2 mL under the skin', 'Vision 7 with SPUR'))
      add(event(branding, 'vaccination', 'Intranasal respiratory (IBR, BRSV, PI3)', 'Inforce 3'))
      if (sex === 'steer') add(event(branding, 'castration', 'Banded at branding'))
      if (sex === 'heifer' && group.program === 'calf') {
        add(event(addDays(branding, 90), 'vaccination', 'Brucellosis calfhood vaccination, official tag', 'RB51 (Bangs)', VET))
      }
      const wean = group.weanDate!
      const preconditioned = daysBetween(wean, DEMO_TODAY) >= 45
      if (preconditioned) {
        add(event(addDays(wean, -21), 'vaccination', 'Pre-weaning respiratory and Mannheimia', 'Bovi-Shield Gold One Shot'))
      }
      add(event(wean, 'weaning', 'Fence-line weaned, started on feed bunk and water trough'))
      add(event(wean, 'deworming', 'Internal and external parasites', 'Dectomax Pour-On'))
      if (!preconditioned) {
        add(event(wean, 'vaccination', 'First-round respiratory vaccine at weaning', 'Bovi-Shield Gold 5'))
      }
      add(event(addDays(wean, 21), 'vaccination', 'Respiratory booster (modified live)', 'Bovi-Shield Gold 5'))
      add(event(addDays(wean, 21), 'vaccination', 'Clostridial booster', 'Vision 7 with SPUR'))
      if (group.program === 'yearling') {
        add(event('2026-04-15', 'deworming', 'Spring turnout deworming', 'Cydectin Pour-On'))
        add(event('2026-04-15', 'vaccination', 'Pinkeye protection for summer grass', 'Pinkeye Shield XT4'))
      }
      break
    }
    case 'bred-heifer': {
      add(event(addDays(birthDate, 150), 'vaccination', 'Brucellosis calfhood vaccination, official tag', 'RB51 (Bangs)', VET))
      add(event('2026-04-22', 'vaccination', 'Pre-breeding: respiratory, BVD fetal protection, lepto, vibrio', 'CattleMaster Gold FP 5 VL5'))
      add(event('2026-04-22', 'deworming', 'Pre-breeding deworming', 'Cydectin Pour-On'))
      if (pregnancy?.dueDate) {
        add(event('2026-07-28', 'pregnancy-check', `Confirmed bred by ultrasound. Due ${pregnancy.dueDate}.`, undefined, VET))
      }
      add(event('2026-10-14', 'vaccination', 'Scours protection ahead of calving', 'ScourGuard 4KC'))
      break
    }
    case 'cow': {
      add(event('2026-02-12', 'vaccination', 'Annual respiratory and reproductive vaccine', 'Express FP 10'))
      add(event('2026-04-15', 'deworming', 'Spring turnout deworming', 'Ivomec Pour-On'))
      if (group.calf) {
        add(event('2026-07-30', 'vaccination', 'Pre-calving scours vaccine', 'ScourGuard 4KC'))
      }
      if (pregnancy?.dueDate) {
        add(event('2026-09-22', 'pregnancy-check', `Confirmed bred by palpation. Due ${pregnancy.dueDate}.`, undefined, VET))
      }
      break
    }
    case 'bull': {
      add(event('2026-03-02', 'vaccination', 'Annual respiratory and lepto', 'Bovi-Shield Gold FP 5 L5'))
      add(event('2026-03-02', 'vaccination', 'Clostridial 7-way', 'Vision 7 with SPUR'))
      add(event('2026-03-02', 'deworming', 'Spring deworming', 'Cydectin Pour-On'))
      add(
        event(
          '2026-10-15',
          'exam',
          `Breeding soundness exam passed. Scrotal ${int(37, 41)} cm, motility ${int(65, 80)}%, morphology ${int(78, 90)}% normal.`,
          undefined,
          VET,
        ),
      )
      add(event('2026-10-15', 'exam', 'Trichomoniasis PCR test: negative', undefined, VET))
      break
    }
  }

  return events.sort((a, b) => a.date.localeCompare(b.date))
}

function weightAt(date: string, birthDate: string, birthWeight: number, current: number, from: string) {
  // Linear growth from birth (calves) or from `from` (adults), with a little noise.
  const start = from > birthDate ? from : birthDate
  const total = daysBetween(start, DEMO_TODAY) || 1
  const progress = Math.min(1, Math.max(0, daysBetween(start, date) / total))
  const jitter = 1 + (rand() - 0.5) * 0.02
  return Math.round((birthWeight + (current - birthWeight) * progress) * jitter)
}

function growthFor(
  group: HerdGroup,
  birthDate: string,
  estWeight: number,
  frameScore: number,
  bcs: number,
): { weighIns: WeighIn[]; scans: ScanRecord[]; scanConfidence: number } {
  const isYoung = group.program === 'calf'
  const birthWeight = int(68, 88)
  // Adults: show the last year. Animals that were still growing then start much lighter.
  const windowStart = isYoung ? birthDate : '2025-11-15'
  const startFactor = daysBetween(birthDate, windowStart) < 420 ? 0.6 : 0.94
  const startWeight = isYoung ? birthWeight : Math.round(estWeight * startFactor)
  const w = (date: string) => weightAt(date, birthDate, startWeight, estWeight, windowStart)

  const weighIns: WeighIn[] = []
  if (isYoung) {
    weighIns.push({ date: birthDate, weight: birthWeight, source: 'birth' })
    weighIns.push({ date: addDays(birthDate, 48), weight: w(addDays(birthDate, 48)), source: 'scale' })
    weighIns.push({ date: group.weanDate!, weight: w(group.weanDate!), source: 'scale' })
  } else {
    for (const d of ['2025-11-15', '2026-02-12', '2026-04-15', '2026-07-01']) {
      weighIns.push({ date: d, weight: d === '2025-11-15' ? startWeight : w(d), source: 'scale' })
    }
  }

  const scanDates = [addDays(group.lastScan, -int(26, 34)), group.lastScan].filter(
    (d) => d > (isYoung ? addDays(birthDate, 60) : '2026-07-01'),
  )
  const scans: ScanRecord[] = scanDates.map((date, i) => {
    const latest = i === scanDates.length - 1
    return {
      id: `s-${date}-${i}`,
      date,
      station: CHUTE_STATION,
      estWeight: latest ? estWeight : w(date),
      frameScore,
      bcs,
      confidence: Math.round(between(91, 99.4) * 10) / 10,
    }
  })
  for (const s of scans) weighIns.push({ date: s.date, weight: s.estWeight, source: 'chute-scan' })
  weighIns.sort((a, b) => a.date.localeCompare(b.date))

  return { weighIns, scans, scanConfidence: scans[scans.length - 1].confidence }
}

export function buildAnimal(group: HerdGroup, index: number): Animal {
  const tagNumber = group.tags[index]
  const tagId = `HCR-${tagNumber}`
  const coat = Array.isArray(group.coat) ? group.coat[index % group.coat.length] : group.coat
  const birthDate = dateBetween(group.born)
  const estWeight = int(...group.weight)
  const frameScore = int(...group.frame)
  const bcs = int(...group.bcs)

  let pregnancy: Pregnancy | undefined
  if (group.pregnancy) {
    const bred = dateBetween(group.pregnancy.bred)
    pregnancy = {
      status: 'bred',
      checkedOn: group.program === 'cow' ? '2026-09-22' : '2026-07-28',
      method: group.program === 'cow' ? 'palpation' : 'ultrasound',
      dueDate: addDays(bred, 283),
      bredTo: group.pregnancy.bredTo,
    }
  }

  let calfAtSide: CalfAtSide | undefined
  if (group.calf) {
    calfAtSide = {
      tagId: `HCR-${group.calf.tags[index]}`,
      sex: rand() > 0.5 ? 'bull calf' : 'heifer calf',
      birthDate: dateBetween(group.calf.born),
      estWeight: int(...group.calf.weight),
    }
  }

  const growth = growthFor(group, birthDate, estWeight, frameScore, bcs)
  const weanDays = group.weanDate ? daysBetween(group.weanDate, DEMO_TODAY) : 0

  return {
    tagId,
    eid: rfid(),
    breed: group.breed,
    sex: group.sex,
    birthDate,
    estWeight,
    frameScore,
    bcs,
    coatColor: coat,
    sire: pick(group.sires),
    dam: group.program === 'calf' || group.program === 'yearling' || group.program === 'bred-heifer' ? `HCR-${int(1805, 2290)}` : undefined,
    registration: group.registry ? `${group.registry} ${int(20_400_000, 20_499_999)}` : undefined,
    health: healthFor(group, group.sex, birthDate, pregnancy),
    weighIns: growth.weighIns,
    scans: growth.scans,
    pregnancy,
    calfAtSide,
    weaned: true,
    weanDate: group.weanDate,
    preconditioned: group.weanDate ? weanDays >= 45 : false,
    ageSourceVerified: true,
    notes: group.notes[index % group.notes.length],
    photos: [],
    scanDate: group.lastScan,
    scanConfidence: growth.scanConfidence,
  }
}

const generated = groups.flatMap((g) => g.tags.map((_, i) => buildAnimal(g, i)))

// One-off records that make the herd feel lived-in.
const special: Record<string, (a: Animal) => Animal> = {
  'HCR-2414': (a) => ({
    ...a,
    health: [
      ...a.health,
      event('2026-07-18', 'treatment', 'Pinkeye, right eye. Treated once, fully healed. Withdrawal period complete.', 'LA-200 (oxytetracycline)'),
    ].sort((x, y) => x.date.localeCompare(y.date)),
  }),
  'HCR-2402': (a) => ({
    ...a,
    health: [
      ...a.health,
      event('2026-10-27', 'treatment', 'Foot rot, left hind. 28-day meat withdrawal, clears Nov 24.', 'Excede (ceftiofur)', VET),
    ].sort((x, y) => x.date.localeCompare(y.date)),
  }),
}

export const animals: Animal[] = generated.map((a) => special[a.tagId]?.(a) ?? a)
