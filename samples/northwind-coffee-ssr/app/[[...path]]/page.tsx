import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { content } from '@/lib/content'
import { loadSiteChrome } from '@/lib/siteChrome'
import { ContentRoot } from '@/app/content-root'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { DEFAULT_LOCALE } from '@/lib/locales'
import { LocaleProvider } from '@/lib/localeContext'
import { pageAddressesFor } from '@/lib/pageAddressesQuery'
import { metadataFor } from '@/lib/pageMetadata'
import { requestPath, resolveOptions } from '@/lib/resolveOptions'
import { catalogueFiltersFrom, catalogueSignature, type CatalogueSeed } from '@/lib/catalogue'
import { fetchCataloguePage } from '@/lib/catalogueQuery'

const SITE_NAME = 'Northwind Coffee'

type PageProps = {
  params: Promise<{ path?: string[] }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/**
 * The page's `<head>`, written on the server, before any of it renders.
 *
 * ---- Where each value comes from ----
 *
 * The **title** comes from the CMS. A Contract declares which of its fields is the title
 * (`titleFieldPath`), the CMS resolves it at publish, freezes it, and `GET /path` hands it back --
 * so this app has no map from a page to its heading, and adding a new kind of page needs no change
 * here. `titleSource` says which step answered: `content` for an authored title, `name` for the
 * node's own editor label, which is the floor when no Contract in the chain declares a path.
 *
 * Everything else -- description, social image, structured data -- comes from `lib/pageMetadata.ts`,
 * because nothing declares those in the CMS. See that file for why the asymmetry is real rather
 * than an omission.
 *
 * ---- Why this could not have been a hook ----
 *
 * This function runs *before* the render tree exists. That is what makes it able to write a
 * `<head>` a crawler receives, and it is exactly why the `useDocumentMeta` effect this replaces
 * could not: an effect runs in a browser, after the HTML has already been sent.
 *
 * ---- It resolves the page, and costs nothing extra ----
 *
 * The resolve below is the same one the component makes, with the same options from the same
 * helper, so the SDK's request cache collapses the two into one `/path` request. `lib/resolveOptions.ts`
 * explains why identical options are load-bearing rather than tidy.
 */
export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  if (!content) return { title: { absolute: SITE_NAME } }

  const { path } = await params
  const options = await resolveOptions()

  // Metadata is decoration, and must never be what decides how a failure is presented.
  //
  // This function runs *before* the page component, so once it resolves the page it also becomes
  // the first thing an outage hits -- and an error thrown here is out of `app/error.tsx`'s reach
  // entirely (that boundary catches a render, and this is not one). Measured against a dead API:
  // without this catch the site answers a bare framework 500 with 96 bytes of body, and the
  // recovery page never renders.
  //
  // Swallowing it puts the failure back where it belongs. The page component makes the same call a
  // moment later, gets the same error, and throws it into the boundary built to explain it; the
  // reader gets a `<head>` carrying the site name instead of a description, which nobody will ever
  // notice, and a body that says what happened.
  let result
  try {
    result = await content.resolveLocation(requestPath(path), options)
  } catch {
    return { title: { absolute: SITE_NAME } }
  }

  // Deliberately issues neither the redirect nor the 404 itself. The page component does both, so
  // exactly one place owns the status code -- two callers issuing the same redirect stays correct
  // right up until one of them changes.
  if (result.kind === 'redirect') return {}
  if (result.kind === 'notFound') {
    return { title: 'Page not found', robots: { index: false, follow: true } }
  }

  const { description, image } = metadataFor(result.presentation)

  // The path the CMS says this content lives at, not the URL that was asked for -- so `?roast=`,
  // `?origin=` and `?q=`, which are this app's own state and never reach the CMS, are excluded by
  // construction rather than by an allow-list somebody has to keep up to date.
  //
  // Used exactly as delivered. The French page is different content rather than a parameterized
  // view of the English one and so has a canonical of its own -- and `result.path` already *is* it,
  // prefix and all, because the server composed it in this site's URL space. Note it is what the
  // CMS says rather than what was asked for, and for a page reached through a renamed slug the two
  // differ.
  const canonical = result.path

  // ---- Why there is no `hreflang` in this <head> ----
  //
  // A resolve answers for the locale it was asked about and nothing else: at `/coffees` it knows
  // `/coffees`, and it does not know that the French edition of this page is served at `/fr/cafes`.
  // Composing the French URL from what it *does* know gives `/fr/coffees` -- which is not a slow
  // path or a redirect, it is a **404**, because once a node carries a French slug its English one
  // is not an address in the French slot at all.
  //
  // The page *does* now ask for every locale's address, for the language switcher
  // (`lib/pageAddressesQuery.ts`), so the addresses themselves are no longer the obstacle. What is
  // left is the other half of an alternate: the claim that a French reader will find French there,
  // which is `TRANSLATED_PATHS`' question and is answered in exactly one place,
  // `app/sitemap.xml/route.ts`. Search engines accept a sitemap and `<link rel="alternate">` as
  // equal ways to say it, and one surface making the claim cannot disagree with a second.

  // `result.title ?? …` rather than a bare read: the member is optional because it can genuinely be
  // absent -- against an origin older than it, or on a result built locally rather than fetched.
  const title = result.title ?? SITE_NAME

  // The layout's `title.template` appends the site name to every page's own, which is right for
  // every page except the one whose title already *is* the site name -- the front page read
  // "Northwind Coffee — Northwind Coffee" until this line existed. `absolute` opts that one page
  // out of the template rather than dropping the template for all of them.
  const titled = title === SITE_NAME ? { absolute: title } : title

  return {
    title: titled,
    description,
    // No `languages` here, deliberately. See the note above `canonical`.
    alternates: { canonical },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      title,
      description,
      url: canonical,
      locale: result.locale ?? DEFAULT_LOCALE,
      ...(image ? { images: [{ url: image.url, alt: image.alt }] } : {}),
    },
    twitter: { card: image ? 'summary_large_image' : 'summary', title, description },
  }
}

/**
 * Every page on this site. There is no route table of pages -- the CMS decides what lives at a
 * path, and this server component asks it before any HTML is sent.
 *
 * Three things the static sample can only approximate become real HTTP here, which is the clearest
 * single illustration of what a server buys:
 *
 *   - a missing page is a real 404, not a 200 carrying a "not found" component;
 *   - a redirect is a real 308, not a client-side navigation after the wrong page has already
 *     painted;
 *   - the content is in the delivered HTML, so a crawler and a JS-disabled reader both get it.
 */
export default async function Page({ params, searchParams }: PageProps) {
  if (!content) {
    return <NotConfigured />
  }

  const [{ path }, query] = await Promise.all([params, searchParams])

  // Read while resolving, so the first bytes are already personalized. `ctx` is part of every
  // cache key, so one client shared by every request cannot serve one reader's variant to another
  // (docs/content-sdk.md §7). Passed per call rather than configured on the client, because a
  // context supplier takes no arguments and so cannot see whose request this is.
  //
  // Built by the same helper `generateMetadata` uses, which is what makes the two resolves one
  // request rather than two.
  const options = await resolveOptions()

  // The request path, exactly as it arrived -- `/fr/cafes/ethiopia-guji` included. The server reads
  // the locale off it; this app no longer splits it into a locale and "the path the CMS should be
  // asked for", because the site's prefix rule is the server's, not a copy kept here.
  const result = await content.resolveLocation(requestPath(path), options)

  // The SDK reports a redirect and never performs one -- it does not know what router you use.
  // Server-side, "performing it" is simply the right status code.
  if (result.kind === 'redirect') {
    // As delivered: the server composed the target in this site's URL space, so a French reader
    // following a renamed slug stays in French with nothing added here. It is also how `/en/about`
    // becomes `/about` -- the default locale is bare on this site, and the server says so with a
    // redirect rather than serving one page at two addresses.
    permanentRedirect(result.targetPath)
  }

  if (result.kind === 'notFound') {
    notFound()
  }

  // The locale the server says this address is in. Everything below that has no address of its
  // own -- the chrome (a Component read by external id), the catalogue query, the switcher's
  // lookups -- is asked in it explicitly, which is legal: only an *address* carries a locale.
  const locale = result.locale ?? DEFAULT_LOCALE

  // All awaited before anything is sent, so the chrome arrives with the document rather than a
  // moment after it (the static sample fetches its header and footer in an effect). They wait for
  // the resolve, because they need the locale it reported; the chrome is memoized per process, so
  // that ordering costs nothing after the first request.
  const [chrome, addresses, catalogue] = await Promise.all([
    loadSiteChrome(locale),
    pageAddressesFor(locale, { nodeId: result.nodeId, siteRootNodeId: result.site.rootNodeId }),
    // The catalogue's first page, resolved here so it is in the delivered HTML (see `catalogueSeedFor`).
    catalogueSeedFor(result.presentation, query, locale),
  ])

  // Structured data, from the same map that produced the description. It is rendered here rather
  // than returned from `generateMetadata` because Next's `Metadata` object has no slot for JSON-LD
  // -- it is a script element, not a meta tag. The resolve is already cached, so reading the
  // envelope again costs nothing.
  const { jsonLd } = metadataFor(result.presentation)

  return (
    <>
      {jsonLd ? (
        <script
          type="application/ld+json"
          // Serialized by us from resolved content, never from a string an author typed, and
          // escaped so a `</script>` inside a value cannot close the element early.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({ '@context': 'https://schema.org', ...jsonLd }).replace(/</g, '\\u003c'),
          }}
        />
      ) : null}
      {/*
        The locale the server reported, for the client components below that need it -- the
        switcher's active state, the catalogue grid's own queries. Provided rather than read back
        off the URL, because parsing the address is the server's job now.
      */}
      <LocaleProvider locale={locale}>
        <Header content={chrome.header} home={addresses.home} alternates={addresses.alternates} />
        <div className="flex-1">
          <ContentRoot result={result} catalogue={catalogue} />
        </div>
        <Footer content={chrome.footer} />
      </LocaleProvider>
    </>
  )
}


/**
 * The catalogue grid's first page, fetched before any HTML is sent.
 *
 * ---- Why the *page* does this, and not the component that needs it ----
 *
 * `CoffeeGrid` is a client component, several layers below `app/content-root.tsx`'s `'use client'`
 * boundary, and a client component cannot `await`. So there is no server component sitting where
 * the data is needed — the only place on this page that can fetch is the top.
 *
 * That is the real cost of data-fetching below a client boundary, and it is worth naming rather
 * than hiding: **a server prefetch for a component further down has to be arranged up here, which
 * means this file has to know that this kind of page wants it.** The alternative is a protocol for
 * renderers to declare their data requirements, which is a framework, and this is a sample.
 *
 * Everything *authored* renders server-side with none of this, because it needs no data beyond the
 * document already resolved above. The grid is the one thing on the site that is a query.
 *
 * ---- Keyed by Template, unlike `lib/pageMetadata.ts` ----
 *
 * That file keys on the Contract, deliberately, because a description is a property of what the
 * content *is*. This is the opposite question: "does the thing rendered here need data fetched?"
 * is a property of how it is *rendered*, which is what a Template names — the same key the renderer
 * registry dispatches on.
 *
 * A failure is swallowed on purpose. The grid falls back to fetching for itself, which is exactly
 * what it did before this existed, so a catalogue query that is down costs the first paint and
 * never the page.
 */
async function catalogueSeedFor(
  envelope: Parameters<typeof metadataFor>[0],
  query: Record<string, string | string[] | undefined>,
  locale: string,
): Promise<CatalogueSeed | undefined> {
  if (envelope?.template?.externalId !== 'coffee-index') return undefined

  // The same declared filters the browser would have sent, read from the URL it was given.
  const filters = catalogueFiltersFrom(query)

  try {
    const page = await fetchCataloguePage({ filters, locale })
    if (!page.facets) return undefined

    return {
      items: page.items,
      nextCursor: page.nextCursor,
      facets: page.facets,
      // The question this answers. The grid compares it against what is being asked at render time
      // and re-fetches only when they differ, which is what stops the prefetch being discarded.
      signature: catalogueSignature(filters, locale),
    }
  } catch (error) {
    console.error('catalogue prefetch failed; the grid will fetch for itself', error)
    return undefined
  }
}

/**
 * The normal state of a fresh clone. "You have not configured this yet" is a different message from
 * "that page does not exist", and conflating them wastes the reader's afternoon.
 */
function NotConfigured() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '40rem', margin: '4rem auto', padding: '0 1.5rem' }}>
      <h1>Not configured yet</h1>
      <p>
        Copy <code>.env.example</code> to <code>.env.local</code> and set <code>CONTENT_DELIVERY_KEY</code> to a
        delivery key from your own ebitex organization. See this sample&rsquo;s README.
      </p>
    </main>
  )
}
