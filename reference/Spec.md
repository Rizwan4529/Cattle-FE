# Project: Ranch-direct cattle marketplace (FRONTEND-ONLY DEMO)

I'm building a sales demo website for a cattle rancher in the US Midwest. He has hundreds of beef cattle, buys and sells regularly, and has no web presence. He's old-fashioned, so this demo must instantly show him value in plain language. There is NO backend. Everything runs in the browser with mock data and local persistence. It must look and feel like a real, finished product.

I've attached two reference files:
- `Cattle_For_Sale.html`: a rough mockup from my partner. Use it only for the content idea (lot cards, $/head, head count, location, seller contact). Do NOT copy its design; build something far better.
- `Cattle_data_1.pdf`: a list of real livestock auction barns (name, city/state, phone). Parse 20–30 of these into mock data for the "Auction Partners / Syndication" feature below. Skip entries marked as demo, test, or inactive.

## The core concept (build the whole site around this)
1. Every animal has an **ear tag ID**. The tag is the primary key for everything.
2. Cattle walk through a **camera chute/tunnel**. Cameras capture photos and estimate data (weight, frame size, body condition, sex, coat color). This creates a CSV row per animal.
3. Animals are grouped into **lots** (e.g. "24 Black Angus Steers, ~650 lb") and listed for sale online. Mainly **Buy It Now** and **Make an Offer**, not live auctions.
4. The rancher can **export/send lot data as CSV** to auction barns, order buyers, and marketplaces. The cattle stay on the ranch until sold ("sell from the pasture").
5. Checkout is a **mock Stripe-style checkout** with deposit and balance due on delivery.

## Tech stack
- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui (set up properly with CSS variables and theming)
- React Router for pages
- Zustand with `persist` middleware (localStorage) so cart, offers, edits, uploaded CSVs, and new listings survive refresh
- papaparse (CSV import/export), recharts (charts), lucide-react (icons), framer-motion (tasteful animation), qrcode.react (QR codes)
- No backend, no real API calls, no real payments. Put all mock data in `/src/data/` as typed TS files.

## Theming and design
- Brand feel: modern ranch / Western premium. Think earthy and trustworthy, not cartoony. Palette: deep leather brown or rich barn red as primary, warm sand/cream backgrounds, charcoal text, muted sage green for "available/healthy" states, amber for "pending." Pick a strong serif or slab for headings with a clean sans for body.
- Full **light and dark mode** with a toggle, via shadcn CSS variables. Respect system preference by default.
- **Large, readable text and big tap targets.** The owner is older and will likely look at this on his phone in a truck. Mobile-first, fully responsive.
- Put the ranch name, logo text, phone, location, and colors in ONE config file (`/src/config/ranch.ts`) so I can rebrand instantly. Use placeholder name "Heritage Creek Ranch, Missouri."
- Images: no hotlinked stock photos. Create a reusable `<CattleImage>` component that renders a good-looking illustrated SVG placeholder (cow silhouette tinted by coat color: black, red, white-face, etc.), with support for swapping in real photos later via a `photos: string[]` field.
- Use realistic US cattle industry terms: head, lot, $/head, $/cwt (price per hundredweight), steers, heifers, bred heifers, pairs (cow-calf), bulls, feeder/stocker, weaned, preconditioned, BQA, age & source verified, frame score, BCS.

## Mock data
- ~40 individual animals across ~10 lots. Fields per animal: `tagId` (e.g. "HCR-2417"), optional `eid` (15-digit RFID), breed, sex/class, birth date/age, estimated weight, frame score, body condition score (1–9), coat color, sire/dam (optional), vaccination & health records (dates, products), pregnancy status for females, weaned/preconditioned flags, notes, photos, `scanDate`, `scanConfidence` (%).
- Lots: title, class, head count, average weight, weight range, price per head AND equivalent $/cwt, pricing mode (Buy It Now / Make Offer / both), status (Available, Offer Pending, Sold), location, pickup window, list of tag IDs, video placeholder.

## Pages and features

### 1. Home (sales pitch to buyers, impressive to the rancher)
- Hero: "Ranch-direct cattle. Every animal tagged, scanned, and verified." Strong CTAs: "Browse Cattle" and "See How It Works."
- Live-looking stats strip: head available, lots listed, avg weight, buyers this month (mock).
- Mock **market price ticker** (feeder steers, fed cattle, cull cows in $/cwt with up/down arrows), clearly labeled "sample data."
- Featured lots carousel and a "How it works" 4-step section (Tag, Scan, List, Sell) with icons/animation.

### 2. Browse cattle (shop)
- Lot cards: image, LOT #, class badge, head count, avg weight, $/head + $/cwt, location, status badge, Buy Now / Make Offer buttons.
- Filters: class (steers, heifers, bred, pairs, bulls), breed, weight range slider, price range, head count, status. Sort by price, weight, newest. Search by tag ID or keyword. Grid/list toggle. Filter state reflected in the URL.

### 3. Lot detail page
- Photo gallery + video placeholder.
- Key specs, pricing ($/head, $/cwt, lot total), pickup info, seller contact (click-to-call).
- **Animal-by-animal table** of every tag in the lot (sortable), each row linking to that animal's passport.
- Weight distribution chart for the lot (recharts).
- Health & vaccination summary, verification badges.
- Buy It Now (add whole lot to cart) and Make an Offer (dialog: offer $/head, number of head if partial lots allowed, message). Offers save to the store and show as pending.
- Freight estimator: enter buyer ZIP or pick a state, get an estimated haul cost and miles (mock formula), plus a note on shrink.
- QR code for the lot and a "Share" / "Copy link" button.

### 4. Animal "Digital Passport" page (`/animal/:tagId`), the signature feature
- Looks like an official ID card/record: big tag ID, RFID, photos, every data field, health timeline (vertical timeline of vaccinations, treatments, weigh-ins), weight-gain chart over time, scan history with camera confidence %, QR code that links to this page.
- "Printable" view (print-friendly CSS) so the rancher can hand it to buyers.

### 5. "Chute Scan" live demo (`/scan`), the WOW moment
- A simulated camera tunnel: animated scene of cattle (SVG) walking through a chute one by one.
- As each animal passes: a "scanning" overlay/laser effect, a camera flash, then the tag ID is "read" and data fields fill in with a typing/counter animation (weight, frame, BCS, sex, color, confidence %).
- Each completed scan appends a row to a live CSV-style table below with a subtle highlight.
- Controls: Start / Pause / Reset, speed control, number of animals.
- At the end: "Create Lot from Scan" (auto-groups the scanned animals into a new draft lot with suggested title and price) and "Download CSV."
- Label clearly as "Simulation — connects to chute cameras in production."

### 6. Rancher Dashboard (`/dashboard`): the owner's private view (no auth, just a mock "Logged in as Owner" badge)
- Overview cards: total head, head listed, head sold, revenue (mock), open offers, avg $/cwt.
- Charts: inventory by class (bar), sales over time (line), herd weight distribution.
- **Herd inventory table**: every animal, searchable/filterable, inline edit, bulk select, and "Create lot from selected."
- **Offers inbox**: accept / counter / decline offers (updates lot status in the store).
- **CSV Import**: drag-and-drop a CSV of ear-tag data (provide a downloadable sample template). Preview rows, map columns, validate (flag duplicate tags, missing weights), then import into the herd.
- **Lot builder**: form to create/edit a lot. Pick animals, auto-calc avg weight/totals, set pricing mode, preview the public listing.

### 7. Syndication / "Send to Auction Partners" (`/dashboard/syndicate`), solves his real problem
- Select one or more lots.
- Choose partners from the list parsed from the attached PDF (searchable, filter by state, show city/state/phone). Also show marketplace "channels" as generic cards (e.g. Online auction marketplace, Video auction, Order buyer network) without using real company logos.
- Choose export format: Standard CSV, "Auction-ready CSV" (column-mapped), or a printable PDF-style lot sheet (print CSS).
- "Send" triggers a realistic animated progress flow (packaging data, sending to X partners, delivered) and logs it in a **Send History** table with timestamps and statuses (mock "Viewed" / "Interested" updates appear after a few seconds).
- Real CSV download must work.

### 8. Cart & Checkout (mock Stripe-style)
- Cart with lots, head counts, subtotal, estimated freight, deposit (e.g. 10%) due now, balance due on delivery/pickup.
- Checkout form (buyer name, operation name, phone, email, delivery address, pickup vs. delivery). Polished card-entry UI that clearly says "Demo — no real payment." Validate fields.
- Confirmation page with order number, summary, and next steps (inspection, health papers, loading date). Purchased lots become "Sold" across the site.

### 9. Supporting pages
- About the Ranch (story, family operation, photos placeholders, values).
- How It Works (for buyers and for sellers).
- FAQ (inspection, health papers, brand inspection, freight, payment, returns/disputes).
- Contact (form with success toast, click-to-call, map placeholder).

## Quality bar
- Every button and link works. No dead ends, no "coming soon." Use toasts (shadcn Sonner) for feedback.
- Empty states, loading skeletons, and error states where relevant.
- Accessible: semantic HTML, keyboard navigation, focus rings, alt text, good contrast in both themes.
- Clean folder structure (`components/`, `pages/`, `data/`, `store/`, `lib/`, `config/`). Reusable typed components. No unused code.
- Add a "Reset demo data" button in the dashboard settings.
- Write a short README: how to run, where to change ranch branding, where mock data lives, and which parts would need a backend later (auth, payments, real camera ingestion, real partner delivery).

## Build order
Work in phases and confirm each runs before moving on:
1. Setup, theming, layout, config, mock data
2. Browse, lot detail, animal passport
3. Chute Scan demo
4. Dashboard, CSV import, lot builder, offers
5. Syndication
6. Cart/checkout, supporting pages, final polish and responsive QA

Before starting, briefly summarize your plan and file structure, then begin Phase 1.
