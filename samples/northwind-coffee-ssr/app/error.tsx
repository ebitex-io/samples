'use client'

import { useEffect } from 'react'

/**
 * What a reader sees when rendering a page throws -- in practice, when the Delivery API is
 * unreachable or answers something this app cannot use.
 *
 * ---- Why there is no header and no footer here, unlike `not-found.tsx` ----
 *
 * Not a limitation worth apologising for, a decision. This is the page that renders when talking
 * to the CMS has just failed; loading the site chrome would be another call to the same API, so
 * the most likely outcome is that it fails too and the reader gets an error page that cannot
 * render either. A recovery page has to be the one thing on the site that depends on nothing.
 *
 * (Next also requires an error boundary to be a client component, which means it could not reach
 * `lib/content.ts` even if that were the right call -- that module is behind `import 'server-only'`
 * precisely so the delivery key can never reach a browser. Two reasons pointing the same way, but
 * the first is the one that matters: a fallback fetched from the thing that failed is not a
 * fallback.)
 *
 * `reset()` re-renders the segment that threw. For a transient outage that is the whole fix, and
 * offering it costs one button -- which is a better answer than asking the reader to reload a page
 * whose URL they may not be able to see.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Whatever this app sends errors to in production. Logged rather than shown: `error.message` is
    // the server's own words, and a delivery failure's words can name internal hosts and ids.
    // `digest` is the handle Next gives you to find the real one in your server logs.
    console.error('page render failed', error)
  }, [error])

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '36rem', margin: '5rem auto', padding: '0 1.5rem' }}>
      <h1 style={{ fontSize: '1.75rem', margin: 0 }}>Something went wrong</h1>
      <p style={{ marginTop: '1rem', lineHeight: 1.6 }}>
        We could not load this page just now. It is usually temporary.
      </p>
      <p style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
        <button
          type="button"
          onClick={reset}
          style={{ padding: '0.6rem 1.25rem', borderRadius: '999px', cursor: 'pointer' }}
        >
          Try again
        </button>
        <a href="/" style={{ padding: '0.6rem 1.25rem' }}>
          Back to the front page
        </a>
      </p>
      {error.digest ? (
        <p style={{ marginTop: '2rem', fontSize: '0.8rem', opacity: 0.7 }}>
          Reference: <code>{error.digest}</code>
        </p>
      ) : null}
    </main>
  )
}
