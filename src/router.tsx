import type { ComponentType } from 'react'
import { createBrowserRouter, redirect } from 'react-router'
import { AppLoading } from '@/components/layout/AppLoading'
import { RouteError } from '@/components/layout/RouteError'
import { SiteLayout } from '@/components/layout/SiteLayout'
import NotFoundPage from '@/pages/NotFoundPage'

/** Code-split each page so heavy pages (charts, scan demo) load only when visited. */
const page = (load: () => Promise<{ default: ComponentType }>) => ({
  lazy: async () => ({ Component: (await load()).default }),
})

const OWNER_PAGES = ['herd', 'lots', 'offers', 'import', 'settings']

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
          {
            path: 'dashboard',
            ...page(() => import('@/components/layout/OwnerLayout')),
            children: [
              {
                index: true,
                // Old links used ?tab=offers etc.; send them to the page that replaced the tab.
                loader: ({ request }) => {
                  const tab = new URL(request.url).searchParams.get('tab')
                  return tab && OWNER_PAGES.includes(tab) ? redirect(`/dashboard/${tab}`) : null
                },
                ...page(() => import('@/pages/dashboard/OverviewPage')),
              },
              { path: 'herd', ...page(() => import('@/pages/dashboard/HerdPage')) },
              { path: 'lots', ...page(() => import('@/pages/dashboard/LotsPage')) },
              { path: 'offers', ...page(() => import('@/pages/dashboard/OffersPage')) },
              { path: 'import', ...page(() => import('@/pages/dashboard/ImportPage')) },
              { path: 'settings', ...page(() => import('@/pages/dashboard/SettingsPage')) },
              { path: 'syndicate', ...page(() => import('@/pages/SyndicatePage')) },
              { path: 'lots/new', ...page(() => import('@/pages/LotBuilderPage')) },
              { path: 'lots/:lotId/edit', ...page(() => import('@/pages/LotBuilderPage')) },
            ],
          },
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
