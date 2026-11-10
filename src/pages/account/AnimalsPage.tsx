import { Link } from 'react-router'
import { CattleImage } from '@/components/cattle/CattleImage'
import { EarTag } from '@/components/cattle/EarTag'
import { Button } from '@/components/ui/button'
import { feedProgram } from '@/config/beef'
import { myAnimals, myClaims } from '@/lib/account'
import { beefTitle, shareNoun } from '@/lib/beef'
import { formatAge, formatDate } from '@/lib/format'
import { usePageTitle } from '@/lib/usePageTitle'
import { useRanchStore } from '@/store/useRanchStore'
import { AccountHeader } from './OverviewPage'

/** "My Animals": every animal the customer's beef came from, with a link to its full record. */
export default function AnimalsPage() {
  usePageTitle('My animals')
  const pools = useRanchStore((s) => s.pools)
  const animals = useRanchStore((s) => s.animals)
  const orders = useRanchStore((s) => s.orders)
  const products = useRanchStore((s) => s.products)
  const mine = myAnimals(myClaims(pools, animals, orders), orders, products, animals)

  return (
    <>
      <AccountHeader
        title="My animals"
        description="Every animal your beef came from. Each one has an ear tag and a full record: where it grazed, its shots, and its weights."
      />
      {mine.length === 0 ? (
        <div className="grid justify-items-start gap-3 rounded-2xl border border-dashed bg-card p-6">
          <p className="text-lg">Once you claim a share or buy from the Butcher Shop, the animals your beef came from show up here.</p>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/beef">Claim your beef</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/shop">Butcher Shop</Link>
            </Button>
          </div>
        </div>
      ) : (
        <ul className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {mine.map(({ animal, shares, cuts }) => (
            <li key={animal.tagId} className="flex flex-col overflow-hidden rounded-2xl border bg-card">
              <div className="relative aspect-video overflow-hidden bg-muted">
                <CattleImage coat={animal.coatColor} sex={animal.sex} seed={animal.tagId} photos={animal.photos} alt={beefTitle(animal)} />
                <EarTag tagId={animal.tagId} className="absolute top-3 left-3" />
              </div>
              <div className="flex flex-1 flex-col gap-3 p-5">
                <h2 className="text-2xl font-bold">{beefTitle(animal)}</h2>
                <p className="text-muted-foreground">
                  {animal.feedProgram ? feedProgram(animal.feedProgram).name : animal.breed}.{' '}
                  {animal.harvest
                    ? `Harvested ${formatDate(animal.harvest.date)}, dry-aged ${animal.harvest.agedDays} days.`
                    : `${formatAge(animal.birthDate)} old.`}
                </p>
                <ul className="grid gap-1">
                  {shares.map((s) => (
                    <li key={s.claim.id}>
                      You claimed <strong className="font-semibold">{shareNoun(s.claim.size)}</strong> of this animal.
                    </li>
                  ))}
                  {cuts.map((c) => (
                    <li key={c.product.id}>
                      {c.packs} {c.packs === 1 ? 'pack' : 'packs'} of{' '}
                      <Link to={`/shop/${c.product.id}`} className="font-medium text-primary underline-offset-4 hover:underline">
                        {c.product.name}
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex flex-wrap gap-2 pt-2">
                  <Button asChild>
                    <Link to={`/animal/${animal.tagId}`}>See its full record</Link>
                  </Button>
                  {shares.length > 0 && (
                    <Button asChild variant="outline">
                      <Link to={`/beef/${animal.tagId}`}>Beef page</Link>
                    </Button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
