import type { PresentationEnvelope } from '@ebitex/content-sdk'

import { plainTextFrom } from '@/lib/richText'
import { PRICE_CURRENCY, formatWeight } from '@/lib/format'
import type { Coffee, CoffeeIndex, Guide, GuideIndex, Image, Origin, Page, StoreList } from '@/types/content'

/**
 * What each kind of content means to a crawler.
 *
 * ---- Why this file exists at all, when the title does not come from it ----
 *
 * The title *is* CMS content and is declared as such: a Contract names its own title field
 * (`titleFieldPath`), the CMS resolves it at publish, freezes it, and hands it back on `GET /path`.
 * So `generateMetadata` reads `result.title` and nothing here is involved. That is the shape to
 * want, and the reason a description is not the same shape is worth being precise about: no
 * Contract declares which of its fields is a description, so nothing is frozen and nothing is
 * delivered. The app has to know.
 *
 * Note that for `page` the description *is* content -- the Contract has a `description` field whose
 * own comment in the model calls it the meta description. What is missing is the declaration, not
 * the value. This file is the app supplying the missing half: it says which field, and the author
 * says what it holds.
 *
 * ---- Keyed by Contract, not by Template ----
 *
 * Renderers dispatch on the Template, because rendering is a presentation decision. A description
 * is not: it is a property of what the content *is*, and two Templates over one Contract should
 * describe the page the same way. The delivered envelope carries the Contract descriptor already,
 * so the key costs nothing.
 *
 * (In this sample every page Template happens to share its Contract's external id, so the two keys
 * would pick the same entries. They are still different questions, and a `coffee-compact` Template
 * added tomorrow would need no entry here.)
 *
 * On an Adapter-mapped binding that descriptor names the Adapter's *output* Contract, which is the
 * right answer -- what is delivered is what should be described. No node payload in this sample is
 * adapted; the card rails are.
 *
 * ---- One function, three answers ----
 *
 * Description, social image and structured data all answer the same question, and three separate
 * maps would be three places to forget a Contract.
 *
 * It is a plain function and not a hook, which is not a style preference: `generateMetadata` runs
 * before the render tree exists, so there is no React to hook into. That is precisely why the
 * `useDocumentMeta` effect this replaces could never have written a server-rendered `<head>`.
 */
export interface PageMetadata {
  description?: string
  image?: { url: string; alt: string }
  /** JSON-LD, emitted by the page as a `<script type="application/ld+json">`. */
  jsonLd?: Record<string, unknown>
}

export function metadataFor(envelope: PresentationEnvelope | undefined): PageMetadata {
  const contract = envelope?.component?.contract?.externalId
  const content = envelope?.component?.content
  if (!contract || !content) return {}

  switch (contract) {
    case 'page': {
      const c = content as Page
      return { description: c.description, jsonLd: { '@type': 'WebPage', name: c.title } }
    }

    case 'coffee': {
      const c = content as Coffee
      const description = plainTextFrom(c.description)
      const image = imageFrom(c.image)
      return {
        description,
        image,
        // A coffee has a price and a bag size. It is a Product in the sense schema.org means, not
        // by analogy -- which is the test for whether a type is worth claiming.
        jsonLd: prune({
          '@type': 'Product',
          name: c.name,
          description,
          image: image?.url,
          brand: { '@type': 'Brand', name: SITE_NAME },
          ...(c.producer ? { manufacturer: { '@type': 'Organization', name: c.producer } } : {}),
          ...(c['weight-grams'] ? { weight: formatWeight(c['weight-grams']) } : {}),
          // The currency is the app's, not the content's: the model stores a plain number on
          // purpose, because a formatted string cannot be localized, sorted or compared. So it
          // comes from the one place that already decides what a price looks like, rather than
          // being invented here -- an invented currency is a wrong price, not a missing one.
          ...(c.price !== undefined
            ? { offers: { '@type': 'Offer', price: c.price.toFixed(2), priceCurrency: PRICE_CURRENCY } }
            : {}),
        }),
      }
    }

    case 'guide': {
      const c = content as Guide
      return {
        description: c.summary,
        jsonLd: prune({
          '@type': 'HowTo',
          name: c.heading,
          description: c.summary,
          ...(isoDuration(c['total-time']) ? { totalTime: isoDuration(c['total-time']) } : {}),
          ...(c.equipment?.length
            ? { supply: c.equipment.map((item) => ({ '@type': 'HowToSupply', name: item })) }
            : {}),
          ...(c.steps?.length
            ? {
                step: c.steps.map((step, i) => {
                  const s = step.content
                  return prune({
                    '@type': 'HowToStep',
                    position: i + 1,
                    name: s?.heading,
                    text: plainTextFrom(s?.body, 300),
                  })
                }),
              }
            : {}),
        }),
      }
    }

    case 'origin': {
      const c = content as Origin
      const description = plainTextFrom(c.summary)
      const image = imageFrom(c.image)
      return {
        description,
        image,
        jsonLd: prune({
          '@type': 'Place',
          name: c.name,
          description,
          image: image?.url,
          ...(c.country ? { address: { '@type': 'PostalAddress', addressCountry: c.country } } : {}),
        }),
      }
    }

    // The three pages whose body is a list. Each has an `intro`, and until now none of them put a
    // single word of it in front of a crawler.
    case 'coffee-index':
    case 'guide-index':
    case 'store-list': {
      const c = content as CoffeeIndex | GuideIndex | StoreList
      const description = plainTextFrom(c.intro)
      return { description, jsonLd: prune({ '@type': 'CollectionPage', name: c.heading, description }) }
    }

    // A Template added tomorrow renders perfectly well and simply describes itself less. Throwing
    // here, or guessing at a field called `description`, would make a new Contract a broken page.
    default:
      return {}
  }
}

const SITE_NAME = 'Northwind Coffee'

/**
 * A `total-time` as schema.org wants it, or nothing.
 *
 * `HowTo.totalTime` is typed: it takes an ISO 8601 duration, and "4 minutes" is not one. Emitting
 * the authored string anyway would produce structured data that reads plausibly and is invalid --
 * the worst of the three outcomes, because nothing reports it.
 *
 * So this converts the shapes the content actually uses and returns `undefined` for anything else,
 * on the same reasoning as the currency above: a field in the wrong format is worse than an absent
 * one. The real lesson is a modelling one, and it belongs to whoever owns the Contract -- a value
 * that has to reach a typed consumer wants a typed field, and `total-time` here is free text
 * because it was only ever rendered as a line of copy.
 */
function isoDuration(value: string | undefined): string | undefined {
  if (!value) return undefined
  if (/^P(?!$)(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?$/.test(value.trim())) return value.trim()

  const hours = /(\d+)\s*(?:h|hr|hrs|hour|hours)\b/i.exec(value)
  const minutes = /(\d+)\s*(?:m|min|mins|minute|minutes)\b/i.exec(value)
  if (!hours && !minutes) return undefined
  return `PT${hours ? `${Number(hours[1])}H` : ''}${minutes ? `${Number(minutes[1])}M` : ''}`
}


/**
 * A Blob's delivered `url` is already absolute and public -- resolved at publish time, served from
 * wherever the organization's blob store lives -- so there is nothing to rewrite. `alt` is
 * mandatory on the Contract, which is why it can be read without a fallback.
 */
function imageFrom(value: { content?: Image } | undefined): { url: string; alt: string } | undefined {
  const url = value?.content?.file?.url
  return url ? { url, alt: value?.content?.alt ?? '' } : undefined
}

/** Drops members with no value, so an absent field is absent from the JSON-LD rather than null. */
function prune<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  ) as T
}
