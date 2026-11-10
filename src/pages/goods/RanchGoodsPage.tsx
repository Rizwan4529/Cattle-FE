import { PageHeader } from '@/components/PageHeader'
import { byproductsConfig } from '@/config/byproducts'
import { visibleCategories } from '@/lib/byproducts'
import { usePageTitle } from '@/lib/usePageTitle'
import { useRanchStore } from '@/store/useRanchStore'

/** Ranch Goods: category overview (the full storefront is built on top of this). */
export default function RanchGoodsPage() {
  usePageTitle('Ranch Goods')
  const goods = useRanchStore((s) => s.goods)
  const categories = visibleCategories(byproductsConfig)

  return (
    <div className="container-page pb-16">
      <PageHeader
        title="Nothing wasted."
        description="Every part of the animal, put to use: tallow, bones, dog chews, hides, horn, and garden meal."
      />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => {
          const items = goods.filter((g) => g.category === c.id)
          return (
            <li key={c.id} className="rounded-xl border bg-card p-5">
              <h2 className="text-xl font-bold">{c.name}</h2>
              <p className="mt-1 text-muted-foreground">{c.description}</p>
              <p className="mt-3 text-sm text-muted-foreground">{items.length} items</p>
            </li>
          )
        })}
      </ul>
      <p className="mt-8 text-sm text-muted-foreground">{byproductsConfig.consumerNote}</p>
    </div>
  )
}
