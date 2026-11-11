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
          // Buy Beef is the default side; the cattle marketplace's home is /livestock.
          { index: true, ...page(() => import('@/pages/beef/BeefHomePage')) },
          { path: 'livestock', ...page(() => import('@/pages/HomePage')) },
          { path: 'beef', ...page(() => import('@/pages/beef/BeefBrowsePage')) },
          { path: 'beef/cut-sheet', ...page(() => import('@/pages/beef/CutSheetPage')) },
          { path: 'beef/cut-sheet/:sheetId', ...page(() => import('@/pages/beef/CutSheetPage')) },
          { path: 'beef/:tagId', ...page(() => import('@/pages/beef/BeefAnimalPage')) },
          { path: 'shop', ...page(() => import('@/pages/shop/ShopPage')) },
          { path: 'shop/boxes', ...page(() => import('@/pages/shop/BoxesPage')) },
          { path: 'shop/build-a-box', ...page(() => import('@/pages/shop/BuildBoxPage')) },
          { path: 'shop/ranch-box', ...page(() => import('@/pages/shop/RanchBoxPage')) },
          { path: 'shop/:productId', ...page(() => import('@/pages/shop/ProductPage')) },
          { path: 'gifts', ...page(() => import('@/pages/shop/GiftsPage')) },
          { path: 'ranch-goods', ...page(() => import('@/pages/goods/RanchGoodsPage')) },
          { path: 'soil', ...page(() => import('@/pages/soil/SoilPage')) },
          { path: 'soil/truckload', ...page(() => import('@/pages/soil/TruckloadPage')) },
          { path: 'soil/pro', ...page(() => import('@/pages/soil/ProAccountsPage')) },
          { path: 'soil/stores', ...page(() => import('@/pages/soil/StoresPage')) },
          { path: 'soil/:productId', ...page(() => import('@/pages/soil/SoilProductPage')) },
          { path: 'fuel', ...page(() => import('@/pages/fuel/FuelPage')) },
          { path: 'nothing-wasted', ...page(() => import('@/pages/goods/NothingWastedPage')) },
          { path: 'ranch-goods/wholesale', ...page(() => import('@/pages/goods/WholesalePage')) },
          { path: 'ranch-goods/boxes', ...page(() => import('@/pages/goods/GoodsBoxesPage')) },
          { path: 'ranch-goods/:goodsId', ...page(() => import('@/pages/goods/GoodsProductPage')) },
          { path: 'account/sign-in', ...page(() => import('@/pages/account/SignInPage')) },
          {
            path: 'account',
            ...page(() => import('@/components/layout/AccountLayout')),
            children: [
              { index: true, ...page(() => import('@/pages/account/OverviewPage')) },
              { path: 'orders', ...page(() => import('@/pages/account/OrdersPage')) },
              { path: 'shares', ...page(() => import('@/pages/account/SharesPage')) },
              { path: 'animals', ...page(() => import('@/pages/account/AnimalsPage')) },
              { path: 'cut-sheets', ...page(() => import('@/pages/account/CutSheetsPage')) },
              { path: 'ranch-box', ...page(() => import('@/pages/account/RanchBoxManagePage')) },
              { path: 'favorites', ...page(() => import('@/pages/account/FavoritesPage')) },
              { path: 'gift-cards', ...page(() => import('@/pages/account/GiftCardsPage')) },
              { path: 'addresses', ...page(() => import('@/pages/account/AddressesPage')) },
            ],
          },
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
              { path: 'pools', ...page(() => import('@/pages/dashboard/PoolsPage')) },
              { path: 'harvest', ...page(() => import('@/pages/dashboard/HarvestPage')) },
              { path: 'inventory', ...page(() => import('@/pages/dashboard/InventoryPage')) },
              { path: 'beef-sales', ...page(() => import('@/pages/dashboard/BeefAnalyticsPage')) },
              { path: 'live-vs-beef', ...page(() => import('@/pages/dashboard/ProfitPage')) },
              { path: 'hidden-revenue', ...page(() => import('@/pages/dashboard/HiddenRevenuePage')) },
              { path: 'byproducts', ...page(() => import('@/pages/dashboard/ByproductInventoryPage')) },
              { path: 'wholesale', ...page(() => import('@/pages/dashboard/WholesaleInboxPage')) },
              { path: 'compliance', ...page(() => import('@/pages/dashboard/CompliancePage')) },
              { path: 'manure-planner', ...page(() => import('@/pages/dashboard/ManurePlannerPage')) },
              { path: 'soil-fuel-compliance', ...page(() => import('@/pages/dashboard/SoilFuelCompliancePage')) },
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
