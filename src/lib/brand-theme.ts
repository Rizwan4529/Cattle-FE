import { ranch, type ThemeTokens } from '@/config/ranch'

/** primaryForeground → --primary-foreground, chart1 → --chart-1 */
function toCssVar(key: string) {
  return `--${key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`).replace(/(\d+)$/, '-$1')}`
}

function withSidebar(t: ThemeTokens): Record<string, string> {
  return {
    ...t,
    sidebar: t.card,
    sidebarForeground: t.cardForeground,
    sidebarPrimary: t.primary,
    sidebarPrimaryForeground: t.primaryForeground,
    sidebarAccent: t.accent,
    sidebarAccentForeground: t.accentForeground,
    sidebarBorder: t.border,
    sidebarRing: t.ring,
  }
}

function block(selector: string, tokens: Record<string, string>, extra = '') {
  const body = Object.entries(tokens)
    .map(([k, v]) => `${toCssVar(k)}:${v};`)
    .join('')
  return `${selector}{${body}${extra}}`
}

/**
 * Writes the palette and fonts from src/config/ranch.ts into a <style> tag as
 * CSS variables. Runs once before React renders, so there is no color flash.
 */
export function injectBrandTheme() {
  const { theme, fonts } = ranch
  const css = [
    block(
      ':root',
      withSidebar(theme.light),
      `--radius:${theme.radius};--brand-font-heading:${fonts.heading};--brand-font-body:${fonts.body};color-scheme:light;`,
    ),
    block('.dark', withSidebar(theme.dark), 'color-scheme:dark;'),
    // Printed documents previewed on screen (lot sheets) stay in the light palette, like paper.
    block('.dark .theme-paper', withSidebar(theme.light), 'color-scheme:light;'),
    // Paper is white: print in the light palette even when the screen is dark.
    `@media print{${block('.dark', withSidebar(theme.light), 'color-scheme:light;')}}`,
  ].join('\n')

  let el = document.getElementById('ranch-theme') as HTMLStyleElement | null
  if (!el) {
    el = document.createElement('style')
    el.id = 'ranch-theme'
    document.head.prepend(el)
  }
  el.textContent = css

  document.title = ranch.name
}
