import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { ContentProvider, Experience } from '@ebitex/content-sdk/react'

import { Markdown } from '@/components/Markdown'
import { content, renderers } from '@/lib/content'
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
  const navigate = useNavigate()
  const onRedirect = useCallback((to: string) => navigate(to, { replace: true }), [navigate])

  if (!content) return <NotConfigured />

  return (
    <ContentProvider client={content} renderers={renderers} markdown={Markdown}>
      <Experience
        path={pathname}
        onRedirect={onRedirect}
        notFound={<NotFound />}
        loading={<PageSkeleton />}
      />
    </ContentProvider>
  )
}

function PageSkeleton() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse px-6 py-24" aria-hidden>
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
