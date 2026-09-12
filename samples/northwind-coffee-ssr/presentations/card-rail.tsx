import { PresentationList } from '@ebitex/content-sdk/react'
import type { PresentationRenderer } from '@ebitex/content-sdk/react'

import type { CardRail } from '@/types/content'

/**
 * The `card-rail` Template: a heading and a row of cards.
 *
 * `<PresentationList>` dispatches each entry to whatever renderer its own Template names, exactly
 * as `page.tsx` does for a page's sections. This file therefore does not know that the cards are
 * cards, any more than `card.tsx` knows they are coffees -- each layer knows only the one below it,
 * which is what lets the rail be filled with something else entirely without either being edited.
 */
const CardRailSection: PresentationRenderer<CardRail> = ({ component }) => {
  const { heading, cards } = component.content

  return (
    <section className="border-t border-line bg-sunken">
      <div className="mx-auto max-w-5xl px-6 py-14">
        <h2 className="font-display text-2xl text-ink">{heading}</h2>
        <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <PresentationList items={cards} wrap={(rendered) => <div>{rendered}</div>} />
        </div>
      </div>
    </section>
  )
}

export default CardRailSection
