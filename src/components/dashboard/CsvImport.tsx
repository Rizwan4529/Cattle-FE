import { type DragEvent, useId, useRef, useState } from 'react'
import { CircleAlert, CircleCheck, Download, FileSpreadsheet, FileUp, PackagePlus, TriangleAlert, Upload } from 'lucide-react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import sampleCsv from '@/data/samples/messy-sale-barn-sheet.csv?raw'
import { downloadText } from '@/lib/chuteScan'
import { formatNumber } from '@/lib/format'
import {
  type CheckedRow,
  checkRows,
  type ExistingMode,
  guessMapping,
  type Mapping,
  type ParsedFile,
  parseCsv,
  TARGET_FIELDS,
  TEMPLATE_NAME,
  templateCsv,
  toNewAnimal,
  toUpdate,
} from '@/lib/herdImport'
import { COAT_LABELS, SEX_LABELS } from '@/lib/labels'
import { cn } from '@/lib/utils'
import { useRanchStore } from '@/store/useRanchStore'

type Step = 'upload' | 'map' | 'check' | 'done'
const STEPS: { value: Step; label: string }[] = [
  { value: 'upload', label: 'Choose a file' },
  { value: 'map', label: 'Match columns' },
  { value: 'check', label: 'Check rows' },
  { value: 'done', label: 'Imported' },
]
const NONE = '__none__'
const MAX_BYTES = 2 * 1024 * 1024

function Stepper({ step }: { step: Step }) {
  const at = STEPS.findIndex((s) => s.value === step)
  return (
    <ol className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Import steps">
      {STEPS.map((s, i) => (
        <li key={s.value} className="flex items-center gap-2" aria-current={i === at ? 'step' : undefined}>
          <span
            className={cn(
              'grid size-8 place-items-center rounded-full border-2 font-heading font-bold tabular-nums',
              i < at && 'border-success bg-success text-success-foreground',
              i === at && 'border-primary bg-primary text-primary-foreground',
              i > at && 'border-border text-muted-foreground',
            )}
          >
            {i < at ? <CircleCheck className="size-4" aria-label="Done" /> : i + 1}
          </span>
          <span className={cn(i === at ? 'font-semibold' : 'text-muted-foreground')}>{s.label}</span>
        </li>
      ))}
    </ol>
  )
}

interface Result {
  added: string[]
  updated: string[]
  skipped: number
}

/**
 * Bring ear-tag data in from a spreadsheet: choose or drop a CSV, match its
 * columns to ours, check every row, then add new animals and update existing
 * ones. Rows with errors are left out and listed.
 */
export function CsvImport({ onShowHerd }: { onShowHerd: () => void }) {
  const id = useId()
  const navigate = useNavigate()
  const animals = useRanchStore((s) => s.animals)
  const importAnimals = useRanchStore((s) => s.importAnimals)
  const input = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<ParsedFile | null>(null)
  const [mapping, setMapping] = useState<Mapping>({})
  const [existing, setExisting] = useState<ExistingMode>('update')
  const [show, setShow] = useState<'all' | 'problems'>('all')
  const [dragging, setDragging] = useState(false)
  const [fileError, setFileError] = useState('')
  const [result, setResult] = useState<Result | null>(null)

  const load = (text: string, name: string) => {
    const parsed = parseCsv(text, name)
    if (!parsed.headers.length || !parsed.rows.length) {
      setFileError(`${name} has no rows to import. The first line should be column names, with one animal per line below.`)
      return
    }
    setFileError('')
    setFile(parsed)
    setMapping(guessMapping(parsed.headers))
    setShow('all')
    setStep('map')
  }

  const readFile = async (f: File | undefined) => {
    if (!f) return
    if (!/\.(csv|txt)$/i.test(f.name) && f.type !== 'text/csv') {
      setFileError(`${f.name} isn't a CSV file. In Excel or Google Sheets, use File, then Download or Save As, and pick CSV.`)
      return
    }
    if (f.size > MAX_BYTES) {
      setFileError(`${f.name} is larger than 2 MB. Split it into smaller files.`)
      return
    }
    load(await f.text(), f.name)
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    readFile(e.dataTransfer.files[0])
  }

  const reset = () => {
    setStep('upload')
    setFile(null)
    setResult(null)
    if (input.current) input.current.value = ''
  }

  const rows: CheckedRow[] = file && step !== 'upload' ? checkRows(file, mapping, animals, existing) : []
  const toAdd = rows.filter((r) => r.action === 'add')
  const toUpdateRows = rows.filter((r) => r.action === 'update')
  const errors = rows.filter((r) => r.issues.some((i) => i.level === 'error'))
  const warned = rows.filter((r) => r.action !== 'skip' && r.issues.length > 0)
  const shown = show === 'all' ? rows : rows.filter((r) => r.issues.length > 0)
  const missingRequired = TARGET_FIELDS.filter((f) => f.required && !mapping[f.key])
  const usedHeaders = new Set(Object.values(mapping))
  const unusedHeaders = file?.headers.filter((h) => !usedHeaders.has(h)) ?? []

  const runImport = () => {
    const byTag = new Map(animals.map((a) => [a.tagId, a]))
    const added = toAdd.map((r) => toNewAnimal(r.values))
    const updates = toUpdateRows.map((r) => ({ tagId: r.values.tagId, patch: toUpdate(r.values, byTag.get(r.values.tagId)!) }))
    importAnimals(added, updates)
    const res = { added: added.map((a) => a.tagId), updated: updates.map((u) => u.tagId), skipped: rows.length - added.length - updates.length }
    setResult(res)
    setStep('done')
    toast.success('Import finished', {
      description: `${res.added.length} new, ${res.updated.length} updated${res.skipped ? `, ${res.skipped} skipped` : ''}.`,
    })
  }

  const example = (header?: string) => (header && file ? (file.rows.find((r) => String(r.cells[header] ?? '').trim())?.cells[header] ?? '') : '')

  return (
    <section aria-labelledby="import-heading" className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="import-heading" className="text-3xl font-bold">
            Import from a spreadsheet
          </h2>
          <p className="mt-1 max-w-[70ch] text-muted-foreground">
            Bring in ear tags and weights from a CSV file: a sale barn sheet, your own spreadsheet, or the chute scan file.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            downloadText(TEMPLATE_NAME, templateCsv())
            toast.success('Template downloaded', { description: `${TEMPLATE_NAME}. Fill it in, save it as CSV, and import it here.` })
          }}
        >
          <Download aria-hidden />
          Download the template
        </Button>
      </div>

      <Stepper step={step} />

      {step === 'upload' && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div className="grid gap-3">
            <label
              htmlFor={`${id}-file`}
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={cn(
                'grid min-h-64 cursor-pointer place-items-center rounded-2xl border-2 border-dashed bg-card p-8 text-center transition-colors focus-within:ring-3 focus-within:ring-ring/50',
                dragging ? 'border-primary bg-primary/5' : 'hover:border-primary/60',
              )}
            >
              <span className="grid justify-items-center gap-3">
                <FileUp className="size-12 text-primary" aria-hidden />
                <span className="font-heading text-2xl font-bold">{dragging ? 'Drop it here' : 'Drag a CSV file here'}</span>
                <span className="text-muted-foreground">or</span>
                <span className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 font-semibold text-primary-foreground">
                  <Upload className="size-5" aria-hidden />
                  Choose a file
                </span>
              </span>
              <input
                ref={input}
                id={`${id}-file`}
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(e) => readFile(e.target.files?.[0])}
                aria-describedby={fileError ? `${id}-file-error` : undefined}
              />
            </label>
            {fileError && (
              <p id={`${id}-file-error`} role="alert" className="flex items-start gap-2 font-medium text-destructive">
                <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
                {fileError}
              </p>
            )}
          </div>

          <div className="grid content-start gap-4 rounded-2xl border bg-card p-5 sm:p-6">
            <h3 className="text-2xl font-bold">What the file needs</h3>
            <ul className="grid gap-2">
              <li>
                <strong className="font-semibold">Ear tag and weight</strong> on every row.
              </li>
              <li>
                <strong className="font-semibold">Sex</strong> for animals not already in your herd.
              </li>
              <li>Breed, coat, birth date, RFID, frame, body condition, and notes if you have them.</li>
              <li>Column names don't have to match ours. You'll match them up next.</li>
            </ul>
            <p className="text-muted-foreground">Tags already in the herd get their new weight and scores added to their record.</p>
            <Button variant="ghost" className="justify-self-start" onClick={() => load(sampleCsv, 'sale-barn-sheet.csv')}>
              <FileSpreadsheet aria-hidden />
              Try it with a sample file
            </Button>
          </div>
        </div>
      )}

      {step === 'map' && file && (
        <div className="grid gap-5">
          <p className="text-lg">
            <strong className="font-semibold">{file.fileName}</strong>: {file.rows.length} {file.rows.length === 1 ? 'row' : 'rows'}
            {file.blankRows > 0 && `, ${file.blankRows} blank ${file.blankRows === 1 ? 'line' : 'lines'} ignored`}. We matched the columns we
            recognized. Check them, and pick any we missed.
          </p>
          <div className="relative overflow-x-auto rounded-2xl border bg-card">
            <table className="w-full min-w-[40rem] text-left">
              <caption className="sr-only">Match each of our fields to a column in your file</caption>
              <thead className="bg-muted">
                <tr className="[&_th]:px-4 [&_th]:py-2.5 [&_th]:font-semibold">
                  <th scope="col">Our field</th>
                  <th scope="col">Column in your file</th>
                  <th scope="col">First value</th>
                </tr>
              </thead>
              <tbody>
                {TARGET_FIELDS.map((f) => {
                  const selectId = `${id}-map-${f.key}`
                  const missing = f.required && !mapping[f.key]
                  return (
                    <tr key={f.key} className="border-t [&_td]:px-4 [&_td]:py-2.5">
                      <th scope="row" className="px-4 py-2.5 align-top font-normal">
                        <Label htmlFor={selectId} className="font-semibold">
                          {f.label}
                          {f.required && <span className="font-normal text-muted-foreground"> (required)</span>}
                        </Label>
                        <span className="block text-sm text-muted-foreground">{f.hint}</span>
                      </th>
                      <td className="align-top">
                        <Select
                          value={mapping[f.key] ?? NONE}
                          onValueChange={(v) => setMapping((m) => ({ ...m, [f.key]: v === NONE ? undefined : v }))}
                        >
                          <SelectTrigger id={selectId} className="w-full max-w-64" aria-invalid={missing}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NONE}>Not in this file</SelectItem>
                            {file.headers.map((h) => (
                              <SelectItem key={h} value={h}>
                                {h}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="align-top text-muted-foreground">
                        <span className="block max-w-48 truncate pt-2.5">{example(mapping[f.key]) || '–'}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {unusedHeaders.length > 0 && <p className="text-muted-foreground">Not imported: {unusedHeaders.join(', ')}.</p>}
          {missingRequired.length > 0 && (
            <p role="alert" className="flex items-start gap-2 font-medium text-destructive">
              <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
              Pick the column for {missingRequired.map((f) => f.label.toLowerCase()).join(' and ')} to go on.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button size="lg" onClick={() => setStep('check')} disabled={missingRequired.length > 0}>
              Check rows
            </Button>
            <Button size="lg" variant="outline" onClick={reset}>
              Choose a different file
            </Button>
          </div>
        </div>
      )}

      {step === 'check' && file && (
        <div className="grid gap-5">
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border md:grid-cols-4">
            {[
              { label: 'New animals', value: toAdd.length, tone: '' },
              { label: 'Updates to the herd', value: toUpdateRows.length, tone: '' },
              { label: 'Imported with a fix', value: warned.length, tone: 'text-warning-foreground dark:text-warning' },
              { label: 'Left out (errors)', value: errors.length, tone: errors.length ? 'text-destructive' : '' },
            ].map((s) => (
              <div key={s.label} className="bg-card px-5 py-4">
                <dt className="text-muted-foreground">{s.label}</dt>
                <dd className={cn('font-heading text-4xl font-bold tabular-nums', s.tone)}>{s.value}</dd>
              </div>
            ))}
          </dl>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <fieldset className="grid gap-2">
              <legend className="mb-2 font-medium">Tags already in your herd</legend>
              <RadioGroup value={existing} onValueChange={(v) => setExisting(v as ExistingMode)} className="flex flex-wrap gap-x-6 gap-y-2">
                {[
                  { value: 'update', label: 'Add the new readings' },
                  { value: 'skip', label: 'Leave them alone' },
                ].map((o) => (
                  <Label
                    key={o.value}
                    htmlFor={`${id}-existing-${o.value}`}
                    className="flex min-h-11 cursor-pointer items-center gap-2.5 font-normal"
                  >
                    <RadioGroupItem id={`${id}-existing-${o.value}`} value={o.value} />
                    {o.label}
                  </Label>
                ))}
              </RadioGroup>
            </fieldset>
            <ToggleGroup type="single" variant="outline" value={show} onValueChange={(v) => v && setShow(v as typeof show)} aria-label="Show rows">
              <ToggleGroupItem value="all" className="h-11 px-4 text-base data-[state=on]:bg-secondary data-[state=on]:font-semibold">
                All rows
              </ToggleGroupItem>
              <ToggleGroupItem value="problems" className="h-11 px-4 text-base data-[state=on]:bg-secondary data-[state=on]:font-semibold">
                Problems only
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="relative max-h-[36rem] overflow-auto rounded-2xl border bg-card" tabIndex={0} aria-label="Rows from the file">
            <table className="w-full min-w-[52rem] text-left tabular-nums">
              <caption className="sr-only">Every row in the file, what will happen to it, and any problems found</caption>
              <thead className="sticky top-0 z-10 bg-muted">
                <tr className="[&_th]:px-3 [&_th]:py-2.5 [&_th]:font-semibold">
                  <th scope="col" className="text-right">
                    Line
                  </th>
                  <th scope="col">Tag</th>
                  <th scope="col">Animal</th>
                  <th scope="col" className="text-right">
                    Weight
                  </th>
                  <th scope="col">Result</th>
                  <th scope="col">Notes from the check</th>
                </tr>
              </thead>
              <tbody>
                {shown.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No problems found.
                    </td>
                  </tr>
                )}
                {shown.map((r) => {
                  const hasError = r.issues.some((i) => i.level === 'error')
                  const v = r.values
                  return (
                    <tr key={r.line} className={cn('border-t align-top [&_td]:px-3 [&_td]:py-2.5', hasError && 'bg-destructive/5')}>
                      <td className="text-right text-muted-foreground">{r.line}</td>
                      <th scope="row" className="px-3 py-2.5 font-heading text-lg font-bold whitespace-nowrap">
                        {v.tagId || '–'}
                      </th>
                      <td>
                        {[v.sex && SEX_LABELS[v.sex], v.breed, v.coatColor && COAT_LABELS[v.coatColor].toLowerCase()].filter(Boolean).join(', ') || (
                          <span className="text-muted-foreground">From the herd record</span>
                        )}
                      </td>
                      <td className="text-right font-semibold">{v.estWeight ? `${formatNumber(v.estWeight)} lb` : '–'}</td>
                      <td>
                        <Badge
                          variant="outline"
                          className={cn(
                            'h-7 px-2.5 text-sm whitespace-nowrap',
                            r.action === 'add' && 'border-success text-foreground',
                            r.action === 'update' && 'border-primary/60 text-foreground',
                            r.action === 'skip' && 'border-destructive/60 text-destructive',
                          )}
                        >
                          {r.action === 'add' ? 'New' : r.action === 'update' ? 'Update' : 'Left out'}
                        </Badge>
                      </td>
                      <td>
                        {r.issues.length === 0 ? (
                          <span className="text-muted-foreground">Looks good</span>
                        ) : (
                          <ul className="grid gap-1">
                            {r.issues.map((i) => (
                              <li
                                key={i.message}
                                className={cn(
                                  'flex items-start gap-1.5',
                                  i.level === 'error' ? 'font-medium text-destructive' : 'text-warning-foreground dark:text-warning',
                                )}
                              >
                                {i.level === 'error' ? (
                                  <CircleAlert className="mt-1 size-4 shrink-0" aria-label="Error:" />
                                ) : (
                                  <TriangleAlert className="mt-1 size-4 shrink-0" aria-label="Fixed:" />
                                )}
                                {i.message}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button size="lg" onClick={runImport} disabled={toAdd.length + toUpdateRows.length === 0}>
              <Upload aria-hidden />
              Import {toAdd.length + toUpdateRows.length} {toAdd.length + toUpdateRows.length === 1 ? 'animal' : 'animals'}
            </Button>
            <Button size="lg" variant="outline" onClick={() => setStep('map')}>
              Back to columns
            </Button>
            {errors.length > 0 && (
              <p className="text-muted-foreground">
                {errors.length} {errors.length === 1 ? 'row is' : 'rows are'} left out. Fix {errors.length === 1 ? 'it' : 'them'} in the spreadsheet
                and import again.
              </p>
            )}
          </div>
        </div>
      )}

      {step === 'done' && result && (
        <div className="grid gap-5 rounded-2xl border-2 border-success/40 bg-card p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <CircleCheck className="mt-1 size-7 shrink-0 text-success" aria-hidden />
            <div>
              <h3 className="text-3xl font-bold">
                {result.added.length} new {result.added.length === 1 ? 'animal' : 'animals'} added, {result.updated.length} updated
              </h3>
              <p className="mt-1 text-lg text-muted-foreground">
                {result.skipped > 0 ? `${result.skipped} ${result.skipped === 1 ? 'row was' : 'rows were'} left out. ` : ''}
                Each animal has its own record, and new weights show on its chart.
              </p>
            </div>
          </div>
          {result.added.length > 0 && <p className="text-muted-foreground">New tags: {result.added.join(', ')}</p>}
          <div className="flex flex-wrap gap-2">
            {result.added.length > 0 && (
              <Button size="lg" onClick={() => navigate(`/dashboard/lots/new?tags=${result.added.join(',')}`)}>
                <PackagePlus aria-hidden />
                Build a lot from the new animals
              </Button>
            )}
            <Button size="lg" variant="outline" onClick={onShowHerd}>
              See them in the herd
            </Button>
            <Button size="lg" variant="ghost" onClick={reset}>
              Import another file
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}
