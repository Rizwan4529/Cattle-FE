import { useId, useState } from 'react'
import { CircleCheck, CircleDashed, CircleDot, EyeOff, Info } from 'lucide-react'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { byproductsConfig, type GoodsCategory } from '@/config/byproducts'
import type { ComplianceState } from '@/data/goodsTypes'
import { complianceFor, complianceNeeds } from '@/lib/byproducts'
import { formatDate } from '@/lib/format'
import { usePageTitle } from '@/lib/usePageTitle'
import { cn } from '@/lib/utils'
import { useRanchStore } from '@/store/useRanchStore'

const STATES: { value: ComplianceState; label: string; icon: typeof CircleCheck; tone: string }[] = [
  { value: 'not-started', label: 'Not started', icon: CircleDashed, tone: 'text-destructive' },
  { value: 'in-progress', label: 'In progress', icon: CircleDot, tone: 'text-warning-foreground dark:text-warning' },
  { value: 'cleared', label: 'Cleared', icon: CircleCheck, tone: 'text-success' },
]

function CategoryRow({ category }: { category: GoodsCategory }) {
  const id = useId()
  const status = useRanchStore((s) => s.compliance[category.id])
  const allGoods = useRanchStore((s) => s.goods)
  const goods = allGoods.filter((g) => g.category === category.id)
  const set = useRanchStore((s) => s.setComplianceStatus)
  const [note, setNote] = useState<string | null>(null)
  const needs = complianceNeeds(category)
  const state = STATES.find((s) => s.value === status.state) ?? STATES[0]
  const Icon = state.icon
  const overrides = goods.filter((g) => g.compliance).map((g) => ({ g, flags: complianceFor(g, byproductsConfig) }))

  return (
    <li className="grid gap-4 rounded-2xl border bg-card p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <div className="grid content-start gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <Icon className={cn('size-6', state.tone)} aria-hidden />
          <h2 className="text-xl font-bold">{category.name}</h2>
          {!category.enabled && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-sm">
              <EyeOff className="size-3.5" aria-hidden />
              Hidden from the store
            </span>
          )}
        </div>
        {needs.length ? (
          <ul className="grid gap-1">
            {needs.map((n) => (
              <li key={n} className="flex items-start gap-2">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-foreground" />
                {n}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">No registration or inspection needed.</p>
        )}
        {overrides.map(({ g, flags }) => (
          <p key={g.id} className="text-sm text-muted-foreground">
            Exception: {g.name} {complianceNeeds(flags).length ? `needs ${complianceNeeds(flags).join('; ').toLowerCase()}` : 'needs none of this'}.
          </p>
        ))}
        <p className="text-sm text-muted-foreground">
          {goods.length} {goods.length === 1 ? 'item' : 'items'}. Updated {formatDate(status.updatedAt)}.
        </p>
      </div>
      <div className="grid content-start gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor={`${id}-state`}>Status</Label>
          <Select
            value={status.state}
            onValueChange={(v) => {
              set(category.id, { state: v as ComplianceState })
              toast.success(`${category.name}: ${STATES.find((s) => s.value === v)?.label}`)
            }}
          >
            <SelectTrigger id={`${id}-state`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`${id}-note`}>Notes</Label>
          <Textarea
            id={`${id}-note`}
            rows={2}
            value={note ?? status.note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => {
              if (note !== null && note !== status.note) {
                set(category.id, { note: note.trim() })
                toast.success('Note saved')
              }
              setNote(null)
            }}
          />
        </div>
      </div>
    </li>
  )
}

/** Owner-only checklist of what each Ranch Goods category needs before it can be sold. Shoppers never see this. */
export default function CompliancePage() {
  usePageTitle('Ranch Goods compliance')
  const compliance = useRanchStore((s) => s.compliance)
  const counts = STATES.map((s) => ({ ...s, n: byproductsConfig.categories.filter((c) => compliance[c.id]?.state === s.value).length }))

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-4xl font-bold">Compliance checklist</h1>
        <p className="mt-2 max-w-3xl text-lg text-muted-foreground">
          What each kind of Ranch Goods needs before you sell it, and where you stand. Only you see this page; shoppers never see legal notes.
        </p>
      </div>
      <p className="flex items-start gap-3 rounded-xl bg-muted px-4 py-3">
        <Info className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
        <span>
          Rules vary by state. This list is a starting point, not legal advice: check with your state department of agriculture before selling edible
          items, pet treats, or fertilizer. Turn a category off in the byproduct settings file to hide it from the store until it’s cleared.
        </span>
      </p>
      <dl className="flex flex-wrap gap-3">
        {counts.map((c) => (
          <div key={c.value} className="flex items-center gap-2 rounded-xl border bg-card px-4 py-2">
            <c.icon className={cn('size-5', c.tone)} aria-hidden />
            <dt>{c.label}</dt>
            <dd className="font-heading text-xl font-bold tabular-nums">{c.n}</dd>
          </div>
        ))}
      </dl>
      <ul className="grid gap-4">
        {byproductsConfig.categories.map((c) => (
          <CategoryRow key={c.id} category={c} />
        ))}
      </ul>
    </div>
  )
}
