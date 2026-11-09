import { useEffect } from 'react'
import { ranch } from '@/config/ranch'

/** Sets the browser tab title, e.g. "Browse cattle | Heritage Creek Ranch". */
export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} | ${ranch.name}` : ranch.name
  }, [title])
}
