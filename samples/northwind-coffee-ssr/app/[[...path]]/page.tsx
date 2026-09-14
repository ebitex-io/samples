import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { content } from '@/lib/content'
import { loadSiteChrome } from '@/lib/siteChrome'
import { ContentRoot } from '@/app/content-root'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { DEFAULT_LOCALE, localeFrom } from '@/lib/locales'
import { metadataFor } from '@/lib/pageMetadata'
import { resolveOptionsFor } from '@/lib/resolveOptions'

const SITE_NAME = 'Northwind Coffee'

type PageProps = {
  params: Promise<{ path?: string[] }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const pathFrom = (path: string[] | undefined) => '/' + (path ?? []).join('/')

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

  const [{ path }, query] = await Promise.all([params, searchParams])
  const options = await resolveOptionsFor(query)

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
    result = await content.resolveLocation(pathFrom(path), options)
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
  // `?lang=` is the exception and is kept: the French page is different content, not a
  // parameterized view of the English one.
  const locale = localeFrom(query.lang)
  const canonical = result.path + (locale === DEFAULT_LOCALE ? '' : `?lang=${locale}`)

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
    alternates: { canonical },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      title,
      description,
      url: canonical,
      locale,
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
  const options = await resolveOptionsFor(query)

  // Both awaited before anything is sent, so the chrome arrives with the document rather than a
  // moment after it. The static sample fetches its header and footer in an effect.
  const [result, chrome] = await Promise.all([
    content.resolveLocation(pathFrom(path), options),
    loadSiteChrome(options.locale),
  ])

  // The SDK reports a redirect and never performs one -- it does not know what router you use.
  // Server-side, "performing it" is simply the right status code.
  if (result.kind === 'redirect') {
    permanentRedirect(result.targetPath)
  }

  if (result.kind === 'notFound') {
    notFound()
  }

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
      <Header content={chrome.header} />
      <div className="flex-1">
        <ContentRoot result={result} />
      </div>
      <Footer content={chrome.footer} />
    </>
  )
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
