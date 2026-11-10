import { type ReactNode, useId, useState } from 'react'
import { ChevronLeft, Download, FileText, Printer, Save, Trash2 } from 'lucide-react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { CarcassDiagram, StyleLegend } from '@/components/beef/CarcassDiagram'
import { CutSheetPrint } from '@/components/beef/CutSheetPrint'
import { FreezerCalculator } from '@/components/beef/FreezerCalculator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { beefConfig } from '@/config/beef'
import type { CutCategory, CutSheet, CutStyle, Primal, PrimalChoice, ShareClaim, SharePool, ShareSize, SteakThickness } from '@/data/beefTypes'
import type { Animal } from '@/data/types'
import { beefTitle, claimLabel, quotePool } from '@/lib/beef'
import { downloadText } from '@/lib/chuteScan'
import {
  applyPreset,
  cutSheetCsv,
  cutSheetFileName,
  estimateCuts,
  EXTRAS,
  newCutSheet,
  PRESETS,
  primalInfo,
  PRIMALS,
  ROAST_SIZES,
  STEAKS_PER_PACK,
  STYLE_NAMES,
  THICKNESS_LABELS,
  THICKNESSES,
  WHOLE_MUSCLE,
} from '@/lib/cutSheet'
import { formatDate, formatNumber } from '@/lib/format'
import { usePageTitle } from '@/lib/usePageTitle'
import { cn } from '@/lib/utils'
import { availableShareSizes, SHARE_FRACTION, SHARE_LABELS, takeHomeWeight } from '@/lib/yield'
import { useRanchStore } from '@/store/useRanchStore'

interface ClaimLink {
  pool: SharePool
  claim: ShareClaim
  animal: Animal
}

function findClaim(pools: SharePool[], animals: Animal[], claimId?: string): ClaimLink | undefined {
  if (!claimId) return undefined
  for (const pool of pools) {
    const claim = pool.claims.find((c) => c.id === claimId)
    const animal = animals.find((a) => a.tagId === pool.tagId)
    if (claim && animal) return { pool, claim, animal }
  }
}

function Card({
  id,
  title,
  description,
  children,
  className,
}: {
  id: string
  title: string
  description?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section aria-labelledby={id} className={cn('grid min-w-0 gap-5 rounded-2xl border bg-card p-5 sm:p-6', className)}>
      <div>
        <h2 id={id} className="text-2xl font-bold">
          {title}
        </h2>
        {description && <p className="mt-1 text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  )
}

/** Radio buttons laid out as a row of choices. */
function ChoiceGroup<T extends string>({
  label,
  value,
  options,
  onChange,
  columns = 'sm:grid-cols-4',
}: {
  label: string
  value: T
  options: { value: T; label: string; hint?: string }[]
  onChange: (v: T) => void
  columns?: string
}) {
  const id = useId()
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-1 font-semibold">{label}</legend>
      <RadioGroup value={value} onValueChange={(v) => onChange(v as T)} className={cn('grid grid-cols-2 gap-2', columns)}>
        {options.map((o) => (
          <Label
            key={o.value}
            htmlFor={`${id}-${o.value}`}
            className="flex min-h-12 cursor-pointer items-start gap-3 rounded-lg border p-3 font-normal has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5"
          >
            <RadioGroupItem id={`${id}-${o.value}`} value={o.value} className="mt-0.5" />
            <span>
              <span className="block font-semibold">{o.label}</span>
              {o.hint && <span className="block text-sm text-muted-foreground">{o.hint}</span>}
            </span>
          </Label>
        ))}
      </RadioGroup>
    </fieldset>
  )
}

const CATEGORY_ROWS: { id: CutCategory; label: string; unit: string; tone: string }[] = [
  { id: 'steak', label: 'Steaks', unit: 'packs', tone: 'bg-primary' },
  { id: 'roast', label: 'Roasts & whole cuts', unit: 'roasts', tone: 'bg-chart-3' },
  { id: 'ground', label: 'Ground beef', unit: 'packs', tone: 'bg-chart-4' },
  { id: 'other', label: 'Extras', unit: 'packs', tone: 'bg-chart-5' },
]

export default function CutSheetPage() {
  const { sheetId } = useParams()
  const [params] = useSearchParams()
  const saved = useRanchStore((s) => (sheetId ? s.cutSheets.find((c) => c.id === sheetId) : undefined))
  const cutSheets = useRanchStore((s) => s.cutSheets)
  const pools = useRanchStore((s) => s.pools)
  const animals = useRanchStore((s) => s.animals)

  const claimId = saved?.claimId ?? params.get('claim') ?? undefined
  const link = findClaim(pools, animals, claimId)
  const sizeParam = params.get('size') as ShareSize | null

  if (sheetId && !saved) {
    return (
      <div className="container-page max-w-2xl py-16">
        <h1 className="text-4xl font-bold">We can’t find that cut sheet</h1>
        <p className="mt-3 text-lg text-muted-foreground">Cut sheets are saved in this browser. Start a new one; it only takes a few minutes.</p>
        <Button asChild size="lg" className="mt-6">
          <Link to="/beef/cut-sheet">Start a cut sheet</Link>
        </Button>
      </div>
    )
  }

  // One sheet per claimed share: open the existing one instead of starting another.
  const existing = !sheetId && claimId ? cutSheets.find((c) => c.claimId === claimId) : undefined
  if (existing) return <Navigate to={`/beef/cut-sheet/${existing.id}`} replace />

  const size: ShareSize = link?.claim.size ?? (sizeParam && SHARE_FRACTION[sizeParam] ? sizeParam : 'quarter')
  const initial = saved ?? newCutSheet(size, link ? { claimId: link.claim.id, tagId: link.animal.tagId } : {})

  return <CutSheetEditor key={initial.id} initial={initial} isSaved={Boolean(saved)} link={link} />
}

function CutSheetEditor({ initial, isSaved, link }: { initial: CutSheet; isSaved: boolean; link?: ClaimLink }) {
  const id = useId()
  const navigate = useNavigate()
  const saveCutSheet = useRanchStore((s) => s.saveCutSheet)
  const deleteCutSheet = useRanchStore((s) => s.deleteCutSheet)
  const cutSheets = useRanchStore((s) => s.cutSheets)
  const [sheet, setSheet] = useState(initial)
  const [savedVersion, setSavedVersion] = useState(isSaved ? JSON.stringify(initial) : '')
  const [selected, setSelected] = useState<Primal>('rib')
  usePageTitle(isSaved ? sheet.name : 'Cut sheet builder')

  const takeHomeLb = link
    ? quotePool(link.pool, link.animal, sheet.size).takeHomeLb
    : Math.round(takeHomeWeight(beefConfig.typicalLiveWeight) * SHARE_FRACTION[sheet.size])
  const estimate = estimateCuts(sheet, takeHomeLb)
  const dirty = JSON.stringify(sheet) !== savedVersion
  const owner = link ? claimLabel(link.claim) : undefined
  const info = primalInfo(selected)
  const pick = sheet.primals[selected]
  const max = Math.max(...CATEGORY_ROWS.map((r) => estimate.lb[r.id]), 1)

  // Any hand edit means the sheet no longer matches a preset exactly.
  const edit = (patch: Partial<CutSheet>) => setSheet((s) => ({ ...s, ...patch, preset: undefined }))
  const editPrimal = (p: Primal, patch: Partial<PrimalChoice>) =>
    setSheet((s) => ({ ...s, primals: { ...s.primals, [p]: { ...s.primals[p], ...patch } }, preset: undefined }))

  const save = () => {
    const name = sheet.name.trim() || `My ${SHARE_LABELS[sheet.size].toLowerCase()} share`
    const next = { ...sheet, name, updatedAt: new Date().toISOString() }
    saveCutSheet(next)
    setSheet(next)
    setSavedVersion(JSON.stringify(next))
    toast.success('Cut sheet saved', {
      description: link ? `The ranch will send it to ${beefConfig.processor.name} with your share.` : 'Find it under “Your saved cut sheets.”',
    })
    if (!isSaved) navigate(`/beef/cut-sheet/${next.id}`, { replace: true })
  }

  const download = () => {
    downloadText(cutSheetFileName(sheet), cutSheetCsv(sheet, owner))
    toast.success('Cut sheet downloaded', { description: cutSheetFileName(sheet) })
  }

  const others = cutSheets.filter((c) => c.id !== sheet.id)

  return (
    <>
      <div className="container-page pb-16 print:hidden">
        <div className="pt-4">
          <Link
            to={link ? `/beef/${link.animal.tagId}` : '/beef'}
            className="inline-flex min-h-11 items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
          >
            <ChevronLeft className="size-4" aria-hidden />
            {link ? `Back to ${link.animal.tagId}` : 'Claim your beef'}
          </Link>
        </div>

        <div className="grid gap-4 pt-4 pb-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold sm:text-5xl">Cut sheet</h1>
            <p className="mt-3 text-lg text-muted-foreground">
              Tell the butcher how to cut your {SHARE_LABELS[sheet.size].toLowerCase()}
              {sheet.size === 'whole' ? ' animal' : ''}. Choose a starting point, then click any section of the animal to change it. You can make
              changes until your beef goes to the processor.
            </p>
          </div>
        </div>

        {link ? (
          <p className="mb-8 flex flex-wrap items-center gap-x-2 rounded-2xl border bg-card p-4">
            <FileText className="size-5 text-primary" aria-hidden />
            For your <strong className="font-semibold">{SHARE_LABELS[sheet.size].toLowerCase()}</strong> of{' '}
            <Link to={`/beef/${link.animal.tagId}`} className="font-semibold text-primary underline-offset-4 hover:underline">
              {link.animal.tagId}
            </Link>
            , a {beefTitle(link.animal).replace(/^./, (c) => c.toLowerCase())}. On the meter as {owner}.
          </p>
        ) : (
          <div className="mb-8 grid gap-3 rounded-2xl border bg-card p-5">
            <ChoiceGroup
              label="Share size"
              value={sheet.size}
              columns="sm:grid-cols-3"
              onChange={(size) =>
                setSheet((s) => ({ ...s, size, name: s.name.startsWith('My ') ? `My ${SHARE_LABELS[size].toLowerCase()} share` : s.name }))
              }
              options={availableShareSizes().map((s) => ({
                value: s,
                label: `${SHARE_LABELS[s]}${s === 'whole' ? ' animal' : ''}`,
                hint: `About ${formatNumber(Math.round(takeHomeWeight(beefConfig.typicalLiveWeight) * SHARE_FRACTION[s]))} lb of beef`,
              }))}
            />
            <p className="text-sm text-muted-foreground">
              Planning ahead? Save this sheet now. Once you’ve{' '}
              <Link to="/beef" className="font-medium text-primary underline-offset-4 hover:underline">
                claimed a share
              </Link>
              , open the cut sheet from your order to link them.
            </p>
          </div>
        )}

        <section aria-labelledby={`${id}-presets`} className="mb-8 grid gap-3">
          <h2 id={`${id}-presets`} className="text-2xl font-bold">
            Start from a favorite
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {PRESETS.map((p) => {
              const on = sheet.preset === p.id
              return (
                <li key={p.id} className="grid">
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      setSheet((s) => applyPreset(s, p))
                      toast(`${p.name} applied`, { description: 'Change any section you like.' })
                    }}
                    className={cn(
                      'grid content-start gap-1 rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                      on && 'border-primary bg-primary/5 ring-1 ring-primary',
                    )}
                  >
                    <span className="font-heading text-xl font-bold">{p.name}</span>
                    <span className="text-muted-foreground">{p.description}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-10">
          <div className="grid min-w-0 content-start gap-6">
            <Card id={`${id}-diagram`} title="Choose a section" description="Click part of the animal, or use the buttons below the drawing.">
              <CarcassDiagram primals={sheet.primals} selected={selected} onSelect={setSelected} />
              <StyleLegend />
              <div role="group" aria-label="Sections of the animal" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {PRIMALS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={selected === p.id}
                    onClick={() => setSelected(p.id)}
                    className={cn(
                      'grid min-h-12 content-center rounded-lg border px-3 py-2 text-left transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                      selected === p.id && 'border-foreground bg-foreground text-background hover:bg-foreground',
                    )}
                  >
                    <span className="font-semibold">{p.label}</span>
                    <span className={cn('text-sm', selected === p.id ? 'text-background/80' : 'text-muted-foreground')}>
                      {p.styles[sheet.primals[p.id].style]?.label ?? STYLE_NAMES[sheet.primals[p.id].style]}
                    </span>
                  </button>
                ))}
              </div>
            </Card>

            <Card id={`${id}-primal`} title={info.label} description={info.about}>
              <ChoiceGroup<CutStyle>
                label={`How should the ${info.label.toLowerCase()} be cut?`}
                value={pick.style}
                columns={Object.keys(info.styles).length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}
                onChange={(style) => editPrimal(selected, { style })}
                options={(Object.entries(info.styles) as [CutStyle, NonNullable<(typeof info.styles)[CutStyle]>][]).map(([value, s]) => ({
                  value,
                  label: s.label,
                  hint: s.cuts,
                }))}
              />
              {pick.style === 'steaks' && WHOLE_MUSCLE.includes(selected) && (
                <p className="rounded-lg bg-muted px-4 py-3">
                  This is one long, thin steak, so it’s packed whole. Slice it across the grain after cooking.
                </p>
              )}
              {pick.style === 'steaks' && !WHOLE_MUSCLE.includes(selected) && (
                <>
                  <ChoiceGroup<SteakThickness>
                    label="Steak thickness"
                    value={pick.thickness}
                    onChange={(thickness) => editPrimal(selected, { thickness })}
                    options={THICKNESSES.map((t) => ({
                      value: t,
                      label: THICKNESS_LABELS[t],
                      hint: t === '1.25' || t === '1.5' ? 'Great for grilling' : undefined,
                    }))}
                  />
                  <ChoiceGroup
                    label="Steaks per package"
                    value={String(pick.steaksPerPack)}
                    columns="sm:grid-cols-3"
                    onChange={(v) => editPrimal(selected, { steaksPerPack: Number(v) })}
                    options={STEAKS_PER_PACK.map((n) => ({
                      value: String(n),
                      label: `${n} per pack`,
                      hint: n === 1 ? 'Cooking for one' : n === 4 ? 'Family dinners' : undefined,
                    }))}
                  />
                </>
              )}
              {pick.style === 'roasts' && selected !== 'brisket' && selected !== 'shank' && (
                <ChoiceGroup
                  label="Roast size"
                  value={String(pick.roastLb)}
                  columns="sm:grid-cols-3"
                  onChange={(v) => editPrimal(selected, { roastLb: Number(v) })}
                  options={ROAST_SIZES.map((n) => ({
                    value: String(n),
                    label: `About ${n} lb`,
                    hint: n === 2 ? 'Serves 4' : n === 3 ? 'Serves 6' : 'Serves 8',
                  }))}
                />
              )}
              {pick.style === 'ground' && <p className="rounded-lg bg-muted px-4 py-3">All of it goes to ground beef. Set the package size below.</p>}
            </Card>

            <Card id={`${id}-ground`} title="Ground beef and extras">
              <ChoiceGroup
                label="Ground beef packages"
                value={String(sheet.groundPackLb)}
                columns="sm:grid-cols-2"
                onChange={(v) => edit({ groundPackLb: Number(v) as 1 | 2 })}
                options={[
                  { value: '1', label: '1 lb packs', hint: 'Easy to thaw for one meal' },
                  { value: '2', label: '2 lb packs', hint: 'Fewer packs for bigger families' },
                ]}
              />
              <Label
                htmlFor={`${id}-patties`}
                className="flex min-h-12 cursor-pointer items-center gap-4 rounded-lg border p-3 text-base font-normal"
              >
                <Switch id={`${id}-patties`} checked={sheet.patties} onCheckedChange={(patties) => edit({ patties })} />
                <span>
                  <span className="block font-semibold">Make some into burger patties</span>
                  <span className="text-sm text-muted-foreground">About a third of the ground beef, ⅓ lb each, 6 to a pack.</span>
                </span>
              </Label>
              <fieldset className="grid gap-2">
                <legend className="mb-1 font-semibold">Keep these extras</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {EXTRAS.map((e) => (
                    <Label
                      key={e.id}
                      htmlFor={`${id}-${e.id}`}
                      className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 font-normal has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5"
                    >
                      <Checkbox
                        id={`${id}-${e.id}`}
                        checked={sheet.extras[e.id]}
                        onCheckedChange={(v) => edit({ extras: { ...sheet.extras, [e.id]: v === true } })}
                        className="mt-0.5"
                      />
                      <span>
                        <span className="block font-semibold">{e.label}</span>
                        <span className="text-sm text-muted-foreground">{e.hint}</span>
                      </span>
                    </Label>
                  ))}
                </div>
              </fieldset>
              <div className="grid gap-2">
                <Label htmlFor={`${id}-notes`}>Anything else for the butcher? (optional)</Label>
                <Textarea
                  id={`${id}-notes`}
                  value={sheet.notes}
                  onChange={(e) => edit({ notes: e.target.value })}
                  placeholder="For example: bone-in ribeyes, no cube steak, label packs with my name."
                  rows={3}
                />
              </div>
            </Card>
          </div>

          <aside
            aria-labelledby={`${id}-estimate`}
            className="grid content-start gap-5 rounded-2xl border bg-card p-5 sm:p-6 lg:sticky lg:top-28 lg:self-start"
          >
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Estimate</p>
              <h2 id={`${id}-estimate`} className="text-2xl font-bold">
                What you’ll take home
              </h2>
              <p className="mt-1 text-muted-foreground">
                About {formatNumber(takeHomeLb)} lb from your {SHARE_LABELS[sheet.size].toLowerCase()}
                {sheet.size === 'whole' ? ' animal' : ''}
                {estimate.lb.other ? ', plus the extras you keep' : ''}.
              </p>
            </div>

            <dl className="grid gap-4" aria-live="polite">
              {CATEGORY_ROWS.map((r) => (
                <div key={r.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-1">
                  <dt className="font-semibold">{r.label}</dt>
                  <dd className="font-heading text-xl font-bold tabular-nums">~{estimate.lb[r.id]} lb</dd>
                  <dd className="col-span-2 h-2.5 rounded-full bg-muted" aria-hidden>
                    <div
                      className={cn('h-full rounded-full transition-[width] duration-300', r.tone)}
                      style={{ width: `${(estimate.lb[r.id] / max) * 100}%` }}
                    />
                  </dd>
                  <dd className="col-span-2 text-sm text-muted-foreground">
                    {estimate.lb[r.id] ? `About ${estimate.packages[r.id]} ${r.unit}` : 'None'}
                    {r.id === 'ground' && estimate.pattyLb > 0 && `, including ${estimate.pattyLb} lb of patties`}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="rounded-lg bg-muted px-4 py-3 text-sm">
              This is an estimate. Real weights depend on the animal, how lean it is, and boneless vs. bone-in cuts.
            </p>

            <div className="grid gap-2 border-t pt-5">
              <Label htmlFor={`${id}-name`}>Name this cut sheet</Label>
              <Input id={`${id}-name`} value={sheet.name} onChange={(e) => setSheet((s) => ({ ...s, name: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Button size="lg" onClick={save} className="text-lg">
                <Save aria-hidden />
                {isSaved && !dirty ? 'Saved' : 'Save cut sheet'}
              </Button>
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {dirty ? (isSaved ? 'You have changes that aren’t saved yet.' : 'Not saved yet.') : `Saved ${formatDate(sheet.updatedAt)}.`}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer aria-hidden />
                  Print
                </Button>
                <Button variant="outline" onClick={download}>
                  <Download aria-hidden />
                  CSV
                </Button>
              </div>
              {isSaved && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" className="text-destructive hover:text-destructive">
                      <Trash2 aria-hidden />
                      Delete this cut sheet
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-heading text-2xl">Delete “{sheet.name}”?</AlertDialogTitle>
                      <AlertDialogDescription className="text-base">You can always start a new one. This can’t be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel size="lg">Keep it</AlertDialogCancel>
                      <AlertDialogAction
                        size="lg"
                        variant="destructive"
                        onClick={() => {
                          deleteCutSheet(sheet.id)
                          toast('Cut sheet deleted')
                          navigate('/beef/cut-sheet', { replace: true })
                        }}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </aside>
        </div>

        <FreezerCalculator key={sheet.size} className="mt-10" initialLb={estimate.total} title="Make room in the freezer" />

        {others.length > 0 && (
          <section aria-labelledby={`${id}-saved`} className="mt-10 grid gap-4">
            <h2 id={`${id}-saved`} className="text-2xl font-bold">
              Your saved cut sheets
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((c) => (
                <li key={c.id}>
                  <Link
                    to={`/beef/cut-sheet/${c.id}`}
                    className="grid gap-1 rounded-xl border bg-card p-4 transition-colors hover:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    <span className="font-heading text-xl font-bold">{c.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {SHARE_LABELS[c.size]} share, saved {formatDate(c.updatedAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <CutSheetPrint sheet={sheet} estimate={estimate} takeHomeLb={takeHomeLb} owner={owner} />
    </>
  )
}
