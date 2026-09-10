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

import { categoryValue, experienceLink, inline, presentation, reference } from './values.mjs'

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
export const blob = (name, id, opts) => field(name, id, 'blob', opts)
export const presentationField = (name, id, opts) => field(name, id, 'presentation', opts)

/**
 * A field holding other content: either a pointer to a Component in the library, or content
 * written inline. `allowedModes` narrows that choice when only one of the two makes sense.
 */
export const componentField = (name, id, opts) => field(name, id, 'component', opts)

/** A field whose value is one entry from a taxonomy the organization defines. */
export const category = (name, id, opts) => field(name, id, 'category', opts)

/**
 * A Category field's group constraint. The entries are `{ provider, key }` references rather than
 * bare ids -- the settings schema rejects a bare Guid, which is the kind of thing you find out
 * once and then never forget.
 */
export const categoryGroups = (groups, externalIds) =>
  externalIds
    .map((id) => groups[id]?.id)
    .filter((id) => id !== undefined)
    .map((id) => ({ provider: 'core', key: id }))

/** Resolves a list of external ids to the ids of entities created earlier in the same run. */
export function ids(byExternalId, externalIds) {
  return externalIds.map((id) => byExternalId[id]?.id).filter((id) => id !== undefined)
}

// ---- taxonomy ----------------------------------------------------------------------------------
//
// Named lists the organization owns, editable without touching the model. Roast level is a
// taxonomy rather than a text field because it is a closed set that people filter by: an author
// picks from it, `/coffees` builds facets from it, and nobody can quietly invent "Med-Dark".

export const CATEGORY_GROUPS = [
  {
    externalId: 'roast',
    name: 'Roast level',
    categories: [
      { key: 'light', value: 'Light' },
      { key: 'medium', value: 'Medium' },
      { key: 'medium-dark', value: 'Medium-dark' },
      { key: 'dark', value: 'Dark' },
    ],
  },
  {
    externalId: 'process',
    name: 'Process',
    categories: [
      { key: 'washed', value: 'Washed' },
      { key: 'natural', value: 'Natural' },
      { key: 'honey', value: 'Honey' },
      { key: 'wet-hulled', value: 'Wet-hulled' },
    ],
  },
]

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
  {
    // An image and the text that belongs with it. Alt text is mandatory and localizable, which is
    // the whole reason this is a Contract rather than a bare Blob field on everything that needs a
    // picture: a Blob is bytes, and bytes cannot be described.
    externalId: 'image',
    name: 'Image',
    fields: () => [
      blob('File', 'file', { mandatory: true }),
      text('Alt text', 'alt', { mandatory: true, localizable: true }),
    ],
  },
  {
    // An origin is shared by several coffees and has a page of its own, so it is a Component in
    // the library that things point *at*, rather than content written inside each coffee. That is
    // the whole inline-versus-reference question, and it is answered by asking whether the thing
    // has an independent life -- not by counting rows.
    externalId: 'origin',
    name: 'Origin',
    fields: ({ contracts }) => [
      text('Name', 'name', { mandatory: true, localizable: true }),
      text('Country', 'country', { localizable: true }),
      text('Altitude', 'altitude', {}),
      rich('Summary', 'summary', { localizable: true }),
      componentField('Image', 'image', {
        settings: { allowedModes: ['inline'], allowedContractIds: ids(contracts, ['image']) },
      }),
    ],
  },
  {
    externalId: 'coffee',
    name: 'Coffee',
    fields: ({ contracts, categoryGroups: categoryGroups_ }) => [
      text('Name', 'name', { mandatory: true, localizable: true }),
      // Not localizable: a producer's name is a proper noun and stays as it is in every language.
      // Deciding this per field is the work; getting it wrong in either direction is visible.
      text('Producer', 'producer', {}),
      // Personalizable, for the same reason `statement.body` is -- a trade buyer and someone
      // buying a single bag want different things said to them. No audiences exist yet.
      rich('Description', 'description', { localizable: true, personalizable: true }),
      // Enumerable: cardinality is a modifier on an ordinary field, never a different field type.
      // The same `shortText` that holds one value holds a list of them.
      text('Tasting notes', 'tasting-notes', { enumerable: true, localizable: true }),
      num('Price (£)', 'price', {}),
      num('Bag size (g)', 'weight-grams', {}),
      // A picture belongs to one coffee and nothing else shares it, so it is written inline rather
      // than pointed at. Step 05 makes the opposite call for `origin`, and the two decisions side
      // by side are the point.
      componentField('Image', 'image', {
        settings: { allowedModes: ['inline'], allowedContractIds: ids(contracts, ['image']) },
      }),
      // Reference-only, and narrowed to one Contract. Without `allowedContractIds` an author could
      // point this at any Component in the library; with it, the field means what its name says.
      componentField('Origin', 'origin', {
        settings: { allowedModes: ['reference'], allowedContractIds: ids(contracts, ['origin']) },
      }),
      category('Roast', 'roast', {
        settings: { allowedCategoryGroupIds: categoryGroups(categoryGroups_, ['roast']) },
      }),
      category('Process', 'process', {
        settings: { allowedCategoryGroupIds: categoryGroups(categoryGroups_, ['process']) },
      }),
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
  {
    externalId: 'coffee',
    name: 'Coffee page',
    supports: ['coffee'],
    settings: [],
  },
  {
    externalId: 'origin',
    name: 'Origin page',
    supports: ['origin'],
    settings: [],
  },
]

// ---- blobs -----------------------------------------------------------------------------------
//
// Files, uploaded once and then referred to by id. The store is content-addressed, so uploading
// identical bytes twice returns the same id and costs nothing -- which is what makes re-running
// this script cheap even though it "uploads" every image every time.

export const BLOBS = [
  { externalId: 'coffee-guji', file: 'coffee-guji.svg', contentType: 'image/svg+xml' },
  { externalId: 'origin-ethiopia', file: 'origin-ethiopia.svg', contentType: 'image/svg+xml' },
  { externalId: 'origin-colombia', file: 'origin-colombia.svg', contentType: 'image/svg+xml' },
]

// ---- folders ---------------------------------------------------------------------------------
//
// Folders organise the Component library for the people authoring in it. They have nothing to do
// with URLs -- that is the Experience tree's job, further down.

export const FOLDERS = [{ name: 'Pages' }, { name: 'Coffees' }, { name: 'Origins' }]

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
  // ---- origins ----
  {
    externalId: 'origin-ethiopia',
    name: 'Ethiopia',
    contract: 'origin',
    folder: 'Origins',
    document: ({ contracts, blobs }) => ({
      name: L('Ethiopia'),
      country: L('Ethiopia'),
      altitude: '1,750–2,200 m',
      summary: L(
        md(
          'Coffee grew here before anyone wrote it down. Most of what we buy is from smallholders in Guji and Yirgacheffe, in lots of a few hundred kilograms, and the range within a single washing station can be startling.',
        ),
      ),
      image: inline(contracts.image, {
        file: blobs['origin-ethiopia'],
        alt: L('Layered hills in muted green, an abstract landscape.'),
      }),
    }),
  },
  {
    externalId: 'origin-colombia',
    name: 'Colombia',
    contract: 'origin',
    folder: 'Origins',
    document: ({ contracts, blobs }) => ({
      name: L('Colombia'),
      country: L('Colombia'),
      altitude: '1,500–2,000 m',
      summary: L(
        md(
          'Two harvests a year and enormous variation between departments. We buy from Huila and Nariño, where the altitude keeps the acidity bright and the sugars slow to develop.',
        ),
      ),
      image: inline(contracts.image, {
        file: blobs['origin-colombia'],
        alt: L('Layered hills in warm ochre, an abstract landscape.'),
      }),
    }),
  },
  // ---- coffees ----

  {
    externalId: 'coffee-guji',
    name: 'Ethiopia Guji — Shakiso',
    contract: 'coffee',
    folder: 'Coffees',
    document: ({ contracts, blobs, components, categories }) => ({
      name: L('Ethiopia Guji, Shakiso'),
      producer: 'Kayon Mountain Farm',
      description: P(
        L(
          md(
            [
              'Peach, bergamot and a long, clean finish. A natural-process lot from the Guji zone, picked at 1,950 metres and dried on raised beds for eighteen days.',
              '',
              'This is the coffee we hand people who say they do not like fruity coffee. It usually works.',
            ].join('\n'),
          ),
        ),
      ),
      // Localizable *and* enumerable, so the list sits inside the locale envelope -- one list per
      // locale, `L([...])`, not a list of separately-translated strings. The modifiers compose as
      // Localizable<list of shortText>, which the compiled schema will tell you if you invert it.
      'tasting-notes': L(['Peach', 'Bergamot', 'Brown sugar']),
      price: 14.5,
      'weight-grams': 250,
      image: inline(contracts.image, {
        file: blobs['coffee-guji'],
        alt: L('An abstract pattern of concentric arcs in the pale amber of a light roast.'),
      }),
      // A pointer, not a copy. Every Ethiopian coffee names this same Origin, so correcting a
      // detail about the region corrects it everywhere at once -- and the Origin has a page of
      // its own, which content written inside a coffee never could.
      origin: reference(components['origin-ethiopia']),
      roast: categoryValue(categories, 'roast', 'light'),
      process: categoryValue(categories, 'process', 'natural'),
    }),
  },]

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
  // `/coffees` is not listed and gets created anyway, as an ancestor of the page below it. A node
  // with no payload is real tree structure with no page of its own: `/coffees` itself 404s until
  // step 08 gives it an index. That is a legitimate state, not a gap to paper over.
  {
    path: 'coffees/ethiopia-guji',
    name: 'Ethiopia Guji',
    template: 'coffee',
    component: 'coffee-guji',
  },
  { path: 'origins/ethiopia', name: 'Ethiopia', template: 'origin', component: 'origin-ethiopia' },
  { path: 'origins/colombia', name: 'Colombia', template: 'origin', component: 'origin-colombia' },
]
