import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import '../globals.css'
import { content, INSTANCE_ID } from '@/lib/content'
import { DEFAULT_LOCALE } from '@/lib/locales'
import { requestPath, resolveOptions } from '@/lib/resolveOptions'

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

type LayoutProps = {
  children: ReactNode
  params: Promise<{ path?: string[] }>
}

/**
 * The root layout -- and why it lives in the catch-all segment rather than at `app/layout.tsx`.
 *
 * `<html lang>` has to say which language the page is in, and on this site the address says that:
 * `/fr/cafes` is French. A root layout at `app/layout.tsx` receives no `params` (it sits above the
 * route that matched), so it could not see the address, and this app used to have middleware put
 * the locale in a request header for it to read. That meant parsing the prefix in *two* places --
 * the middleware and the page -- in a site whose prefix rule is now the server's.
 *
 * Moved into `app/[[...path]]/`, it is still the root layout (the highest one, so it renders
 * `<html>`), and a layout inside a dynamic segment *does* receive that segment's params. So it asks
 * the one thing that knows: it resolves the location exactly as the page does, and declares the
 * locale `GET /path` reported. The SDK's request cache collapses this resolve with the page's and
 * `generateMetadata`'s -- same path, same options from the same helper -- so it costs no request.
 * (Next ignores dynamic param *values* when deciding whether a navigation crosses into a different
 * root layout, so moving here does not turn every link into a full page load.)
 *
 * This is not decoration. `lang` is what tells a screen reader which voice to use and a translation
 * tool what it is looking at, and a document that serves French while declaring English is wrong in
 * a way no test notices (WCAG 3.1.1).
 */
export default async function RootLayout({ children, params }: LayoutProps) {
  const locale = await documentLocale(params)

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

/**
 * The locale the server says this address is in, else the default.
 *
 * ---- Why every failure is swallowed here ----
 *
 * A layout's error is out of reach of its *own* segment's `error.tsx` -- that boundary sits inside
 * this layout, so it cannot catch what this layout throws. An outage thrown from here would be a
 * bare framework 500 with no recovery page at all. So a failure declares the default language and
 * lets the page make the same call a moment later, get the same error, and throw it into the
 * boundary built to explain it -- the same reasoning as the catch in `generateMetadata`.
 *
 * A redirect or a missing page reports no locale either, and gets the default for the same reason:
 * the page component issues the redirect or the 404, and exactly one place owns the status code.
 */
async function documentLocale(params: LayoutProps['params']): Promise<string> {
  if (!content) return DEFAULT_LOCALE

  try {
    const { path } = await params
    const result = await content.resolveLocation(requestPath(path), await resolveOptions())
    return result.kind === 'presentation' ? (result.locale ?? DEFAULT_LOCALE) : DEFAULT_LOCALE
  } catch {
    return DEFAULT_LOCALE
  }
}
