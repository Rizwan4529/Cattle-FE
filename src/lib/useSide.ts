import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { type Side, sideForPath } from '@/components/layout/nav'
import { usePreferences } from '@/store/usePreferences'

/**
 * Which side of the site the visitor is on. Beef and cattle pages set it;
 * shared pages (about, contact, cart) keep whichever side they came from.
 */
export function useSide(): Side {
  const { pathname } = useLocation()
  const fromPath = sideForPath(pathname)
  const remembered = usePreferences((s) => s.side)
  const setSide = usePreferences((s) => s.setSide)

  useEffect(() => {
    if (fromPath && fromPath !== remembered) setSide(fromPath)
  }, [fromPath, remembered, setSide])

  return fromPath ?? remembered
}
