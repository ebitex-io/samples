'use client'

import { useSyncExternalStore, type ReactNode } from 'react'
import { ContentProvider, Experience, PreviewBridge } from '@ebitex/content-sdk/react'
import { isPreviewActivated } from '@ebitex/content-sdk/preview'
import type { ExperienceResult } from '@ebitex/content-sdk'
import { CatalogueSeedProvider } from '@/lib/catalogueSeed'
import type { CatalogueSeed } from '@/lib/catalogue'
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
export function ContentRoot({
  result,
  catalogue,
}: {
  result: ExperienceResult
  /**
   * The catalogue grid's first page, already fetched on the server.
   *
   * It arrives here rather than at the component that needs it because that component sits below
   * this file's `'use client'` boundary and cannot fetch. Plain JSON, like `result` — which is the
   * only reason it can cross at all.
   */
  catalogue?: CatalogueSeed
}) {
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
        <CatalogueSeedProvider seed={catalogue}>
          <Experience result={result} />
        </CatalogueSeedProvider>
      </PreviewBridge>
    </ContentProvider>
  )
}

/**
 * The same bridge, for a path with no published page -- rendered by `not-found.tsx` around its
 * message.
 *
 * ---- Why a missing page needs a bridge at all ----
 *
 * Composer frames a page at its *authoring* path, which exists before the page has ever been
 * published. This server resolves against *published* content, so for a page nobody has published
 * yet the answer is "not found". Until this existed the not-found page mounted no bridge, never told
 * Composer it was ready, and a new page could not be previewed until it was already live. The static
 * sample never had the gap: its `<Experience path>` sits inside the bridge whatever the path
 * resolves to.
 *
 * Nothing about the response changes. It is still a real 404, still `noindex`, and outside a preview
 * it renders exactly the message it always did.
 *
 * No empty result has to be invented to get here, either. The bridge renders its children until
 * Composer's first document arrives and then replaces them with it, which is the mechanism the
 * published case already relies on -- there, the children are the published page.
 *
 * ---- Why the message is hidden inside a preview ----
 *
 * Composer shows the frame as soon as the bridge says it is ready, and the draft lands a beat later.
 * Left alone, the frame would say "We could not find that page" for that beat, about the very page
 * the author is looking at the draft of. So inside a preview the message renders nothing, and the
 * frame is briefly empty instead.
 */
export function PreviewableNotFound({ children }: { children: ReactNode }) {
  return (
    <ContentProvider renderers={renderers} markdown={Markdown} fallback={() => null}>
      <PreviewBridge origins={previewOrigins()}>
        <HiddenInPreview>{children}</HiddenInPreview>
      </PreviewBridge>
    </ContentProvider>
  )
}

/**
 * `isPreviewActivated` reads `window`, which a server render does not have, so it is read through
 * `useSyncExternalStore` with a server answer of `false`: the server render and hydration both
 * produce the message, and a browser that is a preview then renders nothing. Activation cannot change
 * for the life of the page (it is the URL plus being framed), so there is nothing to subscribe to.
 */
function HiddenInPreview({ children }: { children: ReactNode }) {
  const previewing = useSyncExternalStore(noSubscription, readActivation, () => false)
  return previewing ? null : <>{children}</>
}

const noSubscription = () => () => {}
const readActivation = () => isPreviewActivated(window.location, window)

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
