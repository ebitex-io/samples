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
    fields: () => [
      // Mandatory, so a page can never be published without one. Localizable from day one --
      // see the note on `L` above.
      text('Title', 'title', { mandatory: true, localizable: true }),
      // The page's own summary. Used as the standfirst on the page and as its meta description,
      // which is one value doing two jobs rather than two values drifting apart.
      text('Summary', 'description', { localizable: true }),
      rich('Body', 'body', { localizable: true }),
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
  { path: 'about', name: 'About', template: 'page', component: 'about-page' },
]
