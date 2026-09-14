import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { headers } from 'next/headers'
import './globals.css'
import { INSTANCE_ID } from '@/lib/content'
import { localeFrom } from '@/lib/locales'

/**
 * The site-wide defaults every page's own `generateMetadata` builds on.
 *
 * `metadataBase` is what lets a page return a *relative* canonical and og:image and have Next
 * resolve them to absolute URLs -- which is required, since a social scraper and a search engine
 * both need an absolute one. Behind a proxy this cannot be derived from the request (the socket's
 * host is not the site's), so it is configuration: `SITE_ORIGIN`, the same variable
 * `app/robots.ts` needs and for the same reason.
 *
 * `title.template` gives every page the site name after its own, and `title.default` covers
 * anything that sets none. Before this file's sibling `generateMetadata` existed, the default was
 * the only title on the site -- the same words on every page, which is what a crawler saw.
 */
export const metadata: Metadata = {
  metadataBase: process.env.SITE_ORIGIN ? new URL(process.env.SITE_ORIGIN) : undefined,
  title: { default: 'Northwind Coffee', template: '%s — Northwind Coffee' },
}

/**
 * `<html lang>`, and why it takes a header to set it.
 *
 * A root layout receives no `params` and no `searchParams` -- it is rendered once, above the route
 * that matched -- so it cannot read the locale out of the URL directly however that URL is shaped.
 * It *can* read request headers, and `middleware.ts` puts the locale in one, which is the seam.
 *
 * This is not decoration. `lang` is what tells a screen reader which voice to use and a translation
 * tool what it is looking at, and a document that serves French while declaring English is wrong in
 * a way no test notices (WCAG 3.1.1). It said `lang="en"` on every page of this site until the
 * locale moved into the path.
 */
export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = localeFrom((await headers()).get('x-locale') ?? undefined)

  return (
    <html lang={locale}>
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
