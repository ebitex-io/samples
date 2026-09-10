import { Route, Routes } from 'react-router'

import { ContentPage } from '@/pages/ContentPage'

/**
 * The whole route table. One route, matching everything.
 *
 * This sample is greenfield, so every page is CMS-resolved from the first step
 * -- there is never a hard-coded `<Route path="/about">` to retire later.
 */
export default function App() {
  return (
    <Routes>
      <Route path="*" element={<ContentPage />} />
    </Routes>
  )
}
