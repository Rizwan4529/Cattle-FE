import { ranch } from '@/config/ranch'
import { BrandMark } from './RanchBrand'

/** Shown for a moment while the first page's code loads. */
export function AppLoading() {
  return (
    <div role="status" className="grid min-h-svh place-items-center bg-background">
      <div className="flex flex-col items-center gap-3 text-primary">
        <BrandMark className="h-16 animate-pulse motion-reduce:animate-none" />
        <span className="sr-only">Loading {ranch.name}</span>
      </div>
    </div>
  )
}
