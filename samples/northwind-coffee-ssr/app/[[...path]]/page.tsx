import { cookies } from 'next/headers'
import { notFound, permanentRedirect } from 'next/navigation'
import { content } from '@/lib/content'
import { loadSiteChrome } from '@/lib/siteChrome'
import { ContentRoot } from '@/app/content-root'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { localeFrom } from '@/lib/locales'
import { BUYER_COOKIE, contextFor, parseBuyerType } from '@/lib/buyerType'

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
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ path?: string[] }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  if (!content) {
    return <NotConfigured />
  }

  const [{ path }, query, cookieStore] = await Promise.all([params, searchParams, cookies()])
  const locale = localeFrom(query.lang)

  // Read while resolving, so the first bytes are already personalized. `ctx` is part of every
  // cache key, so one client shared by every request cannot serve one reader's variant to another
  // (docs/content-sdk.md §7). Passed per call rather than configured on the client, because a
  // context supplier takes no arguments and so cannot see whose request this is.
  const buyerType = parseBuyerType(cookieStore.get(BUYER_COOKIE)?.value)

  // Both awaited before anything is sent, so the chrome arrives with the document rather than a
  // moment after it. The static sample fetches its header and footer in an effect.
  const [result, chrome] = await Promise.all([
    content.resolveLocation('/' + (path ?? []).join('/'), { locale, context: contextFor(buyerType) }),
    loadSiteChrome(locale),
  ])

  // The SDK reports a redirect and never performs one -- it does not know what router you use.
  // Server-side, "performing it" is simply the right status code.
  if (result.kind === 'redirect') {
    permanentRedirect(result.targetPath)
  }

  if (result.kind === 'notFound') {
    notFound()
  }

  return (
    <>
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
