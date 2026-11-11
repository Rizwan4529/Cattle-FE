import { useEffect } from 'react'
import { ranch } from '@/config/ranch'

/** Sets the browser tab title, e.g. "Browse cattle | CROWDER". */
export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} | ${ranch.name}` : ranch.name
  }, [title])
}
