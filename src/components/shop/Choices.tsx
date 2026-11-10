import { useId } from 'react'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'

/** A big radio-card group with a legend (subscription size, frequency, first ship date…). */
export function Choices<T extends string>({
  legend,
  value,
  onChange,
  options,
  className,
}: {
  legend: string
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string; hint?: string; extra?: string }[]
  className?: string
}) {
  const id = useId()
  return (
    <fieldset className="grid gap-3">
      <legend className="mb-1 text-xl font-bold">{legend}</legend>
      <RadioGroup value={value} onValueChange={(v) => onChange(v as T)} className={cn('grid gap-3', className)}>
        {options.map((o) => (
          <Label
            key={o.value}
            htmlFor={`${id}-${o.value}`}
            className="flex cursor-pointer items-start gap-3 rounded-xl border bg-card p-4 font-normal has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5 has-data-[state=checked]:ring-1 has-data-[state=checked]:ring-primary"
          >
            <RadioGroupItem id={`${id}-${o.value}`} value={o.value} className="mt-1" />
            <span className="grid gap-0.5">
              <span className="text-lg font-semibold">{o.label}</span>
              {o.extra && <span className="font-heading text-2xl font-bold">{o.extra}</span>}
              {o.hint && <span className="text-sm text-muted-foreground">{o.hint}</span>}
            </span>
          </Label>
        ))}
      </RadioGroup>
    </fieldset>
  )
}
