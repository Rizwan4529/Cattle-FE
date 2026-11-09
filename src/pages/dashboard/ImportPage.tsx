import { useNavigate } from 'react-router'
import { CsvImport } from '@/components/dashboard/CsvImport'
import { usePageTitle } from '@/lib/usePageTitle'

export default function ImportPage() {
  usePageTitle('Import a spreadsheet')
  const navigate = useNavigate()
  return <CsvImport onShowHerd={() => navigate('/dashboard/herd')} />
}
