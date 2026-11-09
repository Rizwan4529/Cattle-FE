import { HerdTable } from '@/components/dashboard/HerdTable'
import { usePageTitle } from '@/lib/usePageTitle'

export default function HerdPage() {
  usePageTitle('Herd inventory')
  return <HerdTable />
}
