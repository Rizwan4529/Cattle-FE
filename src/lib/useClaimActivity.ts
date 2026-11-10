import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { usePreferences } from '@/store/usePreferences'
import { useRanchStore } from '@/store/useRanchStore'
import { shareNoun } from './beef'

const MIN_MS = 20_000
const MAX_MS = 40_000

/**
 * Demo activity on the beef pages: every 20–40 seconds a neighbor claims a
 * share ("Mike from Omaha just claimed a quarter of HCR-2708") and the fill
 * meters update. Switch it off under Owner → Settings.
 */
export function useClaimActivity() {
  const enabled = usePreferences((s) => s.claimActivity)
  const simulateClaim = useRanchStore((s) => s.simulateClaim)
  const navigate = useNavigate()

  useEffect(() => {
    if (!enabled) return
    let timer: number
    const schedule = () => {
      timer = window.setTimeout(
        () => {
          // Don't pile up claims in a background tab.
          if (document.visibilityState === 'visible') {
            const result = simulateClaim()
            if (result) {
              const { claim, pool } = result
              toast(`${claim.firstName} from ${claim.city} just claimed ${shareNoun(claim.size)} of ${pool.tagId}`, {
                description: 'Demo activity. Turn it off in Owner → Settings.',
                action: { label: 'See it', onClick: () => navigate(`/beef/${pool.tagId}`) },
              })
            }
          }
          schedule()
        },
        MIN_MS + Math.random() * (MAX_MS - MIN_MS),
      )
    }
    schedule()
    return () => window.clearTimeout(timer)
  }, [enabled, simulateClaim, navigate])
}
