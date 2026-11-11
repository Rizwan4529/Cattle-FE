# CROWDER — every part of the ranch, put to work (demo)

A frontend-only sales demo for **CROWDER**, the Farrell family's cattle ranch in Colorado. Every animal has an ear tag, a camera-chute scan record, and a page of its own. The site has two sides, switched with the **Buy Beef | Buy Cattle** tabs at the top of every page:

- **Buy Beef** (the home page): families claim a share of one animal they choose, fill out a cut sheet, or buy steaks, boxes, a Ranch Box subscription, and gifts in the Butcher Shop. Every share and pack traces back to an ear tag.
- **Ranch Goods** (`/ranch-goods`, under Buy Beef): everything else from the animal (tallow, bones, dog chews, hides, horn, garden meal). One-of-a-kind hides and horns link to the exact animal they came from. The owner dashboard shows the money currently left with the processor.
- **Buy Cattle** (`/livestock`): the livestock marketplace. Lots of cattle to buy outright or make an offer on, and tools for the owner to send lots to auction partners.

There is **no backend**. All data is mock data, and everything a visitor does (cart, orders, claims, cut sheets, offers, herd edits, imports, new lots, sends, account details, wholesale inquiries, byproduct records) is saved in the browser's localStorage.

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
4. **Cart → Checkout.** Enter a ZIP like `80205` (local delivery) or `10001` (shipping), pick a pickup slot or delivery, try the promo code `WELCOME10`, and pay with `4242 4242 4242 4242`. The confirmation shows a timeline; claiming the last share of an animal locks in its harvest.
5. **Cut sheet.** From the order (or the animal page), click the carcass drawing to choose steaks, roasts, or ground for each section, start from a preset, save, print, or download CSV.
6. **Your account** (person icon). Orders, shares with live timelines, **My animals**, cut sheets, Ranch Box (skip, pause, change), favorites, gift cards, and addresses. Sign-in is a mock: any password works.
7. **Owner → Beef** in the dashboard sidebar: open a share pool, book a harvest and **Simulate a week passing**, export processor cut sheets, adjust packaged inventory, read beef sales, and compare **Sell live vs. sell as beef**.

## A five-minute demo: Ranch Goods

1. **Ranch Goods** (`/ranch-goods`). Tap a category chip (they stay pinned on phones), search `bully` or an ear tag like `CRW-2678`, or filter by use and price. **Add** turns into a − / + stepper once an item is in the cart.
2. **Open a hide rug** (for example the cream Charolais rug). It names the exact animal; tap the tag for its passport, which lists everything made from that animal. Buy it and it shows as **Sold** for good.
3. **Volume pricing.** Add 20 lb of rendered tallow: the cart applies 20% off. **Makers & Wholesale** (`/ranch-goods/wholesale`) has the price table and an inquiry form.
4. **Boxes** (`/ranch-goods/boxes`): the Monthly Dog Chew Box and Bone Broth Box use the same subscription system as the Ranch Box (manage them under **Your account → Subscriptions**).
5. **Nothing wasted** (`/nothing-wasted`, also on the home page). Tap any part of the animal to see what it becomes and what's for sale. The cut-sheet builder has the same drawing under **Nose to tail**.
6. **Claiming a share** now asks the buyer to agree that the ranch keeps the byproducts they don't ask for on their cut sheet. Cross-sells appear on Butcher Shop pages ("Goes with your ribeye", "Treat the pup") and in the cart.
7. **Owner → Ranch Goods** in the dashboard sidebar:
   - **Hidden revenue:** sell live vs. beef vs. beef + Ranch Goods, every yield and price editable, a "back from the processor" slider per part, and money left on the table each year.
   - **Byproduct inventory:** record what came back per animal (what's missing shows in red), then turn raw fat or bones into stock.
   - **Wholesale inquiries:** reply to inquiries or mark them handled.
   - **Compliance checklist:** visible to the owner only.

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

## Ranch Goods settings

Everything about byproducts is in **`src/config/byproducts.ts`**:

- **Categories:** name, description, `enabled` (off hides the category from the store), and compliance flags (`requiresInspection`, `requiresFeedRegistration`, `requiresFertilizerRegistration`). A product can override its category's flags (tallow soap isn't food). Shoppers never see these; the owner's checklist does.
- **Per-part yields and prices:** for each part (hide, horns, hooves, fat, bones, organs, tail, tendons, ears, trachea, pizzle): raw amount per animal, how much sellable product that makes, sale price, the cost to make it sellable, and how much the processor returns today.
  - **⚠ These are placeholder estimates.** Sale prices come from the rancher's byproduct mockup; the yields and costs are rough figures for a 1,300 lb steer. Confirm them with the processor and tannery, then set `estimatesConfirmed: true` to drop the "Estimate" labels.
  - The owner can also type their own numbers on the Hidden revenue page; those are saved in the browser.
- **Volume tiers** (1–4 list, 5–19 10% off, 20+ 20% off), the share-agreement wording (`rights`), and the shopper footer note.

The catalog (seeded from the mockup), subscription boxes, cross-sell lists, and conversion recipes are in `src/data/goods.ts`.

## Rebrand the site

Everything brand-related is in **`src/config/ranch.ts`**:

- **Identity:** ranch name (`CROWDER`), brand-mark initials, tagline, owner (`Farrell`) and family name, year established, acres.
- **About Farrell story** (`story`): the lede, the four story points (family operation, the land, all natural, his earlier organic fertilizer business), his quote, and the About-page timeline. Shown on the About page, in Meet the Rancher on the home page, and on the Buy Cattle home page. **⚠ Placeholder copy**: confirm every line and year with Farrell, then set `story.confirmed: true` (the owner's Settings page shows which it is).
- **Brand values** (`values.allNatural`): the "All Natural" badge and wording. Set `enabled: false` or reword it until the owner confirms what they can claim.
- **Contact:** phone, email, hours, address, and map coordinates (used for freight estimates). The Colorado address, phone, and email are placeholders.
- **Commerce:** the ear-tag prefix (`CRW`) and the checkout deposit rate.
- **Look:** heading and body fonts, and the full light and dark color palettes.

Colors are injected as CSS variables at startup (`src/lib/brand-theme.ts`), so every component, chart, and illustration picks them up. `src/index.css` only maps those variables into Tailwind; don't put colors there.

The browser-tab icon is a static file at `public/favicon.svg`. Update its letters and color when you rebrand. Some page copy (FAQ answers) mentions specifics such as the brand location; read through `FaqPage.tsx` too. Local delivery zones and the processor are in `src/config/beef.ts`; mock buyers, reviews, and inquiries (in `src/data/`) use Colorado towns.

## Where things live

| Folder | What's in it |
| --- | --- |
| `src/config/` | `ranch.ts`: branding, contact, and colors. `beef.ts`: beef prices, policies, delivery, promo codes |
| `src/data/` | Typed mock data: `animals.ts` (44 head), `lots.ts` (10 lots), `partners.ts` (28 sale barns from the PDF, plus marketplace channels), `market.ts` (sample prices and sales history), `offers.ts`, `geo.ts`, `types.ts` |
| `src/data/` (beef) | `beefTypes.ts`, `pools.ts` (share pools at every stage), `products.ts` (Butcher Shop packs, each tied to a harvested animal), `shop.ts` (cuts, bundles, Ranch Box plans, reviews), `beefFaq.ts`, `beefSales.ts` (sample beef sales) |
| `src/data/` (Ranch Goods) | `goodsTypes.ts`, `goods.ts` (catalog, what came back from each harvested animal, conversion recipes and batches, subscription boxes, cross-sells, wholesale inquiries) |
| `src/store/` | Zustand stores. `useRanchStore` holds the demo data (herd, lots, pools, products, cart, orders, cut sheets, account) and saves it to localStorage. `usePreferences` holds light/dark, which side of the site you're on, ZIP codes, and delivery choices. |
| `src/lib/` | Logic with no UI: lot stats, filters, freight, chute scan timing, CSV import and export, cart math, dashboard numbers. Beef: `yield.ts`, `cutSheet.ts`, `shop.ts`, `delivery.ts`, `useCheckoutSummary.ts`, `poolAdmin.ts`, `processorExport.ts`, `profit.ts`, `beefAnalytics.ts`. Ranch Goods: `byproducts.ts` (tier prices, compliance, value per animal, what share buyers' extras take, what wasn't recovered, herd projection, storefront filters). Tests sit next to them as `*.test.ts`. |
| `src/components/` | Grouped by area: `layout/`, `cattle/` (`CattleImage`, `EarTag`), `beef/` (fill meter, claim dialog, carcass diagram, `CutImage`, delivery choices), `goods/` (`GoodsImage`, cards, cross-sells, the Whole Animal diagram), `shop/`, `lots/`, `lot/`, `animal/`, `scan/`, `dashboard/`, `syndicate/`, `cart/`, and `ui/` (shadcn/ui) |
| `src/pages/` | One file per route. Beef pages in `pages/beef/` and `pages/shop/`; Ranch Goods in `pages/goods/`; customer account in `pages/account/` (shares `AccountLayout`); owner pages in `pages/dashboard/` (share `OwnerLayout`) |
| `reference/sample-csv/` | Sample files for the CSV import, with a README explaining each |

### Mock data notes

- **Fixed seed:** the herd is generated from a fixed seed, so it's identical on every load. Edit the groups at the top of `src/data/animals.ts` to change breeds, weights, or dates.
- **Calculated lot numbers:** a lot's head count, average weight, weight range, $/cwt, and total come from its animals (`src/lib/lots.ts`), never typed in. Edit an animal's weight and every listing updates.
- **Demo "today":** `DEMO_TODAY` in `src/data/animals.ts` (Nov 6, 2026). Ages, weaning days, and preconditioning are measured from it.
- **Beef animals:** 12 finished animals (`CRW-2690` to `CRW-2715`) are added at the end of the herd, so the original 44 head are unchanged. Three were harvested in September; the Butcher Shop beef comes from them.
- **Ranch Goods animals:** three more harvested animals (`CRW-2672` horned Hereford, `CRW-2678` horned Charolais cross, `CRW-2683` Red Angus heifer, harvested in August) carry the hide rugs and horns, because Angus are naturally polled. `Animal.horned` marks horned animals.
- **Share pool dates** (deadlines, claims, harvest and aging days) are set relative to when the demo data is first created, so countdowns always make sense. **Reset demo data** starts them over.
- **Auction partners:** parsed from `reference/Cattle data 1.pdf`. Entries marked demo, test, or inactive were skipped, along with horse-only sales, events, entries without a phone number, and entries that reuse the demo phone line.

### Photos

`CattleImage` draws an illustrated animal tinted by coat color. To use real photos, add URLs to an animal's `photos` array. The component shows the photo instead, and nothing else changes.

## What a real launch would need

This demo fakes everything below. Each needs a backend:

- **Share pools for real buyers.** Claims are saved per browser, so every visitor sees their own copy of each fill meter. The live "Mike from Omaha just claimed…" activity is simulated.
- **Processor and fulfillment.** Harvest booking, processor cut-sheet export, shipping labels, delivery routes, and pickup slots are mock. Production needs the processor's schedule, real cold-chain shipping, and balance invoices from actual hanging weights.
- **Recurring billing and gift cards.** The Ranch Box doesn't charge again; gift cards and promo codes are checked only in the browser.
- **Inventory.** Butcher Shop and Ranch Goods stock is per browser; a real shop needs one shared count, so a one-of-a-kind hide can't sell twice.
- **Ranch Goods compliance.** Edible items need inspected processing and labels, pet chews need state feed registration, and garden meal needs fertilizer registration. The checklist tracks this but can't do it. Byproduct yields and prices are placeholders until the rancher confirms them.
- **Wholesale replies.** Replies are saved in the browser, not emailed.
- **Selling by the cut** needs USDA- or state-inspected processing and labeling (`sellByTheCut` in `src/config/beef.ts`).

- **Accounts and sign-in.** The dashboard is open to anyone and shows a mock "Logged in as Owner" badge. Customer sign-in accepts any password and keeps the account in the browser.
- **Payments.** Checkout is a mock card form that checks the number's format and charges nothing. A real one needs a payment provider and held deposits.
- **Camera ingestion.** The chute scan is a simulation. Production needs the chute cameras to send tag reads, weights, and photos to a server, which would feed the same import code.
- **Partner delivery.** "Send to auction partners" makes real CSV files and a real printed lot sheet, but the sending and the "Viewed"/"Interested" replies are simulated. Real delivery needs email or partner APIs.
- **Shared data.** Everything is saved per browser. A real site needs a database so buyers and the owner see the same lots, offers, and orders, plus email notifications for offers and orders.
- **Live market prices.** The price ticker and the suggested $/cwt use sample numbers.
- **Messages.** The contact form shows a confirmation but doesn't send anything.
