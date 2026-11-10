import { beefConfig } from '@/config/beef'
import { ranch } from '@/config/ranch'

/** Questions families ask about buying beef. Shown on the FAQ page and previewed on the home page. */

export interface FaqTopic {
  id: string
  title: string
  questions: { q: string; a: string }[]
}

const pct = (n: number) => `${Math.round(n * 100)}%`
const deposit = pct(beefConfig.depositRate)

export const BEEF_FAQ: FaqTopic[] = [
  {
    id: 'shares',
    title: 'Beef shares',
    questions: [
      {
        q: 'How does buying a share work?',
        a: `Pick an animal, claim a whole, half, or quarter, and pay a ${deposit} deposit. When every share of that animal is claimed, we take it to ${beefConfig.processor.name}. It dry-ages ${beefConfig.dryAgeDays.min} to ${beefConfig.dryAgeDays.max} days, gets cut the way your cut sheet says, and is frozen for pickup or delivery.`,
      },
      {
        q: 'What do live, hanging, and take-home weight mean?',
        a: `Live weight is the animal on the scale. Hanging weight is the carcass after harvest, about ${pct(beefConfig.dressingPercent)} of live, still with bone and fat. Take-home is the wrapped beef in your freezer, usually ${pct(beefConfig.takeHomeRange[0])} to ${pct(beefConfig.takeHomeRange[1])} of live weight.`,
      },
      {
        q: 'Why is beef sold by the share?',
        a: 'The whole animal is harvested and cut at once. Selling it in even shares means every family gets a fair mix of steaks, roasts, and ground beef, not just the ground.',
      },
      {
        q: 'When do I pay the rest?',
        a: 'When your beef is ready. The balance is figured on the actual hanging weight from the processor, so you pay for exactly what your share weighs. Your account shows the final number as soon as the carcass is weighed.',
      },
      {
        q: 'What if the animal doesn’t fill by its deadline?',
        a: 'Nothing is harvested until every share is claimed. If the deadline passes, you get what you chose when you claimed: your deposit rolls over to the next animal, or it’s refunded in full.',
      },
      {
        q: 'How much freezer space do I need?',
        a: `About 1 cubic foot for every ${beefConfig.freezer.lbsPerCuFt.min} to ${beefConfig.freezer.lbsPerCuFt.max} lb of beef. A quarter fits in a 5 cubic foot chest freezer; a half needs about 9. The cart and cut sheet both have a freezer calculator.`,
      },
    ],
  },
  {
    id: 'raising',
    title: 'How it’s raised',
    questions: [
      {
        q: 'What’s the difference between grass-finished and grain-finished?',
        a: beefConfig.feedPrograms.map((p) => `${p.name}: ${p.flavor}`).join(' '),
      },
      {
        q: 'Do you use hormones or antibiotics?',
        a: `No added hormones, ever, and no routine antibiotics. If an animal is sick we treat it, it goes on its record with the product and date, and it isn’t sold until the withdrawal time has passed.`,
      },
      {
        q: 'Can I see the animal my beef came from?',
        a: `Yes. Every share and every pack is tied to an ear tag. Open the tag to see where it grazed, its shots, its weights, and its camera scans. Or call ${ranch.phone} and come see the herd.`,
      },
    ],
  },
  {
    id: 'delivery',
    title: 'Pickup, delivery, and shipping',
    questions: [
      {
        q: 'Where do I pick up?',
        a: `${beefConfig.delivery.pickup.place}, ${beefConfig.delivery.pickup.days.join(', ')}. Choose a time slot at checkout. Bring a cooler; a quarter fills about four.`,
      },
      {
        q: 'Do you deliver?',
        a: `Locally, yes: ${beefConfig.delivery.localZones.map((z) => z.name).join(', ')}. Enter your ZIP in the cart to see your delivery day and fee.`,
      },
      {
        q: 'Will shipped beef arrive frozen?',
        a: `${beefConfig.delivery.shipping.note} Shipping is free on Butcher Shop orders over $${beefConfig.delivery.shipping.freeOver}.`,
      },
    ],
  },
  {
    id: 'shop',
    title: 'Butcher Shop and gifts',
    questions: [
      {
        q: 'Is the Butcher Shop beef inspected?',
        a: `Yes. Everything sold by the cut is processed at ${beefConfig.processor.name}, ${beefConfig.processor.inspection}, and every pack is labeled with the ear tag of the animal it came from.`,
      },
      {
        q: 'Can I skip or pause the Ranch Box?',
        a: 'Any time, from your account. Skip a box, pause for a while, change the size, or cancel. No fees.',
      },
      {
        q: 'Do gift cards expire?',
        a: 'Never. They work on anything on the site: shares, cuts, boxes, and the Ranch Box.',
      },
      {
        q: 'What’s your guarantee?',
        a: beefConfig.guarantee.body,
      },
    ],
  },
]
