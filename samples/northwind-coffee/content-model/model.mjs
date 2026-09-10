// ---------------------------------------------------------------------------------------------
// Northwind Coffee's content model, as data.
//
// Read this file top to bottom and you have the whole system: the Contracts (what content *is*),
// the Templates (how it can be *presented*), the Components (the content itself), and the
// Experience nodes (where each page lives). `apply.mjs` walks it in dependency order and creates
// or updates every piece, so a re-run after an edit is safe.
//
// This grows one step at a time along with the tutorial. `git diff` between two step tags shows
// exactly what a step added to the model -- which is the reason it is worth shipping a readable
// script alongside the seed bundles that do the same job faster.
//
// See api.mjs for why you should not run this against your own organization.
// ---------------------------------------------------------------------------------------------

import { experienceLink, inline, presentation } from './values.mjs'

// ---- value helpers ---------------------------------------------------------------------------

/**
 * A localizable field's stored envelope: one default value plus per-locale overrides.
 *
 * Every localizable field is written this way from the very first step, while the organization
 * still has exactly one locale -- so the envelope is always `{ default, locales: {} }` and nothing
 * about the site looks any different. Adding a second locale later fills in `locales` and changes
 * no Contract, no Template and no renderer. That is the whole point.
 */
export const L = (value) => ({ default: value, locales: {} })

/**
 * A personalizable field's stored envelope: one default value plus audience-conditioned variants.
 *
 * Same idea as `L`, one axis over. Declared now, with no audiences in the organization and every
 * `variants` list empty, so that step 17 can add a variant without touching the model.
 *
 * The two compose as `P(L(value))` -- personalization on the outside, locales within each arm --
 * which is the order the compiled schema expects.
 */
export const P = (value) => ({ default: value, variants: [] })

/** A RichText value: one markdown block (CommonMark plus GFM tables and strikethrough). */
export const md = (markdown) => ({ markdown })

// ---- field helpers ---------------------------------------------------------------------------

function field(
  name,
  externalId,
  fieldTypeKey,
  {
    mandatory = false,
    enumerable = false,
    localizable = false,
    contextual = false,
    personalizable = false,
    settings = {},
  } = {},
) {
  return {
    name,
    externalId,
    fieldTypeKey,
    isMandatory: mandatory,
    isEnumerable: enumerable,
    isLocalizable: localizable,
    isContextual: contextual,
    isPersonalizable: personalizable,
    settings,
  }
}

export const text = (name, id, opts) => field(name, id, 'shortText', opts)
export const rich = (name, id, opts) => field(name, id, 'richText', opts)
export const link = (name, id, opts) => field(name, id, 'link', opts)
export const num = (name, id, opts) => field(name, id, 'number', opts)
export const presentationField = (name, id, opts) => field(name, id, 'presentation', opts)

/** Resolves a list of external ids to the ids of entities created earlier in the same run. */
export function ids(byExternalId, externalIds) {
  return externalIds.map((id) => byExternalId[id]?.id).filter((id) => id !== undefined)
}

// ---- contracts -------------------------------------------------------------------------------
//
// A Contract is a content *type*: a named set of fields, with no opinion at all about how any of
// it looks. `page` is the first one, and for now it is as small as a page type can be.

export const CONTRACTS = [
  {
    externalId: 'page',
    name: 'Page',
    // Its `sections` field constrains which Templates may appear in it, and those Templates are
    // created after this Contract. `apply.mjs` therefore revisits it once they exist -- see the
    // second pass in applyModel.mjs.
    namesTemplates: true,
    fields: ({ templates }) => [
      // Mandatory, so a page can never be published without one. Localizable from day one --
      // see the note on `L` above.
      text('Title', 'title', { mandatory: true, localizable: true }),
      // The page's own summary. Used as the standfirst on the page and as its meta description,
      // which is one value doing two jobs rather than two values drifting apart.
      text('Summary', 'description', { localizable: true }),
      rich('Body', 'body', { localizable: true }),
      // A page built out of parts. Each entry names a Template and the content to render through
      // it, so a page's shape is authored rather than coded -- reorder the list and the page
      // reorders. `allowedTemplateIds` is what keeps that from becoming a free-for-all: an author
      // picks from the Templates that belong on a page, not from every Template in the system.
      presentationField('Sections', 'sections', {
        enumerable: true,
        settings: { allowedTemplateIds: ids(templates, ['hero', 'prose']) },
      }),
    ],
  },
  {
    // A heading, some words, and optionally somewhere to go. Deliberately not called `hero` or
    // `intro`: a Contract describes what content *is*, and naming it after one of its
    // presentations is the quickest way to end up with `hero-2` a year later.
    externalId: 'statement',
    name: 'Statement',
    fields: () => [
      text('Heading', 'heading', { mandatory: true, localizable: true }),
      text('Standfirst', 'standfirst', { localizable: true }),
      // Personalizable as well as localizable, from the start. There are no audiences yet, so
      // every variant list is empty and this behaves exactly like an ordinary field.
      rich('Body', 'body', { localizable: true, personalizable: true }),
      link('Call to action', 'cta', {}),
      text('Call-to-action label', 'cta-label', { localizable: true }),
    ],
  },
]

// ---- templates -------------------------------------------------------------------------------
//
// A Template is a *presentation*: a name the front end dispatches on, plus the set of Contracts
// it knows how to render, plus its own settings. `src/presentations/page.tsx` renders this one,
// found by its external id and nothing else.

export const TEMPLATES = [
  {
    externalId: 'page',
    name: 'Page',
    supports: ['page'],
    settings: [],
  },
  // Two Templates, one Contract. This is the distinction worth internalising early: `statement`
  // says what the content is, and `hero` and `prose` are two ways of showing it. Adding a third
  // presentation later is a new Template and a new file in src/presentations -- it is not a new
  // content type, and nothing already authored has to move.
  {
    externalId: 'hero',
    name: 'Hero',
    supports: ['statement'],
    settings: [],
  },
  {
    externalId: 'prose',
    name: 'Prose section',
    supports: ['statement'],
    settings: [],
  },
]

// ---- folders ---------------------------------------------------------------------------------
//
// Folders organise the Component library for the people authoring in it. They have nothing to do
// with URLs -- that is the Experience tree's job, further down.

export const FOLDERS = [{ name: 'Pages' }]

// ---- components ------------------------------------------------------------------------------
//
// A Component is one piece of content of one Contract's type. This is the About page's text, and
// it is not yet a page: it is content, sitting in the library, that a page can point at.

export const COMPONENTS = [
  {
    // The front page. It has no body of its own -- it is assembled entirely out of `sections`,
    // which is what "composition" means here. Each section is a Template plus the content to run
    // through it, and the content is *inline*: this hero belongs to the front page and to nothing
    // else, so giving it a life of its own in the library would be clutter rather than reuse.
    externalId: 'home-page',
    name: 'Home',
    contract: 'page',
    folder: 'Pages',
    document: ({ contracts, templates, nodes }) => ({
      title: L('Northwind Coffee'),
      description: L(
        'Small-batch coffee from four farms we know by name, roasted on the north coast and posted out the same week.',
      ),
      sections: [
        presentation(
          templates.hero,
          inline(contracts.statement, {
            heading: L('Coffee worth the wait'),
            standfirst: L('Four farms. Two roast days a week. Nothing older than a month.'),
            body: P(
              L(
                md(
                  'We are a small roastery on the north coast, and we would rather sell you one coffee you love than six you are unsure about.',
                ),
              ),
            ),
            // A link to another page in this site, by node identity rather than by URL. The
            // Delivery API resolves the current path for it on every request, so moving the
            // target page never leaves this link stale.
            cta: experienceLink(nodes['about']),
            'cta-label': L('How we work'),
          }),
        ),
        presentation(
          templates.prose,
          inline(contracts.statement, {
            heading: L('On the roaster this month'),
            body: P(
              L(
                md(
                  [
                    "The Guji lot has just landed and it is the best thing we have bought this year — peach, bergamot, and a finish that goes on longer than it has any right to. It will not last.",
                    '',
                    'Alongside it: the Huila washed lot we buy every year, which is as reliable as coffee gets, and a Sumatran that divides the room and always has.',
                  ].join('\n'),
                ),
              ),
            ),
          }),
        ),
      ],
    }),
  },
  {
    externalId: 'about-page',
    name: 'About Northwind Coffee',
    contract: 'page',
    folder: 'Pages',
    document: () => ({
      title: L('A small roastery on the north coast'),
      description: L(
        'We buy coffee from farms we have visited, roast it in small batches on a Tuesday, and post it out the same week.',
      ),
      // Localizable *and* RichText, so the markdown block sits inside the locale envelope:
      // `L(md(...))`. The order matters and the compiled schema will tell you if you get it
      // the wrong way round.
      body: L(
        md(
          [
            'Northwind Coffee started in 2016 in a converted boatshed, with one 5kg roaster and a',
            'stubborn conviction that most coffee is roasted too dark and shipped too late.',
            '',
            '## How we buy',
            '',
            'We work with four producing partners and visit each of them at least once every two',
            'years. We pay above the Fairtrade floor on every lot, and we publish what we paid.',
            '',
            '## How we roast',
            '',
            'Small batches, Tuesdays and Thursdays. Everything is rested for a week before it goes',
            'out, and nothing sits on our shelf for longer than a month.',
          ].join('\n'),
        ),
      ),
    }),
  },
]

// ---- site and experience nodes ---------------------------------------------------------------
//
// The Experience tree is what turns content into a *site*. Each node owns a path segment and
// points at a Component through a Template -- that pairing is a "Presentation", and it is what
// the front end resolves when someone visits a URL.
//
// A site is simply the root node. `path: ''` is that root.

export const SITE = { name: 'Northwind Coffee' }

export const NODES = [
  // The site root itself. A site *is* its root node, so the front page needs no node of its own --
  // give the root a payload and `/` is served.
  { path: '', name: 'Home', template: 'page', component: 'home-page' },
  { path: 'about', name: 'About', template: 'page', component: 'about-page' },
]
