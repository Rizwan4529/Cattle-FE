# SPEC-BYPRODUCTS: "Whole Animal" byproduct market + hidden revenue tools (FRONTEND-ONLY)

## Context
The app already has: livestock marketplace (Buy Cattle), beef storefront with share pools, cut sheets, butcher shop, subscriptions, account, and rancher dashboard (see SPEC.md and SPEC-BEEF.md). The rancher sent /reference/Buy_it_now_Beef_Byproduct_Market.html, a rough mockup of a byproducts shop. Use its catalog (categories, items, descriptions, prices, units) as seed data, but rebuild it fully in our design system. Do NOT keep its separate "copy order" flow; everything goes through our existing cart and checkout.

Goal: (1) sell every usable part of the animal, and (2) make the rancher SEE the money he's currently leaving with the processor. Frontend-only, Zustand + localStorage, typed mock data, every button works.

## Navigation
Under "Buy Beef" add **"Ranch Goods"** (whole-animal products). Categories: Tallow & Fat, Bones & Specialty Cuts, Dog Chews, Hides & Leather, Horn/Bone & Craft, Garden. Category chips stay sticky on mobile like the mockup.

## Compliance flags (config-driven)
Each category and product carries flags in config: `requiresInspection` (edible items), `requiresFeedRegistration` (pet chews), `requiresFertilizerRegistration` (garden), plus `enabled`. Disabled categories disappear from the storefront. The dashboard shows an admin-only compliance checklist with a status per category ("Not started / In progress / Cleared"), editable. Shoppers never see legal warnings, only the admin does. Keep a short consumer footer note that prices and availability vary.

## Feature A: Ranch Goods storefront
- Category landing page with hero "Nothing wasted. Every part of the animal, put to use."
- Product cards and pages: illustrated SVG placeholder, name, description, price/unit, stock, quantity stepper (mobile-friendly like the mockup), add to cart.
- Traceability where it makes sense: hides, horns, and bones show "From animal HCR-XXXX" linking to its passport (e.g. a hide rug page shows the actual animal it came from). One-of-a-kind items (hides, horns) have quantity 1 and become "Sold" after purchase.
- Search, sort, and filter by category, price, and use (cooking, pets, crafts, garden, home).
- **Makers & Wholesale**: tiered bulk pricing on tallow, hides, leather, and craft blanks (e.g. 1–4, 5–19, 20+ with % off shown in a table), plus a wholesale inquiry form for soap makers, pet treat shops, leatherworkers, and garden centers (saved to store, appears in dashboard).
- Subscriptions: "Monthly Dog Chew Box" and "Bone Broth Box," reusing the existing subscription system.
- Cross-sell: on beef cut pages show related goods (ribeye → marrow bones, any order → "Treat the pup" chews), and an "add the whole-animal extras" upsell in the cart.

## Feature B: Nose-to-tail explorer
- Extend the existing SVG carcass diagram with a "Whole Animal" mode: clickable regions for hide, horns, hooves, fat/suet, bones, organs, tail, tendons, ears, trachea.
- Clicking a region shows what it becomes, which products are available (linked), and its estimated value per animal.
- Total panel: "One animal = $X beef + $Y in ranch goods." Use on a public page (/nothing-wasted) and on the Buy Beef home page as a section.

## Feature C: Share agreement update
- In the share claim flow, add a clearly worded byproduct rights checkbox: the ranch keeps hide, horns, bones, fat, and organs not requested on the cut sheet. Store the acceptance with the claim.
- Items a share buyer requests in their cut sheet extras (soup bones, organs, suet) are deducted from that animal's ranch byproduct yield.

## Feature D: Rancher dashboard: Hidden Revenue (the headline feature for the owner)
- **Hidden Revenue Calculator**: per-animal waterfall/stacked bar: Sell Live → Sell as Beef → Beef + Ranch Goods. Byproduct yields per animal and prices are editable inputs pre-filled with clearly labeled placeholder estimates in config (rancher must confirm real numbers). Include a "recovery rate" slider per byproduct (what share he actually gets back from the processor).
- Herd projection: head harvested per year × per-animal byproduct value = "Money left on the table each year," shown big, with a line chart over 12 months and a "what if you recovered 50% / 80% / 100%" toggle.
- **Byproduct Inventory**: per harvested animal, record what was recovered (hide yes/no, lbs fat, lbs bones, organs, horns), convert batches into sellable stock (e.g. 40 lb raw fat → rendered tallow lbs at an editable yield), and show a "Not recovered" column with its lost value in red.
- Wholesale inquiries inbox (reply/mark handled), and byproduct sales added to the existing revenue analytics as a new channel.

## Quality bar
Same as SPEC.md and SPEC-BEEF.md: mobile-first, large text, light/dark, accessible, toasts, empty states, no dead buttons, "Reset demo data" includes all new data, README updated.
