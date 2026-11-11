# SPEC-SOIL-FUEL: CROWDER rebrand + compost & fuel divisions (FRONTEND-ONLY)

## Context
The app already has Buy Cattle, Buy Beef (shares, cut sheets, butcher shop), and Ranch Goods (byproducts), plus a rancher dashboard. See the other SPEC files. Now:
1. Rebrand the entire site for the real owner.
2. Add two new divisions that turn manure into revenue: **organic compost/fertilizer** (manure blended with alfalfa/hay, sold by bag, cubic yard, ton, and truckload) and **manure fuel logs** (dried, pressed logs, briquettes, and campfire bundles).
Research notes for fuel are in /reference/cow_dung_fuel_industry.xlsx (read all sheets).

Frontend-only: Zustand + localStorage, typed mock data, no real payments, every button works.

## Part 1: Rebrand (do this first)
- Business name: **CROWDER**. Owner: **Farrell** (family/rancher name). Update /src/config/ranch.ts and replace EVERY placeholder ranch name, logo text, page title, email/footer, mock seller name, receipt, CSV header, and print sheet across the app. Search the codebase for the old placeholder name to make sure nothing is missed.
- Add an "About Farrell" story section (placeholder copy in config: years ranching, family operation, the land, "all natural" values, and his past experience building an organic fertilizer business) on About, Meet the Rancher, and home pages.
- Tagline idea: "CROWDER: Every part of the ranch, put to work." Use "All Natural" as a brand value in copy, but keep it config-driven so the owner can confirm wording.
- Do NOT use the name Humalfa or any of its logos, product names, images, or testimonials anywhere.

## Part 2: CROWDER Soil (compost & fertilizer division)
Header gets a new top-level section: **Soil** (next to Buy Beef, Ranch Goods, Buy Cattle).
- Original product line (names in config): e.g. Garden Blend (bags), Lawn & Turf Topdress (bags/yards), Ag-Grade Bulk Compost (tons/truckloads), Potting & Raised Bed Mix. Each has: what it's made of (manure + alfalfa/hay blend, composted), best uses, application rates, bag size, $/bag, $/cubic yard, $/ton.
- Unit switcher on every product: Bag / Cubic Yard / Ton / Truckload. Prices and totals update.
- **Coverage calculator**: enter area (sq ft or acres) and use (new lawn, topdress, garden bed, field), get bags/yards/tons needed, cost, and a one-click add to cart.
- **Truckload quote flow**: for farms, landscapers, and golf courses. Enter ZIP, quantity, and delivery window, see a mock delivered price (base + per-mile from config), then request a quote (saved, appears in dashboard).
- **Pro accounts**: volume tier pricing table for commercial buyers (landscapers, golf courses, farms, garden centers) and an application form.
- **Find us in stores**: dealer/stockist locator with mock Colorado stores (list + map placeholder + filter), and "Become a dealer" form.
- Trust section: "lab tested" badge driven by config (default OFF until the owner confirms real testing), what's in it and what's not, and a "from our herd to your soil" loop graphic.
- Pre-order / waitlist signup for the launch season.
- Admin-only compliance flags (fertilizer/soil amendment registration, labeling) like Ranch Goods, with per-product enable switches.

## Part 3: CROWDER Fuel (manure fuel logs)
Header section: **Fuel** (or under Soil as "Soil & Fuel" if the nav gets crowded; choose what's cleaner on mobile).
- Product types from the spreadsheet: pressed fuel logs, briquettes, campfire bundles, and a novelty "cow chip" gift pack. Sold by bundle, case, and pallet with tier pricing.
- Product pages: burn time, how it's made (collect, mix with hay/straw, press, sun-dry, cure), suggested uses (outdoor fire pits, campfires, wood-substitute), storage tips, and a clear "outdoor use" note.
- Bulk/wholesale inquiry for campgrounds, retailers, and institutions.
- Same admin compliance flags (air quality, labeling) and enable switches.

## Part 4: Dashboard: Manure Revenue Planner (the headline feature)
- Inputs: head count, manure per head per day (placeholder default in config, clearly marked "confirm with your own numbers"), collection rate %, moisture loss on drying, alfalfa/hay blend ratio and its cost per ton.
- **Allocation slider**: % of collected manure to compost vs. fuel logs (vs. left on pasture).
- Per-product yield and price assumptions (editable), plus costs: labor hours, equipment (compost turner, bagging, log press), drying/curing space, bags/packaging, delivery.
- Outputs: tons/year to each product, units produced, revenue, costs, net profit per year, **value per ton for compost vs. fuel** side by side (the spreadsheet notes manure may earn more in another use, so make this comparison prominent), equipment payback period, and a 12-month projection chart with a seasonality toggle (fuel drying is seasonal).
- A combined **"Whole Ranch" summary card** at the top of the dashboard: Beef + Ranch Goods + Soil + Fuel + Live Cattle, annual projection, with a stacked bar chart.

## Part 5: Dashboard: Production Tracker
- Compost batches: start date, manure tons + alfalfa tons, windrow ID, a temperature log (mock readings with a chart and a target-range band from config), turning log, curing days, status (Mixing → Composting → Curing → Screened → Bagged), finished tons converted into inventory by unit.
- Fuel batches: collected tons, mix ratio, pressed count, drying days with a moisture % reading, status (Pressed → Drying → Curing → Packed), converted into inventory.
- Inventory and low-stock alerts for both divisions; quote requests, pro account applications, and dealer applications inboxes.
- Add Soil and Fuel as channels in the existing revenue analytics.

## Home page update
Add a "One ranch, four ways it pays" section (Beef, Ranch Goods, Soil, Fuel) with a circular loop graphic: pasture → cattle → beef → manure + hay → compost → back to pasture, with fuel branching off.

## Quality bar
Same as other SPECs: mobile-first, large text, light/dark, accessible, toasts, empty states, no dead buttons, "Reset demo data" covers new data, README updated.
