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
    titleFieldPath: 'name',
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
    // One step of a brew guide. Never referenced, never published on its own, never shared: it
    // belongs to its guide and nothing else, so it is written *inline* and does not appear in the
    // Component library at all. Compare `origin`, which is the opposite decision for the opposite
    // reasons.
    externalId: 'guide-step',
    name: 'Guide step',
    fields: () => [
      text('Heading', 'heading', { localizable: true }),
      rich('Body', 'body', { localizable: true }),
    ],
  },
  {
    externalId: 'guide',
    name: 'Brew guide',
    titleFieldPath: 'heading',
    fields: ({ contracts }) => [
      text('Heading', 'heading', { mandatory: true, localizable: true }),
      text('Summary', 'summary', { localizable: true }),
      text('Equipment', 'equipment', { enumerable: true, localizable: true }),
      text('Total time', 'total-time', { localizable: true }),
      componentField('Steps', 'steps', {
        enumerable: true,
        settings: { allowedModes: ['inline'], allowedContractIds: ids(contracts, ['guide-step']) },
      }),
    ],
  },
  {
    externalId: 'guide-index',
    name: 'Guide index',
    fields: ({ contracts }) => [
      text('Heading', 'heading', { mandatory: true, localizable: true }),
      rich('Introduction', 'intro', { localizable: true }),
      // An *authored* list, deliberately, where `/coffees` is a query. A catalogue should be
      // complete and maintain itself; a set of guides is editorial -- someone decides which three
      // a beginner should read and in what order, and that decision is content.
      componentField('Guides', 'guides', {
        enumerable: true,
        settings: { allowedModes: ['reference'], allowedContractIds: ids(contracts, ['guide']) },
      }),
    ],
  },
  {
    // The catalogue page. Its content is a heading and an introduction; the grid itself is a
    // *query*, not authored -- see STREAMS below.
    externalId: 'coffee-index',
    name: 'Coffee index',
    fields: () => [
      text('Heading', 'heading', { mandatory: true, localizable: true }),
      rich('Introduction', 'intro', { localizable: true }),
    ],
  },
  {
    externalId: 'coffee',
    name: 'Coffee',
    // Which field is this type's human-readable title. The Delivery API freezes it at publish and
    // hands it back on every listing, so a navigation menu or a search result can show a real name
    // without resolving the whole document to find one.
    titleFieldPath: 'name',
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
  {
    // Renders an `image` inside a RichText body. A Template, not a field: an image placed in the
    // middle of a paragraph is a *presentation* of an image, and modelling it as a field would
    // force every body to choose its figure positions up front.
    externalId: 'figure',
    name: 'Figure',
    supports: ['image'],
    settings: [],
  },
  {
    externalId: 'guide',
    name: 'Brew guide',
    supports: ['guide'],
    settings: [],
  },
  {
    externalId: 'guide-index',
    name: 'Guide index',
    supports: ['guide-index'],
    settings: [],
  },
  {
    externalId: 'coffee-index',
    name: 'Coffee index',
    supports: ['coffee-index'],
    settings: [],
  },
]

// ---- streams ---------------------------------------------------------------------------------
//
// A stream is a saved, server-side query over published content, addressed by external id. The
// catalogue page runs one instead of fetching every coffee and filtering in the browser, which is
// the difference between a page that works at eight coffees and one that still works at eight
// hundred.
//
// `declaredFilters` is the stream's whole public surface. A caller may filter by these keys and
// nothing else -- there is no way to smuggle an arbitrary predicate in from the query string, and
// no way to read a field the stream does not expose. Each declared filter is also *facetable*:
// asking for a facet returns the distinct values and their counts, computed against every other
// active filter, which is what makes chips that show real numbers rather than guesses.
//
// A stream is configuration, never content: it is read live at delivery and is not published.

export const STREAMS = [
  {
    externalId: 'coffees',
    name: 'Coffees',
    sources: ['coffee'],
    orderByFieldPath: 'price',
    orderDescending: false,
    resolveDepth: 1,
    declaredFilters: [
      { key: 'q', type: 'fullText' },
      { key: 'roast', type: 'category' },
      { key: 'origin', type: 'reference', fieldPath: 'origin', labelFieldPath: 'name' },
    ],
  },
]

// ---- blobs -----------------------------------------------------------------------------------
//
// Files, uploaded once and then referred to by id. The store is content-addressed, so uploading
// identical bytes twice returns the same id and costs nothing -- which is what makes re-running
// this script cheap even though it "uploads" every image every time.

export const BLOBS = [
  'coffee-guji',
  'coffee-huila',
  'coffee-yirgacheffe',
  'coffee-antigua',
  'coffee-kirinyaga',
  'coffee-gayo',
  'coffee-narino',
  'coffee-hambela',
  'guide-pour-over',
  'guide-aeropress',
  'guide-cafetiere',
  'origin-ethiopia',
  'origin-colombia',
  'origin-guatemala',
  'origin-kenya',
  'origin-sumatra',
].map((externalId) => ({ externalId, file: `${externalId}.svg`, contentType: 'image/svg+xml' }))

// ---- folders ---------------------------------------------------------------------------------
//
// Folders organise the Component library for the people authoring in it. They have nothing to do
// with URLs -- that is the Experience tree's job, further down.

export const FOLDERS = [{ name: 'Pages' }, { name: 'Coffees' }, { name: 'Origins' }, { name: 'Guides' }]

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
  {
    externalId: 'origin-guatemala',
    name: 'Guatemala',
    contract: 'origin',
    folder: 'Origins',
    document: ({ contracts, blobs }) => ({
      name: L('Guatemala'),
      country: L('Guatemala'),
      altitude: '1,400-1,800 m',
      summary: L(md('Volcanic soil and a long dry season. We buy from Antigua, where the shade cover slows ripening and the cup comes out dense and cocoa-heavy rather than bright.')),
      image: inline(contracts.image, {
        file: blobs['origin-guatemala'],
        alt: L('An abstract landscape of layered hills.'),
      }),
    }),
  },
  {
    externalId: 'origin-kenya',
    name: 'Kenya',
    contract: 'origin',
    folder: 'Origins',
    document: ({ contracts, blobs }) => ({
      name: L('Kenya'),
      country: L('Kenya'),
      altitude: '1,600-2,000 m',
      summary: L(md('Sold through an auction system that rewards quality, and it shows. Kenyan lots are the most structured coffee we buy: blackcurrant, tomato leaf, and an acidity that can be startling if you are not expecting it.')),
      image: inline(contracts.image, {
        file: blobs['origin-kenya'],
        alt: L('An abstract landscape of layered hills.'),
      }),
    }),
  },
  {
    externalId: 'origin-sumatra',
    name: 'Sumatra',
    contract: 'origin',
    folder: 'Origins',
    document: ({ contracts, blobs }) => ({
      name: L('Sumatra'),
      country: L('Indonesia'),
      altitude: '1,200-1,600 m',
      summary: L(md('Wet-hulled, a processing method almost unique to Sumatra and responsible for everything people love and hate about it: low acidity, enormous body, and a savoury edge nothing else has.')),
      image: inline(contracts.image, {
        file: blobs['origin-sumatra'],
        alt: L('An abstract landscape of layered hills.'),
      }),
    }),
  },
  {
    externalId: 'coffee-index-page',
    name: 'Coffees',
    contract: 'coffee-index',
    folder: 'Pages',
    document: () => ({
      heading: L('What we are roasting'),
      intro: L(
        md(
          'Eight coffees, five origins and two roast days a week. Everything here was on a farm we have visited, and nothing sits on our shelf for more than a month.',
        ),
      ),
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
  },
  {
    externalId: 'coffee-huila',
    name: 'Colombia Huila, La Esperanza',
    contract: 'coffee',
    folder: 'Coffees',
    document: ({ contracts, blobs, components, categories }) => ({
      name: L('Colombia Huila, La Esperanza'),
      producer: 'Finca La Esperanza',
      description: P(L(md('Red apple and caramel, with the almond sweetness Huila does better than anywhere. Washed, dried on parabolic beds, and the one coffee we have bought every single year since we opened.'))),
      'tasting-notes': L(['Red apple', 'Caramel', 'Almond']),
      price: 12.5,
      'weight-grams': 250,
      image: inline(contracts.image, {
        file: blobs['coffee-huila'],
        alt: L('An abstract pattern of concentric arcs in the colours of a medium roast.'),
      }),
      origin: reference(components['origin-colombia']),
      roast: categoryValue(categories, 'roast', 'medium'),
      process: categoryValue(categories, 'process', 'washed'),
    }),
  },
  {
    externalId: 'coffee-yirgacheffe',
    name: 'Ethiopia Yirgacheffe, Kochere',
    contract: 'coffee',
    folder: 'Coffees',
    document: ({ contracts, blobs, components, categories }) => ({
      name: L('Ethiopia Yirgacheffe, Kochere'),
      producer: 'Kochere Washing Station',
      description: P(L(md('Jasmine and lemon, and a body like black tea. Washed Yirgacheffe is the coffee that convinced most of us to take this seriously in the first place, and it still tastes like nothing else.'))),
      'tasting-notes': L(['Jasmine', 'Lemon', 'Black tea']),
      price: 15,
      'weight-grams': 250,
      image: inline(contracts.image, {
        file: blobs['coffee-yirgacheffe'],
        alt: L('An abstract pattern of concentric arcs in the colours of a light roast.'),
      }),
      origin: reference(components['origin-ethiopia']),
      roast: categoryValue(categories, 'roast', 'light'),
      process: categoryValue(categories, 'process', 'washed'),
    }),
  },
  {
    externalId: 'coffee-antigua',
    name: 'Guatemala Antigua, El Pilar',
    contract: 'coffee',
    folder: 'Coffees',
    document: ({ contracts, blobs, components, categories }) => ({
      name: L('Guatemala Antigua, El Pilar'),
      producer: 'Finca El Pilar',
      description: P(L(md('Cocoa and orange peel over a walnut base. Grown under shade at the foot of Agua, which slows everything down and gives the cup a density that survives milk without disappearing into it.'))),
      'tasting-notes': L(['Cocoa', 'Orange peel', 'Walnut']),
      price: 13,
      'weight-grams': 250,
      image: inline(contracts.image, {
        file: blobs['coffee-antigua'],
        alt: L('An abstract pattern of concentric arcs in the colours of a medium roast.'),
      }),
      origin: reference(components['origin-guatemala']),
      roast: categoryValue(categories, 'roast', 'medium'),
      process: categoryValue(categories, 'process', 'washed'),
    }),
  },
  {
    externalId: 'coffee-kirinyaga',
    name: 'Kenya Kirinyaga, Kianjuki',
    contract: 'coffee',
    folder: 'Coffees',
    document: ({ contracts, blobs, components, categories }) => ({
      name: L('Kenya Kirinyaga, Kianjuki'),
      producer: 'Kianjuki Factory',
      description: P(L(md('Blackcurrant and grapefruit, with the structure Kenyan coffee is bought for. The most assertive thing on our list, and we make no apology for it: brew it a little weaker than you think you should.'))),
      'tasting-notes': L(['Blackcurrant', 'Grapefruit', 'Cane sugar']),
      price: 16.5,
      'weight-grams': 250,
      image: inline(contracts.image, {
        file: blobs['coffee-kirinyaga'],
        alt: L('An abstract pattern of concentric arcs in the colours of a light roast.'),
      }),
      origin: reference(components['origin-kenya']),
      roast: categoryValue(categories, 'roast', 'light'),
      process: categoryValue(categories, 'process', 'washed'),
    }),
  },
  {
    externalId: 'coffee-gayo',
    name: 'Sumatra Gayo, Bener Meriah',
    contract: 'coffee',
    folder: 'Coffees',
    document: ({ contracts, blobs, components, categories }) => ({
      name: L('Sumatra Gayo, Bener Meriah'),
      producer: 'Gayo Highlands cooperative',
      description: P(L(md('Cedar, dark chocolate and tobacco. Wet-hulled, low in acidity, enormous in body, and the coffee that divides our own staff more than any other. Try it in a moka pot before you decide.'))),
      'tasting-notes': L(['Cedar', 'Dark chocolate', 'Tobacco']),
      price: 12,
      'weight-grams': 250,
      image: inline(contracts.image, {
        file: blobs['coffee-gayo'],
        alt: L('An abstract pattern of concentric arcs in the colours of a dark roast.'),
      }),
      origin: reference(components['origin-sumatra']),
      roast: categoryValue(categories, 'roast', 'dark'),
      process: categoryValue(categories, 'process', 'wet-hulled'),
    }),
  },
  {
    externalId: 'coffee-narino',
    name: 'Colombia Narino, Buesaco',
    contract: 'coffee',
    folder: 'Coffees',
    document: ({ contracts, blobs, components, categories }) => ({
      name: L('Colombia Narino, Buesaco'),
      producer: 'Los Rosales',
      description: P(L(md('Honey-processed, which leaves some of the fruit on the bean while it dries and gives the cup a syrupy sweetness washed lots never quite reach. Peach and lime over honey.'))),
      'tasting-notes': L(['Peach', 'Honey', 'Lime']),
      price: 14,
      'weight-grams': 250,
      image: inline(contracts.image, {
        file: blobs['coffee-narino'],
        alt: L('An abstract pattern of concentric arcs in the colours of a medium roast.'),
      }),
      origin: reference(components['origin-colombia']),
      roast: categoryValue(categories, 'roast', 'medium'),
      process: categoryValue(categories, 'process', 'honey'),
    }),
  },
  {
    externalId: 'coffee-hambela',
    name: 'Ethiopia Hambela, Guji',
    contract: 'coffee',
    folder: 'Coffees',
    document: ({ contracts, blobs, components, categories }) => ({
      name: L('Ethiopia Hambela, Guji'),
      producer: 'Hambela Estate',
      description: P(L(md('A natural taken a shade darker than we usually go, which trades some of the floral top notes for strawberry and cacao. The coffee we recommend to people moving across from a supermarket blend.'))),
      'tasting-notes': L(['Strawberry', 'Cacao nib', 'Rose']),
      price: 15.5,
      'weight-grams': 250,
      image: inline(contracts.image, {
        file: blobs['coffee-hambela'],
        alt: L('An abstract pattern of concentric arcs in the colours of a medium-dark roast.'),
      }),
      origin: reference(components['origin-ethiopia']),
      roast: categoryValue(categories, 'roast', 'medium-dark'),
      process: categoryValue(categories, 'process', 'natural'),
    }),
  },

  // ---- brew guides ----
  {
    externalId: 'figure-pour-over',
    name: 'Pour Over figure',
    contract: 'image',
    folder: 'Guides',
    document: ({ blobs }) => ({
      file: blobs['guide-pour-over'],
      alt: L('A stylised brewing cone with a stream of water falling into it.'),
    }),
  },
  {
    externalId: 'figure-aeropress',
    name: 'Aeropress figure',
    contract: 'image',
    folder: 'Guides',
    document: ({ blobs }) => ({
      file: blobs['guide-aeropress'],
      alt: L('A stylised plunger vessel with a stream of water above it.'),
    }),
  },
  {
    externalId: 'figure-cafetiere',
    name: 'Cafetiere figure',
    contract: 'image',
    folder: 'Guides',
    document: ({ blobs }) => ({
      file: blobs['guide-cafetiere'],
      alt: L('A stylised tall vessel with a stream of water above it.'),
    }),
  },
  {
    externalId: 'guide-pour-over',
    name: 'Pour-over, the way we make it',
    contract: 'guide',
    folder: 'Guides',
    document: ({ contracts, templates, components }) => ({
      heading: L('Pour-over, the way we make it'),
      summary: L('A V60, a scale and four minutes. The method we use every morning.'),
      equipment: L(['V60 or similar cone', 'Paper filter', 'Scale', 'Gooseneck kettle']),
      'total-time': L('4 minutes'),
      steps: [
        inline(contracts['guide-step'], {
          heading: L('Rinse and weigh'),
          body: L({
            markdown: 'Rinse the paper filter with hot water and throw the water away — it removes the papery taste and warms the cone. Weigh 15g of coffee and grind it a little coarser than table salt.',
          }),
        }),
        inline(contracts['guide-step'], {
          heading: L('The bloom'),
          body: L({
            markdown: 'Start the timer and pour 45g of water, just off the boil, over the grounds. Everything will swell and bubble as trapped carbon dioxide escapes.\n\n{{embed:vessel}}\n\nWait 40 seconds. Skipping this is the single most common reason a pour-over tastes thin.',
            embeds: {
              // An *inline* embed: `{{embed:vessel}}` in the markdown above is a placeholder, and
              // this map says what it is. The embed is a Presentation like any other -- a Template
              // plus content -- so the front end renders it through `src/presentations/figure.tsx`
              // exactly as it renders a page section. The token is structural, not text.
              //
              // Note the figure is *referenced*, not written inline. An embed's Presentation binds
              // a Component from the library; the schema rejects an inline value here. That turns
              // out to be the right constraint anyway -- these three figures are shared by their
              // guide's several steps, so they were always going to want a life of their own.
              vessel: {
                kind: 'presentation',
                presentation: presentation(templates.figure, reference(components['figure-pour-over'])),
              },
            },
          }),
        }),
        inline(contracts['guide-step'], {
          heading: L('Pour in stages'),
          body: L({
            markdown: 'Pour to 150g in slow circles, wait for the bed to drop, then pour to 250g. Keep the stream small and near the centre; chasing the edges pushes grounds up the paper where water no longer reaches them.',
          }),
        }),
        inline(contracts['guide-step'], {
          heading: L('Finish and taste'),
          body: L({
            markdown: 'The last of the water should drain by about four minutes. Sour and thin means grind finer; bitter and dry means grind coarser. Change one thing at a time.',
          }),
        }),
      ],
    }),
  },
  {
    externalId: 'guide-aeropress',
    name: 'AeroPress for one',
    contract: 'guide',
    folder: 'Guides',
    document: ({ contracts, templates, components }) => ({
      heading: L('AeroPress for one'),
      summary: L('Forgiving, fast, and almost impossible to ruin. Where to start if you are starting.'),
      equipment: L(['AeroPress', 'Paper filter', 'Scale']),
      'total-time': L('2 minutes'),
      steps: [
        inline(contracts['guide-step'], {
          heading: L('Assemble inverted'),
          body: L({
            markdown: 'Put the plunger in about a centimetre and stand the whole thing upside down. It feels wrong the first time and then never again.',
          }),
        }),
        inline(contracts['guide-step'], {
          heading: L('Coffee and water'),
          body: L({
            markdown: 'Weigh 16g of coffee ground like fine sand and add 240g of water at about 90 degrees. Stir twice.\n\n{{embed:vessel}}',
            embeds: {
              // An *inline* embed: `{{embed:vessel}}` in the markdown above is a placeholder, and
              // this map says what it is. The embed is a Presentation like any other -- a Template
              // plus content -- so the front end renders it through `src/presentations/figure.tsx`
              // exactly as it renders a page section. The token is structural, not text.
              //
              // Note the figure is *referenced*, not written inline. An embed's Presentation binds
              // a Component from the library; the schema rejects an inline value here. That turns
              // out to be the right constraint anyway -- these three figures are shared by their
              // guide's several steps, so they were always going to want a life of their own.
              vessel: {
                kind: 'presentation',
                presentation: presentation(templates.figure, reference(components['figure-aeropress'])),
              },
            },
          }),
        }),
        inline(contracts['guide-step'], {
          heading: L('Wait, then press'),
          body: L({
            markdown: 'Wait ninety seconds. Screw on the rinsed filter cap, invert onto your cup, and press slowly — thirty seconds is about right. Stop when it hisses.',
          }),
        }),
        inline(contracts['guide-step'], {
          heading: L('Adjust to taste'),
          body: L({
            markdown: 'Too sharp? Wait longer. Too heavy? Grind coarser. The AeroPress tolerates a lot of variation, which is exactly why it is a good place to learn.',
          }),
        }),
      ],
    }),
  },
  {
    externalId: 'guide-cafetiere',
    name: 'Cafetiere, done properly',
    contract: 'guide',
    folder: 'Guides',
    document: ({ contracts, templates, components }) => ({
      heading: L('Cafetiere, done properly'),
      summary: L('The method everyone owns and almost nobody gets right. Two changes fix it.'),
      equipment: L(['Cafetiere', 'Scale', 'Spoon']),
      'total-time': L('9 minutes'),
      steps: [
        inline(contracts['guide-step'], {
          heading: L('Grind coarse, and mean it'),
          body: L({
            markdown: 'Coarser than you think: like coarse sea salt. A cafetiere has a metal filter, so anything fine ends up in the cup as sludge.',
          }),
        }),
        inline(contracts['guide-step'], {
          heading: L('Brew for four minutes'),
          body: L({
            markdown: 'Weigh 60g of coffee per litre of water just off the boil. Pour it all at once and leave it alone.\n\n{{embed:vessel}}',
            embeds: {
              // An *inline* embed: `{{embed:vessel}}` in the markdown above is a placeholder, and
              // this map says what it is. The embed is a Presentation like any other -- a Template
              // plus content -- so the front end renders it through `src/presentations/figure.tsx`
              // exactly as it renders a page section. The token is structural, not text.
              //
              // Note the figure is *referenced*, not written inline. An embed's Presentation binds
              // a Component from the library; the schema rejects an inline value here. That turns
              // out to be the right constraint anyway -- these three figures are shared by their
              // guide's several steps, so they were always going to want a life of their own.
              vessel: {
                kind: 'presentation',
                presentation: presentation(templates.figure, reference(components['figure-cafetiere'])),
              },
            },
          }),
        }),
        inline(contracts['guide-step'], {
          heading: L('Break the crust, then skim'),
          body: L({
            markdown: 'At four minutes a crust has formed on top. Stir it gently so it sinks, then skim off the foam and floating grounds with a spoon. This is the change most people have never been told about, and it is the one that matters.',
          }),
        }),
        inline(contracts['guide-step'], {
          heading: L('Wait, then press gently'),
          body: L({
            markdown: 'Leave it another five minutes so the fines settle, then press slowly — the plunger is there to hold grounds down, not to force water through them. Decant everything immediately or it keeps brewing.',
          }),
        }),
      ],
    }),
  },
  {
    externalId: 'guide-index-page',
    name: 'Brew guides',
    contract: 'guide-index',
    folder: 'Pages',
    document: ({ components }) => ({
      heading: L('Brew guides'),
      intro: L(
        md(
          'Three methods, in the order we would teach them. None of them needs equipment you cannot buy for the price of two bags of coffee.',
        ),
      ),
      guides: [
        reference(components['guide-pour-over']),
        reference(components['guide-aeropress']),
        reference(components['guide-cafetiere']),
      ],
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
  // `/coffees` stops being a bare structural node and becomes a page. Its children are unaffected:
  // a node's payload and its place in the tree are independent.
  { path: 'coffees', name: 'Coffees', template: 'coffee-index', component: 'coffee-index-page' },
  { path: 'guides', name: 'Brew guides', template: 'guide-index', component: 'guide-index-page' },
  { path: 'guides/pour-over', name: 'Pour-over, the way we make it', template: 'guide', component: 'guide-pour-over' },
  { path: 'guides/aeropress', name: 'AeroPress for one', template: 'guide', component: 'guide-aeropress' },
  { path: 'guides/cafetiere', name: 'Cafetiere, done properly', template: 'guide', component: 'guide-cafetiere' },
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
  { path: 'origins/colombia', name: 'Colombia', template: 'origin', component: 'origin-colombia' },  { path: 'coffees/colombia-huila', name: 'Colombia Huila, La Esperanza', template: 'coffee', component: 'coffee-huila' },
  { path: 'coffees/ethiopia-yirgacheffe', name: 'Ethiopia Yirgacheffe, Kochere', template: 'coffee', component: 'coffee-yirgacheffe' },
  { path: 'coffees/guatemala-antigua', name: 'Guatemala Antigua, El Pilar', template: 'coffee', component: 'coffee-antigua' },
  { path: 'coffees/kenya-kirinyaga', name: 'Kenya Kirinyaga, Kianjuki', template: 'coffee', component: 'coffee-kirinyaga' },
  { path: 'coffees/sumatra-gayo', name: 'Sumatra Gayo, Bener Meriah', template: 'coffee', component: 'coffee-gayo' },
  { path: 'coffees/colombia-narino', name: 'Colombia Narino, Buesaco', template: 'coffee', component: 'coffee-narino' },
  { path: 'coffees/ethiopia-hambela', name: 'Ethiopia Hambela, Guji', template: 'coffee', component: 'coffee-hambela' },
  { path: 'origins/guatemala', name: 'Guatemala', template: 'origin', component: 'origin-guatemala' },
  { path: 'origins/kenya', name: 'Kenya', template: 'origin', component: 'origin-kenya' },
  { path: 'origins/sumatra', name: 'Sumatra', template: 'origin', component: 'origin-sumatra' },
]
