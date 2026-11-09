# Heritage Creek Ranch — ranch-direct cattle (demo)

A frontend-only sales demo for a cattle ranch. Every animal has an ear tag, a camera-chute scan record, and a page of its own. Animals are grouped into lots that buyers can buy outright or make an offer on, and the owner can send lots to auction partners as CSV or a printed lot sheet.

There is **no backend**. All data is mock data, and everything a visitor does (cart, orders, offers, herd edits, imports, new lots, sends) is saved in the browser's localStorage.

## Run it

Needs Node 20 or newer.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check and production build into dist/
npm run preview  # serve the production build
npm run lint
```

### Deploying

`dist/` is a static site that works on any static host. Every route is drawn by `index.html`, so the host must send unknown paths there, or reloading a page like `/cattle` returns 404. `vercel.json` does this for Vercel. On Netlify, add a `public/_redirects` file containing `/* /index.html 200`.

## A five-minute demo

1. **Home → Browse cattle.** Filter by class, weight, or price, or search an ear tag like `2417`.
2. **Open a lot**, then click any ear tag in its table to see that animal's record: shots, weight chart, camera scans, and a printable version.
3. **Chute scan** (`/scan`). Press Start and watch cattle walk through the camera tunnel. At the end, choose **Create lot from scan** or **Download CSV**.
4. **Owner dashboard** (`/dashboard`):
   - **Overview:** sales and herd numbers.
   - **Herd:** edit a weight inline, or tick a few animals and choose **Create lot from selected**.
   - **Offers:** accept, counter, or decline.
   - **Import:** try **Try it with a sample file** to see column matching and validation.
   - **Lots:** edit a lot in the lot builder.
5. **Send to auction partners** (`/dashboard/syndicate`). Pick lots and sale barns, then send. Replies ("Viewed", "Interested") arrive over the next half minute.
6. **Buy now → Cart → Checkout.** Use the test card `4242 4242 4242 4242` with any future date. The lot shows as sold everywhere afterward.

**Settings → Reset demo data** puts everything back.

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
| `src/config/` | `ranch.ts`: branding, contact, and colors |
| `src/data/` | Typed mock data: `animals.ts` (44 head), `lots.ts` (10 lots), `partners.ts` (28 sale barns from the PDF, plus marketplace channels), `market.ts` (sample prices and sales history), `offers.ts`, `geo.ts`, `types.ts` |
| `src/store/` | Zustand stores. `useRanchStore` holds the demo data and saves it to localStorage. `usePreferences` holds light/dark, the freight ZIP, and pickup or delivery. |
| `src/lib/` | Logic with no UI: lot stats, filters, freight, chute scan timing, CSV import and export, lot suggestions, cart math, dashboard numbers |
| `src/components/` | Grouped by area: `layout/`, `cattle/` (`CattleImage`, `EarTag`), `lots/`, `lot/`, `animal/`, `scan/`, `dashboard/`, `syndicate/`, `cart/`, and `ui/` (shadcn/ui) |
| `src/pages/` | One file per route |
| `reference/sample-csv/` | Sample files for the CSV import, with a README explaining each |

### Mock data notes

- **Fixed seed:** the herd is generated from a fixed seed, so it's identical on every load. Edit the groups at the top of `src/data/animals.ts` to change breeds, weights, or dates.
- **Calculated lot numbers:** a lot's head count, average weight, weight range, $/cwt, and total come from its animals (`src/lib/lots.ts`), never typed in. Edit an animal's weight and every listing updates.
- **Demo "today":** `DEMO_TODAY` in `src/data/animals.ts` (Nov 6, 2026). Ages, weaning days, and preconditioning are measured from it.
- **Auction partners:** parsed from `reference/Cattle data 1.pdf`. Entries marked demo, test, or inactive were skipped, along with horse-only sales, events, entries without a phone number, and entries that reuse the demo phone line.

### Photos

`CattleImage` draws an illustrated animal tinted by coat color. To use real photos, add URLs to an animal's `photos` array. The component shows the photo instead, and nothing else changes.

## What a real launch would need

This demo fakes everything below. Each needs a backend:

- **Accounts and sign-in.** The dashboard is open to anyone and shows a mock "Logged in as Owner" badge.
- **Payments.** Checkout is a mock card form that checks the number's format and charges nothing. A real one needs a payment provider and held deposits.
- **Camera ingestion.** The chute scan is a simulation. Production needs the chute cameras to send tag reads, weights, and photos to a server, which would feed the same import code.
- **Partner delivery.** "Send to auction partners" makes real CSV files and a real printed lot sheet, but the sending and the "Viewed"/"Interested" replies are simulated. Real delivery needs email or partner APIs.
- **Shared data.** Everything is saved per browser. A real site needs a database so buyers and the owner see the same lots, offers, and orders, plus email notifications for offers and orders.
- **Live market prices.** The price ticker and the suggested $/cwt use sample numbers.
- **Messages.** The contact form shows a confirmation but doesn't send anything.
