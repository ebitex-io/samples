import { Route, Routes } from 'react-router'

import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { ContentPage } from '@/pages/ContentPage'
import { useSiteChrome } from '@/lib/siteChrome'

/**
 * The whole route table. One route, matching everything.
 *
 * This sample is greenfield, so every page is CMS-resolved from the first step -- there is never a
 * hard-coded `<Route path="/about">` to retire later. The chrome around those pages started as
 * plain arrays in code and moved into the CMS in step 12, which is the migration most readers
 * will actually face: almost nobody starts greenfield.
 *
 * The routed area grows to fill the viewport, so the footer sits at the bottom of a short page
 * rather than halfway up it. Keeping the footer *below* the fold while a page is still loading is
 * the loading skeleton's own job -- see ContentPage -- because that is where the jump would
 * otherwise come from.
 */
export default function App() {
  const { header, footer } = useSiteChrome()

  return (
    <div className="flex min-h-svh flex-col">
      <Header content={header} />
      <div className="flex-1">
        <Routes>
          <Route path="*" element={<ContentPage />} />
        </Routes>
      </div>
      <Footer content={footer} />
    </div>
  )
}
