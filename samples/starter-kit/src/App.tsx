import { Route, Routes } from 'react-router'

import { ModeToggle } from '@/components/ModeToggle'
import { ContentPage } from '@/pages/ContentPage'

/** One route matching everything, and a corner colour-mode switch so both modes can be checked on a real page. */
export default function App() {
  return (
    <>
      <div className="fixed right-4 bottom-4 z-10">
        <ModeToggle />
      </div>
      <Routes>
        <Route path="*" element={<ContentPage />} />
      </Routes>
    </>
  )
}
