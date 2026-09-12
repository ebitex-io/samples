import type { ReactNode } from 'react'
import './globals.css'
import { INSTANCE_ID } from '@/lib/content'

export const metadata = { title: 'Northwind Coffee' }

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/*
          Diagnostics, and the ONE place the client-identity claim can actually be checked from
          outside. The id is minted when the client is (lib/content.ts), so:

            curl -s http://localhost:3000/ | grep x-content-instance
            curl -s -X POST http://localhost:3000/api/revalidate

          must report the SAME value. This layout is a server component, so it renders in the page
          module graph; the route handler renders in its own. Those two disagreeing is precisely the
          failure `sharedContentClient` exists to prevent, and it is invisible from anywhere else --
          two calls to the revalidate route share one graph and always agree, pinned or not.

          Delete this in your own app. It is here because the sample is teaching the property.
        */}
        <meta name="x-content-instance" content={INSTANCE_ID} />
      </head>
      <body className="flex min-h-svh flex-col">{children}</body>
    </html>
  )
}
