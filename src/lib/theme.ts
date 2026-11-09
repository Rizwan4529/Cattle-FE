import { useEffect, useSyncExternalStore } from 'react'
import { usePreferences } from '@/store/usePreferences'

const query = '(prefers-color-scheme: dark)'

function subscribe(callback: () => void) {
  const mq = window.matchMedia(query)
  mq.addEventListener('change', callback)
  return () => mq.removeEventListener('change', callback)
}

const systemPrefersDark = () => window.matchMedia(query).matches

/** The theme actually in use: the saved choice, or the device setting for "system". */
export function useResolvedTheme(): 'light' | 'dark' {
  const theme = usePreferences((s) => s.theme)
  const systemDark = useSyncExternalStore(subscribe, systemPrefersDark)
  if (theme === 'system') return systemDark ? 'dark' : 'light'
  return theme
}

/** Keeps the `dark` class on <html> in sync with the preference. Mount once. */
export function useThemeSync() {
  const resolved = useResolvedTheme()
  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolved === 'dark')
  }, [resolved])
}
