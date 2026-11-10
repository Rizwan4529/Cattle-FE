# SPEC-BEEF: Ranch-to-Table beef storefront (FRONTEND-ONLY, extends existing app)

## Context
This project already has a working cattle marketplace demo (lots, animal passports, chute scan, rancher dashboard, syndication). The rancher reviewed it and loved it. Now he wants to ALSO sell beef directly to consumers, because selling as beef is far more profitable than selling live (see /reference/A_Cattle_Economics_One-Page_Sheet.pdf).

Our competitor benchmark is Omaha Steaks (mail-order steaks: shop by cut, steak packages, build-a-box, gifts, corporate gifts, free-shipping threshold, frozen delivery, satisfaction guarantee). We must match their convenience AND beat them on what they can't offer: full traceability to the individual animal, choice of feed program, transparent pricing, and buying a share of a specific animal. Do NOT copy Omaha Steaks' branding, copy, layout, or imagery.

Keep everything frontend-only: Zustand + localStorage persistence, typed mock data, no real payments, no APIs. Reuse the existing theming, ranch config, CattleImage component, and animal passport pages. Every button must work.

## Site structure
- Top-level split in the header: **"Buy Beef"** (consumers, the new default on the home page) and **"Buy Cattle"** (the existing livestock marketplace for buyers and auction partners). Both share one cart system but with separate line-item types.
- Consumer tone: warm, appetizing, premium. Livestock tone stays as is.

## Core domain logic: put this in /src/lib/yield.ts, fully unit-testable
- Live weight → **hanging weight** = live × dressingPercent (config default 0.62, range 0.60–0.65)
- Hanging → **take-home weight** = live × takeHomePercent (config default 0.40, range 0.38–0.43)
- NEVER call hanging weight "meat." Always show Live / Hanging / Take-home with a short "What do these mean?" explainer.
- Share sizes from config: whole, half, quarter (eighth optional, OFF by default, with an admin warning that some states limit shares).
- Share price = share hanging lbs × pricePerHangingLb (config default $7.10), with processing either included or itemized (config switch; default ~$1.00/hanging lb + kill fee split across shares).
- Show the effective **$/take-home lb** next to every share price, plus "vs. buying these cuts individually: save $X."
- Pound-to-share helper: customer types "I want ~300 lb of beef" → recommend the closest share size with its take-home range, and explain why shares are sold this way (one friendly sentence, no legalese).

## Feed programs (animal categories the customer chooses)
Grass-fed & grass-finished, grain-finished (corn), forage/hay-fed with grain finish, plus breed (Angus, Hereford, Wagyu-cross, etc.). Each program has a description card, a flavor/marbling note, and a price multiplier in config. Customers can filter animals by feed program, breed, finish date, and share availability.

## Feature A: "Claim Your Beef" share pools (the signature feature)
- Each animal ready for harvest has a **share pool**: an animal card with photo, tag ID (links to existing passport), feed program, breed, age, live/hanging/take-home estimates, and a **fill meter** showing shares claimed vs. available (e.g. a 4-segment bar for quarters, with claimed segments showing first name + city, like "Sarah · Kansas City").
- Pool statuses: Open → Fully Claimed → Harvest Scheduled → Dry Aging (day X of 14–21) → Cut & Wrap → Ready for Pickup / Shipped. Show this as a visual timeline on the animal's beef page.
- Harvest happens ONLY when 100% of shares are claimed. Show "Harvest locks in when this animal fills: 1 quarter left!"
- Pool deadline with a countdown. If not full by the deadline: customer chooses roll over to the next animal, or full deposit refund (show this policy clearly at claim time).
- Mock activity: every 20–40 seconds a toast like "Mike from Omaha just claimed a quarter of HCR-2417" (toggleable in demo settings), and the fill meter animates.
- "Notify me when a new grass-finished animal opens" (mock subscription saved to store).
- Claiming a share = add to cart with a deposit (config, e.g. 25%), balance due at pickup/shipping based on ACTUAL hanging weight (explain this clearly).

## Feature B: Cut Sheet Builder
- After claiming a share (and in cart/account), the customer fills out a cut sheet.
- Interactive ORIGINAL SVG beef-carcass diagram with clickable primals (chuck, rib, loin, sirloin, round, brisket, plate, flank, shank). Clicking a primal shows its options: steaks vs. roasts vs. ground, steak thickness (¾", 1", 1¼", 1½"), steaks per package, roast size, ground package size (1 lb / 2 lb), patties yes/no, extras (soup bones, short ribs, organ meats, fat/suet).
- A live estimate panel shows approximate lbs by category (steaks / roasts / ground / other) for their share size, updating as they choose. Label it "estimate."
- Presets: "Steak Lover," "Family Freezer (more ground)," "Smoker Pack," "Butcher's Choice."
- Saved to the store; exportable/printable as a processor-ready cut sheet.

## Feature C: Butcher Shop (individual cuts and boxes, Omaha-style but traceable)
- Behind a config flag `sellByTheCut` (default ON for the demo), with a small admin-only note that this requires USDA- or state-inspected processing.
- Shop by cut: Ribeye, NY Strip, Filet, Sirloin, T-Bone/Porterhouse, Flat Iron, Brisket, Short Ribs, Roasts, Ground Beef, Patties, Stew Meat, Bones & Broth.
- Every product card and page shows **"From animal HCR-XXXX · Grass-finished · Angus"**, linking to that animal's passport. Lot freshness/pack date, weight per pack, $/lb.
- Curated bundles (Grill Master Box, Family Month of Dinners, Holiday Prime Rib), **Build-Your-Own Box** (pick items until a box target is reached, with a progress bar and box-level discount), and a **monthly Ranch Box subscription** (choose size, frequency, feed preference; skip/pause in account).
- Gifts: gift boxes, gift cards (choose amount, recipient, message, send date), and a corporate/bulk gifting inquiry form.
- Reviews with star ratings and filtering, a "Pairs well with" section, and a cooking guide per cut.

## Feature D: Delivery, freezer, and trust tools
- ZIP checker: local delivery zone (free over threshold), farm pickup (pick date/time slot), or shipped frozen with dry ice (cost tiers, free shipping over config threshold). Mock zones from config.
- **Freezer space calculator**: share size or cart weight → cubic feet needed (config default ~1 cu ft per 35–40 lb of packaged beef) → suggests chest freezer sizes.
- "Know Your Animal" trust badges: tag ID, feed program, no added hormones (config-driven, only show what the rancher confirms), dry-aged days, harvest date, processor name.
- Ranch satisfaction guarantee section (policy text in config).

## Feature E: Customer account (mock login, no real auth)
Orders, claimed shares with live status timelines, saved cut sheets, subscriptions (pause/skip/change), favorites with one-click reorder, gift cards, addresses, and a "My Animals" page showing every animal their beef came from.

## Feature F: Rancher dashboard additions (extend the existing dashboard)
- **Share Pool Manager**: create a pool from any herd animal (picks feed program, price/hanging lb, share sizes, deadline), see fill %, buyer list, close/extend pools.
- **Harvest Scheduler**: fully claimed pools → pick a processor date on a calendar → statuses advance (button to simulate time passing in the demo).
- **Processor export**: combined cut sheets + owner names per carcass as CSV and a printable sheet.
- **Packaged inventory** for the Butcher Shop (stock by cut, low-stock warnings).
- **"Sell Live vs Sell as Beef" profit calculator**: prefill defaults from the economics PDF (700 lb feeder at $350/cwt, 600 lb gain at $1.02/lb, fed price $2.16/lb at 1,300 lb, 62% dressing, 40% take-home, ~$825 processing; scenarios at $7/$9/$11 per take-home lb). Every input editable; outputs show net per head live vs. as beef, breakeven price, and a bar chart. Footnote that nets exclude interest, vet, death loss, packaging, labor, marketing, shipping, and that prices move weekly.
- Beef sales analytics: revenue by channel (shares / cuts / subscriptions / live cattle), top cuts, pool fill speed.

## Home page (Buy Beef)
Hero: "Beef from one ranch. One animal. You choose which." Primary CTAs: "Claim Your Beef" and "Shop Cuts." Sections: How it works (Pick your animal → Claim a share → We harvest when it's full → Dry-aged, cut your way, delivered), animals filling now (live meters), shop by cut, feed program cards, bundles, "Why not mail-order steaks?" comparison (traceable to one animal vs. unknown sources; your cut sheet vs. preset packs; price per lb shown upfront), Meet the Rancher, reviews, FAQ preview, newsletter signup.

## Checkout updates
Support mixed carts (share deposits + butcher shop items + gift cards + live cattle lots). Clearly separate "pay today" vs. "due later." Delivery method per item type. Gift message option. Promo code field (demo codes in config). Mock Stripe-style payment. Order confirmation with a timeline.

## Quality bar
Same as the main SPEC.md: mobile-first, large readable text, light/dark mode, accessible, empty/loading states, toasts, no dead buttons, "Reset demo data" covers new data too. Use appetizing illustrated SVG placeholders for cuts (no hotlinked photos), swappable later via `photos` fields.
