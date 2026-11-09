import { MotionConfig } from 'framer-motion'
import { RouterProvider } from 'react-router'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useThemeSync } from '@/lib/theme'
import { router } from '@/router'

export default function App() {
  useThemeSync()
  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider delayDuration={200}>
        <RouterProvider router={router} />
        <Toaster position="top-center" richColors closeButton />
      </TooltipProvider>
    </MotionConfig>
  )
}
