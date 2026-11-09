import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Title block used at the top of every page. */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-4 pt-8 pb-6 sm:flex-row sm:items-end sm:justify-between lg:pt-12', className)}>
      <div className="max-w-3xl">
        <h1 className="text-4xl font-bold sm:text-5xl">{title}</h1>
        {description && <p className="mt-3 text-lg text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
