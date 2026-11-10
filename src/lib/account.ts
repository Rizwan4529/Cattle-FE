import type { BeefProduct, ShareClaim, SharePool } from '@/data/beefTypes'
import type { Animal, Order } from '@/data/types'

/** What the customer account pages show, worked out from the store. */

export interface MyClaim {
  claim: ShareClaim
  pool: SharePool
  animal: Animal
  order?: Order
}

/** Every share claimed on this device, newest first. */
export function myClaims(pools: SharePool[], animals: Animal[], orders: Order[]): MyClaim[] {
  const byTag = new Map(animals.map((a) => [a.tagId, a]))
  return pools
    .flatMap((pool) =>
      pool.claims
        .filter((c) => c.fromThisDevice)
        .flatMap((claim) => {
          const animal = byTag.get(pool.tagId)
          return animal ? [{ claim, pool, animal, order: orders.find((o) => o.id === claim.orderId) }] : []
        }),
    )
    .sort((a, b) => b.claim.claimedAt.localeCompare(a.claim.claimedAt))
}

export interface MyAnimal {
  animal: Animal
  /** Shares claimed from it */
  shares: MyClaim[]
  /** Butcher Shop packs bought from it */
  cuts: { product: BeefProduct; packs: number }[]
}

/** Every animal the customer's beef came from: shares they claimed, and the source animals of every pack they bought. */
export function myAnimals(claims: MyClaim[], orders: Order[], products: BeefProduct[], animals: Animal[]): MyAnimal[] {
  const out = new Map<string, MyAnimal>()
  const get = (animal: Animal) => {
    if (!out.has(animal.tagId)) out.set(animal.tagId, { animal, shares: [], cuts: [] })
    return out.get(animal.tagId)!
  }
  for (const c of claims) get(c.animal).shares.push(c)

  const packs = new Map<string, number>()
  for (const o of orders)
    for (const item of o.items ?? []) for (const p of item.packs ?? []) packs.set(p.productId, (packs.get(p.productId) ?? 0) + p.packs)
  for (const [productId, n] of packs) {
    const product = products.find((p) => p.id === productId)
    const animal = product && animals.find((a) => a.tagId === product.sourceTagId)
    if (product && animal) get(animal).cuts.push({ product, packs: n })
  }
  return [...out.values()]
}
