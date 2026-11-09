import type { AuctionPartner, MarketChannel } from './types'

/**
 * Auction partners parsed from reference/Cattle data 1.pdf.
 *
 * Selection: 28 sale barns weighted toward Missouri and neighboring states.
 * Skipped: entries marked demo, test, or inactive; horse-only sales; events;
 * entries without a phone number; and entries sharing the demo phone line.
 */
const raw: [name: string, city: string, state: string, phone: string, kind?: AuctionPartner['kind']][] = [
  ['Buffalo Livestock Mkt', 'Buffalo', 'MO', '(417) 345-8122'],
  ['Callaway Livestock', 'Kingdom City', 'MO', '(573) 642-7486'],
  ['Heartland Livestock Auction LLC', 'Nevada', 'MO', '(417) 327-6239'],
  ['Kingsville Livestock', 'Kingsville', 'MO', '(816) 597-3331'],
  ['Osborn Livestock Auction', 'Osborn', 'MO', '(816) 977-1693'],
  ['Scotland County', 'Memphis', 'MO', '(660) 465-7213'],
  ['Unionville Livestock', 'Unionville', 'MO', '(660) 947-2451'],
  ['Versailles Livestock Auction', 'Versailles', 'MO', '(573) 378-4000'],
  ['Wheeler Livestock', 'Osceola', 'MO', '(417) 646-8102'],
  ['Clay Center Livestock Sales', 'Clay Center', 'KS', '(785) 632-5566'],
  ['El Dorado LS', 'El Dorado', 'KS', '(316) 320-3212'],
  ['Farmers & Ranchers', 'Salina', 'KS', '(785) 825-0211'],
  ['Manhattan Commission Co.', 'Manhattan', 'KS', '(785) 776-4815'],
  ['Pratt Livestock', 'Pratt', 'KS', '(620) 672-5961'],
  ['Winfield Livestock Auction', 'Winfield', 'KS', '(620) 221-4364'],
  ['Bassett Livestock', 'Bassett', 'NE', '(888) 684-0584'],
  ['Columbus Sales', 'Columbus', 'NE', '(402) 564-3231'],
  ['North Platte Stockyards', 'North Platte', 'NE', '(308) 534-1200'],
  ['Valentine Livestock', 'Valentine', 'NE', '(402) 376-3611'],
  ['Bloomfield Livestock Mkt', 'Bloomfield', 'IA', '(641) 664-2435'],
  ['Creston Livestock', 'Creston', 'IA', '(641) 782-7025'],
  ['Tama Livestock', 'Tama', 'IA', '(641) 484-3465'],
  ['Waverly Sales Company', 'Waverly', 'IA', '(319) 352-2804'],
  ['Tulsa Stockyards', 'Tulsa', 'OK', '(918) 234-3438'],
  ['Southern Oklahoma LSA', 'Ada', 'OK', '(580) 436-5033'],
  ['Mitchell Livestock', 'Mitchell', 'SD', '(605) 996-6543'],
  ['Arkansas Cattle', 'Searcy', 'AR', '(501) 268-2471'],
  ['Cattle Country Video', 'Torrington', 'WY', '(307) 575-0018', 'video-auction'],
]

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

export const auctionPartners: AuctionPartner[] = raw.map(([name, city, state, phone, kind = 'sale-barn']) => ({
  id: slug(`${name}-${state}`),
  name,
  city,
  state,
  phone,
  kind,
}))

/** Generic marketplace channels (no real company names or logos). */
export const marketChannels: MarketChannel[] = [
  {
    id: 'online-marketplace',
    name: 'Online auction marketplace',
    description: 'Timed online listings that reach registered cattle buyers nationwide.',
    reach: '12,000+ registered buyers',
  },
  {
    id: 'video-auction',
    name: 'Video auction',
    description: 'Lots filmed on the ranch and sold on a scheduled video sale. Cattle ship after the sale.',
    reach: 'Weekly sales',
  },
  {
    id: 'order-buyers',
    name: 'Order buyer network',
    description: 'Regional order buyers sourcing cattle for feedyards and backgrounders.',
    reach: '40 buyers in 6 states',
  },
  {
    id: 'feedyard-list',
    name: 'Feedyard direct list',
    description: 'Email the lot sheet to feedyards within 400 miles of the ranch.',
    reach: '85 feedyards',
  },
]
