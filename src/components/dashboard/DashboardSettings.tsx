import { RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { ThemeSegmented } from '@/components/layout/ThemeToggle'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { beefConfig } from '@/config/beef'
import { ranch } from '@/config/ranch'
import { usePreferences } from '@/store/usePreferences'
import { useRanchStore } from '@/store/useRanchStore'

function Panel({ id, title, description, children }: { id: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <section
      aria-labelledby={id}
      className="grid gap-4 rounded-2xl border bg-card p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-10"
    >
      <div>
        <h2 id={id} className="text-2xl font-bold">
          {title}
        </h2>
        <p className="mt-1 text-muted-foreground">{description}</p>
      </div>
      <div>{children}</div>
    </section>
  )
}

export function DashboardSettings() {
  const resetDemo = useRanchStore((s) => s.resetDemo)
  const claimActivity = usePreferences((s) => s.claimActivity)
  const setClaimActivity = usePreferences((s) => s.setClaimActivity)

  return (
    <div className="grid gap-5">
      <h1 className="text-4xl font-bold">Settings</h1>

      <Panel id="settings-ranch" title="Ranch details" description="Shown in the header, on every listing, and on printed animal records.">
        <dl className="grid gap-3 sm:grid-cols-2">
          {[
            ['Ranch', ranch.name],
            ['Owner', ranch.owner],
            ['Phone', ranch.phone],
            ['Email', ranch.email],
            ['Address', `${ranch.location.address}, ${ranch.location.city}, ${ranch.location.state} ${ranch.location.zip}`],
            ['Ear tag prefix', ranch.tagPrefix],
            ['About Farrell story', ranch.story.confirmed ? 'Confirmed' : 'Placeholder copy, confirm it'],
            ['“All Natural” wording', ranch.values.allNatural.enabled ? `On: ${ranch.values.allNatural.label}` : 'Off'],
          ].map(([label, value]) => (
            <div key={label} className="min-w-0 border-t pt-2">
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="font-semibold break-words">{value}</dd>
            </div>
          ))}
        </dl>
      </Panel>

      <Panel
        id="settings-look"
        title="Light or dark"
        description="Auto follows your phone or computer. Dark is easier on the eyes in the truck at night."
      >
        <ThemeSegmented />
      </Panel>

      <Panel
        id="settings-activity"
        title="Live claim activity"
        description="For demos: on the beef pages, a neighbor claims a share every 20 to 40 seconds and the fill meters move. It never takes an animal's last open share."
      >
        <Label htmlFor="settings-activity-switch" className="flex min-h-12 cursor-pointer items-center gap-4 text-base font-medium">
          <Switch id="settings-activity-switch" checked={claimActivity} onCheckedChange={setClaimActivity} />
          {claimActivity ? 'On: show claim activity' : 'Off: no claim activity'}
        </Label>
      </Panel>

      <Panel
        id="settings-cuts"
        title="Selling by the cut"
        description="Whether the Butcher Shop sells individual steaks, roasts, and ground beef. Changed in src/config/beef.ts (sellByTheCut)."
      >
        <div className="grid gap-2">
          <p className="text-lg font-semibold">{beefConfig.sellByTheCut ? 'On: the Butcher Shop is open' : 'Off: beef is sold by the share only'}</p>
          <p className="rounded-lg bg-warning/15 px-4 py-3 text-sm">
            <strong className="font-semibold">Owner note:</strong> {beefConfig.sellByTheCutNote}
          </p>
        </div>
      </Panel>

      <Panel
        id="settings-reset"
        title="Reset demo data"
        description="Puts back the original herd, lots, offers, and beef share pools. Clears new lots, edits, accepted offers, claims, the cart, and orders. The light or dark setting stays."
      >
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="lg"
              variant="outline"
              className="w-full border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive sm:w-auto"
            >
              <RotateCcw aria-hidden />
              Reset demo data
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="font-heading text-2xl">Reset all demo data?</AlertDialogTitle>
              <AlertDialogDescription className="text-base">
                Every change made in this browser is undone: new and edited lots, herd edits, offers, beef claims and sign-ups, the cart, and orders.
                Share pool deadlines start counting down again. This can't be taken back.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel size="lg">Keep my changes</AlertDialogCancel>
              <AlertDialogAction
                size="lg"
                variant="destructive"
                onClick={() => {
                  resetDemo()
                  toast.success('Demo data reset', { description: 'The herd, lots, offers, and beef pools are back to where the demo started.' })
                }}
              >
                Reset demo data
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Panel>
    </div>
  )
}
