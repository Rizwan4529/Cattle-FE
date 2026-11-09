import { useNavigate } from 'react-router'
import { LotsOverview } from '@/components/dashboard/LotsOverview'
import { usePageTitle } from '@/lib/usePageTitle'

export default function LotsPage() {
  usePageTitle('Your lots')
  const navigate = useNavigate()
  return <LotsOverview onOpenOffers={() => navigate('/dashboard/offers')} />
}
