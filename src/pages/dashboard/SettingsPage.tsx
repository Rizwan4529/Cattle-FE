import { DashboardSettings } from '@/components/dashboard/DashboardSettings'
import { usePageTitle } from '@/lib/usePageTitle'

export default function SettingsPage() {
  usePageTitle('Settings')
  return <DashboardSettings />
}
