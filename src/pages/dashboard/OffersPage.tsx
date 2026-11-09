import { OffersInbox } from '@/components/dashboard/OffersInbox'
import { usePageTitle } from '@/lib/usePageTitle'

export default function OffersPage() {
  usePageTitle('Offers')
  return <OffersInbox />
}
