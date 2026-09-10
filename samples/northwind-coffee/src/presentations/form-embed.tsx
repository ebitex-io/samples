import { useEffect, useRef } from 'react'
import type { PresentationRenderer } from '@ebitex/content-sdk/react'

import { formsBaseUrl, formsOrgSlug } from '@/lib/forms'
import type { FormEmbedContent } from '@/lib/cmsTypes'

/**
 * The `form-embed` Template: an ebitex Form, embedded the way any customer would embed it.
 *
 * This is the suite talking to itself over its own public surface. The CMS decides *which* form
 * and *where on the page*; it has no opinion about how the form reaches the page, and nothing here
 * re-renders the form from its definition. If that ever seemed like a good idea, every change to
 * the form would need a matching change here.
 *
 * `embed.js` is Forms' own script. It listens for the framed form's reported content height and
 * resizes the iframe, so the form grows as steps advance or validation errors appear.
 */
const FormEmbed: PresentationRenderer<FormEmbedContent> = ({ component }) => {
  const { form, title } = component.content
  useFormsEmbedScript()

  // A sample cannot assume the reader has created a form yet, and a blank iframe is a worse
  // answer than a sentence explaining what is missing.
  if (!formsOrgSlug) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-dashed border-line px-6 py-10 text-center text-ink-muted">
        <p>
          Set <code className="rounded bg-sunken px-1.5 py-0.5">VITE_FORMS_ORG_SLUG</code> in{' '}
          <code className="rounded bg-sunken px-1.5 py-0.5">.env</code> to embed your own
          organization&rsquo;s form here.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <iframe
        id={`ebitex-form-${form}`}
        src={`${formsBaseUrl}/public/form/${formsOrgSlug}/${form}?embed=1`}
        title={title ?? 'Form'}
        // A starting value only: embed.js corrects it from the form's own reported height. Without
        // one the iframe defaults to 150px and visibly jumps on load.
        style={{ width: '100%', border: 0, height: 620 }}
        loading="lazy"
      />
    </div>
  )
}

/**
 * Injects Forms' `embed.js` at most once, however many forms a page mounts.
 *
 * StrictMode double-invokes effects in development, so both guards are load-bearing: without them
 * the page grows a second script tag on every mount, each installing its own resize listener.
 */
function useFormsEmbedScript() {
  const injected = useRef(false)

  useEffect(() => {
    if (!formsOrgSlug || injected.current) return
    const src = `${formsBaseUrl}/embed.js`
    if (document.querySelector(`script[src="${src}"]`)) return

    const script = document.createElement('script')
    script.src = src
    script.async = true
    document.body.appendChild(script)
    injected.current = true
  }, [])
}

export default FormEmbed
