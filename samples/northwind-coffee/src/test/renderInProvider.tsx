import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { ContentProvider } from '@ebitex/content-sdk/react'

import { Markdown } from '@/components/Markdown'

/**
 * Renders a Template's renderer the way the app does.
 *
 * A renderer never mounts on its own -- `<RichText>` and `<RenderPresentation>` both read the
 * provider for the markdown component and the renderer registry, and an internal link renders a
 * router `<Link>` -- so both belong in the test. No client is passed, because a renderer that
 * needed to fetch something in order to display already-resolved content would be a design
 * mistake worth failing on.
 */
export function renderInProvider(ui: ReactElement) {
  return render(
    <MemoryRouter>
      <ContentProvider renderers={{}} markdown={Markdown}>
        {ui}
      </ContentProvider>
    </MemoryRouter>,
  )
}
