/**
 * What a reader sees when the CMS says no page lives at this path.
 *
 * The real 404 is the headline claim of this sample -- a missing page is a status code here, not a
 * 200 carrying a "not found" component -- and until this file existed, the page behind that status
 * was Next own bare default: no words of ours, and nowhere to go next. A correct status served with
 * no way onward is a worse experience than the thing it is correct about.
 *
 * ---- One thing measured here that is worth knowing before you copy it ----
 *
 * On Next 16, a notFound() raised from a dynamic route serves a response whose body is **empty**.
 * Everything this file renders travels in the flight payload and is drawn by the browser. That is
 * true of the site chrome, of the heading, and of a hand-written placeholder with no imports at
 * all -- so it is the framework boundary, not anything about the code below, and there is no
 * arrangement of this file that changes it.
 *
 * Which is fine, and worth saying why rather than leaving as an apology: Next marks this response
 * `noindex`, so the one page in the site whose body a crawler should not read is the one page whose
 * body is not in the HTML. A person gets the full page. The claim the sample actually makes -- that
 * the *status* is real -- is unaffected, and that is the part a crawler acts on.
 *
 * ---- How to check any of this, because the obvious way is wrong ----
 *
 * `curl <url> | grep "some text"` finds text that lives only in the flight payload, and so reports
 * a page as rendered when its body is empty. Strip the script tags first and search what is left.
 * Several conclusions in the building of this file were wrong until that was fixed -- including,
 * twice, a conclusion about which component was at fault.
 */
import { headers } from 'next/headers'

import { loadSiteChrome } from '@/lib/siteChrome'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { DEFAULT_LOCALE } from '@/lib/locales'
import { pageAddressesFor } from '@/lib/pageAddressesQuery'

export default async function NotFound() {
  // Opts this route out of static prerendering. Every other route here is already dynamic because
  // resolving a page reads cookies; this one has nothing of its own, and a static prerender cannot
  // answer the useSearchParams() the header reaches through its locale switcher -- which fails the
  // build outright. The value is deliberately unused: it is the asking that matters.
  await headers()

  // The default locale, because a missing page resolved no node and so reported no locale -- and
  // this app does not read one off the URL, since that is the server's rule to apply. With no node
  // to anchor on, the switcher offers each language's front page.
  const [chrome, addresses] = await Promise.all([loadSiteChrome(DEFAULT_LOCALE), pageAddressesFor(DEFAULT_LOCALE)])

  return (
    <>
      <Header content={chrome.header} home={addresses.home} alternates={addresses.alternates} />
      <div className="flex-1">
        <main className="mx-auto max-w-2xl px-6 py-24 text-center">
          <p className="font-mono text-xs tracking-widest text-ink-muted uppercase">404</p>
          <h1 className="mt-3 font-display text-4xl text-ink sm:text-5xl">
            We could not find that page
          </h1>
          <p className="mt-4 text-lg text-ink-muted">
            It may have been moved, or the link that brought you here may be out of date.
          </p>
          <p className="mt-10">
            <a
              href="/"
              className="rounded-full border border-line px-5 py-2.5 text-sm text-ink hover:text-accent"
            >
              Back to the front page
            </a>
          </p>
        </main>
      </div>
      <Footer content={chrome.footer} />
    </>
  )
}
