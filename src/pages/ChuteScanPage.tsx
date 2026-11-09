import { useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { FastForward, Pause, Play, RotateCcw, TriangleAlert } from 'lucide-react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { PageHeader } from '@/components/PageHeader'
import { ChuteScene } from '@/components/scan/ChuteScene'
import { CreateLotDialog } from '@/components/lots/CreateLotDialog'
import { ScanLog } from '@/components/scan/ScanLog'
import { ScanReadout } from '@/components/scan/ScanReadout'
import { ScanSummary } from '@/components/scan/ScanSummary'
import { useScanClock } from '@/components/scan/useScanClock'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { CHUTE_STATION } from '@/data/animals'
import type { Animal, Lot } from '@/data/types'
import {
  completedAt,
  csvFileName,
  downloadText,
  generateScanBatch,
  HEAD_COUNTS,
  runLength,
  SCAN_GROUPS,
  type ScanGroupId,
  scanCsv,
  scanGroup,
  SPEEDS,
} from '@/lib/chuteScan'
import { formatNumber } from '@/lib/format'
import { COAT_LABELS, SEX_LABELS } from '@/lib/labels'
import { useMediaQuery } from '@/lib/useMediaQuery'
import { usePageTitle } from '@/lib/usePageTitle'
import { cn } from '@/lib/utils'
import { useRanchStore } from '@/store/useRanchStore'

const STATUS_LABELS = {
  idle: 'Ready',
  running: 'Scanning',
  paused: 'Paused',
  done: 'Finished',
} as const

const newBatch = (groupId: ScanGroupId, count: number) => generateScanBatch(groupId, count, useRanchStore.getState().animals)

function announce(a: Animal) {
  return `${a.tagId} scanned: ${formatNumber(a.estWeight)} pounds, frame score ${a.frameScore}, body condition ${a.bcs}, ${SEX_LABELS[a.sex].toLowerCase()}, ${COAT_LABELS[a.coatColor].toLowerCase()}, ${a.scanConfidence}% confidence.`
}

export default function ChuteScanPage() {
  usePageTitle('Chute scan')
  const navigate = useNavigate()
  const reduce = useReducedMotion() ?? false
  const compact = useMediaQuery('(max-width: 639px)')

  const [groupId, setGroupId] = useState<ScanGroupId>('steer-calves')
  const [count, setCount] = useState<number>(8)
  const [speed, setSpeed] = useState<number>(1)
  const [batch, setBatch] = useState(() => newBatch('steer-calves', 8))
  const [lotDialog, setLotDialog] = useState(false)
  // Remounts the lot dialog for each new batch so its suggestions start fresh.
  const [runId, setRunId] = useState(0)

  const clock = useScanClock(runLength(batch.length), speed)
  const { status, elapsed } = clock
  const completed = completedAt(elapsed, batch.length)
  const rows = batch.slice(0, completed)
  const group = scanGroup(groupId)

  const restart = (nextGroup = groupId, nextCount = count) => {
    clock.reset()
    setBatch(newBatch(nextGroup, nextCount))
    setRunId((n) => n + 1)
  }

  const download = () => {
    downloadText(csvFileName(), scanCsv(rows))
    toast.success('CSV downloaded', {
      description: `${csvFileName()}, ${rows.length} ${rows.length === 1 ? 'row' : 'rows'}.`,
    })
  }

  const onCreated = (lot: Lot) => {
    setLotDialog(false)
    toast.success(`Draft Lot ${lot.number} created`, {
      description: `${lot.tagIds.length} head. Publish it from the lot page when you're ready.`,
    })
    navigate(`/lots/${lot.id}`)
  }

  const primary =
    status === 'running'
      ? { label: 'Pause', icon: Pause, onClick: clock.pause }
      : status === 'done'
        ? {
            label: 'Scan another group',
            icon: RotateCcw,
            onClick: () => restart(),
          }
        : {
            label: status === 'paused' ? 'Resume' : 'Start scan',
            icon: Play,
            onClick: clock.start,
          }
  const PrimaryIcon = primary.icon
  const locked = status !== 'idle'
  const progress = Math.min(100, (elapsed / runLength(batch.length)) * 100)
  const onAnimal = Math.min(batch.length, completed + (status === 'idle' || status === 'done' ? 0 : 1))

  return (
    <div className="container-page pb-16">
      <PageHeader
        title="Chute scan"
        description="Cattle walk through the camera tunnel one at a time. Each one is weighed by camera, scored, and logged by ear tag, ready to list for sale."
      />

      {/* Controls */}
      <div className="grid grid-cols-2 items-end gap-x-3 gap-y-4 rounded-t-2xl border border-b-0 bg-card p-4 sm:flex sm:flex-wrap sm:gap-x-6 sm:p-5">
        <div className="col-span-2 flex gap-2">
          <Button size="lg" onClick={primary.onClick} className="min-w-0 flex-1 sm:min-w-44 sm:flex-none">
            <PrimaryIcon aria-hidden />
            {primary.label}
          </Button>
          <Button size="lg" variant="outline" onClick={() => restart()} disabled={status === 'idle'} aria-label="Reset the scan">
            <RotateCcw aria-hidden />
            <span className="hidden sm:inline">Reset</span>
          </Button>
          {(status === 'running' || status === 'paused') && (
            <Button size="lg" variant="ghost" onClick={clock.finish} aria-label="Skip to results" className="sm:hidden">
              <FastForward aria-hidden />
            </Button>
          )}
        </div>

        <div className="col-span-2 grid gap-1.5">
          <span id="speed-label" className="text-sm font-medium text-muted-foreground">
            Speed
          </span>
          <ToggleGroup
            type="single"
            variant="outline"
            value={String(speed)}
            onValueChange={(v) => v && setSpeed(Number(v))}
            aria-labelledby="speed-label"
            className="w-full sm:w-fit"
          >
            {SPEEDS.map((s) => (
              <ToggleGroupItem
                key={s}
                value={String(s)}
                aria-label={`${s} times speed`}
                className="h-11 min-w-14 flex-1 px-3 text-base tabular-nums sm:flex-none data-[state=on]:bg-secondary data-[state=on]:font-semibold"
              >
                {s}×
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="scan-count" className="text-sm font-medium text-muted-foreground">
            Head
          </Label>
          <Select
            value={String(count)}
            disabled={locked}
            onValueChange={(v) => {
              setCount(Number(v))
              restart(groupId, Number(v))
            }}
          >
            <SelectTrigger id="scan-count" className="w-full sm:w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HEAD_COUNTS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} head
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="scan-group" className="text-sm font-medium text-muted-foreground">
            In the alley
          </Label>
          <Select
            value={groupId}
            disabled={locked}
            onValueChange={(v) => {
              setGroupId(v as ScanGroupId)
              restart(v as ScanGroupId, count)
            }}
          >
            <SelectTrigger id="scan-group" className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCAN_GROUPS.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(status === 'running' || status === 'paused') && (
          <Button variant="ghost" onClick={clock.finish} className="ml-auto hidden sm:inline-flex">
            <FastForward aria-hidden />
            Skip to results
          </Button>
        )}
      </div>

      {/* The tunnel and its readout */}
      <section aria-label="Camera tunnel" className="overflow-hidden rounded-b-2xl border shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b bg-muted px-4 py-2.5 sm:px-5">
          <p className="flex flex-wrap items-center gap-x-2 font-semibold">
            <span
              aria-hidden
              className={cn(
                'size-2.5 rounded-full',
                status === 'running' ? 'animate-pulse bg-success' : status === 'done' ? 'bg-success' : 'bg-muted-foreground/50',
              )}
            />
            <span className="whitespace-nowrap">{CHUTE_STATION}</span>
            <span className="font-normal whitespace-nowrap text-muted-foreground">
              {STATUS_LABELS[status]}
              {status !== 'idle' && `, animal ${onAnimal} of ${batch.length}`}
            </span>
          </p>
          <p className="text-sm font-medium text-muted-foreground">Simulation — connects to chute cameras in production.</p>
        </div>

        <div className="relative">
          <ChuteScene batch={batch} elapsed={elapsed} running={status === 'running'} speed={speed} reduce={reduce} compact={compact} />
          {status === 'idle' && (
            <div className="absolute inset-0 grid place-items-center bg-background/25">
              <Button size="lg" onClick={clock.start} className="h-14 px-7 text-lg shadow-lg">
                <Play aria-hidden />
                Start scan
              </Button>
            </div>
          )}
          {status === 'paused' && <p className="absolute top-3 left-3 rounded-full bg-background/90 px-3 py-1 font-semibold shadow-sm">Paused</p>}
        </div>

        <div
          className="h-1.5 bg-muted"
          role="progressbar"
          aria-label="Scan progress"
          aria-valuemin={0}
          aria-valuemax={batch.length}
          aria-valuenow={completed}
          aria-valuetext={`${completed} of ${batch.length} scanned`}
        >
          <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
        </div>

        <ScanReadout batch={batch} elapsed={elapsed} status={status} />
      </section>

      <p className="sr-only" aria-live="polite">
        {rows.length > 0 && announce(rows[rows.length - 1])}
        {status === 'done' && ` All ${batch.length} head scanned.`}
      </p>

      {status === 'done' && rows.length > 0 && (
        <div className="mt-8">
          <ScanSummary
            rows={rows}
            groupLabel={group.label}
            onCreateLot={() => setLotDialog(true)}
            onDownload={download}
            onRestart={() => restart()}
          />
        </div>
      )}

      {status !== 'done' && rows.length > 0 && rows.length < batch.length && status === 'paused' && (
        <p className="mt-6 flex items-center gap-2 text-muted-foreground">
          <TriangleAlert className="size-4" aria-hidden />
          Paused with {rows.length} of {batch.length} scanned. Resume to finish, or download what's done so far.
        </p>
      )}

      <div className="mt-12">
        <ScanLog rows={rows} onDownload={download} />
      </div>

      {/* Mounted once the run is done, so its suggestions start from the full set of readings. */}
      {status === 'done' && (
        <CreateLotDialog
          key={runId}
          open={lotDialog}
          onOpenChange={setLotDialog}
          animals={rows}
          source="scan"
          pasture={group.pen}
          onCreated={onCreated}
        />
      )}
    </div>
  )
}
