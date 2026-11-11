# CROWDER Soil & Fuel: build plan (SPEC-SOIL-FUEL)

Phases follow the user's S1–S6 list; each is finished and committed (`[FEAT]` / `[FIX]`) before the next starts.

| Phase | Scope | Status |
|---|---|---|
| S1 | Part 1 rebrand: CROWDER, owner Farrell, About Farrell story | Done (`1d70eef`) |
| S2 | Data model + config for Soil and Fuel, nav entry | Done |
| S3 | Part 4: Manure Revenue Planner + Whole Ranch summary card | Done |
| S4 | Part 2: Soil storefront, unit switcher, coverage calculator, truckload quotes, pro accounts, dealer locator, waitlist, trust | Done |
| S5 | Part 3 Fuel storefront + wholesale inquiry; Part 5 Production Tracker | |
| S6 | "One ranch, four ways it pays" home section + full QA + README | |

## S2 plan

### Decisions
- **Navigation:** a third top-level tab, **Soil & Fuel**, in the leather tab strip: `Buy Beef | Soil & Fuel | Buy Cattle`. The spec allows "Soil & Fuel" if the header gets crowded. The beef header already holds four links, so adding Soil and Fuel there would wrap on tablets. A tab also gives the division its own header links (Soil, Fuel, Pro accounts, Find a store) and its own phone tab bar. Paths `/soil*` and `/fuel*` belong to that side.
- **S2 pages:** `/soil` and `/fuel` get simple real pages that list the product line from config (name, what it's made of, prices per unit), so no nav link goes nowhere. S4 and S5 replace them with the full storefronts.
- **Every number is a placeholder:** prices, densities, application rates, delivery rates, and all planner defaults. They are labeled that way in config (`estimatesConfirmed: false`), and the UI shows an "Estimate" badge, as Ranch Goods does.
- **Fuel product types** come from the spreadsheet's "Products & Markets" sheet, per the spec: pressed fuel logs, briquettes, campfire bundles, and a novelty cow-chip gift pack. Dung cakes, ritual cakes, and biogas digestate are left out.
  - Logs, briquettes, and bundles are each sold by the **bundle, case, and pallet**, with lower prices per bundle at the larger sizes.
  - The how-it's-made steps follow the spreadsheet's six production steps: collect, mix with hay or straw, press, sun-dry, cure, package.
- **Soil units:** every product has Bag / Cubic yard / Ton / Truckload. Bag, yard, and ton prices are set per product. A truckload is priced from the ton price, times tons per load, less a truckload discount; delivery is added on top. Truckloads go through the quote flow, not the cart.
- **Delivery pricing:** a base fee plus a per-mile rate from the ranch. ZIP code to miles uses a small table of Colorado 3-digit ZIP centroids (great-circle distance × a road factor). ZIPs outside Colorado get "call for a quote."
- **Compliance:** owner-only requirements per division:
  - Soil: fertilizer or soil-amendment registration with the Colorado Department of Agriculture, the bag label, lab testing, and the compost site permit.
  - Fuel: air-quality review, the fuel label, and outdoor-use and fire-safety wording.
  - Each product lists the requirements it needs. The owner tracks status and can switch each product on or off.
- **"Lab tested" badge:** controlled by `trust.labTested` in config, default **off**.
- **Cart:** soil (bag/yard/ton) and fuel (bundle/case/pallet) cart line types are defined now. They join the cart union in S4/S5, when their storefronts and checkout handling land.

### Files
- `src/data/soilFuelTypes.ts`: all types.
  - Products and units: `SoilProductId`, `SoilUnit`, `SoilUse`, `FuelProductId`, `FuelUnit`.
  - Customers and compliance: `ProBuyerKind`, `ComplianceRequirementId`.
  - Requests and records: `TruckloadQuote`, `ProApplication`, `Dealer`, `DealerApplication`, `WaitlistSignup`, `FuelInquiry`.
  - Production: `CompostBatch` (temperature and turning logs), `FuelBatch` (moisture readings), `SoilStock`, `FuelStock`, `PlannerSettings`.
  - Cart: `SoilCartItem`, `FuelCartItem`.
- `src/config/soilFuel.ts`: everything the owner edits.
  - Soil: product line, conversions (lb per cubic yard, bag size, truckload yards and tons), application rates per use, pro tiers, delivery pricing.
  - Fuel: product line, burn times, bundle/case/pallet contents and prices, process steps, storage tips, outdoor-use note.
  - Shared: compliance requirements, trust settings (`labTested: false`), what's in it and what's not, waitlist season, low-stock levels.
- `src/config/manurePlanner.ts`: planner defaults, every one marked "confirm with your own numbers".
  - Manure inputs: head count, lb per head per day, collection rate, moisture loss, hay blend ratio and cost.
  - Allocation split, plus yields, prices, labor, equipment, drying space, packaging, and delivery.
  - Monthly seasonality.
- `src/data/dealers.ts`: about 10 mock Colorado stockists with invented names, at real town coordinates.
- `src/data/soilFuel.ts`: seed data.
  - Starting stock, compliance status, and product switches.
  - Inbox seeds: two truckload quotes, two pro applications, one dealer application, waitlist sign-ups, and two fuel inquiries.
  - Production seeds: four compost batches with temperature and turning logs, and three fuel batches with moisture readings.
- `src/lib/soilFuel.ts` + tests: the shared calculations.
  - Unit conversions and price for a unit, truckload price, and pro-tier lookup.
  - ZIP → miles → delivered price, and the coverage calculator (area + use → yards, tons, bags, cost).
  - Dealer filtering and distance, and low-stock checks.
- **Store:** new persisted slices with seeds, covered by **Reset demo data**. Persist version 5.
  - Product settings: `soilFuelEnabled`, `soilFuelCompliance`.
  - Stock: `soilStock`, `fuelStock`.
  - Inboxes: `truckloadQuotes`, `proApplications`, `dealerApplications`, `waitlist`, `fuelInquiries`.
  - Production: `compostBatches`, `fuelBatches`.
  - Planner: `plannerSettings`.
- **Nav:** the `soil` side in `nav.ts` (header, menu, tab bar), the SideSwitch, the footer, and routes for `/soil` and `/fuel`.

## Progress log
- **S1** (`1d70eef`): rebrand to CROWDER and Farrell.
  - Ear tags are now `CRW`; the Colorado placeholder location replaces Missouri.
  - The About Farrell story lives in `ranch.story` (placeholder copy) and shows on About, Meet the Rancher, and the Buy Cattle home page.
- **S2**: Soil & Fuel data model, config, seeds, math, store slices, and nav.
  - New files: `soilFuelTypes.ts`, `config/soilFuel.ts`, `config/manurePlanner.ts`, `dealers.ts`, `coloradoZips.ts`, `soilFuel.ts` (seeds), and `lib/soilFuel.ts` with 17 tests.
  - Store: 12 new slices; persist version 5.
  - Nav: a third tab, Soil & Fuel, with simple `/soil` and `/fuel` pages.
  - Small jobs (1 yd or less) are pointed to bags; bulk has a 1-yard minimum.
- **S3:** Manure Revenue Planner (`/dashboard/manure-planner`) and the Whole Ranch card at the top of the Overview.
  - Every input is editable and saved to the store; "Back to the defaults" restores them. Inputs still on the placeholder default show an "Estimate" tag.
  - A two-handle allocation slider splits collected manure between compost, fuel, and pasture.
  - "What one ton of manure earns" puts compost, fuel, and pasture side by side, as the spec asks.
  - A 12-month chart has a By season / Evenly toggle, plus a full cost table and equipment payback.
  - **Decision:** added "Bundles you can sell a year" (default 2,500). Per ton, fuel logs earn far more than compost, but the research sheet warns the market is small. Pressing past what sells only adds labor, so the cap is what makes the comparison honest.
  - **Whole Ranch** (Beef, Ranch Goods, Soil, Fuel, Live cattle) is a stacked bar of today vs. with Soil & Fuel. The palette is validated in both modes.
  - **Persist:** the store merges saved planner settings over the defaults, so new planner fields never show NaN.
  - The math is in `lib/manurePlanner.ts` (9 tests); the colors are in `lib/divisionColors.ts`.
- **S4:** the Soil storefront.
  - **Product pages** (`/soil`, `/soil/:id`) have a Bag / Cubic yard / Ton / Truckload switcher, a quantity stepper, live totals, stock, application rates, and a coverage calculator on both pages. Small jobs default to bags.
  - **Truckload quotes** (`/soil/truckload`): a live delivered estimate (product + base + per mile from the ZIP); requests are saved to `truckloadQuotes`. The inbox UI comes in S5.
  - **Pro accounts** (`/soil/pro`): a tier price table with a per bag / yard / ton toggle, plus an application form.
  - **Find a store** (`/soil/stores`): ZIP, store-type, and product filters; nearest stores first; a map placeholder with clickable pins; and a Become a dealer form.
  - **Trust:** what's in it and what's not, a loop graphic (reusable `LoopGraphic`), and the lab-tested badge, off by default. There's also a waitlist.
  - **Owner:** a Soil & Fuel compliance checklist with per-product on/off switches.
  - **Cart:** soil and fuel lines are now in the cart union, with stock checks and stock that drops on order.
  - **Decision:** Soil & Fuel get their own delivery choice. Pickup at the ranch is free; otherwise it's one ranch-truck trip, base + per mile from the ZIP, shown in the cart, checkout, and confirmation.
  - New `formatPrice` keeps cents on unit prices, and shared form helpers live in `lib/forms.ts`.
