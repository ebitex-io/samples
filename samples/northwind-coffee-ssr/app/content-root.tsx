'use client'

import { ContentProvider, Experience, PreviewBridge } from '@ebitex/content-sdk/react'
import type { ExperienceResult } from '@ebitex/content-sdk'
import { renderers } from '@/lib/renderers'
import { Markdown } from '@/components/Markdown'

/**
 * The client boundary, and the reason one is needed at all.
 *
 * `renderers` is a map of component *functions*, and functions cannot cross the React Server
 * Components boundary -- so the map cannot be built in a server component and passed down. It is
 * built here instead, and only `result` (plain JSON) crosses.
 *
 * This file's own `'use client'` is what pulls `@ebitex/content-sdk/react` into the client graph.
 * The SDK ships no such directive of its own, deliberately: a consumer needs this wrapper regardless,
 * so the directive would save no step while marking `<Experience result>` -- the *server* rendering
 * seam -- as a client component.
 *
 * `fallback={() => null}` keeps the SDK's developer panel, which is right in development, out of
 * delivered HTML.
 */
export function ContentRoot({ result }: { result: ExperienceResult }) {
  return (
    <ContentProvider renderers={renderers} markdown={Markdown} fallback={() => null}>
      {/*
        Live preview (spec 342). Inert unless this page is *both* framed (or opened) by another
        window and carrying `?ebitex-preview=1`, so a production visit renders exactly as it would
        without it — the server-rendered HTML above is untouched and this adds nothing to it.
        Composer posts the editor's current draft, already resolved through the same pipeline
        delivery uses, and the bridge swaps it in.
        Nothing server-side is involved, which is the point worth checking: issue #362 exists for
        sites where a posted document arrives too late because the *server* renders the page. A Next
        app hydrates, so the bridge takes over in the browser exactly as it does in the static
        sample, and the server render is simply the first paint.
      */}
      <PreviewBridge origins={previewOrigins()}>
        <Experience result={result} />
      </PreviewBridge>
    </ContentProvider>
  )
}

/**
 * Which window may drive preview. Defaults to ebitex's own Composer; a self-hosted or local
 * Content is named through the environment. This list is the `targetOrigin` allow-list — a message
 * from anywhere else is ignored, which is what keeps an arbitrary framing page from injecting
 * content into your site.
 */
function previewOrigins(): string[] | undefined {
  const configured = process.env.NEXT_PUBLIC_PREVIEW_ORIGINS
  return configured ? configured.split(',').map((o) => o.trim()).filter(Boolean) : undefined
}
