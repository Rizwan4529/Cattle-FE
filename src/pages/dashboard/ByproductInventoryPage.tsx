import { type FormEvent, useId, useState } from 'react'
import { Factory, Pencil } from 'lucide-react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { GoodsImage } from '@/components/goods/GoodsImage'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { byproductsConfig } from '@/config/byproducts'
import { RECIPES } from '@/data/goods'
import type { ByproductPartId, ByproductRecovery } from '@/data/goodsTypes'
import type { Animal } from '@/data/types'
import { batchUnits, goodsUrl, isListed, LOW_STOCK_GOODS, partById, ranchYield, rawOnHand, recoveryReport, withSettings } from '@/lib/byproducts'
import { formatCurrency, formatDate, formatNumber, formatShortDate } from '@/lib/format'
import { usePageTitle } from '@/lib/usePageTitle'
import { cn } from '@/lib/utils'
import { useRanchStore } from '@/store/useRanchStore'

const INLINE: ByproductPartId[] = ['fat', 'bones', 'organs']

const unitWord = (part: ByproductPartId, n: number) => {
  const p = partById(byproductsConfig, part)!
  if (p.rawUnit === 'lb') return `${formatNumber(n)} lb`
  const name = p.name.toLowerCase()
  const plural = /[sa]$/.test(name) ? name : `${name}s`
  return `${formatNumber(n)} ${n === 1 ? name.replace(/s$/, '') : plural}`
}

/** A small number field that saves when you leave it (or press Enter). */
function AmountInput({
  value,
  onSave,
  label,
  disabled,
  max,
}: {
  value: number
  onSave: (n: number) => void
  label: string
  disabled?: boolean
  max?: number
}) {
  const [text, setText] = useState<string | null>(null)
  const commit = () => {
    if (text === null) return
    const n = Number(text)
    if (text !== '' && Number.isFinite(n) && n >= 0) onSave(max !== undefined ? Math.min(max, n) : n)
    setText(null)
  }
  return (
    <Input
      type="number"
      inputMode="decimal"
      min={0}
      max={max}
      step={1}
      aria-label={label}
      disabled={disabled}
      value={text ?? String(value)}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && commit()}
      className="h-10 w-20 tabular-nums"
    />
  )
}

/** Every part for one animal, in a dialog. */
function AllPartsDialog({
  animal,
  record,
  open,
  onOpenChange,
}: {
  animal: Animal
  record?: ByproductRecovery
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const setRecovery = useRanchStore((s) => s.setRecovery)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">What came back from {animal.tagId}</DialogTitle>
          <DialogDescription>Amounts the processor returned to you. Anything at 0 was left with them.</DialogDescription>
        </DialogHeader>
        <ul className="grid gap-2">
          {byproductsConfig.parts.map((p) => {
            const none = (p.hornedOnly && !animal.horned) || (p.malesOnly && (animal.sex === 'heifer' || animal.sex === 'cow'))
            return (
              <li key={p.id} className="flex items-center justify-between gap-3 border-b pb-2 last:border-0">
                <span>
                  <span className="font-semibold">{p.name}</span>
                  <span className="block text-sm text-muted-foreground">
                    {none ? (p.hornedOnly ? 'Polled, no horns' : 'None on a heifer') : `Up to ${unitWord(p.id, p.rawPerAnimal)}`}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <AmountInput
                    value={record?.recovered[p.id] ?? 0}
                    onSave={(n) => setRecovery(animal.tagId, p.id, n)}
                    label={`${p.name} recovered from ${animal.tagId}`}
                    disabled={none}
                  />
                  <span className="w-8 text-sm text-muted-foreground">{p.rawUnit === 'lb' ? 'lb' : ''}</span>
                </span>
              </li>
            )
          })}
        </ul>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Turn raw byproduct into stock: 40 lb raw fat → 30 lb rendered tallow at an editable yield. */
function ConvertDialog({
  part,
  onHand,
  open,
  onOpenChange,
}: {
  part: ByproductPartId
  onHand: number
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const id = useId()
  const goods = useRanchStore((s) => s.goods)
  const convert = useRanchStore((s) => s.convertBatch)
  const recipes = RECIPES.filter((r) => r.part === part)
  const [recipeId, setRecipeId] = useState(recipes[0]?.id ?? '')
  const recipe = recipes.find((r) => r.id === recipeId) ?? recipes[0]
  const [raw, setRaw] = useState(String(Math.floor(onHand)))
  const [ratio, setRatio] = useState(String(recipe?.ratio ?? 1))
  const [error, setError] = useState('')
  const info = partById(byproductsConfig, part)!
  const product = goods.find((g) => g.id === recipe?.goodsId)
  const units = batchUnits(Number(raw) || 0, Number(ratio) || 0)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const n = Number(raw)
    const r = Number(ratio)
    if (!(n > 0)) return setError('Enter how much raw to use.')
    if (n > onHand) return setError(`You only have ${unitWord(part, onHand)} on hand.`)
    if (!(r > 0)) return setError('Enter a yield above zero.')
    const batch = convert({ recipeId: recipe.id, rawUsed: n, ratio: r })
    if (!batch) return setError('That makes less than one unit. Use more raw, or check the yield.')
    toast.success(`Added ${batch.units} ${product?.unit ?? ''} of ${product?.name ?? 'stock'}`, {
      description: `From ${unitWord(part, n)}. It’s in the store now.`,
    })
    onOpenChange(false)
  }

  if (!recipe) return null
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">Turn {info.name.toLowerCase()} into stock</DialogTitle>
          <DialogDescription>{unitWord(part, onHand)} on hand.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor={`${id}-recipe`}>Make</Label>
            <Select
              value={recipe.id}
              onValueChange={(v) => {
                setRecipeId(v)
                setRatio(String(RECIPES.find((r) => r.id === v)?.ratio ?? 1))
              }}
            >
              <SelectTrigger id={`${id}-recipe`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {recipes.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor={`${id}-raw`}>Raw to use ({info.rawUnit === 'lb' ? 'lb' : info.name.toLowerCase()})</Label>
              <Input
                id={`${id}-raw`}
                type="number"
                inputMode="decimal"
                min={0}
                max={onHand}
                value={raw}
                onChange={(e) => {
                  setRaw(e.target.value)
                  setError('')
                }}
                className="tabular-nums"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${id}-ratio`}>
                Yield ({product?.unit ?? 'units'} per {info.rawUnit === 'lb' ? 'lb' : info.name.toLowerCase().replace(/s$/, '')})
              </Label>
              <Input
                id={`${id}-ratio`}
                type="number"
                inputMode="decimal"
                min={0}
                step={0.05}
                value={ratio}
                onChange={(e) => {
                  setRatio(e.target.value)
                  setError('')
                }}
                className="tabular-nums"
              />
            </div>
          </div>
          <p className="rounded-lg bg-muted px-4 py-3 text-lg" aria-live="polite">
            Makes <strong className="font-semibold">{units}</strong> {product?.unit} of {product?.name}.
          </p>
          {error && <p className="text-sm font-medium text-destructive">{error}</p>}
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              <Factory aria-hidden />
              Add to stock
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** Byproduct Inventory: what came back from each harvested animal, raw on hand, conversions, and Ranch Goods stock. */
export default function ByproductInventoryPage() {
  usePageTitle('Byproduct inventory')
  const animals = useRanchStore((s) => s.animals)
  const pools = useRanchStore((s) => s.pools)
  const cutSheets = useRanchStore((s) => s.cutSheets)
  const recoveries = useRanchStore((s) => s.byproductRecoveries)
  const batches = useRanchStore((s) => s.byproductBatches)
  const goods = useRanchStore((s) => s.goods)
  const settings = useRanchStore((s) => s.byproductSettings)
  const setRecovery = useRanchStore((s) => s.setRecovery)
  const setStock = useRanchStore((s) => s.setGoodsStock)
  const [editing, setEditing] = useState<string | null>(null)
  const [converting, setConverting] = useState<ByproductPartId | null>(null)

  const config = withSettings(byproductsConfig, settings)
  const harvested = animals.filter((a) => a.harvest).sort((a, b) => b.harvest!.date.localeCompare(a.harvest!.date))
  const rows = harvested.map((a) => {
    const record = recoveries.find((r) => r.tagId === a.tagId)
    const pool = pools.find((p) => p.tagId === a.tagId)
    const share = Object.fromEntries(ranchYield(config, a, pool?.claims ?? [], cutSheets).map((y) => [y.part, y.toRanch]))
    const report = recoveryReport(config, record ?? { recovered: {} }, a, share)
    return { animal: a, record, report, share }
  })
  const lostTotal = rows.reduce((n, r) => n + r.report.lostValue, 0)
  const onHand = rawOnHand(config, recoveries, batches, goods)
  const listed = goods.filter((g) => isListed(g, byproductsConfig))
  const stockValue = listed.reduce((n, g) => n + g.price * g.stock, 0)
  const editingAnimal = harvested.find((a) => a.tagId === editing)

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-4xl font-bold">Byproduct inventory</h1>
        <p className="mt-2 max-w-3xl text-lg text-muted-foreground">
          What came back from the processor for each animal, the raw byproducts on hand, and turning them into stock for Ranch Goods.
        </p>
      </div>

      <dl className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border bg-card p-4">
          <dt className="text-sm text-muted-foreground">Ranch Goods on the shelf</dt>
          <dd className="font-heading text-3xl font-bold tabular-nums">{formatCurrency(stockValue)}</dd>
          <dd className="text-sm text-muted-foreground">At list price, {listed.filter((g) => g.stock > 0).length} items in stock</dd>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <dt className="text-sm text-muted-foreground">Raw fat and bones waiting</dt>
          <dd className="font-heading text-3xl font-bold tabular-nums">{formatNumber(Math.round(onHand.fat + onHand.bones))} lb</dd>
          <dd className="text-sm text-muted-foreground">Ready to render or cut</dd>
        </div>
        <div className="rounded-2xl border-2 border-destructive/40 bg-card p-4">
          <dt className="text-sm text-muted-foreground">Not recovered, {harvested.length} animals</dt>
          <dd className="font-heading text-3xl font-bold text-destructive tabular-nums">{formatCurrency(lostTotal)}</dd>
          <dd className="text-sm text-muted-foreground">Left with the processor, net</dd>
        </div>
      </dl>

      <section aria-labelledby="recovered-heading" className="grid gap-4">
        <div>
          <h2 id="recovered-heading" className="text-2xl font-bold">
            What came back from each animal
          </h2>
          <p className="mt-1 text-muted-foreground">
            Fill this in when you pick up from the processor. Share owners’ cut-sheet extras are already taken out of what you should get back.
          </p>
        </div>
        {rows.length === 0 ? (
          <p className="rounded-xl border border-dashed bg-card p-5 text-muted-foreground">
            No animals harvested yet. They show up here after harvest.
          </p>
        ) : (
          <div className="relative overflow-x-auto rounded-2xl border bg-card">
            <table className="w-full min-w-[54rem] text-left">
              <caption className="sr-only">Byproducts recovered per harvested animal</caption>
              <thead>
                <tr className="border-b bg-muted text-sm">
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Animal
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold">
                    Hide
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold">
                    Horns
                  </th>
                  {INLINE.map((p) => (
                    <th key={p} scope="col" className="px-3 py-3 font-semibold">
                      {partById(byproductsConfig, p)!.name} (lb)
                    </th>
                  ))}
                  <th scope="col" className="px-3 py-3 font-semibold">
                    Other parts
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">
                    Not recovered
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ animal, record, report }) => {
                  const others = report.parts.filter((p) => !['hide', 'horns', ...INLINE].includes(p.part) && p.expected > 0)
                  const othersBack = others.filter((p) => p.recovered > 0).length
                  return (
                    <tr key={animal.tagId} className="border-b align-middle last:border-0">
                      <th scope="row" className="px-4 py-3 font-normal">
                        <Link to={`/animal/${animal.tagId}`} className="font-semibold text-primary underline underline-offset-4">
                          {animal.tagId}
                        </Link>
                        <span className="block text-sm text-muted-foreground">
                          {animal.breed}, harvested {formatShortDate(animal.harvest!.date)}
                        </span>
                      </th>
                      <td className="px-3 py-3">
                        <Checkbox
                          checked={(record?.recovered.hide ?? 0) > 0}
                          onCheckedChange={(v) => setRecovery(animal.tagId, 'hide', v === true ? 1 : 0)}
                          aria-label={`Hide recovered from ${animal.tagId}`}
                          className="size-6"
                        />
                      </td>
                      <td className="px-3 py-3">
                        {animal.horned ? (
                          <AmountInput
                            value={record?.recovered.horns ?? 0}
                            max={2}
                            onSave={(n) => setRecovery(animal.tagId, 'horns', Math.round(n))}
                            label={`Horns recovered from ${animal.tagId}`}
                          />
                        ) : (
                          <span className="text-sm text-muted-foreground">Polled</span>
                        )}
                      </td>
                      {INLINE.map((p) => {
                        const line = report.parts.find((x) => x.part === p)!
                        return (
                          <td key={p} className="px-3 py-3">
                            <AmountInput
                              value={record?.recovered[p] ?? 0}
                              onSave={(n) => setRecovery(animal.tagId, p, n)}
                              label={`${partById(byproductsConfig, p)!.name} recovered from ${animal.tagId}, lb`}
                            />
                            <span className="mt-0.5 block text-xs text-muted-foreground tabular-nums">of ~{Math.round(line.expected)}</span>
                          </td>
                        )
                      })}
                      <td className="px-3 py-3">
                        <Button variant="outline" size="sm" onClick={() => setEditing(animal.tagId)}>
                          <Pencil aria-hidden />
                          {othersBack} of {others.length}
                          <span className="sr-only"> other parts recovered from {animal.tagId}. Edit</span>
                        </Button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={cn('font-heading text-xl font-bold tabular-nums', report.lostValue > 0 ? 'text-destructive' : 'text-success')}
                        >
                          {report.lostValue > 0 ? formatCurrency(report.lostValue) : 'All back'}
                        </span>
                        {report.lostValue > 0 && (
                          <span className="block text-xs text-muted-foreground">
                            {report.parts
                              .filter((p) => p.lostValue > 0)
                              .sort((a, b) => b.lostValue - a.lostValue)
                              .slice(0, 2)
                              .map((p) => partById(byproductsConfig, p.part)!.name.toLowerCase())
                              .join(', ')}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        {rows.some((r) => r.record?.note) && (
          <ul className="grid gap-1 text-sm text-muted-foreground">
            {rows
              .filter((r) => r.record?.note)
              .map((r) => (
                <li key={r.animal.tagId}>
                  <span className="font-semibold text-foreground">{r.animal.tagId}:</span> {r.record!.note}
                </li>
              ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="raw-heading" className="grid gap-4">
        <div>
          <h2 id="raw-heading" className="text-2xl font-bold">
            Raw on hand
          </h2>
          <p className="mt-1 text-muted-foreground">Recovered and not yet made into something. Turn it into stock and it shows up in Ranch Goods.</p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {config.parts
            .filter((p) => RECIPES.some((r) => r.part === p.id))
            .map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4">
                <span>
                  <span className="block font-semibold">{p.name}</span>
                  <span className={cn('font-heading text-2xl font-bold tabular-nums', onHand[p.id] <= 0 && 'text-muted-foreground')}>
                    {unitWord(p.id, onHand[p.id])}
                  </span>
                </span>
                <Button
                  variant="outline"
                  disabled={onHand[p.id] <= 0}
                  onClick={() => setConverting(p.id)}
                  aria-label={`Turn ${p.name.toLowerCase()} into stock`}
                >
                  <Factory aria-hidden />
                  Convert
                </Button>
              </li>
            ))}
        </ul>
        {batches.length > 0 && (
          <div className="relative overflow-x-auto rounded-2xl border bg-card">
            <table className="w-full min-w-[36rem] text-left">
              <caption className="px-4 pt-3 text-left font-semibold">Batches</caption>
              <thead>
                <tr className="border-b text-sm text-muted-foreground">
                  <th scope="col" className="px-4 py-2 font-medium">
                    Date
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Raw used
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Yield
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Made
                  </th>
                </tr>
              </thead>
              <tbody>
                {batches.slice(0, 10).map((b) => {
                  const g = goods.find((x) => x.id === b.goodsId)
                  return (
                    <tr key={b.id} className="border-b last:border-0">
                      <td className="px-4 py-2">{formatDate(b.createdAt)}</td>
                      <td className="px-4 py-2 tabular-nums">
                        {unitWord(b.part, b.rawUsed)}
                        {partById(byproductsConfig, b.part)!.rawUnit === 'lb' ? ` ${partById(byproductsConfig, b.part)!.name.toLowerCase()}` : ''}
                      </td>
                      <td className="px-4 py-2 tabular-nums">{b.ratio}</td>
                      <td className="px-4 py-2">
                        <span className="font-semibold tabular-nums">
                          {b.units} {g?.unit}
                        </span>{' '}
                        {g && (
                          <Link to={goodsUrl(g)} className="text-primary underline underline-offset-4">
                            {g.name}
                          </Link>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="stock-heading" className="grid gap-4">
        <div>
          <h2 id="stock-heading" className="text-2xl font-bold">
            Ranch Goods stock
          </h2>
          <p className="mt-1 text-muted-foreground">
            Counts update as orders come in. Set a count after a stocktake; one-of-a-kind items are 1 or 0.
          </p>
        </div>
        <div className="relative overflow-x-auto rounded-2xl border bg-card">
          <table className="w-full min-w-[40rem] text-left">
            <caption className="sr-only">Ranch Goods stock</caption>
            <thead>
              <tr className="border-b bg-muted text-sm">
                <th scope="col" className="px-4 py-3 font-semibold">
                  Item
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  From
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  Price
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  On hand
                </th>
              </tr>
            </thead>
            <tbody>
              {listed.map((g) => (
                <tr key={g.id} className={cn('border-b last:border-0', !g.unique && g.stock <= LOW_STOCK_GOODS && 'bg-warning/10')}>
                  <th scope="row" className="px-4 py-2 font-normal">
                    <Link to={goodsUrl(g)} className="flex items-center gap-3 font-semibold underline-offset-4 hover:underline">
                      <span className="block aspect-4/3 w-14 shrink-0 overflow-hidden rounded-md border">
                        <GoodsImage art={g.art} coat={g.coat} seed={g.id} alt="" />
                      </span>
                      {g.name}
                    </Link>
                  </th>
                  <td className="px-4 py-2 text-sm text-muted-foreground">
                    {g.sourceTagIds.length ? g.sourceTagIds.join(', ') : 'Earlier harvests'}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {formatCurrency(g.price, true)}/{g.unit}
                  </td>
                  <td className="px-4 py-2">
                    <span className="flex items-center gap-2">
                      <AmountInput value={g.stock} max={g.unique ? 1 : undefined} onSave={(n) => setStock(g.id, n)} label={`${g.name} on hand`} />
                      <span className="text-sm text-muted-foreground">
                        {g.unique ? (g.stock > 0 ? 'Available' : 'Sold') : g.stock <= 0 ? 'Sold out' : g.stock <= LOW_STOCK_GOODS ? 'Low' : ''}
                      </span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {editingAnimal && (
        <AllPartsDialog
          animal={editingAnimal}
          record={recoveries.find((r) => r.tagId === editingAnimal.tagId)}
          open={Boolean(editing)}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}
      {converting && (
        <ConvertDialog key={converting} part={converting} onHand={onHand[converting]} open onOpenChange={(o) => !o && setConverting(null)} />
      )}
    </div>
  )
}
