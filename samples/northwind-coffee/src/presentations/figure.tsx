import type { PresentationRenderer } from '@ebitex/content-sdk/react'

import { CmsImage } from '@/components/CmsImage'
import type { Image } from '@/types/content'

/**
 * The `figure` Template, rendering an `image` inside a RichText body.
 *
 * Nothing about this file knows it is being rendered mid-paragraph. A RichText body's markdown
 * contains `{{embed:vessel}}` and the document's `embeds` map says that token is a Presentation;
 * the SDK splits the text around it and dispatches here, exactly as a page section is dispatched.
 * An embed is a Presentation like any other, which is why there is no special "inline image" path
 * anywhere in this app.
 */
const Figure: PresentationRenderer<Image> = ({ component }) => {
  const { file, alt } = component.content
  return (
    <figure className="my-6 overflow-hidden rounded-2xl border border-line bg-sunken">
      <CmsImage file={file} alt={alt} className="w-full" />
    </figure>
  )
}

export default Figure
