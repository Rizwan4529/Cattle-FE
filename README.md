# Heritage Creek Ranch — ranch-direct beef and cattle (demo)

A frontend-only sales demo for a cattle ranch. Every animal has an ear tag, a camera-chute scan record, and a page of its own. The site has two sides, switched with the **Buy Beef | Buy Cattle** tabs at the top of every page:

- **Buy Beef** (the home page): families claim a share of one animal they choose, fill out a cut sheet, or buy steaks, boxes, a Ranch Box subscription, and gifts in the Butcher Shop. Every share and pack traces back to an ear tag.
- **Buy Cattle** (`/livestock`): the livestock marketplace. Lots of cattle to buy outright or make an offer on, and tools for the owner to send lots to auction partners.

There is **no backend**. All data is mock data, and everything a visitor does (cart, orders, claims, cut sheets, offers, herd edits, imports, new lots, sends, account details) is saved in the browser's localStorage.

## Run it

Needs Node 20 or newer.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check and production build into dist/
npm run preview  # serve the production build
npm run lint
npm test         # unit tests (Vitest): beef math, cut sheets, shop, delivery, profit calculator, mock data
```

### Deploying

`dist/` is a static site that works on any static host. Every route is drawn by `index.html`, so the host must send unknown paths there, or reloading a page like `/cattle` returns 404. `vercel.json` does this for Vercel. On Netlify, add a `public/_redirects` file containing `/* /index.html 200`.

## A five-minute demo: Buy Beef

1. **Home** (`/`). The hero shows a real animal filling up. Every 20 to 40 seconds a neighbor claims a share and the meters move (switch this off in **Owner → Settings**).
2. **Claim your beef** (`/beef`). Filter by feed program, breed, finish date, or share size, or type "I want about 300 lb" into the helper. Open an animal for its live, hanging, and take-home weights, price by share, and beef timeline. Choose **Claim**, pick a size, and add it to the cart.
3. **Butcher Shop** (`/shop`). Shop by cut, open a product for its source animal, cooking guide, and reviews, then try **Build your own box** (15 lb unlocks 10% off) and the **Ranch Box**. **Gifts** has gift boxes, gift cards, and a corporate gifting form.
4. **Cart → Checkout.** Enter a ZIP like `65804` (local delivery) or `10001` (shipping), pick a pickup slot or delivery, try the promo code `WELCOME10`, and pay with `4242 4242 4242 4242`. The confirmation shows a timeline; claiming the last share of an animal locks in its harvest.
5. **Cut sheet.** From the order (or the animal page), click the carcass drawing to choose steaks, roasts, or ground for each section, start from a preset, save, print, or download CSV.
6. **Your account** (person icon). Orders, shares with live timelines, **My animals**, cut sheets, Ranch Box (skip, pause, change), favorites, gift cards, and addresses. Sign-in is a mock: any password works.
7. **Owner → Beef** in the dashboard sidebar: open a share pool, book a harvest and **Simulate a week passing**, export processor cut sheets, adjust packaged inventory, read beef sales, and compare **Sell live vs. sell as beef**.

## A five-minute demo: Buy Cattle

1. **Buy Cattle → Browse cattle.** Filter by class, weight, or price, or search an ear tag like `2417`.
2. **Open a lot**, then click any ear tag in its table to see that animal's record: shots, weight chart, camera scans, and a printable version.
3. **Chute scan** (`/scan`). Press Start and watch cattle walk through the camera tunnel. At the end, choose **Create lot from scan** or **Download CSV**.
4. **Owner dashboard** (`/dashboard`). Use the sidebar (the **Dashboard menu** button on phones):
   - **Overview:** sales and herd numbers.
   - **Herd:** edit a weight inline, or tick a few animals and choose **Create lot from selected**.
   - **Offers:** accept, counter, or decline.
   - **Import:** try **Try it with a sample file** to see column matching and validation.
   - **Lots:** edit a lot in the lot builder.
5. **Send to auction partners** (`/dashboard/syndicate`). Pick lots and sale barns, then send. Replies ("Viewed", "Interested") arrive over the next half minute.
6. **Buy now → Cart → Checkout.** Use the test card `4242 4242 4242 4242` with any future date. The lot shows as sold everywhere afterward.

**Owner → Settings → Reset demo data** puts everything back, on both sides.

## Beef prices and policies

Everything about how beef is priced and sold is in **`src/config/beef.ts`**:

- **Yield:** dressing % (hanging ÷ live, default 62%, allowed 60–65%) and take-home % (take-home ÷ live, default 40%, allowed 38–43%).
- **Price:** price per hanging lb ($7.10), feed-program multipliers, breed premiums, processing (itemized or included, $1.00/hanging lb plus a $95 kill fee split across shares), and the share deposit (25%).
- **Shares:** which sizes are sold (eighths are off by default, with a warning for the owner), pool deadline, and dry-aging days.
- **Feed programs:** names, descriptions, flavor notes, and marbling scores.
- **Delivery:** local delivery zones by ZIP prefix, pickup days and time slots, and frozen-shipping tiers.
- **Other:** promo codes, the "Know your animal" claims (only show what the ranch can stand behind), processor name, the guarantee, freezer sizing, and `sellByTheCut` (turn off to hide the Butcher Shop).

The math lives in `src/lib/yield.ts` (weights, share prices, $/take-home lb, the pound-to-share helper, freezer space, pool helpers) and is covered by unit tests.

## Rebrand the site

Everything brand-related is in **`src/config/ranch.ts`**:

- **Identity:** ranch name, brand-mark initials, tagline, owner and family name, year established, acres.
- **Contact:** phone, email, hours, address, and map coordinates (used for freight estimates).
- **Commerce:** the ear-tag prefix (`HCR`) and the checkout deposit rate.
- **Look:** heading and body fonts, and the full light and dark color palettes.

Colors are injected as CSS variables at startup (`src/lib/brand-theme.ts`), so every component, chart, and illustration picks them up. `src/index.css` only maps those variables into Tailwind; don't put colors there.

The browser-tab icon is a static file at `public/favicon.svg`. Update its letters and color when you rebrand. Some page copy (the About story, FAQ answers) mentions specifics such as the brand location; read through `src/pages/AboutPage.tsx` and `FaqPage.tsx` too.

## Where things live

| Folder | What's in it |
| --- | --- |
| `src/config/` | `ranch.ts`: branding, contact, and colors. `beef.ts`: beef prices, policies, delivery, promo codes |
| `src/data/` | Typed mock data: `animals.ts` (44 head), `lots.ts` (10 lots), `partners.ts` (28 sale barns from the PDF, plus marketplace channels), `market.ts` (sample prices and sales history), `offers.ts`, `geo.ts`, `types.ts` |
| `src/data/` (beef) | `beefTypes.ts`, `pools.ts` (share pools at every stage), `products.ts` (Butcher Shop packs, each tied to a harvested animal), `shop.ts` (cuts, bundles, Ranch Box plans, reviews), `beefFaq.ts`, `beefSales.ts` (sample beef sales) |
| `src/store/` | Zustand stores. `useRanchStore` holds the demo data (herd, lots, pools, products, cart, orders, cut sheets, account) and saves it to localStorage. `usePreferences` holds light/dark, which side of the site you're on, ZIP codes, and delivery choices. |
| `src/lib/` | Logic with no UI: lot stats, filters, freight, chute scan timing, CSV import and export, cart math, dashboard numbers. Beef: `yield.ts`, `cutSheet.ts`, `shop.ts`, `delivery.ts`, `useCheckoutSummary.ts`, `poolAdmin.ts`, `processorExport.ts`, `profit.ts`, `beefAnalytics.ts`. Tests sit next to them as `*.test.ts`. |
| `src/components/` | Grouped by area: `layout/`, `cattle/` (`CattleImage`, `EarTag`), `beef/` (fill meter, claim dialog, carcass diagram, `CutImage`, delivery choices), `shop/`, `lots/`, `lot/`, `animal/`, `scan/`, `dashboard/`, `syndicate/`, `cart/`, and `ui/` (shadcn/ui) |
| `src/pages/` | One file per route. Beef pages in `pages/beef/` and `pages/shop/`; customer account in `pages/account/` (shares `AccountLayout`); owner pages in `pages/dashboard/` (share `OwnerLayout`) |
| `reference/sample-csv/` | Sample files for the CSV import, with a README explaining each |

### Mock data notes

- **Fixed seed:** the herd is generated from a fixed seed, so it's identical on every load. Edit the groups at the top of `src/data/animals.ts` to change breeds, weights, or dates.
- **Calculated lot numbers:** a lot's head count, average weight, weight range, $/cwt, and total come from its animals (`src/lib/lots.ts`), never typed in. Edit an animal's weight and every listing updates.
- **Demo "today":** `DEMO_TODAY` in `src/data/animals.ts` (Nov 6, 2026). Ages, weaning days, and preconditioning are measured from it.
- **Beef animals:** 12 finished animals (`HCR-2690` to `HCR-2715`) are added at the end of the herd, so the original 44 head are unchanged. Three were harvested in September; the Butcher Shop beef comes from them.
- **Share pool dates** (deadlines, claims, harvest and aging days) are set relative to when the demo data is first created, so countdowns always make sense. **Reset demo data** starts them over.
- **Auction partners:** parsed from `reference/Cattle data 1.pdf`. Entries marked demo, test, or inactive were skipped, along with horse-only sales, events, entries without a phone number, and entries that reuse the demo phone line.

### Photos

`CattleImage` draws an illustrated animal tinted by coat color. To use real photos, add URLs to an animal's `photos` array. The component shows the photo instead, and nothing else changes.

## What a real launch would need

This demo fakes everything below. Each needs a backend:

- **Share pools for real buyers.** Claims are saved per browser, so every visitor sees their own copy of each fill meter. The live "Mike from Omaha just claimed…" activity is simulated.
- **Processor and fulfillment.** Harvest booking, processor cut-sheet export, shipping labels, delivery routes, and pickup slots are mock. Production needs the processor's schedule, real cold-chain shipping, and balance invoices from actual hanging weights.
- **Recurring billing and gift cards.** The Ranch Box doesn't charge again; gift cards and promo codes are checked only in the browser.
- **Inventory.** Butcher Shop stock is per browser; a real shop needs one shared count.
- **Selling by the cut** needs USDA- or state-inspected processing and labeling (`sellByTheCut` in `src/config/beef.ts`).

- **Accounts and sign-in.** The dashboard is open to anyone and shows a mock "Logged in as Owner" badge. Customer sign-in accepts any password and keeps the account in the browser.
- **Payments.** Checkout is a mock card form that checks the number's format and charges nothing. A real one needs a payment provider and held deposits.
- **Camera ingestion.** The chute scan is a simulation. Production needs the chute cameras to send tag reads, weights, and photos to a server, which would feed the same import code.
- **Partner delivery.** "Send to auction partners" makes real CSV files and a real printed lot sheet, but the sending and the "Viewed"/"Interested" replies are simulated. Real delivery needs email or partner APIs.
- **Shared data.** Everything is saved per browser. A real site needs a database so buyers and the owner see the same lots, offers, and orders, plus email notifications for offers and orders.
- **Live market prices.** The price ticker and the suggested $/cwt use sample numbers.
- **Messages.** The contact form shows a confirmation but doesn't send anything.
