import { Monitor, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useResolvedTheme } from '@/lib/theme'
import { type ThemePreference, usePreferences } from '@/store/usePreferences'

const OPTIONS: { value: ThemePreference; label: string; short: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', short: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', short: 'Dark', icon: Moon },
  { value: 'system', label: 'Match device', short: 'Auto', icon: Monitor },
]

/** Header button with a light / dark / match-device menu. */
export function ThemeToggle() {
  const { theme, setTheme } = usePreferences()
  const resolved = useResolvedTheme()
  const Icon = resolved === 'dark' ? Moon : Sun

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Change light or dark mode">
          <Icon className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={theme} onValueChange={(v) => setTheme(v as ThemePreference)}>
          {OPTIONS.map(({ value, label, icon: ItemIcon }) => (
            <DropdownMenuRadioItem key={value} value={value} className="py-2.5 text-base">
              <ItemIcon className="size-4" />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Full-width segmented control for the mobile menu. */
export function ThemeSegmented() {
  const { theme, setTheme } = usePreferences()
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      value={theme}
      onValueChange={(v) => v && setTheme(v as ThemePreference)}
      aria-label="Appearance"
      className="w-full"
    >
      {OPTIONS.map(({ value, label, short, icon: Icon }) => (
        <ToggleGroupItem
          key={value}
          value={value}
          aria-label={label}
          className="h-12 flex-1 gap-2 text-base data-[state=on]:bg-secondary data-[state=on]:font-semibold data-[state=on]:text-secondary-foreground"
        >
          <Icon className="size-4" />
          {short}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
