import type { Renderers } from '@ebitex/content-sdk/react'
import Card from '@/presentations/card'
import CardRail from '@/presentations/card-rail'
import Coffee from '@/presentations/coffee'
import CoffeeIndex from '@/presentations/coffee-index'
import Figure from '@/presentations/figure'
import FormEmbed from '@/presentations/form-embed'
import Guide from '@/presentations/guide'
import GuideIndex from '@/presentations/guide-index'
import Hero from '@/presentations/hero'
import Origin from '@/presentations/origin'
import Page from '@/presentations/page'
import Prose from '@/presentations/prose'
import StoreList from '@/presentations/store-list'

/**
 * Registration is a plain map from a Template's external id to the component that renders it.
 *
 * The static sample uses `renderersFromGlob(import.meta.glob(...))`, which is a Vite feature — there
 * is no `import.meta.glob` here. A static map is what every non-Vite consumer writes, so it is what
 * this sample shows. The filename is still the Template's external id, by convention; the map just
 * says so explicitly.
 */
export const renderers: Renderers = {
  'card': Card,
  'card-rail': CardRail,
  'coffee': Coffee,
  'coffee-index': CoffeeIndex,
  'figure': Figure,
  'form-embed': FormEmbed,
  'guide': Guide,
  'guide-index': GuideIndex,
  'hero': Hero,
  'origin': Origin,
  'page': Page,
  'prose': Prose,
  'store-list': StoreList,
}
