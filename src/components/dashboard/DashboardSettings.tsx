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
import { ranch } from '@/config/ranch'
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
        id="settings-reset"
        title="Reset demo data"
        description="Puts back the original herd, lots, and offers. Clears new lots, edits, accepted offers, the cart, and orders. The light or dark setting stays."
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
                Every change made in this browser is undone: new and edited lots, herd edits, offers, the cart, and orders. This can't be taken back.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel size="lg">Keep my changes</AlertDialogCancel>
              <AlertDialogAction
                size="lg"
                variant="destructive"
                onClick={() => {
                  resetDemo()
                  toast.success('Demo data reset', { description: 'The herd, lots, and offers are back to where the demo started.' })
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
