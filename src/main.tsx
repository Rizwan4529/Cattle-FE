import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/public-sans'
import '@fontsource-variable/rokkitt'
import './index.css'
import App from './App.tsx'
import { injectBrandTheme } from './lib/brand-theme'

injectBrandTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
