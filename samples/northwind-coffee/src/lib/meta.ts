import { useEffect } from 'react'

const SITE_NAME = 'Northwind Coffee'

/**
 * Sets the document title and meta description for the page currently rendered.
 *
 * A static site has one `index.html`, so anything a crawler that runs JavaScript
 * should see has to be written at render time. (A crawler that does not run
 * JavaScript sees only the shell -- which is the honest trade of the static
 * model, and the reason the server-rendered sample exists as a sibling.)
 */
export function useDocumentMeta(title: string | undefined, description?: string | undefined) {
  useEffect(() => {
    if (title) document.title = `${title} — ${SITE_NAME}`
    return () => {
      document.title = SITE_NAME
    }
  }, [title])

  useEffect(() => {
    if (description === undefined) return
    let tag = document.head.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (!tag) {
      tag = document.createElement('meta')
      tag.name = 'description'
      document.head.appendChild(tag)
    }
    tag.content = description
  }, [description])
}
