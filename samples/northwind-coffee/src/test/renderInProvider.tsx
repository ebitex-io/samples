import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { ContentProvider } from '@ebitex/content-sdk/react'

import { Markdown } from '@/components/Markdown'

/**
 * Renders a Template's renderer the way the app does.
 *
 * A renderer never mounts on its own -- `<RichText>` and `<RenderPresentation>` both read the
 * provider for the markdown component and the renderer registry -- so the provider belongs in the
 * test too. No client is passed, because a renderer that needs to fetch something to display
 * already-resolved content would be a design mistake worth failing on.
 */
export function renderInProvider(ui: ReactElement) {
  return render(
    <ContentProvider renderers={{}} markdown={Markdown}>
      {ui}
    </ContentProvider>,
  )
}
