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
 * `min-h-svh` on the routed area keeps the footer below the fold while a page is loading, so it
 * does not sit in the middle of the viewport and then jump when content arrives.
 */
export default function App() {
  return (
    <div className="flex min-h-svh flex-col">
      <Header />
      <div className="min-h-svh">
        <Routes>
          <Route path="*" element={<ContentPage />} />
        </Routes>
      </div>
      <Footer />
    </div>
  )
}
