import { Camera, CircleCheck, Footprints, Nfc, ScanLine, TriangleAlert } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { EarTag } from '@/components/cattle/EarTag'
import type { Animal } from '@/data/types'
import { CYCLE, jitter, phaseAt, RESCAN_BELOW, TIMING } from '@/lib/chuteScan'
import { formatNumber } from '@/lib/format'
import { COAT_LABELS, SEX_LABELS } from '@/lib/labels'
import { cn } from '@/lib/utils'

type FieldState = 'empty' | 'estimating' | 'counting' | 'locked'

interface Field {
  label: string
  value: string
  unit?: string
  state: FieldState
  /** 0–1, drawn as a meter under the value */
  meter?: number
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const easeOut = (t: number) => 1 - (1 - t) ** 3

/**
 * Readings for one animal at local time `t` (ms into its pass). While the
 * camera works the numbers flicker; during "fill" each one counts to its
 * final value and locks, in order.
 */
function fieldsFor(animal: Animal | null, t: number, seed: number): Field[] {
  const labels = ['Weight', 'Frame score', 'Body condition', 'Sex', 'Coat color', 'Confidence']
  if (!animal) return labels.map((label) => ({ label, value: '–', state: 'empty' }))

  const scanStart = TIMING.walkIn
  const fillStart = TIMING.walkIn + TIMING.scan + TIMING.flash + TIMING.read
  const step = Math.floor(t / 90)
  const final = [
    animal.estWeight,
    animal.frameScore,
    animal.bcs,
    SEX_LABELS[animal.sex],
    COAT_LABELS[animal.coatColor],
    animal.scanConfidence,
  ] as const

  return labels.map((label, k) => {
    // Each field gets a slice of the fill phase to count up and lock.
    const windowStart = fillStart + (k / labels.length) * TIMING.fill * 0.8
    const windowLength = TIMING.fill * 0.3
    const p = clamp01((t - windowStart) / windowLength)
    const target = final[k]
    const state: FieldState = t < scanStart ? 'empty' : t < windowStart ? 'estimating' : p < 1 ? 'counting' : 'locked'
    const unit = k === 0 ? 'lb' : k === 1 || k === 2 ? 'of 9' : k === 5 ? '%' : undefined

    if (state === 'empty') return { label, value: '–', state, unit: undefined }

    if (typeof target === 'string') {
      const shown = state === 'estimating' ? '…' : target.slice(0, Math.ceil(target.length * easeOut(p)))
      return { label, value: shown, state }
    }

    // Numbers: noisy guesses while estimating, then an eased count to the value.
    const spread = k === 0 ? 70 : k === 5 ? 18 : 2
    const guess = k === 5 ? 70 + jitter(seed + k, step) * 22 : target + (jitter(seed + k, step) - 0.5) * spread * 2
    const value = state === 'locked' ? target : state === 'estimating' ? guess : guess + (target - guess) * easeOut(p)
    const text = k === 0 ? formatNumber(Math.round(value)) : k === 5 ? value.toFixed(1) : String(Math.round(value))
    return {
      label,
      value: text,
      unit,
      state,
      meter: k === 5 ? clamp01(value / 100) : undefined,
    }
  })
}

interface Status {
  icon: LucideIcon
  text: string
}

export function ScanReadout({ batch, elapsed, status }: { batch: Animal[]; elapsed: number; status: string }) {
  const total = batch.length
  const active = Math.floor(elapsed / CYCLE)
  let animal: Animal | null = null
  let t = 0
  let index = active
  let state: Status

  if (status === 'idle') {
    state = {
      icon: Footprints,
      text: `${total} head waiting in the alley. Press Start to run them through.`,
    }
  } else if (active >= total) {
    index = total - 1
    animal = batch[index]
    t = Infinity
    state = {
      icon: CircleCheck,
      text: `All ${total} head scanned and saved to the scan file.`,
    }
  } else {
    const { phase, local } = phaseAt(active, elapsed)
    if (phase === 'walk-in') {
      // Keep the last animal's readings up while the next one walks in.
      index = active - 1
      animal = index >= 0 ? batch[index] : null
      t = Infinity
      state = {
        icon: Footprints,
        text: index >= 0 ? `${batch[index].tagId} saved. Next animal walking in.` : 'First animal walking in.',
      }
    } else {
      animal = batch[active]
      t = local
      const texts: Record<string, Status> = {
        scan: {
          icon: ScanLine,
          text: 'Scanning. Estimating weight, frame, and condition.',
        },
        flash: { icon: Camera, text: 'Taking photos from three angles.' },
        read: { icon: Nfc, text: 'Reading the ear tag.' },
        fill: { icon: CircleCheck, text: 'Saving the readings.' },
      }
      state = texts[phase] ?? texts.fill
    }
  }

  const readStart = TIMING.walkIn + TIMING.scan + TIMING.flash
  const tagShown = animal && t >= readStart
  const tagChars = animal ? Math.round(animal.tagId.length * clamp01((t - readStart) / (TIMING.read * 0.7))) : 0
  const fields = fieldsFor(animal, t, index * 31 + 7)
  const lowConfidence = animal && t === Infinity && animal.scanConfidence < RESCAN_BELOW
  const Icon = lowConfidence ? TriangleAlert : state.icon

  return (
    <div className="grid gap-5 bg-leather p-4 text-leather-foreground sm:p-5 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8">
      <div className="grid content-start gap-3">
        <p className="text-sm text-leather-foreground/70">Ear tag</p>
        <div className="flex min-h-16 items-end">
          {tagShown ? (
            <EarTag tagId={animal!.tagId.slice(0, tagChars).padEnd(animal!.tagId.length, ' ')} size="lg" className="whitespace-pre" />
          ) : (
            <span className="inline-flex min-h-16 items-end rounded-t-[1.4em] rounded-b-[0.4em] border-2 border-dashed border-leather-foreground/30 px-5 pt-5 pb-3 font-heading text-3xl font-bold text-leather-foreground/40 sm:text-4xl">
              {animal || status === 'running' ? 'Reading' : 'No tag'}
            </span>
          )}
        </div>
        {/* Fixed height so the panel doesn't jump as the status text changes */}
        <p className="flex min-h-[6lh] items-start gap-2 text-leather-foreground/90 lg:min-h-[5lh]" aria-hidden>
          <Icon className={cn('mt-0.5 size-5 shrink-0', lowConfidence ? 'text-leather-down' : 'text-tag')} />
          <span>
            {state.text}
            {lowConfidence && <span className="block text-leather-down">Low confidence read. Run it through again before it's sold.</span>}
          </span>
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
        {fields.map((f) => (
          <div key={f.label} className="min-w-0 border-t border-leather-foreground/15 pt-2">
            <dt className="text-sm text-leather-foreground/70">{f.label}</dt>
            <dd
              className={cn(
                'font-heading text-3xl leading-tight font-bold break-words tabular-nums transition-colors sm:text-4xl',
                f.state === 'estimating' && 'text-leather-foreground/45',
                f.state === 'empty' && 'text-leather-foreground/30',
                f.state === 'counting' && 'text-tag',
              )}
            >
              {f.value}
              {f.unit && <span className="ml-1.5 font-sans text-base font-medium text-leather-foreground/60">{f.unit}</span>}
            </dd>
            {f.meter !== undefined && (
              <dd aria-hidden className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-leather-foreground/15">
                <div
                  className={cn('h-full rounded-full', f.state === 'locked' ? 'bg-leather-up' : 'bg-leather-foreground/50')}
                  style={{ width: `${f.meter * 100}%` }}
                />
              </dd>
            )}
          </div>
        ))}
      </dl>
    </div>
  )
}
