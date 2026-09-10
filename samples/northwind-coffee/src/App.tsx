import { Route, Routes } from 'react-router'

import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { ContentPage } from '@/pages/ContentPage'

/**
 * The whole route table. One route, matching everything.
 *
 * This sample is greenfield, so every page is CMS-resolved from the first step -- there is never a
 * hard-coded `<Route path="/about">` to retire later. The chrome around those pages is the one
 * deliberate exception, and step 12 moves it into the CMS too.
 *
 * The routed area grows to fill the viewport, so the footer sits at the bottom of a short page
 * rather than halfway up it. Keeping the footer *below* the fold while a page is still loading is
 * the loading skeleton's own job -- see ContentPage -- because that is where the jump would
 * otherwise come from.
 */
export default function App() {
  return (
    <div className="flex min-h-svh flex-col">
      <Header />
      <div className="flex-1">
        <Routes>
          <Route path="*" element={<ContentPage />} />
        </Routes>
      </div>
      <Footer />
    </div>
  )
}
