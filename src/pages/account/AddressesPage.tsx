import { type FormEvent, useId, useState } from 'react'
import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Address } from '@/data/beefTypes'
import { stateForZip, US_STATES } from '@/data/geo'
import { zoneForZip } from '@/lib/delivery'
import { usePageTitle } from '@/lib/usePageTitle'
import { useRanchStore } from '@/store/useRanchStore'
import { AccountHeader } from './OverviewPage'

type Field = 'label' | 'name' | 'street' | 'city' | 'state' | 'zip'

function AddressForm({ initial, onDone }: { initial: Address; onDone: () => void }) {
  const id = useId()
  const saveAddress = useRanchStore((s) => s.saveAddress)
  const [a, setA] = useState(initial)
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({})
  const set = (k: keyof Address, v: string | boolean) => {
    setA((x) => ({ ...x, [k]: v }))
    setErrors((e) => ({ ...e, [k]: undefined }))
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const found: Partial<Record<Field, string>> = {}
    if (!a.label.trim()) found.label = 'Give it a name, like Home or the cabin.'
    if (!a.name.trim()) found.name = 'Who receives deliveries here?'
    if (!a.street.trim()) found.street = 'Enter the street address or road.'
    if (!a.city.trim()) found.city = 'Enter the town.'
    if (!a.state) found.state = 'Choose a state.'
    if (!/^\d{5}$/.test(a.zip)) found.zip = 'Enter a 5-digit ZIP code.'
    else if (a.state && stateForZip(a.zip)?.abbr !== a.state) found.zip = `That ZIP isn't in ${a.state}.`
    setErrors(found)
    const first = (['label', 'name', 'street', 'city', 'state', 'zip'] as Field[]).find((f) => found[f])
    if (first) return document.getElementById(`${id}-${first}`)?.focus()
    saveAddress({ ...a, label: a.label.trim(), name: a.name.trim(), street: a.street.trim(), city: a.city.trim() })
    toast.success('Address saved')
    onDone()
  }

  const field = (f: Field, label: string, className = '') => (
    <div className={`grid content-start gap-2 ${className}`}>
      <Label htmlFor={`${id}-${f}`}>{label}</Label>
      <Input
        id={`${id}-${f}`}
        value={a[f]}
        onChange={(e) => set(f, f === 'zip' ? e.target.value.replace(/\D/g, '').slice(0, 5) : e.target.value)}
        aria-invalid={Boolean(errors[f])}
        aria-describedby={errors[f] ? `${id}-${f}-error` : undefined}
        inputMode={f === 'zip' ? 'numeric' : undefined}
      />
      {errors[f] && (
        <p id={`${id}-${f}-error`} className="text-sm font-medium text-destructive">
          {errors[f]}
        </p>
      )}
    </div>
  )

  return (
    <form onSubmit={submit} noValidate className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-6">
        {field('label', 'Name for this address', 'sm:col-span-3')}
        {field('name', 'Deliver to', 'sm:col-span-3')}
        {field('street', 'Street address or road', 'sm:col-span-6')}
        {field('city', 'Town', 'sm:col-span-3')}
        <div className="grid content-start gap-2 sm:col-span-1">
          <Label htmlFor={`${id}-state`}>State</Label>
          <Select value={a.state} onValueChange={(v) => set('state', v)}>
            <SelectTrigger id={`${id}-state`} className="w-full" aria-invalid={Boolean(errors.state)}>
              <SelectValue placeholder="State" />
            </SelectTrigger>
            <SelectContent>
              {US_STATES.map((s) => (
                <SelectItem key={s.abbr} value={s.abbr}>
                  {s.abbr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.state && <p className="text-sm font-medium text-destructive">{errors.state}</p>}
        </div>
        {field('zip', 'ZIP code', 'sm:col-span-2')}
      </div>
      <Label htmlFor={`${id}-default`} className="flex cursor-pointer items-center gap-3 font-normal">
        <Checkbox id={`${id}-default`} checked={a.isDefault} onCheckedChange={(v) => set('isDefault', v === true)} />
        Use this address at checkout
      </Label>
      <DialogFooter className="gap-2">
        <Button type="button" variant="outline" size="lg" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" size="lg">
          Save address
        </Button>
      </DialogFooter>
    </form>
  )
}

export default function AddressesPage() {
  usePageTitle('Addresses')
  const addresses = useRanchStore((s) => s.addresses)
  const account = useRanchStore((s) => s.account)
  const deleteAddress = useRanchStore((s) => s.deleteAddress)
  const [editing, setEditing] = useState<Address | null>(null)

  const blank = (): Address => ({
    id: `addr-${Date.now().toString(36)}`,
    label: addresses.length ? '' : 'Home',
    name: account?.name ?? '',
    street: '',
    city: '',
    state: '',
    zip: '',
    isDefault: addresses.length === 0,
  })

  return (
    <>
      <AccountHeader
        title="Addresses"
        description="Where we deliver. Your default address fills in at checkout."
        actions={
          <Button onClick={() => setEditing(blank())}>
            <Plus aria-hidden />
            Add an address
          </Button>
        }
      />
      {addresses.length === 0 ? (
        <div className="grid justify-items-start gap-3 rounded-2xl border border-dashed bg-card p-6">
          <MapPin className="size-8 text-muted-foreground" aria-hidden />
          <p className="text-lg">No saved addresses. Add one to speed up checkout.</p>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {addresses.map((a) => {
            const zone = zoneForZip(a.zip)
            return (
              <li key={a.id} className="grid gap-3 rounded-2xl border bg-card p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-heading text-xl font-bold">{a.label}</h2>
                  {a.isDefault && <Badge className="h-6 px-2 text-sm">Default</Badge>}
                </div>
                <p>
                  {a.name}
                  <br />
                  {a.street}
                  <br />
                  {a.city}, {a.state} {a.zip}
                </p>
                <p className="text-sm text-muted-foreground">
                  {zone ? `In our ${zone.name} delivery area.` : 'Outside local delivery; we ship frozen here.'}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditing(a)}>
                    <Pencil aria-hidden />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      deleteAddress(a.id)
                      toast(`${a.label} removed`)
                    }}
                  >
                    <Trash2 aria-hidden />
                    Remove
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Dialog open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[92svh] overflow-y-auto p-6 sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">
              {addresses.some((a) => a.id === editing?.id) ? 'Edit address' : 'Add an address'}
            </DialogTitle>
            <DialogDescription className="text-base">For local delivery and frozen shipping.</DialogDescription>
          </DialogHeader>
          {editing && <AddressForm key={editing.id} initial={editing} onDone={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>
    </>
  )
}
