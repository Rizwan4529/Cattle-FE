# Handoff: CROWDER ranch marketplace (frontend-only demo)

You're continuing a build that's partway done. Read `reference/Spec.md` first (the full product spec), then this file. The project lives at `d:\Client Projects\Cattke website\Cattle-FE` (Windows, a git repo; commit each phase with a `[FEAT]` or `[FIX]` prefix). Work in the spec's phases, show a short plan before each phase, then build, then verify in a real browser before reporting.

## Beef storefront (SPEC-BEEF)

The Buy Beef side (`reference/spec-beef.md`) was built in phases B1–B7. The plan, the decisions made along the way, and a per-phase log of what was built and where it lives are in `reference/beef-build-plan.md`. Read that before changing anything on the beef side. The status below covers the original cattle marketplace.

## Ranch Goods (SPEC-BYPRODUCTS)

The byproduct store, nose-to-tail explorer, byproduct rights in the share flow, and the owner's Hidden revenue / Byproduct inventory / wholesale inbox / compliance pages (`reference/SPEC-BYPRODUCTS.md`) were built in phases P1–P5. The plan, decisions, and a per-phase log are in `reference/byproducts-build-plan.md`. Notes:
- **Store:** persist version 3. Ranch Goods slices: `goods`, `compliance`, `byproductRecoveries`, `wholesaleInquiries`, `byproductSettings`, `byproductBatches`. Cart line `kind: 'goods'`; a goods subscription box is a normal subscription with `box` set.
- **Estimates:** `src/config/byproducts.ts` holds placeholder yields and prices; pass `withSettings(config, byproductSettings)` anywhere the owner's own numbers should apply.
- **Zustand 5:** never `.filter()` inside a selector (`useRanchStore((s) => s.goods.filter(...))`). It returns a new array every render and loops. Select the array, then filter.

## Status
- **Done:** Phases 1 to 4. Home, Browse, Lot Detail, Animal Passport, Chute Scan (`/scan`), and the owner dashboard: one page per section in a sidebar layout (`src/components/layout/OwnerLayout.tsx`): `/dashboard`, `/dashboard/herd`, `/lots`, `/offers`, `/import`, `/settings`, `/syndicate`; old `?tab=` links redirect: overview stats and charts, herd table (search, filters, inline edit, bulk select, create lot, CSV download), lots list, offers inbox, CSV import, settings with Reset demo data. Lot builder at `/dashboard/lots/new` (accepts `?tags=CRW-1,CRW-2`) and `/dashboard/lots/:lotId/edit`.
- **Also done (task 8):** syndication at `/dashboard/syndicate` (accepts `?lots=lot-101,lot-102`): pick lots, sale barns (search, state filter) and marketplace channels, pick a format (auction-ready CSV, standard CSV, printable lot sheet with preview), real CSV downloads, printing only the lot sheet, an animated send dialog, and a send history whose partner replies (viewed/interested) arrive over the next ~30 seconds with toasts.
- **Also done (task 9):** `/cart` (pickup or delivery, ZIP freight estimate for the whole order, subtotal, 10% deposit, balance), `/checkout` ("Demo — no real payment." banner, buyer details, delivery address, card form with Luhn/expiry/CVC checks and test card 4242 4242 4242 4242, processing state), `/order/:orderId` confirmation with next steps and Print receipt. Placing an order marks its lots sold, declines open offers on them, and empties them from the cart; dashboard revenue picks the order up.
- **Also done (task 10):** `/about`, `/how-it-works` (buyers and the ranch's side), `/faq` (inspection, health papers, brand inspection, freight, payment, returns; native `<details>`), `/contact` (validated form, success state, prefill via `?lot=lot-101`, map placeholder, directions link). Full QA: every route at 375px and 1366px in light and dark with no overflow or console errors, all internal links resolve, axe-core WCAG 2.1 AA audit clean on every page and on interactive and empty states, README rewritten. `PagePlaceholder` deleted.
- **Status: the spec is fully built.** Further work is polish or changes the client asks for.
- **Sample CSVs for the import** are in `reference/sample-csv/` (with a README). The messy one is also bundled at `src/data/samples/` for the in-app "Try it with a sample file" button.

## Stack (already installed)
- **Core:** Vite 8, React 19 with the React Compiler (babel plugin), TypeScript 6.
- **Styling:** Tailwind 4.3 via `@tailwindcss/vite`. The path alias `@` points to `src`.
- **shadcn/ui:** CLI v4, style `radix-nova`. Components import `cn` from the official `cn` package (re-exported in `src/lib/utils.ts`) and primitives from the `radix-ui` meta package. `next-themes` was removed.
- **Routing:** React Router **7**, deliberately not 8. Uses `createBrowserRouter` with lazy page routes in `src/router.tsx`.
- **State:** Zustand 5 with `persist`.
- **Libraries:** recharts 3.10, framer-motion (wrapped in `<MotionConfig reducedMotion="user">`), papaparse (not used yet), qrcode.react 4, sonner, lucide-react.
- **Fonts:** Rokkitt (headings) and Public Sans (body), installed locally via `@fontsource-variable`.

## Branding and theming (important)
- **All brand values live in `src/config/ranch.ts`:** name, initials, owner ("Farrell"; the business is CROWDER), the About Farrell `story` and `values.allNatural` (placeholder copy until the owner confirms), phone, email, address and coordinates, tag prefix `CRW`, `commerce.depositRate` (0.1), fonts, and full light/dark `ThemeTokens`.
- **Custom tokens beyond shadcn's:** `success`, `warning`, `tag` (ear-tag yellow), `leather`, `leatherUp`, `leatherDown`, `sceneSky`, `sceneHill`, `sceneGround`, and `chart1`–`chart5`.
- **How colors reach the page:** `src/lib/brand-theme.ts` injects the tokens as CSS variables before React renders. It includes an `@media print` block that forces the light palette. `src/index.css` only maps the variables into Tailwind. **Never hard-code colors.**
- **`index.css` also holds:** the `container-page` utility, the `ticker` keyframes, print rules (`@page` margins, 10.5pt root), and a 17px root font size.
- **Light/dark preference:** stored in `src/store/usePreferences.ts` (localStorage key `ranch-preferences`, which also stores `freightDestination`). An inline script in `index.html` applies it before first paint to prevent a flash. Helpers are in `src/lib/theme.ts`.
- **shadcn components were enlarged for an older user on a phone:**
  - **Buttons:** default h-11, lg h-13, text-base.
  - **Fields:** inputs and selects are h-11, checkboxes and radios are size-5, labels text-base.
  - **Slider:** thick track with large thumbs. It gained `thumbLabels` and `getValueText` props.
  - **Lint:** ESLint turns off `react-refresh/only-export-components` for `src/components/ui/**`.

## Design rules in force
- **Look:** modern ranch. Barn red primary, kraft-sand background, charcoal text, sage for available, amber for pending.
- **The one bold motif is the yellow ear tag** (`<EarTag>`). Use it for tag IDs, plus the numbered How-it-works steps.
- **Avoid:** all-caps eyebrow labels, "A · B · C" middle-dot strings, decorative gradients, and identical card grids.
- **Copy:**
  - **Style:** plain-language, sentence case, active verbs. Keep each action named the same through a flow ("Send offer" → "Offer sent").
  - **No pronouns for the owner:** the owner is a placeholder the client will replace, so use their name.
- **Size:** mobile-first with tap targets of at least 44px. Phones get a bottom tab bar (Home, Browse, Scan, Cart). The desktop nav appears at `xl`.
- **Pricing:** cow-calf pairs are priced per pair (`priceUnit()` in `lib/labels.ts`). Sold lots always sort last. **Buy now** stays available on lots with a pending offer.
- **Charts** follow the dataviz skill:
  - **Series:** a single series gets no legend.
  - **Marks:** bars at most 24px thick with a zero baseline; 2px lines; markers with a surface-colored ring.
  - **Hover and tables:** tooltips on hover, and a table view nearby.

## Data (`src/data/`, all typed)
- **`types.ts`:** `Animal`, `Lot`, `Offer` (with `fromThisDevice`), `CartItem` (`lotId`, `addedAt`), `Order`, `AuctionPartner`, `MarketChannel`, `SendRecord`, `ExportFormat`.
- **`animals.ts`:**
  - **Herd:** 44 head from a fixed-seed generator (`mulberry32(2417)`) with `DEMO_TODAY = '2026-11-06'`, covering lots 101–110.
  - **Unlisted head:** CRW-2421 and CRW-2424 (replacement heifers), CRW-1912, CRW-2011 and CRW-2115 (bred cows), and CRW-2402 (a steer held for a foot-rot withdrawal).
  - **Special records:** CRW-2414 has a pinkeye treatment on file.
- **`lots.ts`:** 10 lots. Lot 106 is pending, 108 is sold, 103 and 109 are offer-only, 105 and 108 are buy-now only.
  - **Never store derived numbers.** Head count, average and range of weights, $/cwt and lot total all come from `getLotStats()` in `src/lib/lots.ts`.
- **`offers.ts`:** 3 seed offers.
- **`partners.ts`:** 28 sale barns cleaned from the PDF (demo, test, inactive and horse-only entries skipped), plus 4 generic marketplace channels.
- **`market.ts`:** sample $/cwt quotes, 12 months of sales history, and buyers this month.
- **`geo.ts`:** lower-48 state centers and ZIP-prefix ranges, used by the freight estimator.

## Store (`src/store/useRanchStore.ts`)
- **Persistence:** localStorage key `ranch-demo-data`, version 1. Migration resets to the seed data.
- **State:** `animals`, `lots`, `offers`, `cart`, `orders`, `sends`.
- **Actions so far:** `submitOffer` (also flips an available lot to pending), `addToCart`, `removeFromCart`, `clearCart`, `saveLot(lot, newAnimals?)` (insert or replace; adds animals not already in the herd; moves tags out of other unsold lots and removes lots left empty), `publishLot`, `deleteLot`, `importAnimals(added, updates)`, `updateAnimal`, `acceptOffer` (lot → sold, other open offers on it declined, stores `acceptedPricePerHead`), `counterOffer` (lot → pending), `declineOffer` (lot → available if no open offers remain), `resetDemo`.
- **Draft lots:** `Lot.draft = true` hides a lot from `useLotRows()` (pass `{ includeDrafts: true }` in the dashboard). The lot page shows a "Draft" notice with a Publish button and hides the buy actions.
- **Add more actions as phases need them:** accept, counter or decline offers; edit animals; import; create lots; place orders; log sends.

## Library helpers (`src/lib/`)
- **`format.ts`:** currency, $/cwt, weight, numbers, dates, short dates, age, `pricePerCwt`, and `daysSince` measured from `DEMO_TODAY`.
- **`labels.ts`:** display labels for lot classes, statuses, pricing modes, sexes and coat colors, plus `priceUnit`.
- **Lots and filters:**
  - **`lots.ts`:** `getLotAnimals`, `getLotStats`, `lotIllustration`.
  - **`useLotRows.ts`:** each lot with its stats.
  - **Browse filters:** `lotFilters.ts` (parse, serialize, apply, sort) and `useLotFilters.ts`. The URL is the single source of truth, and updates use `replace` plus `preventScrollReset`.
- **Lot and animal detail:**
  - **`freight.ts`:** the mock haul estimate, choosing a gooseneck or semi trailer and estimating shrink.
  - **`lotHealth.ts`:** `getVerifications` and `getHealthSummary`.
  - **`animalTimeline.ts`:** `buildTimeline`, `getGainStats`, `formatEid`.
- **`usePageTitle.ts`:** sets the browser tab title. **`useMediaQuery.ts`:** matchMedia hook.
- **`lotDraft.ts`:** generic lot creation: `classOf`/`inferLotClass`, `suggestedCwt`, `suggestLot` (title + price; feeder cattle by $/cwt, breeding stock from the ranch's other lots), `describeLot`, `highlightsFor`, `breedSummaryOf`, `buildDraftLot`. Used by `components/lots/CreateLotDialog` from both the scan and the herd table.
- **`herdImport.ts`:** CSV import: `TARGET_FIELDS` (with header synonyms), `guessMapping`, `parseCsv` (keeps file line numbers, counts blank lines), value parsers (`parseDate` takes yyyy-mm-dd or m/d/yy(yy), `parseSex`, `parseCoat`, `normalizeTag` adds the CRW- prefix), `checkRows` (errors: missing tag, duplicate tag, missing/odd weight, missing sex for new animals; everything else is a warning with the fix stated), `toNewAnimal`, `toUpdate` (one imported reading per animal per day), `templateCsv`.
- **`dashboard.ts`:** `indexLots`, `herdStatus`, `HERD_CLASSES`, `salesSeries` (seed history + accepted offers + orders added to the current month), `getOverview`, `classBreakdown`, `weightBins`, `herdCsv`.
- **`checkout.ts`:** `summarizeCart` (lines, unavailable lots, subtotal, one combined haul via `estimateFreight`, deposit from `ranch.commerce.depositRate`, balance), card helpers (`luhnValid`, `cardBrand`, `formatCardNumber`, `formatExpiry`, `expiryValid`), `newOrderNumber`. Store action `placeOrder`. `usePreferences` also holds `fulfillment` ('pickup' | 'delivery').
- **`syndication.ts`:** `EXPORT_FORMATS`, `auctionCsv` (one row per lot, sale-barn column names), `standardCsv` (one row per animal), `RECIPIENTS`/`recipientById` (partners + channels), `planReplies` (~60% view, ~25% interested, at least one; stored as `viewedAt`/`interestedAt` timestamps on each recipient) and `statusAt(recipient, now)`. Store action `logSend`.
- **Paper preview:** `.theme-paper` (in `brand-theme.ts`) keeps the light palette inside dark mode, used by the lot sheet preview.
- **Overflow gotcha:** a table wrapper with `overflow-x-auto` needs `relative`, or an `sr-only` header cell escapes it and widens the page.
- **`chuteScan.ts`:** scan groups (steer calves, heifer calves, yearling steers), `generateScanBatch` (uses the exported `buildAnimal` from `data/animals.ts`, picks free tags from CRW-2470 up), timing (`TIMING`, `CYCLE`, `phaseAt`, `runLength`), the CSV (`scanCsv`, `downloadText`, `csvFileName`; snake_case columns meant to match the Phase 4 CSV import). `RESCAN_BELOW = 92` flags low-confidence reads.

## Components
- **`layout/`:** the site shell.
  - **Shell:** `SiteLayout` (skip link, `ScrollRestoration`), `Header`, `MobileMenu` (a sheet), `MobileTabBar`, `Footer`.
  - **Pieces:** `ThemeToggle` and `ThemeSegmented`, `RanchBrand` and `BrandMark`, and `nav.ts`.
  - **States:** `RouteError` and `AppLoading` (the first-load fallback).
- **`cattle/`:** `CattleImage` and `EarTag`.
  - **`CattleImage`:** draws an SVG cow on a pasture scene in a 400×300 frame (4:3). It handles six coat colors, a grazing pose, a calf at side for pairs, and a bull's crest. An empty `alt` makes it decorative, and a `photos` array swaps in real photos.
- **`lots/`:** `LotCard` (grid and list layouts), `LotActions` (`size` and `onLotPage` props), `MakeOfferDialog` (validated in on-screen field order), `LotStatusBadge`.
- **`browse/`:** `FilterPanel`, `SearchBox` (debounced, matches tags like "2417" or "CRW-2417"), `ActiveFilters`.
- **`home/`:** `HeroScanCard`, `StatsStrip` (count-up), `MarketTicker` (marked as sample data), `FeaturedLots` (scroll-snap carousel), `HowItWorksSteps`.
- **`lot/`:** `LotGallery` (includes a fake video player), `WeightChart`, `AnimalTable` (sortable, pinned tag column), `HealthSummary` and `VerificationBadges`, `FreightEstimator`, `ShareLot` (QR, share, copy, download).
- **`animal/`:** `PassportCard`, `WeightGainChart`, `HealthTimeline`, `ScanHistory`.
- **`dashboard/`:** `OverviewStats`, `ChartPanel` (chart/table toggle), `OverviewCharts` (sales line, class bars, weight histogram; single series in `--chart-1`, since the 2nd chart color failed the dataviz chroma check), `LotsOverview` (Lots tab, with Edit and Publish), `HerdTable` (table at lg+, cards below), `OffersInbox`, `CsvImport` (4 steps: file, columns, check, done), `DashboardSettings`.
- **`pages/LotBuilderPage.tsx`:** form state uses `null` for "follow the suggestion" (title, class, breed, description, highlights, price), so suggestions track the animals picked until edited. The live preview is the real `LotCard` inside an `inert` wrapper. Sold lots can't be edited.
- **`scan/`:** `ChuteScene` (SVG tunnel; every frame is a pure function of simulated `elapsed` ms), `useScanClock` (rAF clock with speed, pause, reset, skip), `ScanReadout` (leather console, flicker-then-lock fields), `ScanLog` (spreadsheet-style live table), `ScanSummary`.
- **`CattleSprite`** (exported from `CattleImage.tsx`): the bare animal as an SVG group for other scenes. Legs swing inside an element with the `cattle-walking` class (`--stride` sets the pace; keyframes in `index.css`).
- **`PageHeader.tsx`:** the standard page title block.

## Routes
- **Built:** `/`, `/cattle`, `/lots/:lotId`, `/animal/:tagId`, `/scan`, `/dashboard`, `/dashboard/lots/new`, `/dashboard/lots/:lotId/edit`, and `*` (the 404 page).
- **Placeholders:** none.
- **Placeholder links:** toasts and links already point at `/cart`.

## Gotchas learned the hard way
- **Grid overflow on phones:** every grid wrapper that can contain a `CattleImage` or long text needs `grid-cols-1` (or `minmax(0,1fr)`). Otherwise the SVG's natural 400px width forces sideways scrolling.
- **Recharts 3:**
  - **Tooltips:** type them as `TooltipContentProps` with no generics.
  - **Markers:** they inherit the area's `fillOpacity`, so set `fillOpacity: 1`.
  - **Clicks:** use the chart-level `onClick` with `state.activeLabel`.
  - **Height:** give chart containers px heights, not rem, or print layouts break.
- **Edits on Windows:** `node -e` and `sed` with escaped quotes or backslashes often fail in this shell. Prefer the Edit tool for multi-line or regex changes.
- **Hot reload noise:** it can log a transient error when you change a function's signature in one edit and its caller in the next. Re-check on a fresh load before chasing it.
- **Dev server:** port 5173 was taken by another process, so the dev server ran on **5199**.
- **Contrast:** dark-mode `primary` is `#E07A62` and `destructive` `#EC7A60` so small text passes 4.5:1 on dark cards. Sold lot cards fade only the picture, not the text. Re-run axe-core (load it from cdnjs in Playwright) after color changes.
- **Formatting:** there's no Prettier config. Plain `npx prettier --write` switches files to double quotes and semicolons. Match the house style with `--single-quote --no-semi --print-width 150 --trailing-comma all`.

## How to verify each phase
1. Run `npx tsc -b`, `npx eslint .` and `npm run build`. All three must be clean.
2. In Playwright, check 1366×900 and 390×844, in light and dark. On every page, confirm `document.documentElement.scrollWidth` equals the viewport width.
3. Script the interactions with `browser_run_code_unsafe` and collect console errors.
4. For print views, generate a PDF with `page.pdf()` and read it.
5. Delete the `.playwright-mcp/` folder afterward (it's in `.gitignore`).
6. Report what was built, what was fixed during testing, and any decisions the user might want to change.

## Notes for upcoming phases
- **Phase 6 (cart and checkout):**
  - **Money:** the deposit comes from `ranch.commerce.depositRate`. Estimated freight reuses `usePreferences().freightDestination` with `estimateFreight()`.
  - **After purchase:** purchased lots become `sold`.
  - **Checkout page:** must clearly say "Demo — no real payment."
- **README:** `README.md` exists from Phase 1. Update it at the end.
