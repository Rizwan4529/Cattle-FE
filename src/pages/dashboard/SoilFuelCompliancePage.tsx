import { useId, useState } from 'react'
import { CircleCheck, CircleDashed, CircleDot, Info } from 'lucide-react'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { soilFuelConfig } from '@/config/soilFuel'
import type { ComplianceState } from '@/data/goodsTypes'
import type { ComplianceRequirement, Division } from '@/data/soilFuelTypes'
import { formatDate } from '@/lib/format'
import { usePageTitle } from '@/lib/usePageTitle'
import { cn } from '@/lib/utils'
import { useRanchStore } from '@/store/useRanchStore'

const STATES: { value: ComplianceState; label: string; icon: typeof CircleCheck; tone: string }[] = [
  { value: 'not-started', label: 'Not started', icon: CircleDashed, tone: 'text-destructive' },
  { value: 'in-progress', label: 'In progress', icon: CircleDot, tone: 'text-warning-foreground dark:text-warning' },
  { value: 'cleared', label: 'Cleared', icon: CircleCheck, tone: 'text-success' },
]

const ALL_PRODUCTS = [...soilFuelConfig.soil.products, ...soilFuelConfig.fuel.products]

function RequirementRow({ req }: { req: ComplianceRequirement }) {
  const id = useId()
  const status = useRanchStore((s) => s.soilFuelCompliance[req.id])
  const set = useRanchStore((s) => s.setSoilFuelCompliance)
  const [note, setNote] = useState<string | null>(null)
  const state = STATES.find((s) => s.value === status.state) ?? STATES[0]
  const Icon = state.icon
  const needed = ALL_PRODUCTS.filter((p) => p.requires.includes(req.id))

  return (
    <li className="grid gap-4 rounded-2xl border bg-card p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <div className="grid content-start gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <Icon className={cn('size-6', state.tone)} aria-hidden />
          <h3 className="text-xl font-bold">{req.title}</h3>
        </div>
        <p>{req.detail}</p>
        <p className="text-sm text-muted-foreground">
          Needed for {needed.map((p) => p.name).join(', ')}. Updated {formatDate(status.updatedAt)}.
        </p>
      </div>
      <div className="grid content-start gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor={`${id}-state`}>Status</Label>
          <Select
            value={status.state}
            onValueChange={(v) => {
              set(req.id, { state: v as ComplianceState })
              toast.success(`${req.title}: ${STATES.find((s) => s.value === v)?.label}`)
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
                set(req.id, { note: note.trim() })
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

function ProductSwitches({ division }: { division: Division }) {
  const enabled = useRanchStore((s) => s.soilFuelEnabled)
  const compliance = useRanchStore((s) => s.soilFuelCompliance)
  const setEnabled = useRanchStore((s) => s.setSoilFuelEnabled)
  const products = division === 'soil' ? soilFuelConfig.soil.products : soilFuelConfig.fuel.products
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {products.map((p) => {
        const open = p.requires.filter((r) => compliance[r].state !== 'cleared').length
        const switchId = `switch-${p.id}`
        return (
          <li key={p.id} className="flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3">
            <span className="min-w-0">
              <Label htmlFor={switchId} className="text-base font-semibold">
                {p.name}
              </Label>
              <span className="block text-sm text-muted-foreground">
                {enabled[p.id] ? 'For sale on the site' : 'Hidden from the site'}
                {open ? ` · ${open} requirement${open === 1 ? '' : 's'} not cleared` : ' · All requirements cleared'}
              </span>
            </span>
            <Switch
              id={switchId}
              checked={enabled[p.id]}
              onCheckedChange={(on) => {
                setEnabled(p.id, on)
                toast.success(on ? `${p.name} is for sale` : `${p.name} is hidden from the site`)
              }}
            />
          </li>
        )
      })}
    </ul>
  )
}

/** Owner-only: the paperwork Soil and Fuel need before they're sold, plus an on/off switch per product. */
export default function SoilFuelCompliancePage() {
  usePageTitle('Soil & Fuel compliance')
  const compliance = useRanchStore((s) => s.soilFuelCompliance)
  const counts = STATES.map((s) => ({ ...s, n: soilFuelConfig.compliance.filter((c) => compliance[c.id]?.state === s.value).length }))

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-4xl font-bold">Soil & Fuel compliance</h1>
        <p className="mt-2 max-w-3xl text-lg text-muted-foreground">
          Registration, labels, testing, and air-quality checks before you sell compost and fuel, and a switch to take any product off the site. Only
          you see this page.
        </p>
      </div>
      <p className="flex items-start gap-3 rounded-xl bg-muted px-4 py-3">
        <Info className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
        <span>
          A starting point, not legal advice. Confirm with the Colorado Department of Agriculture, CDPHE, and your county. Selling manure as fuel and
          as fertilizer can fall under different rules. The “Lab tested” badge stays off (in the settings file) until testing is cleared.
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
      {(['soil', 'fuel'] as const).map((d) => (
        <section key={d} aria-labelledby={`${d}-compliance`} className="grid gap-4">
          <h2 id={`${d}-compliance`} className="text-2xl font-bold">
            {d === 'soil' ? soilFuelConfig.soil.brand : soilFuelConfig.fuel.brand}
          </h2>
          <ProductSwitches division={d} />
          <ul className="grid gap-4">
            {soilFuelConfig.compliance
              .filter((c) => c.division === d)
              .map((c) => (
                <RequirementRow key={c.id} req={c} />
              ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
