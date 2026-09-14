'use client'

import { createContext, useContext } from 'react'

import type { CatalogueSeed } from '@/lib/catalogue'

const CatalogueSeedContext = createContext<CatalogueSeed | undefined>(undefined)

/**
 * Carries the server's prefetched first page of the catalogue down to the grid.
 *
 * Context rather than a prop because of where the two ends are: the seed enters the client graph at
 * `app/content-root.tsx`, and the component that wants it is inside a *renderer*, dispatched by the
 * SDK on the Template's external id. Renderers receive the content envelope and nothing else — by
 * design, since a renderer is registered by convention rather than constructed by its parent — so
 * there is no prop to thread it through, and giving the SDK one would be asking a content library
 * to carry an application's data-fetching concerns.
 *
 * `undefined` is a normal value here, not a failure: every page that is not the catalogue renders
 * inside this provider with nothing in it, and so does the catalogue itself if the prefetch failed.
 */
export function CatalogueSeedProvider({
  seed,
  children,
}: {
  seed?: CatalogueSeed
  children: React.ReactNode
}) {
  return <CatalogueSeedContext.Provider value={seed}>{children}</CatalogueSeedContext.Provider>
}

/** The server's prefetched page, if this render has one. */
export function useCatalogueSeed(): CatalogueSeed | undefined {
  return useContext(CatalogueSeedContext)
}
