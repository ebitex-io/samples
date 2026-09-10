import type {
  BlobValue,
  CategoryDescriptor,
  ComponentValue,
  LinkValue,
  PresentationEnvelope,
  RichTextValue,
} from '@ebitex/content-sdk'

/**
 * The delivered shapes, in TypeScript.
 *
 * These mirror the Contracts in `content-model/model.mjs`. Field keys are the Contract's field
 * external ids exactly as authored, which is why they are kebab-case rather than camelCase --
 * `cta-label`, not `ctaLabel`. Nothing translates them on the way through.
 *
 * Keeping this file true by hand is a chore, and a chore that fails silently: rename a field and
 * TypeScript happily keeps compiling against the old name. Step 14 deletes the whole file and
 * generates it from the delivered schemas instead. It is worth living with the chore until then,
 * because feeling the problem is what makes the fix land.
 */

export interface PageContent {
  title: string
  description?: string
  body?: RichTextValue
  sections?: PresentationEnvelope[]
}

export interface StatementContent {
  heading: string
  standfirst?: string
  body?: RichTextValue
  cta?: LinkValue
  'cta-label'?: string
}

export interface ImageContent {
  file: BlobValue
  alt: string
}

export interface CoffeeContent {
  name: string
  producer?: string
  description?: RichTextValue
  'tasting-notes'?: string[]
  price?: number
  'weight-grams'?: number
  image?: ComponentValue<ImageContent>
  origin?: ComponentValue<OriginContent>
  roast?: CategoryDescriptor
  process?: CategoryDescriptor
}

export interface OriginContent {
  name: string
  country?: string
  altitude?: string
  summary?: RichTextValue
  image?: ComponentValue<ImageContent>
}

export interface CoffeeIndexContent {
  heading: string
  intro?: RichTextValue
}

export interface GuideStepContent {
  heading?: string
  body?: RichTextValue
}

export interface GuideContent {
  heading: string
  summary?: string
  equipment?: string[]
  'total-time'?: string
  steps?: ComponentValue<GuideStepContent>[]
}

export interface GuideIndexContent {
  heading: string
  intro?: RichTextValue
  guides?: ComponentValue<GuideContent>[]
}

export interface StoreContent {
  name: string
  address?: string[]
  hours?: string[]
  phone?: string
  map?: LinkValue
}

export interface StoreListContent {
  heading: string
  intro?: RichTextValue
  stores?: ComponentValue<StoreContent>[]
}

export interface FormEmbedContent {
  form: string
  title?: string
}

export interface NavLinkContent {
  label: string
  link?: LinkValue
}

export interface HeaderContent {
  links?: ComponentValue<NavLinkContent>[]
}

export interface FooterContent {
  tagline?: string
  links?: ComponentValue<NavLinkContent>[]
}
