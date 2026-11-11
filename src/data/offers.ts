import type { Offer } from './types'

/** Offers already in the inbox when the demo starts. */
export const seedOffers: Offer[] = [
  {
    id: 'offer-1001',
    lotId: 'lot-106',
    buyerName: 'Dale Kessler',
    operation: 'Kessler Cattle Co.',
    phone: '(719) 555-0192',
    email: 'dale@kesslercattle.com',
    pricePerHead: 2425,
    headCount: 5,
    message: 'Can pick up the week of the 16th with my own trailer. Would like to see them first.',
    status: 'pending',
    createdAt: '2026-11-05T15:42:00',
  },
  {
    id: 'offer-1002',
    lotId: 'lot-103',
    buyerName: 'Ruth Brandt',
    operation: 'Brandt Family Farms',
    phone: '(970) 555-0163',
    email: 'ruthbrandt@farmmail.com',
    pricePerHead: 3450,
    headCount: 4,
    message: 'We are rebuilding after the drought. Would you take $3,450 for all four?',
    status: 'pending',
    createdAt: '2026-11-04T09:15:00',
  },
  {
    id: 'offer-1003',
    lotId: 'lot-101',
    buyerName: 'Marcus Hale',
    operation: 'Hale Order Buying',
    phone: '(620) 555-0117',
    pricePerHead: 2150,
    headCount: 6,
    status: 'declined',
    createdAt: '2026-11-03T18:05:00',
    respondedAt: '2026-11-04T07:30:00',
  },
]
