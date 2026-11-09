import { CircleCheck, Clock, Handshake } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { LotStatus } from '@/data/types'
import { LOT_STATUS_LABELS } from '@/lib/labels'
import { cn } from '@/lib/utils'

const STYLES: Record<LotStatus, { className: string; icon: typeof Clock }> = {
  available: { className: 'bg-success text-success-foreground', icon: CircleCheck },
  pending: { className: 'bg-warning text-warning-foreground', icon: Clock },
  sold: { className: 'bg-foreground/80 text-background', icon: Handshake },
}

/** Color plus an icon, so status never relies on color alone. */
export function LotStatusBadge({ status, className }: { status: LotStatus; className?: string }) {
  const { className: tone, icon: Icon } = STYLES[status]
  return (
    <Badge className={cn('h-7 gap-1.5 px-2.5 text-sm font-semibold', tone, className)}>
      <Icon aria-hidden />
      {LOT_STATUS_LABELS[status]}
    </Badge>
  )
}
