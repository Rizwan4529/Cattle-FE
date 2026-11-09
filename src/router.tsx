import type { ComponentType } from 'react'
import { createBrowserRouter } from 'react-router'
import { AppLoading } from '@/components/layout/AppLoading'
import { RouteError } from '@/components/layout/RouteError'
import { SiteLayout } from '@/components/layout/SiteLayout'
import NotFoundPage from '@/pages/NotFoundPage'

/** Code-split each page so heavy pages (charts, scan demo) load only when visited. */
const page = (load: () => Promise<{ default: ComponentType }>) => ({
  lazy: async () => ({ Component: (await load()).default }),
})

export const router = createBrowserRouter([
  {
    element: <SiteLayout />,
    hydrateFallbackElement: <AppLoading />,
    children: [
      {
        errorElement: <RouteError />,
        children: [
          { index: true, ...page(() => import('@/pages/HomePage')) },
          { path: 'cattle', ...page(() => import('@/pages/BrowsePage')) },
          { path: 'lots/:lotId', ...page(() => import('@/pages/LotDetailPage')) },
          { path: 'animal/:tagId', ...page(() => import('@/pages/AnimalPassportPage')) },
          { path: 'scan', ...page(() => import('@/pages/ChuteScanPage')) },
          { path: 'dashboard', ...page(() => import('@/pages/DashboardPage')) },
          { path: 'dashboard/syndicate', ...page(() => import('@/pages/SyndicatePage')) },
          { path: 'dashboard/lots/new', ...page(() => import('@/pages/LotBuilderPage')) },
          { path: 'dashboard/lots/:lotId/edit', ...page(() => import('@/pages/LotBuilderPage')) },
          { path: 'cart', ...page(() => import('@/pages/CartPage')) },
          { path: 'checkout', ...page(() => import('@/pages/CheckoutPage')) },
          { path: 'order/:orderId', ...page(() => import('@/pages/OrderConfirmationPage')) },
          { path: 'about', ...page(() => import('@/pages/AboutPage')) },
          { path: 'how-it-works', ...page(() => import('@/pages/HowItWorksPage')) },
          { path: 'faq', ...page(() => import('@/pages/FaqPage')) },
          { path: 'contact', ...page(() => import('@/pages/ContactPage')) },
          { path: '*', Component: NotFoundPage },
        ],
      },
    ],
  },
])
