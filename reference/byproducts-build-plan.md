# Ranch Goods build plan (SPEC-BYPRODUCTS.md)

Build these phases one after another, in order, with a commit after each (`[FEAT]` for new work, `[FIX]` for fixes). Each phase follows `reference/SPEC-BYPRODUCTS.md` and keeps the quality bar of `reference/Spec.md` and `reference/spec-beef.md`.
Update the **Progress log** at the bottom when a phase is finished, so work can resume from here in a new session.

## Phases

**P1.** Read SPEC-BYPRODUCTS.md, the existing specs, and the byproduct mockup. Don't build UI yet. Add the byproduct catalog as typed mock data seeded from the mockup, byproduct yield and price estimates per animal in config (clearly labeled placeholders), compliance flags per category, link one-of-a-kind items (hides, horns) to harvested mock animals, and the Ranch Goods nav entry.

**P2.** Feature A: the Ranch Goods storefront, product pages with traceability, steppers using the existing cart, search/filter, Makers & Wholesale with tiered pricing and inquiry form, the two subscriptions, and cross-sells on beef pages and in the cart.

**P3.** Feature B (Whole Animal mode on the SVG diagram, the /nothing-wasted page, and a Buy Beef home page section) and Feature C (byproduct rights checkbox in the share claim flow, cut sheet extras deducting from ranch yield).

**P4.** Feature D in the dashboard: Hidden Revenue Calculator with recovery sliders, herd-level "money left on the table" projection, Byproduct Inventory with batch conversion and lost-value tracking, compliance checklist, wholesale inbox, and byproducts in revenue analytics.

**P5.** Full QA across Buy Cattle, Buy Beef, and Ranch Goods: every button, mixed carts with byproducts, 375px mobile, dark mode, reset demo data, and update the README.

## Decisions (2026-11-10)

- **Mockup** lives at `../Docs/Buy it now Beef Byproduct Market.html` (not in `/reference`). Its 29 items, prices, and units seed the catalog; its "copy order" flow is dropped (everything goes through our cart and checkout).
- **Horns:** Angus and Wagyu-cross are naturally polled, so three harvested animals were added (August harvest): HCR-2672 horned Hereford steer, HCR-2678 horned Charolais-cross steer, HCR-2683 Red Angus heifer. `Animal.horned` marks horned animals; horn items only come from them, and heifers/cows have no pizzle.
- **Value per animal** = sellable units × (price − cost to make it sellable), × recovery rate. Every yield/price/cost/rate in `src/config/byproducts.ts` is a placeholder (`estimatesConfirmed: false`) until the rancher confirms it.
- **One-of-a-kind items** (each hide and horn) are their own listing with stock 1 and one source animal.
- **Compliance** flags live on categories in config, with per-product overrides (tallow soap isn't food). Shoppers never see them; the owner's progress per category is store state (`compliance`).
- **Header:** "Cut sheet" moved into the menu to make room for "Ranch Goods" (still linked from claims, orders, and the account). Measured at 375–2000px: no overlap or overflow.

## Progress log

- 2026-11-10: Plan approved.
- 2026-11-10: **P1 done.** `src/data/goodsTypes.ts`, `src/config/byproducts.ts` (categories + compliance flags, per-part yields/prices/costs/recovery rates, price tiers), `src/data/goods.ts` (catalog, recovery records per harvested animal, seed compliance status), `src/lib/byproducts.ts` (+ tests: tiers, compliance, value per animal, lost value). Store slices `goods`, `compliance`, `byproductRecoveries` (persist v3). Nav/footer "Ranch Goods" → `/ranch-goods` (category overview until P2).
