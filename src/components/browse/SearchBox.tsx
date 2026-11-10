import { useEffect, useState } from 'react'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/** Search field that updates the URL a moment after typing stops. */
export function SearchBox({
  value,
  onChange,
  placeholder = 'Ear tag, breed, or keyword',
  label = 'Search lots by ear tag number, breed, or keyword',
}: {
  value: string
  onChange: (q: string) => void
  placeholder?: string
  label?: string
}) {
  const [text, setText] = useState(value)
  const [synced, setSynced] = useState(value)
  // Follow outside changes (e.g. "Clear all" or the Back button).
  if (synced !== value) {
    setSynced(value)
    if (text.trim() !== value) setText(value)
  }

  useEffect(() => {
    const next = text.trim()
    if (next === value) return
    const timer = setTimeout(() => onChange(next), 300)
    return () => clearTimeout(timer)
  }, [text, value, onChange])

  return (
    <div role="search" className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onChange(text.trim())}
        placeholder={placeholder}
        aria-label={label}
        className="h-13 pr-12 pl-11 text-lg [&::-webkit-search-cancel-button]:hidden"
      />
      {text && (
        <Button
          variant="ghost"
          size="icon-sm"
          className="absolute top-1/2 right-1.5 -translate-y-1/2"
          onClick={() => {
            setText('')
            onChange('')
          }}
          aria-label="Clear search"
        >
          <X />
        </Button>
      )}
    </div>
  )
}
