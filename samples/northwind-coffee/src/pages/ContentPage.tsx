import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { ContentProvider, Experience } from '@ebitex/content-sdk/react'

import { Markdown } from '@/components/Markdown'
import { content, renderers } from '@/lib/content'
import { useLocale } from '@/lib/locale'
import { useVisitorContext } from '@/lib/visitor'
import { NotConfigured } from '@/pages/NotConfigured'
import { NotFound } from '@/pages/NotFound'

/**
 * Every page on this site. There is no route table of pages -- the CMS decides
 * what lives at a path, and this component asks it.
 *
 * `<Experience>` resolves the current path and renders whatever Presentation is
 * published there, dispatching to `src/presentations/<template external id>.tsx`.
 * Publishing a new page makes it live; nothing here changes.
 *
 * A redirect is reported, never performed: the SDK does not know what router
 * you use, so it hands you the target and you navigate.
 */
export function ContentPage() {
  const { pathname } = useLocation()
  const locale = useLocale()
  const context = useVisitorContext()
  const navigate = useNavigate()
  const onRedirect = useCallback((to: string) => navigate(to, { replace: true }), [navigate])

  if (!content) return <NotConfigured />

  return (
    <ContentProvider client={content} renderers={renderers} markdown={Markdown}>
      <Experience
        path={pathname}
        // The only change step 16 made to this file. Everything downstream -- every renderer, every
        // Contract -- is untouched: what arrives is simply the French value where one exists and
        // the English one where it does not.
        locale={locale}
        // Step 17's whole change to this file. The SDK re-resolves whenever the bag changes, the
        // same way it does for the path or the locale -- so switching who you are buying for
        // re-renders the page with different words and nothing here has to know which words.
        context={context}
        onRedirect={onRedirect}
        notFound={<NotFound />}
        loading={<PageSkeleton />}
      />
    </ContentProvider>
  )
}

/**
 * `min-h-svh` is doing real work: without it the skeleton is short, the footer sits in the middle
 * of the viewport, and it leaps down the page the moment content arrives. That jump is a large
 * cumulative layout shift on every first visit, and it costs one class to avoid.
 */
function PageSkeleton() {
  return (
    <div className="mx-auto min-h-svh max-w-3xl animate-pulse px-6 py-24" aria-hidden>
      <div className="h-3 w-24 rounded bg-ink/10" />
      <div className="mt-6 h-10 w-3/4 rounded bg-ink/10" />
      <div className="mt-8 space-y-3">
        <div className="h-4 w-full rounded bg-ink/10" />
        <div className="h-4 w-11/12 rounded bg-ink/10" />
        <div className="h-4 w-9/12 rounded bg-ink/10" />
      </div>
    </div>
  )
}

export default ContentPage
