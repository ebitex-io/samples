import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { ContentProvider, Experience } from '@ebitex/content-sdk/react'

import { Markdown } from '@/components/Markdown'
import { content, renderers } from '@/lib/content'
import { NotConfigured } from '@/pages/NotConfigured'
import { NotFound } from '@/pages/NotFound'

/**
 * Every page on this site. There is no route table of pages: the CMS decides what lives at a path,
 * and this component asks it. A section that arrives as a bare reference is fetched by `<Section>`,
 * so the page is never hollow whatever depth the resolve reached.
 */
export function ContentPage() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const onRedirect = useCallback((to: string) => navigate(to, { replace: true }), [navigate])

  if (!content) return <NotConfigured />

  return (
    <ContentProvider client={content} renderers={renderers} markdown={Markdown}>
      <Experience path={pathname} onRedirect={onRedirect} notFound={<NotFound />} loading={<div aria-hidden className="min-h-svh" />} />
    </ContentProvider>
  )
}

export default ContentPage
