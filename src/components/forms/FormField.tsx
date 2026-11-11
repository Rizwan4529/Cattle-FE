import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

/** A labeled form control with a hint and an error message tied to it. */
export function FormField({
  id,
  label,
  error,
  hint,
  children,
  className,
}: {
  id: string
  label: ReactNode
  error?: string
  hint?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('grid content-start gap-2', className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
