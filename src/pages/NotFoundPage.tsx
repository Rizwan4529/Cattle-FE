import { Link } from 'react-router'
import { CattleImage } from '@/components/cattle/CattleImage'
import { Button } from '@/components/ui/button'
import { usePageTitle } from '@/lib/usePageTitle'

export default function NotFoundPage() {
  usePageTitle('Page not found')
  return (
    <div className="container-page grid items-center gap-8 py-16 md:grid-cols-2">
      <div className="aspect-4/3 overflow-hidden rounded-2xl border">
        <CattleImage coat="hereford" sex="cow" pose="grazing" seed="stray" alt="Illustration of a cow grazing" />
      </div>
      <div>
        <h1 className="text-5xl font-bold">This one wandered off</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          We couldn't find that page. The link may be old, or the lot may have been taken down.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link to="/cattle">Browse cattle</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/">Go to home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
