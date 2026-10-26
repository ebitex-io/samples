// The demo site: one page built only from the ebitex starter kit. It owns one Contract (the page,
// which inherits the kit's `ebitex-experience`) and the Components and node below; every other
// Contract and Template it names belongs to the kit and is never copied (see build-demo.mjs).
//
// What to read here: the Components hold the *words*. Where each is placed and how it looks (width,
// background, tone, emphasis, columns, tab labels) lives on the reference that places it, so the
// same Component is reused with different settings (`banner-launch` appears twice, as information
// and as a warning).

import { ref } from '@ebitex/content-sdk/model'

/** A localizable value in the envelope the editor writes. */
const L = (value) => ({ default: value, locales: {} })
/** A localizable RichText value: the language envelope around one markdown block. */
const md = (markdown) => L({ markdown })
const external = (url) => ({ kind: 'external', url })

/** An inline `ebitex-action`. */
const action = (label, url, style) => ({
  mode: 'inline',
  contract: ref('contract', 'ebitex-action'),
  contractVersion: 1,
  document: { label: L(label), href: external(url), ...(style ? { style } : {}) },
})

/** A reference to a Component of this model, with the placing edge's own settings. */
const place = (externalId, contextualValues) => ({
  mode: 'reference',
  provider: 'core',
  key: ref('component', externalId),
  ...(contextualValues ? { contextualValues } : {}),
})

const feature = (externalId, name, icon, title, body) => ({ externalId, name, contract: 'ebitex-feature', document: { icon, title: L(title), body: L(body) } })
const card = (externalId, name, title, summary, label) => ({
  externalId,
  name,
  contract: 'ebitex-card',
  document: { title: L(title), summary: L(summary), action: action(label, 'https://ebitex.io', 'link') },
})
const prose = (externalId, name, markdown) => ({ externalId, name, contract: 'ebitex-rich-text', document: { body: md(markdown) } })

export const contracts = [{ externalId: 'starter-demo-page', name: 'Demo page', parent: 'ebitex-experience', fields: [] }]

export const components = [
  {
    externalId: 'banner-launch',
    name: 'Launch banner',
    contract: 'ebitex-banner',
    document: { message: md('**The starter kit is here.** Build a page from the same pieces every ebitex site starts with.'), action: action('See how', 'https://ebitex.io', 'link') },
  },
  feature('feature-fast', 'Feature: fast', '⚡', 'Fast to start', 'Every organization that opts in gets the same Contracts and Templates, ready to use.'),
  feature('feature-flexible', 'Feature: flexible', '🧩', 'Flexible to extend', 'Inherit a kit Contract or duplicate it into your own realm and change what you need.'),
  feature('feature-safe', 'Feature: safe', '🛡️', 'Safe to update', 'A kit update that would break something you built is refused, with the reasons.'),
  card('card-hero', 'Card: pages', 'Pages', 'A page is a hero and a list of sections, each one a presentation from the kit.', 'Read more'),
  card('card-sections', 'Card: sections', 'Sections', 'Hero, rich text, media, card, feature, banner, call to action, tabs, accordion and grid.', 'Read more'),
  card('card-themes', 'Card: themes', 'Themes', 'Colour tokens as CSS variables, with a light and a dark set that follow the reader.', 'Read more'),
  prose('rich-intro', 'Introduction', '## Built from reusable parts\n\nThe words live in Components. **How** a section looks is chosen where it is placed, so one Component can appear in many places in different ways.\n\n- Change a heading once and every page that uses it follows.\n- Choose the width, the background and the layout per placement.\n- Keep your own content in your own realm; the kit stays read-only.'),
  prose('tab-overview', 'Tab: overview', 'The kit gives every site the same starting vocabulary. Pages, sections and actions are ordinary Contracts, so nothing here is special to the renderer.'),
  prose('tab-details', 'Tab: details', 'A renderer reads the Contract of each section and draws it. This sample draws all ten presentations in a light and a dark theme.\n\n| Presentation | Draws |\n|---|---|\n| Hero | a heading, a lead and up to two actions |\n| Grid | its items in a chosen number of columns |'),
  { externalId: 'tabs-main', name: 'Tabs', contract: 'ebitex-tabs', document: { items: [place('tab-overview', { itemLabel: L('Overview') }), place('tab-details', { itemLabel: L('Details') })] } },
  prose('faq-reuse', 'FAQ: reuse', 'Yes. The same Component can be placed several times; each placement chooses its own width, background, tone or layout.'),
  prose('faq-fork', 'FAQ: fork', 'Duplicate the item into your own realm. The copy is yours; the kit keeps changing without touching it.'),
  prose('faq-update', 'FAQ: update', 'Kit updates arrive for everyone who opted in. One that would break something you built is refused for you, with what it would have broken.'),
  {
    externalId: 'accordion-faq',
    name: 'FAQ',
    contract: 'ebitex-accordion',
    document: {
      items: [
        place('faq-reuse', { itemLabel: L('Can I reuse one section in many places?'), openByDefault: true }),
        place('faq-fork', { itemLabel: L('How do I change something the kit provides?') }),
        place('faq-update', { itemLabel: L('What happens when the kit is updated?') }),
      ],
    },
  },
  { externalId: 'grid-features', name: 'Features grid', contract: 'ebitex-grid', document: { items: [place('feature-fast'), place('feature-flexible'), place('feature-safe')] } },
  {
    externalId: 'grid-cards',
    name: 'Cards grid',
    contract: 'ebitex-grid',
    document: { items: [place('card-hero', { emphasis: 'default' }), place('card-sections', { emphasis: 'high' }), place('card-themes', { emphasis: 'default' })] },
  },
  {
    externalId: 'cta-main',
    name: 'Call to action',
    contract: 'ebitex-cta',
    document: { heading: L('Start from a good place'), body: L('Opt in to the starter kit and build your first page from it in minutes.'), primaryAction: action('Get started', 'https://ebitex.io'), secondaryAction: action('Talk to us', 'https://ebitex.io') },
  },
]

/** The home page document: an inline hero and the sections, each placed with its own settings. */
export const homePage = {
  externalId: 'demo-home',
  name: 'Demo home',
  contract: 'starter-demo-page',
  document: {
    metaTitle: L('ebitex starter kit'),
    metaDescription: L('A reference site built only from the ebitex starter kit.'),
    hero: {
      mode: 'inline',
      contract: ref('contract', 'ebitex-hero'),
      contractVersion: 1,
      document: {
        heading: L('Build a site from a kit that already works'),
        lead: md('Contracts, Templates and ten ready presentations, shared by every organization that opts in.'),
        primaryAction: action('Get started', 'https://ebitex.io'),
        secondaryAction: action('Read the docs', 'https://developers.ebitex.io'),
      },
    },
    sections: [
      place('banner-launch', { tone: 'info', width: 'wide' }),
      place('rich-intro', { width: 'narrow' }),
      place('grid-features', { columns: 3, width: 'wide', background: 'muted', anchor: 'features' }),
      place('grid-cards', { columns: 3, width: 'wide', anchor: 'cards' }),
      place('tabs-main', { width: 'default' }),
      place('accordion-faq', { width: 'narrow', anchor: 'faq' }),
      place('banner-launch', { tone: 'warning', width: 'narrow' }),
      place('cta-main', { width: 'wide' }),
    ],
  },
}

/** The site root answers `/` with the home page, through the kit's `ebitex-page` Template. */
export const nodes = [
  {
    key: '@Starter site',
    name: 'Starter site',
    slug: null,
    payloadKind: 'presentation',
    presentationPayload: { template: ref('template', 'ebitex-page'), templateVersion: 1, component: place('demo-home'), settings: {} },
  },
]
