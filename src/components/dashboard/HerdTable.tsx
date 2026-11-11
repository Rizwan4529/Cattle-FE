import { type KeyboardEvent, useId, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, Check, Download, PackagePlus, Pencil, Search, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { CreateLotDialog } from '@/components/lots/CreateLotDialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Animal, Lot } from '@/data/types'
import { downloadText } from '@/lib/chuteScan'
import { HERD_CLASSES, type HerdClassId, herdCsv, herdCsvName, type HerdStatus, herdStatus, indexLots, type LotIndex } from '@/lib/dashboard'
import { formatAge, formatNumber } from '@/lib/format'
import { COAT_LABELS, SEX_LABELS } from '@/lib/labels'
import { ranch } from '@/config/ranch'
import { useMediaQuery } from '@/lib/useMediaQuery'
import { cn } from '@/lib/utils'
import { useRanchStore } from '@/store/useRanchStore'

type SortKey = 'tag' | 'age' | 'weight'
type StatusFilter = 'all' | 'unlisted' | 'listed' | 'draft' | 'sold' | 'beef'

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Any status' },
  { value: 'unlisted', label: 'Not listed' },
  { value: 'listed', label: 'Listed for sale' },
  { value: 'draft', label: 'In a draft lot' },
  { value: 'sold', label: 'Sold' },
  { value: 'beef', label: 'Raised for beef' },
]

const matchesStatus = (status: HerdStatus, filter: StatusFilter) =>
  filter === 'all' ||
  (filter === 'listed'
    ? status === 'listed' || status === 'pending'
    : filter === 'beef'
      ? status === 'beef' || status === 'harvested'
      : status === filter)

/** Animals raised for beef are sold by the share, so they can't be picked for a cattle lot. */
const selectable = (a: Animal) => !a.feedProgram

interface Draft {
  tagId: string
  estWeight: string
  frameScore: string
  bcs: string
}

const LIMITS = {
  estWeight: { min: 40, max: 3000, label: 'Weight', unit: 'lb' },
  frameScore: { min: 1, max: 9, label: 'Frame score', unit: '' },
  bcs: { min: 1, max: 9, label: 'Body condition', unit: '' },
} as const
type EditField = keyof typeof LIMITS

function Where({ animal, index }: { animal: Animal; index: LotIndex }) {
  const status = herdStatus(animal, index)
  const lot = index.get(animal.tagId)
  const short: Record<HerdStatus, string> = {
    unlisted: 'Not listed',
    draft: 'Draft',
    listed: 'Listed',
    pending: 'Offer pending',
    sold: 'Sold',
    beef: 'Raised for beef',
    harvested: 'Harvested',
  }
  return (
    <span className="xl:whitespace-nowrap">
      <span
        className={cn(
          status === 'unlisted' && 'text-muted-foreground',
          status === 'pending' && 'font-medium text-warning-foreground dark:text-warning',
        )}
      >
        {short[status]}
      </span>
      {animal.feedProgram && (
        <>
          {', '}
          <Link to={`/beef/${animal.tagId}`} className="font-medium text-primary underline-offset-4 hover:underline">
            beef page
          </Link>
        </>
      )}
      {lot && (
        <>
          {', '}
          <Link to={`/lots/${lot.id}`} className="font-medium text-primary underline-offset-4 hover:underline">
            Lot {lot.number}
          </Link>
        </>
      )}
    </span>
  )
}

/**
 * Every animal on the books. Search and filter, sort by tag, age, or weight,
 * edit weight and scores in place, and select rows to make a lot or download.
 */
export function HerdTable() {
  const id = useId()
  const navigate = useNavigate()
  const animals = useRanchStore((s) => s.animals)
  const lots = useRanchStore((s) => s.lots)
  const updateAnimal = useRanchStore((s) => s.updateAnimal)
  const wide = useMediaQuery('(min-width: 1440px)')
  const index = indexLots(lots)

  const [query, setQuery] = useState('')
  const [classId, setClassId] = useState<HerdClassId | 'all'>('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'tag', dir: 1 })
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [draft, setDraft] = useState<Draft | null>(null)
  const [invalid, setInvalid] = useState<EditField | null>(null)
  const [creating, setCreating] = useState(false)

  const q = query
    .trim()
    .toLowerCase()
    .replace(new RegExp(`^${ranch.tagPrefix.toLowerCase()}-?`), '')
  const classMatch = HERD_CLASSES.find((c) => c.id === classId)?.match
  const visible = animals
    .filter((a) => !classMatch || classMatch(a))
    .filter((a) => matchesStatus(herdStatus(a, index), status))
    .filter((a) => !q || [a.tagId, a.breed, a.eid ?? '', a.notes, COAT_LABELS[a.coatColor]].some((f) => f.toLowerCase().includes(q)))
    .sort((a, b) => {
      const d =
        sort.key === 'tag'
          ? a.tagId.localeCompare(b.tagId)
          : sort.key === 'weight'
            ? a.estWeight - b.estWeight
            : b.birthDate.localeCompare(a.birthDate)
      return d * sort.dir
    })

  const visibleSelected = visible.filter((a) => selected.has(a.tagId)).length
  const pickable = visible.filter(selectable).length
  const hiddenSelected = selected.size - visibleSelected
  const selectedAnimals = animals.filter((a) => selected.has(a.tagId))
  const filtered = query !== '' || classId !== 'all' || status !== 'all'

  const toggle = (tag: string, on: boolean) =>
    setSelected((s) => {
      const next = new Set(s)
      if (on) next.add(tag)
      else next.delete(tag)
      return next
    })
  const toggleVisible = (on: boolean) =>
    setSelected((s) => {
      const next = new Set(s)
      for (const a of visible.filter(selectable)) {
        if (on) next.add(a.tagId)
        else next.delete(a.tagId)
      }
      return next
    })

  const setSortKey = (key: SortKey) => setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: key === 'tag' ? 1 : -1 }))

  const startEdit = (a: Animal) => {
    setInvalid(null)
    setDraft({ tagId: a.tagId, estWeight: String(a.estWeight), frameScore: String(a.frameScore), bcs: String(a.bcs) })
  }
  const fieldId = (tag: string, field: EditField) => `${id}-${tag}-${field}`

  const save = () => {
    if (!draft) return
    for (const field of Object.keys(LIMITS) as EditField[]) {
      const value = Number(draft[field])
      const { min, max, label, unit } = LIMITS[field]
      if (!Number.isInteger(value) || value < min || value > max) {
        setInvalid(field)
        toast.error(`Check the ${label.toLowerCase()}`, { description: `Enter a whole number from ${min} to ${max}${unit ? ` ${unit}` : ''}.` })
        document.getElementById(fieldId(draft.tagId, field))?.focus()
        return
      }
    }
    updateAnimal(draft.tagId, { estWeight: Number(draft.estWeight), frameScore: Number(draft.frameScore), bcs: Number(draft.bcs) })
    toast.success(`${draft.tagId} updated`, { description: 'Lot averages and prices per cwt update everywhere.' })
    setDraft(null)
  }

  const onEditKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      save()
    } else if (e.key === 'Escape') {
      setDraft(null)
    }
  }

  const editInput = (field: EditField, className?: string) =>
    draft && (
      <Input
        id={fieldId(draft.tagId, field)}
        type="number"
        inputMode="numeric"
        min={LIMITS[field].min}
        max={LIMITS[field].max}
        value={draft[field]}
        onChange={(e) => {
          setDraft({ ...draft, [field]: e.target.value })
          if (invalid === field) setInvalid(null)
        }}
        onKeyDown={onEditKey}
        aria-invalid={invalid === field}
        aria-label={`${LIMITS[field].label} for ${draft.tagId}`}
        className={cn('h-10 tabular-nums', className)}
      />
    )

  const download = () => {
    downloadText(herdCsvName(), herdCsv(selectedAnimals, index))
    toast.success('CSV downloaded', { description: `${herdCsvName()}, ${selectedAnimals.length} ${selectedAnimals.length === 1 ? 'row' : 'rows'}.` })
  }

  const onCreated = (lot: Lot) => {
    setCreating(false)
    setSelected(new Set())
    toast.success(`Draft Lot ${lot.number} created`, { description: `${lot.tagIds.length} head. Publish it from the lot page when you're ready.` })
    navigate(`/lots/${lot.id}`)
  }

  const sortButton = (k: SortKey, label: string) => {
    const Icon = sort.key !== k ? ArrowUpDown : sort.dir === 1 ? ArrowUp : ArrowDown
    return (
      <button
        type="button"
        onClick={() => setSortKey(k)}
        className="-mx-1 inline-flex min-h-10 items-center gap-1 rounded px-1 font-semibold hover:bg-background/60"
      >
        {label}
        <Icon className={cn('size-4', sort.key !== k && 'opacity-40')} aria-hidden />
      </button>
    )
  }
  const ariaSort = (k: SortKey) => (sort.key === k ? (sort.dir === 1 ? 'ascending' : 'descending') : undefined)

  const headerCheck = (
    <Checkbox
      checked={visibleSelected === 0 ? false : visibleSelected === pickable ? true : 'indeterminate'}
      onCheckedChange={(v) => toggleVisible(v === true)}
      aria-label={visibleSelected === pickable && pickable ? 'Clear the selection' : `Select all ${pickable} shown`}
      disabled={pickable === 0}
    />
  )

  return (
    <section aria-labelledby="herd-heading" className="grid gap-5">
      <div>
        <h1 id="herd-heading" className="text-4xl font-bold">
          Herd inventory
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">Edit a weight or score and every lot it's in updates. Pick animals to make a new lot.</p>
      </div>

      {/* Filters */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_14rem_14rem]">
        <div className="grid gap-1.5 sm:col-span-2 lg:col-span-1">
          <Label htmlFor={`${id}-q`}>Search</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              id={`${id}-q`}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
              placeholder="Tag, breed, or note"
            />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`${id}-class`}>Class</Label>
          <Select value={classId} onValueChange={(v) => setClassId(v as HerdClassId | 'all')}>
            <SelectTrigger id={`${id}-class`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classes</SelectItem>
              {HERD_CLASSES.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`${id}-status`}>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
            <SelectTrigger id={`${id}-status`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Count, or the bulk actions once something is selected */}
      <div
        className={cn(
          'sticky top-20 z-20 flex min-h-14 flex-wrap items-center gap-x-4 gap-y-2 rounded-xl px-4 py-2 lg:top-24',
          selected.size ? 'border-2 border-primary/40 bg-card shadow-md' : 'border border-transparent',
        )}
        aria-live="polite"
      >
        {selected.size ? (
          <>
            <p className="font-semibold">
              {selected.size} selected
              {hiddenSelected > 0 && <span className="font-normal text-muted-foreground"> ({hiddenSelected} hidden by filters)</span>}
            </p>
            <div className="flex flex-wrap gap-2 sm:ml-auto">
              <Button onClick={() => setCreating(true)}>
                <PackagePlus aria-hidden />
                Create lot from selected
              </Button>
              <Button variant="outline" onClick={download}>
                <Download aria-hidden />
                Download CSV
              </Button>
              <Button variant="ghost" onClick={() => setSelected(new Set())}>
                Clear
              </Button>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground">
            Showing {visible.length} of {animals.length} head.{filtered ? '' : ' Check the box on a row to select it.'}
          </p>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="grid justify-items-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center">
          <p className="text-lg">No animals match these filters.</p>
          <Button
            variant="outline"
            onClick={() => {
              setQuery('')
              setClassId('all')
              setStatus('all')
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : wide ? (
        <div className="relative overflow-x-auto rounded-2xl border bg-card">
          <table className="w-full text-left tabular-nums">
            <caption className="sr-only">Herd inventory. Select rows with the checkboxes; edit a row with its Edit button.</caption>
            <thead className="bg-muted">
              <tr className="[&_th]:px-3 [&_th]:py-2">
                <th scope="col" className="w-12">
                  {headerCheck}
                </th>
                <th scope="col" aria-sort={ariaSort('tag')}>
                  {sortButton('tag', 'Tag')}
                </th>
                <th scope="col" className="font-semibold">
                  Class
                </th>
                <th scope="col" className="font-semibold">
                  Breed and coat
                </th>
                <th scope="col" aria-sort={ariaSort('age')}>
                  {sortButton('age', 'Age')}
                </th>
                <th scope="col" aria-sort={ariaSort('weight')} className="text-right">
                  {sortButton('weight', 'Weight (lb)')}
                </th>
                <th scope="col" className="text-right font-semibold">
                  Frame
                </th>
                <th scope="col" className="text-right font-semibold">
                  BCS
                </th>
                <th scope="col" className="font-semibold">
                  Where
                </th>
                <th scope="col">
                  <span className="sr-only">Edit</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((a) => {
                const editing = draft?.tagId === a.tagId
                const isSelected = selected.has(a.tagId)
                return (
                  <tr key={a.tagId} className={cn('border-t [&_td]:px-3 [&_td]:py-2', isSelected && 'bg-primary/5', editing && 'bg-secondary/60')}>
                    <td>
                      <Checkbox
                        checked={isSelected}
                        disabled={!selectable(a)}
                        onCheckedChange={(v) => toggle(a.tagId, v === true)}
                        aria-label={selectable(a) ? `Select ${a.tagId}` : `${a.tagId} is raised for beef and sold by the share`}
                      />
                    </td>
                    <th scope="row" className="px-3 py-2">
                      <Link to={`/animal/${a.tagId}`} className="font-heading text-lg font-bold whitespace-nowrap underline-offset-4 hover:underline">
                        {a.tagId}
                      </Link>
                    </th>
                    <td>{SEX_LABELS[a.sex]}</td>
                    <td>
                      {a.breed}
                      <span className="block text-sm text-muted-foreground">{COAT_LABELS[a.coatColor]}</span>
                    </td>
                    <td className="whitespace-nowrap">{formatAge(a.birthDate)}</td>
                    <td className="text-right font-semibold">
                      {editing ? editInput('estWeight', 'ml-auto w-24 text-right') : formatNumber(a.estWeight)}
                    </td>
                    <td className="text-right">{editing ? editInput('frameScore', 'ml-auto w-16 text-right') : a.frameScore}</td>
                    <td className="text-right">{editing ? editInput('bcs', 'ml-auto w-16 text-right') : a.bcs}</td>
                    <td>
                      <Where animal={a} index={index} />
                    </td>
                    <td className="text-right whitespace-nowrap">
                      {editing ? (
                        <span className="inline-flex gap-1">
                          <Button size="sm" onClick={save}>
                            <Check aria-hidden />
                            Save
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setDraft(null)} aria-label="Cancel editing">
                            <X aria-hidden />
                          </Button>
                        </span>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => startEdit(a)} aria-label={`Edit ${a.tagId}`}>
                          <Pencil aria-hidden />
                          Edit
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          <label className="flex min-h-11 items-center gap-3 px-1">
            {headerCheck}
            <span>Select all {pickable} shown</span>
          </label>
          <ul className="grid gap-3">
            {visible.map((a) => {
              const editing = draft?.tagId === a.tagId
              const isSelected = selected.has(a.tagId)
              return (
                <li key={a.tagId} className={cn('grid gap-3 rounded-2xl border bg-card p-4', isSelected && 'border-primary/50 bg-primary/5')}>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isSelected}
                      disabled={!selectable(a)}
                      onCheckedChange={(v) => toggle(a.tagId, v === true)}
                      aria-label={selectable(a) ? `Select ${a.tagId}` : `${a.tagId} is raised for beef and sold by the share`}
                      className="mt-1.5"
                    />
                    <div className="min-w-0 flex-1">
                      <Link to={`/animal/${a.tagId}`} className="font-heading text-xl font-bold underline-offset-4 hover:underline">
                        {a.tagId}
                      </Link>
                      <p className="text-muted-foreground">
                        {a.breed} {SEX_LABELS[a.sex].toLowerCase()}, {formatAge(a.birthDate)}
                      </p>
                      <Where animal={a} index={index} />
                    </div>
                    {!editing && (
                      <Button size="sm" variant="outline" onClick={() => startEdit(a)} aria-label={`Edit ${a.tagId}`}>
                        <Pencil aria-hidden />
                        Edit
                      </Button>
                    )}
                  </div>
                  {editing ? (
                    <div className="grid gap-3">
                      <div className="grid grid-cols-3 gap-3">
                        {(Object.keys(LIMITS) as EditField[]).map((f) => (
                          <div key={f} className="grid gap-1">
                            <Label htmlFor={fieldId(a.tagId, f)} className="text-sm">
                              {f === 'estWeight' ? 'Weight (lb)' : f === 'bcs' ? 'BCS' : 'Frame'}
                            </Label>
                            {editInput(f)}
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={save} className="flex-1">
                          <Check aria-hidden />
                          Save
                        </Button>
                        <Button variant="outline" onClick={() => setDraft(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <dl className="grid grid-cols-3 gap-3 border-t pt-3 tabular-nums">
                      <div>
                        <dt className="text-sm text-muted-foreground">Weight</dt>
                        <dd className="font-heading text-xl font-bold">{formatNumber(a.estWeight)} lb</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">Frame</dt>
                        <dd className="font-heading text-xl font-bold">{a.frameScore}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">BCS</dt>
                        <dd className="font-heading text-xl font-bold">{a.bcs}</dd>
                      </div>
                    </dl>
                  )}
                </li>
              )
            })}
          </ul>
        </>
      )}

      {creating && (
        <CreateLotDialog
          open
          onOpenChange={setCreating}
          animals={selectedAnimals}
          source="herd"
          pasture={selectedAnimals.map((a) => index.get(a.tagId)?.location.pasture).find(Boolean) ?? 'Home pasture'}
          onCreated={onCreated}
        />
      )}
    </section>
  )
}
