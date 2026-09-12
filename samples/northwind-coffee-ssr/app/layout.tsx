import type { ReactNode } from 'react'
import './globals.css'

export const metadata = { title: 'Northwind Coffee' }

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-svh flex-col">{children}</body>
    </html>
  )
}
