import Papa from 'papaparse'
import { ranch } from '@/config/ranch'
import { DEMO_TODAY } from '@/data/animals'
import type { Animal, AnimalSex, CoatColor } from '@/data/types'

/**
 * CSV import for the herd: read the file, match its columns to ours, check
 * every row, and turn the good rows into new animals or new readings for
 * animals already in the herd. Accepts the sample template, the chute scan
 * file, and the herd export as-is.
 */

export type TargetField =
  'tagId' | 'eid' | 'breed' | 'sex' | 'coatColor' | 'birthDate' | 'estWeight' | 'frameScore' | 'bcs' | 'scanConfidence' | 'scanDate' | 'notes'

interface FieldSpec {
  key: TargetField
  label: string
  required?: boolean
  hint: string
  /** Header names that mean this field, compared without case, spaces, or punctuation */
  synonyms: string[]
}

export const TARGET_FIELDS: FieldSpec[] = [
  {
    key: 'tagId',
    label: 'Ear tag',
    required: true,
    hint: 'CRW-2417, or just 2417',
    synonyms: ['tagid', 'tag', 'eartag', 'tagnumber', 'tagno', 'tagnum', 'visualtag', 'visualid', 'animalid', 'id'],
  },
  {
    key: 'estWeight',
    label: 'Weight (lb)',
    required: true,
    hint: 'Scale or camera weight',
    synonyms: ['estweightlb', 'weight', 'weightlb', 'weightlbs', 'wt', 'wtlb', 'wtlbs', 'lbs', 'estweight', 'estimatedweight', 'scaleweight'],
  },
  {
    key: 'sex',
    label: 'Sex',
    hint: 'Steer, heifer, cow, or bull. Needed for new animals.',
    synonyms: ['sex', 'gender', 'class', 'type', 'sexclass'],
  },
  { key: 'breed', label: 'Breed', hint: 'Angus, Hereford, Angus cross…', synonyms: ['breed', 'breeds'] },
  {
    key: 'coatColor',
    label: 'Coat color',
    hint: 'Black, red, white face, smoke…',
    synonyms: ['coatcolor', 'coat', 'color', 'colour', 'hide', 'hidecolor'],
  },
  {
    key: 'birthDate',
    label: 'Birth date',
    hint: '2026-03-14 or 3/14/2026',
    synonyms: ['birthdate', 'dob', 'born', 'dateofbirth', 'birth', 'birthday'],
  },
  {
    key: 'eid',
    label: 'Electronic ID',
    hint: '15-digit RFID number',
    synonyms: ['eid', 'rfid', 'electronicid', 'eidtag', 'rfidtag', 'eidnumber', 'rfidnumber', '840tag'],
  },
  { key: 'frameScore', label: 'Frame score', hint: '1 to 9', synonyms: ['framescore', 'frame', 'fs'] },
  { key: 'bcs', label: 'Body condition', hint: '1 to 9', synonyms: ['bcs', 'bodycondition', 'bodyconditionscore', 'condition', 'conditionscore'] },
  {
    key: 'scanConfidence',
    label: 'Camera confidence (%)',
    hint: 'From the chute camera, 0 to 100',
    synonyms: ['scanconfidencepct', 'confidence', 'scanconfidence', 'confidencepct', 'conf'],
  },
  {
    key: 'scanDate',
    label: 'Date weighed',
    hint: 'When the weight was taken. Defaults to today.',
    synonyms: ['scandate', 'scannedat', 'weighdate', 'weighedon', 'dateweighed', 'scanned', 'date'],
  },
  { key: 'notes', label: 'Notes', hint: 'Anything else', synonyms: ['notes', 'note', 'comments', 'comment', 'remarks'] },
]

export type Mapping = Partial<Record<TargetField, string>>

const normalize = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, '')

/** Matches each of our fields to a column in the file by name. Each column is used once. */
export function guessMapping(headers: string[]): Mapping {
  const mapping: Mapping = {}
  const used = new Set<string>()
  for (const field of TARGET_FIELDS) {
    // Earlier synonyms are stronger matches, so try them in order.
    for (const syn of field.synonyms) {
      const header = headers.find((h) => !used.has(h) && normalize(h) === syn)
      if (header) {
        mapping[field.key] = header
        used.add(header)
        break
      }
    }
  }
  return mapping
}

export interface ParsedFile {
  fileName: string
  headers: string[]
  /** Data rows with their line number in the file (the header is line 1) */
  rows: { line: number; cells: Record<string, string> }[]
  blankRows: number
}

export function parseCsv(text: string, fileName: string): ParsedFile {
  // Drop a byte-order mark and trailing newlines, so the last line isn't read as a blank row.
  const result = Papa.parse<Record<string, string>>(text.replace(/^\uFEFF/, '').trimEnd(), {
    header: true,
    skipEmptyLines: false,
    transformHeader: (h) => h.trim(),
  })
  const headers = (result.meta.fields ?? []).filter((h) => h !== '')
  let blankRows = 0
  const rows: ParsedFile['rows'] = []
  result.data.forEach((cells, i) => {
    if (Object.values(cells).every((v) => !String(v ?? '').trim())) {
      blankRows++
      return
    }
    rows.push({ line: i + 2, cells })
  })
  return { fileName, headers, rows, blankRows }
}

// ---------------------------------------------------------------------------
// Reading values
// ---------------------------------------------------------------------------

const parseNumber = (s: string) => {
  const n = Number(s.replace(/,/g, '').replace(/[^\d.-]/g, ''))
  return s.trim() && Number.isFinite(n) ? n : null
}

/** yyyy-mm-dd (with or without a time), m/d/yyyy, or m/d/yy. */
export function parseDate(s: string): string | null {
  const t = s.trim()
  let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (m) return valid(+m[1], +m[2], +m[3])
  m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/)
  if (m) {
    const year = m[3].length === 2 ? 2000 + +m[3] : +m[3]
    return valid(year, +m[1], +m[2])
  }
  return null
}
function valid(y: number, mo: number, d: number) {
  const date = new Date(Date.UTC(y, mo - 1, d))
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) return null
  return date.toISOString().slice(0, 10)
}

const SEXES: [RegExp, AnimalSex][] = [
  [/^(s|str|steer|steers|steer calf)$/, 'steer'],
  [/^(h|hfr|heifer|heifers|heifer calf|bred heifer|open heifer|replacement heifer)$/, 'heifer'],
  [/^(c|cow|cows|bred cow|pair|cow-calf pair)$/, 'cow'],
  [/^(b|bull|bulls|bull calf)$/, 'bull'],
]
export const parseSex = (s: string) => SEXES.find(([re]) => re.test(s.trim().toLowerCase()))?.[1] ?? null

const COATS: [RegExp, CoatColor][] = [
  [/^(bwf|black baldy|black-baldy|baldy|black,? white face|black whiteface|black w\/ white face)$/, 'black-baldy'],
  [/^(rwf|hereford|red,? white face|red whiteface|white face|whiteface)$/, 'hereford'],
  [/^(blk|black|blk angus)$/, 'black'],
  [/^(red|rd)$/, 'red'],
  [/^(char|charolais|white|cream|white \/ cream|white\/cream|wht)$/, 'charolais'],
  [/^(smoke|smoky|gray|grey|smoke \(gray\)|smk)$/, 'smoke'],
]
export const parseCoat = (s: string) => COATS.find(([re]) => re.test(s.trim().toLowerCase()))?.[1] ?? null

/** "2417" → "CRW-2417"; "crw 2417" → "CRW-2417". Anything else is kept, uppercased. */
export function normalizeTag(s: string): { tag: string; prefixed: boolean } {
  const t = s.trim().toUpperCase()
  if (/^\d{1,6}$/.test(t)) return { tag: `${ranch.tagPrefix}-${t}`, prefixed: true }
  const m = t.match(new RegExp(`^${ranch.tagPrefix}[\\s-]*(\\d+)$`))
  return { tag: m ? `${ranch.tagPrefix}-${m[1]}` : t, prefixed: false }
}

// ---------------------------------------------------------------------------
// Checking rows
// ---------------------------------------------------------------------------

export interface Issue {
  level: 'error' | 'warning'
  field?: TargetField
  message: string
}

export interface Values {
  tagId: string
  eid?: string
  breed?: string
  sex?: AnimalSex
  coatColor?: CoatColor
  birthDate?: string
  estWeight?: number
  frameScore?: number
  bcs?: number
  scanConfidence?: number
  scanDate: string
  notes?: string
}

export interface CheckedRow {
  line: number
  values: Values
  /** add: new animal. update: new readings for an animal already in the herd. skip: not imported. */
  action: 'add' | 'update' | 'skip'
  issues: Issue[]
}

export type ExistingMode = 'update' | 'skip'

/** Checks every row. Rows with an error are skipped; warnings are imported with the fix described. */
export function checkRows(file: ParsedFile, mapping: Mapping, herd: Animal[], existing: ExistingMode): CheckedRow[] {
  const inHerd = new Set(herd.map((a) => a.tagId))
  const firstLine = new Map<string, number>()
  const cell = (cells: Record<string, string>, f: TargetField) => (mapping[f] ? String(cells[mapping[f]!] ?? '').trim() : '')

  return file.rows.map(({ line, cells }) => {
    const issues: Issue[] = []
    const err = (message: string, field?: TargetField) => issues.push({ level: 'error', field, message })
    const warn = (message: string, field?: TargetField) => issues.push({ level: 'warning', field, message })

    const rawTag = cell(cells, 'tagId')
    const { tag, prefixed } = normalizeTag(rawTag)
    const values: Values = { tagId: tag, scanDate: DEMO_TODAY }

    if (!rawTag) err('No ear tag.', 'tagId')
    else {
      if (prefixed) warn(`Tag written as ${rawTag}; saved as ${tag}.`, 'tagId')
      const seen = firstLine.get(tag)
      if (seen) err(`Same tag as line ${seen}. Only the first is imported.`, 'tagId')
      else firstLine.set(tag, line)
    }
    const known = inHerd.has(tag)

    const weightRaw = cell(cells, 'estWeight')
    const weight = parseNumber(weightRaw)
    if (!weightRaw) {
      if (known) warn('No weight. The current weight is kept.', 'estWeight')
      else err('No weight.', 'estWeight')
    } else if (weight === null || weight < 40 || weight > 3000) err(`Weight "${weightRaw}" doesn't look right (40 to 3,000 lb).`, 'estWeight')
    else values.estWeight = Math.round(weight)

    const sexRaw = cell(cells, 'sex')
    const sex = sexRaw ? parseSex(sexRaw) : null
    if (sex) values.sex = sex
    else if (!known)
      err(sexRaw ? `Sex "${sexRaw}" not recognized. Use steer, heifer, cow, or bull.` : 'No sex given; needed for a new animal.', 'sex')
    else if (sexRaw) warn(`Sex "${sexRaw}" not recognized; the herd record is kept.`, 'sex')

    const coatRaw = cell(cells, 'coatColor')
    const coat = coatRaw ? parseCoat(coatRaw) : null
    if (coat) values.coatColor = coat
    else if (coatRaw) warn(`Coat "${coatRaw}" not recognized${known ? '; the herd record is kept' : '; saved as black'}.`, 'coatColor')
    else if (!known) warn('No coat color; saved as black.', 'coatColor')

    const breed = cell(cells, 'breed')
    if (breed) values.breed = breed
    else if (!known) warn('No breed; saved as "Crossbred".', 'breed')

    const birthRaw = cell(cells, 'birthDate')
    const birth = birthRaw ? parseDate(birthRaw) : null
    if (birth && birth <= DEMO_TODAY) values.birthDate = birth
    else if (birthRaw) warn(`Birth date "${birthRaw}" not understood${known ? '' : '; age estimated from weight'}.`, 'birthDate')
    else if (!known) warn('No birth date; age estimated from weight.', 'birthDate')

    const dateRaw = cell(cells, 'scanDate')
    if (dateRaw) {
      const d = parseDate(dateRaw)
      if (d && d <= DEMO_TODAY) values.scanDate = d
      else warn(`Date weighed "${dateRaw}" not understood; today is used.`, 'scanDate')
    }

    const eidRaw = cell(cells, 'eid').replace(/\s/g, '')
    if (eidRaw) {
      if (/^\d{15}$/.test(eidRaw)) values.eid = eidRaw
      else warn(`Electronic ID "${cell(cells, 'eid')}" isn't 15 digits; left off.`, 'eid')
    }

    for (const f of ['frameScore', 'bcs'] as const) {
      const raw = cell(cells, f)
      if (!raw) continue
      const n = parseNumber(raw)
      if (n !== null && Number.isInteger(n) && n >= 1 && n <= 9) values[f] = n
      else warn(`${f === 'bcs' ? 'Body condition' : 'Frame score'} "${raw}" should be 1 to 9; left off.`, f)
    }

    const confRaw = cell(cells, 'scanConfidence').replace('%', '')
    if (confRaw) {
      const n = parseNumber(confRaw)
      if (n !== null && n >= 0 && n <= 100) values.scanConfidence = Math.round(n * 10) / 10
      else warn(`Confidence "${confRaw}" should be 0 to 100; left off.`, 'scanConfidence')
    }

    const notes = cell(cells, 'notes')
    if (notes) values.notes = notes

    let action: CheckedRow['action'] = known ? 'update' : 'add'
    if (issues.some((i) => i.level === 'error')) action = 'skip'
    else if (known && existing === 'skip') {
      action = 'skip'
      issues.push({ level: 'warning', field: 'tagId', message: 'Already in the herd; skipped.' })
    }
    return { line, values, action, issues }
  })
}

// ---------------------------------------------------------------------------
// Building records
// ---------------------------------------------------------------------------

const addDays = (date: string, days: number) => {
  const d = new Date(`${date}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Rough age from weight when no birth date is given: calves gain about 2.2 lb a day. */
const estimatedBirth = (weight: number, sex: AnimalSex, on: string) =>
  sex === 'cow' || sex === 'bull' ? addDays(on, -Math.round(365 * 3.5)) : addDays(on, -Math.min(720, Math.max(60, Math.round((weight - 80) / 2.2))))

export const IMPORT_STATION = 'CSV import'

function readings(v: Values) {
  const weighIn = v.estWeight
    ? [{ date: v.scanDate, weight: v.estWeight, source: v.scanConfidence !== undefined ? ('chute-scan' as const) : ('scale' as const) }]
    : []
  const scan =
    v.scanConfidence !== undefined && v.estWeight
      ? [
          {
            // One imported reading per animal per day: importing the same day again replaces it.
            id: `import-${v.tagId}-${v.scanDate}`,
            date: v.scanDate,
            station: IMPORT_STATION,
            estWeight: v.estWeight,
            frameScore: v.frameScore ?? 5,
            bcs: v.bcs ?? 5,
            confidence: v.scanConfidence,
          },
        ]
      : []
  return { weighIn, scan }
}

export function toNewAnimal(v: Values): Animal {
  const sex = v.sex!
  const weight = v.estWeight!
  const birthDate = v.birthDate ?? estimatedBirth(weight, sex, v.scanDate)
  const { weighIn, scan } = readings(v)
  const ageDays = (Date.parse(v.scanDate) - Date.parse(birthDate)) / 86_400_000
  return {
    tagId: v.tagId,
    eid: v.eid,
    breed: v.breed ?? 'Crossbred',
    sex,
    birthDate,
    estWeight: weight,
    frameScore: v.frameScore ?? 5,
    bcs: v.bcs ?? 5,
    coatColor: v.coatColor ?? 'black',
    health: [],
    weighIns: weighIn,
    scans: scan,
    weaned: ageDays > 200,
    preconditioned: false,
    ageSourceVerified: false,
    notes: v.notes ?? '',
    photos: [],
    scanDate: v.scanDate,
    scanConfidence: v.scanConfidence ?? 0,
  }
}

/** New readings for an animal already in the herd: the weight and scores change, and the weight is added to its history. */
export function toUpdate(v: Values, current: Animal): Partial<Animal> {
  const { weighIn, scan } = readings(v)
  const patch: Partial<Animal> = {}
  if (v.estWeight) {
    patch.estWeight = v.estWeight
    patch.weighIns = [...current.weighIns.filter((w) => !(w.date === v.scanDate && w.source !== 'birth')), ...weighIn].sort((a, b) =>
      a.date.localeCompare(b.date),
    )
  }
  if (scan.length) {
    patch.scans = [...current.scans.filter((x) => x.id !== scan[0].id), ...scan]
    patch.scanConfidence = v.scanConfidence
    patch.scanDate = v.scanDate
  }
  if (v.frameScore) patch.frameScore = v.frameScore
  if (v.bcs) patch.bcs = v.bcs
  if (v.eid && !current.eid) patch.eid = v.eid
  if (v.notes) patch.notes = current.notes ? `${current.notes} ${v.notes}` : v.notes
  if (v.coatColor) patch.coatColor = v.coatColor
  if (v.breed) patch.breed = v.breed
  if (v.birthDate) patch.birthDate = v.birthDate
  return patch
}

// ---------------------------------------------------------------------------
// Template
// ---------------------------------------------------------------------------

export const TEMPLATE_NAME = `${ranch.tagPrefix.toLowerCase()}-herd-import-template.csv`

/** Our column names with two example rows, for the "Download the template" button. */
export function templateCsv() {
  return Papa.unparse([
    {
      tag_id: `${ranch.tagPrefix}-2601`,
      eid: '840003123456789',
      breed: 'Angus',
      sex: 'steer',
      coat_color: 'black',
      birth_date: '2026-03-12',
      est_weight_lb: 562,
      frame_score: 5,
      bcs: 5,
      scan_confidence_pct: 96.4,
      scan_date: DEMO_TODAY,
      notes: 'Weaned Sept 18',
    },
    {
      tag_id: `${ranch.tagPrefix}-2602`,
      eid: '',
      breed: 'Angus cross',
      sex: 'heifer',
      coat_color: 'black baldy',
      birth_date: '3/30/2026',
      est_weight_lb: 518,
      frame_score: '',
      bcs: '',
      scan_confidence_pct: '',
      scan_date: '',
      notes: '',
    },
  ])
}
