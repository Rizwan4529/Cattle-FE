import { TriangleAlert } from 'lucide-react'
import { isRouteErrorResponse, Link, useRouteError } from 'react-router'
import { Button } from '@/components/ui/button'
import NotFoundPage from '@/pages/NotFoundPage'

/** Shown inside the site layout when a page fails to load or throws. */
export function RouteError() {
  const error = useRouteError()
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />

  return (
    <div className="container-page max-w-2xl py-16">
      <TriangleAlert className="size-10 text-destructive" aria-hidden />
      <h1 className="mt-4 text-4xl font-bold">This page didn't load</h1>
      <p className="mt-3 text-lg text-muted-foreground">
        Something went wrong while showing this page. Reload to try again. If it keeps happening, reset the demo data
        from the owner dashboard.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button size="lg" onClick={() => window.location.reload()}>
          Reload page
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to="/">Go to home</Link>
        </Button>
      </div>
    </div>
  )
}
