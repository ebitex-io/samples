import { Route, Routes } from 'react-router'

import { ThemeToggle } from '@/components/ThemeToggle'
import { ContentPage } from '@/pages/ContentPage'

/** One route matching everything, and a corner theme switch so both themes can be checked on a real page. */
export default function App() {
  return (
    <>
      <div className="fixed right-4 bottom-4 z-10">
        <ThemeToggle />
      </div>
      <Routes>
        <Route path="*" element={<ContentPage />} />
      </Routes>
    </>
  )
}
