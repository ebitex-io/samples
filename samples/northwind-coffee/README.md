# Northwind Coffee

A speciality coffee roaster's website — a catalogue, brew guides, store list and wholesale enquiry
form — built on [ebitex](https://ebitex.io) Content.

It is a **static site**: Vite, React and TypeScript, talking to the Content Delivery API from the
browser with `@ebitex/content-sdk`. There is no server of our own anywhere in it. That is a real
choice rather than a simplification — a content-driven marketing site is mostly cacheable reads, and
a static bundle on a CDN is the cheapest, fastest and least breakable way to serve those. The price
is that a crawler which does not run JavaScript sees only the shell, which is why a server-rendered
sibling sample is planned.

**Every page on this site is resolved from the CMS.** There is exactly one route in the whole app,
matching everything, and what lives at a path is a question only the CMS answers. Publishing a page
makes it live; no code changes and nothing is redeployed.

## What it teaches

| Area | Where to look |
|---|---|
| The whole loop: Contract → Component → Template → Experience node → renderer | `content-model/model.mjs`, `src/presentations/page.tsx` |
| One route, every page — CMS-resolved routing with no page routes at all | `src/App.tsx`, `src/pages/ContentPage.tsx` |
| Renderer-by-convention: file name *is* the Template's external id | `src/lib/content.ts`, `src/presentations/` |
| A whole content model as readable data | `content-model/model.mjs` |
| Modifiers: mandatory, localizable, enumerable, personalizable | `content-model/model.mjs`, the `coffee` Contract |
| Blobs, and why alt text belongs on a Contract | `src/components/CmsImage.tsx` |
| Inline versus referenced content | `content-model/values.mjs` |
| Contextual values: one Component, a different framing in each place it is used | `content-model/model.mjs`, `src/components/OriginCard.tsx` |
| Localization: deciding the axis early, and enabling it later | `content-model/model.mjs`'s `L()`, `src/lib/locale.ts` |
| Locale fallback, and why a partly-translated site is a normal state | `src/components/LocaleSwitcher.tsx` |
| Personalization: one page, different words for trade and retail | `content-model/model.mjs`'s `AUDIENCES`, `src/lib/visitor.ts` |
| The context bag: your app reports facts, the CMS owns what they mean | `src/lib/visitor.ts` |
| Editorial workflow, and why governance needs a *thing* to govern | `content-model/model.mjs`'s `WORKFLOWS` |
| A second environment, and promotion between them | `content-model/model.mjs`'s `ENVIRONMENTS` |
| Which way promotion runs, and why that direction is not a convention | `content-model/applyModel.mjs`'s `promoteStaged` |
| Adapters: one Component, a second shape, no copy and no bespoke Contract | `content-model/model.mjs`'s `ADAPTERS`, `src/presentations/card.tsx` |
| Taxonomy: closed sets read live, not frozen | `src/components/CategoryTags.tsx` |
| Streams: a page whose content is a query | `content-model/model.mjs`, `src/components/CoffeeIndex.tsx` |
| Real facets — counts computed against the other active filters | `src/components/CoffeeIndex.tsx` |
| Published paths from a listing, instead of guessed URLs | `src/lib/originPaths.ts` |
| RichText with an embedded figure | `content-model/model.mjs`, `src/presentations/figure.tsx` |
| A query versus an authored list, and when each is right | `src/presentations/guide-index.tsx` |
| Embedding an ebitex Form — the suite over its own public surface | `src/presentations/form-embed.tsx` |
| Site chrome as content, addressed by external id | `src/lib/siteChrome.ts`, `src/components/NavLinks.tsx` |
| A sitemap built at deploy time, and why the SDK ships no route | `scripts/sitemap.mjs` |
| Browser-safe versus server-side keys, and what `VITE_` decides | `scripts/sitemap.mjs`, README step 4 |
| Generated types, and why a hand-written mirror of the model always rots | `scripts/codegen.mjs`, `src/types/content.d.ts` |

More arrives with each tutorial step; this table grows with it.

## Prerequisites

- **Node 20 or newer.**
- **An ebitex organization you control.** Not one of ours — there is no shared demo organization,
  by design. You import the content into your own, which is what makes it something you can change.
- **Content must be enabled for your organization.** Content is currently in Early Access behind the
  `app.content` flag. If Content shows as "Coming soon" in Hub, that is what is missing — ask us to
  enable it, and nothing below will work until it is.
- **A Pro allowance.** A new organization gets a **14-day Pro trial**, and that is the window this
  tutorial is written for. See "Which parts fit Starter" below for what happens after it.

## 1. Seed the content

The site has nothing to render until the content model and the content exist in your organization.
Import a bundle from [`seed/`](seed/) through **Content → Configure → Transfer → Import**.

Bundles are named for the tutorial step they match. On `main`, import the highest-numbered one; on a
step tag, import the highest-numbered bundle at or *below* your step:

| Bundle | Import it if you are on |
|---|---|
| `seed/step-03.zip` | `step-01` … `step-06` |
| `seed/step-07.zip` | `step-07` … `step-08` |
| `seed/step-09.zip` | `step-09` … `step-12` |
| `seed/step-13.zip` | `step-13` … `step-19` |
| `seed/final.zip` | `step-20` and `main` — the finished site |

Choose **Fresh identity** when the import screen offers it. That is what rewrites every id — and
every reference between them — so the content becomes genuinely yours rather than a copy carrying
another organization's identifiers.

Importing gives every entity fresh identity in your organization. It is your content from that
moment on — rename a Contract, add a field, break something and fix it.

**Then publish it.** An import writes drafts; nothing is delivered until it is published. Publish the
site root and each page from Composer, and publish `site-header` and `site-footer` from the Component
library — those two belong to no page, so no page's publish reaches them.

### Three things a bundle does not carry

A bundle carries **content**: Contracts, Templates, Components, pages, Adapters, Audiences, taxonomy,
streams, and the images they use. Some of what this sample demonstrates is **organization or
environment configuration** instead, which is not content and does not travel:

| | Set it up | Which step needs it |
|---|---|---|
| **Locales** | Settings → Locales: add `en`, then `fr` with `en` as its parent | 16. Without them the French text is *present in every document* and never selected — `?lang=fr` quietly serves English |
| **A workflow definition** | Settings → Workflows, then assign it to the `Seasonal` folder | 18 |
| **A second authoring environment** | Settings → Environments (Pro — Starter allows one) | 19 |

The locale one is worth doing before you conclude anything about step 16: it is the only gap here
that looks like nothing is wrong.
## 2. Configure

```bash
cp .env.example .env
```

| Variable | Where to get it |
|---|---|
| `VITE_CONTENT_DELIVERY_KEY` | Content → Settings → API Keys, in your own organization |
| `VITE_CONTENT_API_BASE_URL` | Optional. Leave unset unless you are pointing at a non-production API |
| `VITE_CONTENT_SITE_ID` | Optional. Content → Configure → Sites. Saves the SDK one discovery request |

**On the key.** A delivery key is read-only, and for local development an unrestricted one is fine.
A deployed static site is different: the key ships inside the JavaScript bundle where anyone can
read it, so a deployed copy should use a **browser-safe** key restricted to its own origins. Step 13
of the tutorial covers this properly, and the sample deliberately does not gloss over it.

## 3. Run

```bash
npm install
npm run dev
```

If you see "No delivery key configured", `.env` is missing or empty — that page is telling you so on
purpose rather than showing a 404.

## 4. Deploy

```bash
npm run build
```

That produces `dist/`, which any static host will serve. The sample deliberately does not name one:
they all work, and picking a favourite would read as an advertisement rather than as help.

Two things your host does need to be told.

**An SPA rewrite: `/*` → `/index.html`.** Every path on this site is served by the same
`index.html`, because the CMS decides what lives where. Without the rewrite, `/coffees` is a 404
from the host before the app ever runs — the single most common way a static deployment of a
CMS-driven site goes wrong.

**Two different keys.** The one in `VITE_CONTENT_DELIVERY_KEY` ships inside the JavaScript bundle,
where anyone can read it. That is unavoidable for a static site and is why ebitex has **browser-safe
keys**: a key restricted to your own origins is safe to publish, and an unrestricted one is not.
Create one in Content → Settings → API Keys with your site's origins filled in.

The sitemap is generated at build time by `scripts/sitemap.mjs` and needs the *other* kind — a
server-side key, in `CONTENT_DELIVERY_KEY` with no `VITE_` prefix. That prefix is precisely what
decides whether a value reaches the browser. A browser-safe key cannot be used from a build step at
all: it is restricted by `Origin`, Node sends no `Origin` header, and the request is refused with
`origin_denied`. That refusal is the mechanism working, not a misconfiguration.

## Which parts fit Starter

No Content *capability* is restricted by tier. Localization, personalization, contextual values,
workflow, Adapters and streams are available on every plan — there is no feature flag and no quota
key for any of them. What a plan buys is **scale and environments**:

| | Starter | Pro |
|---|---|---|
| Experience nodes | **10** | 200 |
| Components | 50 | 200 |
| Sites | 1 | 3 |
| Authoring / delivery environments | **1 / 1** | 3 / 5 |
| Categories | 100 | 5,000 |
| Blob storage | 1.5 GB | 15 GB |
| Delivery requests / day | 6,000 | 60,000 |

**A Starter organization stops at step 07.** The finished site is 24 Experience nodes and Starter
allows 10. Steps 01–06 build seven of them and fit comfortably; step 07 fills out the catalogue and
crosses the limit three pages in, with a plain refusal naming the quota:

```
403 quota_exceeded — content.max_experience_nodes
This organization has reached its plan's Experience node limit (10). Upgrade to create more.
```

That is not a problem the sample designs around — it is the demonstration. You meet the ceiling
while building something entirely reasonable, which says more than a pricing table does.

The tutorial assumes the **14-day Pro trial** a new organization gets, which is the window it is
written for and comfortably enough for the whole series. Step 19 is the one step that genuinely
needs Pro afterwards, because it uses a second authoring environment and Starter has exactly one.

## Following the tutorial

The [tutorial series](https://ebitex.io/blog) builds this site from an empty organization, one step
at a time, explaining why at each point. Every step is a tag:

```bash
git checkout northwind-coffee/step-07
```

At any step tag the sample builds, typechecks, and runs against an organization seeded with the
nearest bundle at or before that step. It is **not** always visually complete — a step that adds a
Contract before the code that renders it is a legitimate step, and the post says so when that is
where you are.

## Structure

```
src/
  App.tsx              the whole route table: one catch-all
  pages/ContentPage.tsx  resolves the current path against the CMS
  presentations/       one file per Template; the file name is the Template's external id
  lib/content.ts       the only place configuration is read and the SDK client is built
  types/content.d.ts   the delivered shapes, in TypeScript. Generated -- see below
assets/                every image this repo ships, and the script that generates them
content-model/         the content model as data. Internal tooling: read it, do not run it
seed/                  portable export bundles, one per checkpoint step
```

### Two languages

The site is in English and French. Switch with the control in the header, or add `?lang=fr` to any
URL.

Most of it is **deliberately untranslated** -- the header, the front page, the catalogue, the roast
and process labels and one coffee are in French, and everything else falls back to English. That is
not an unfinished job, it is the state every site translating itself passes through, and it is worth
seeing work.

The part worth noticing is what adding French did *not* touch. No Contract changed, no Template
changed, no renderer changed. Every localizable field has been written as `{ default, locales }`
since step 04, while the organization still had one language and the envelope looked like pointless
ceremony. Enabling the second language was adding a locale in Settings, filling in `locales`, and
passing one `locale` value to `<Experience>`.

Deciding that axis early costs almost nothing. Deciding it late costs a migration.

### Two audiences

Northwind sells a bag at a time to people at home and by the sack to cafés, and those readers want
different things from the same page. The footer has a "Buying" control; switch it to **For a café**
and the front page says something else. `?buyer=trade` on any URL does the same thing, which is how
a wholesale email would link you in.

The site sends one property, `buyerType`. The CMS decides what it *means* -- an Audience called
"Trade buyers" is the rule `buyerType equals trade`, and that rule lives in Settings. Widening who
counts as a trade buyer is a settings change that takes effect on already-published pages, because
audience definitions are read live at delivery rather than frozen at publish.

There is no tracking and no profile here. The bag is a fact this page already has, sent with a
request and used to resolve it. A real shop would more likely derive it from a signed-in account,
and the CMS side would be identical -- which is the useful part.

The two axes compose: switch to French *and* For a café and you get the trade copy in French,
without either the locale or the audience knowing the other exists.

### Seasonal copy gets reviewed

The note on the front page about what is on the roaster changes every month and is written in a
hurry, which makes it exactly the copy worth reading twice. Everything else here is edited by the
person who knows the answer and published when they are done.

So a review workflow is assigned to one **folder**, `Seasonal`, and inherited by what is in it.
Governance is a property of where content lives rather than a flag somebody has to remember to set.

The step's real lesson is what it forced. That note used to be written *inline* on the front page,
and it had to stop being inline before it could be reviewed:

> **You cannot review something that has no independent existence.**

A workflow governs a Component or an Experience node. Inline content has no version of its own and
no place in the library, so there is nothing for a review to be *about*. Wanting a paragraph
reviewed turns out to be a reason to make it a Component -- which is the same inline-versus-reference
question step 05 asked, arriving from the opposite direction.

A workflow's vocabulary comes from its **kind**, not from you. A publishing workflow always has
Draft and Approved; they cannot be renamed or removed, and Approved is what permits publishing.
Review and Rework are steps you add and name. You are choosing a shape rather than inventing a state
machine, which is what stops one team's workflow being unreadable to the next.

Open **On the roaster this month** in Content and look at its Settings tab to see the state and the
transitions.

### Staging the Christmas range

The Christmas range is decided in October and goes on sale in December. It is written in the ordinary
authoring environment along with everything else and simply not published -- that much is free. What
that does not give you is a way to *look at it*: an unpublished draft can be previewed a page at a
time, but nobody can walk the whole site with the range on it and decide whether it hangs together.

So there is a second authoring environment, `Staging`, with a delivery environment of its own. The
range is **promoted** into it and published there, against a key that is not the public one. When it
is ready it is published from the ordinary environment like anything else.

**This is the one step that genuinely requires Pro.** Starter allows exactly one authoring and one
delivery environment. Everything else in this sample runs on either tier -- no capability here is
tier-gated, and what Pro buys is scale and environments.

Two things this step teaches that are easy to get wrong:

- **Content flows downstream, away from where it is authored.** Promotion copies a closure keeping
  each item's identity, and the target's copies come *from* the source. Two environments that each
  grew their own `coffee` Contract have two different ids for it and nothing can reconcile them
  afterwards. So: author in one place, promote outwards. Do not apply a content model twice.
- **Plan, then execute -- and the root goes first.** The plan returns the whole dependency closure
  you did not ask for, and does more than it shows: promoting into an empty environment creates the
  site root and the ancestor nodes without those appearing in the plan at all. `execute` takes its
  root from the *first* item in the list, so echoing the plan back verbatim -- the obvious thing --
  makes a Contract the root and promotes one item, successfully and silently.

### A coffee, shown as a card

The front page ends with a row of "try these next" cards. A card is a heading, a line of small print
and a picture -- which is not what a coffee is.

The two obvious answers are both the same mistake. Adding card fields to `coffee` lets a
*presentation* dictate the shape of the content, and those fields mean nothing on the coffee's own
page. Writing a card-shaped copy of each coffee goes stale the first time somebody corrects a name.

An **Adapter** is the third answer: a named, reusable mapping from one Contract to another, applied
by the server. The binding still points at the coffee -- nothing is copied -- and delivery hands the
renderer a `card`. Open `src/presentations/card.tsx` and notice what is not in it: the word coffee.

Two details worth having:

- **The mapping is frozen at publish**, like the content it maps. Editing the Adapter does not change
  already-published pages until they are republished — a page delivered yesterday should not change
  because somebody edited a mapping today.
- **The link is not mapped, deliberately.** A coffee has no URL field, because a URL is a fact the
  CMS owns rather than content someone types. An Adapter changes the *shape* delivered, never the
  identity, so the card's binding still carries the coffee's own id — and `lib/publishedPaths.ts`
  turns that into the page it is published at. A card whose subject has no published page is simply
  not a link.

### Types are generated, not hand-written

`src/types/content.d.ts` is generated from the Delivery API's own schemas, and committed so the
project builds without a key:

```bash
npm run codegen
```

Until step 14 this project carried a hand-written types module -- one interface per Contract, kept
true by hand. It worked, and it was quietly wrong the whole time: rename a field in the CMS and
TypeScript happily keeps compiling against the old name, because nothing connects the two. Ten steps
of that is enough to feel the problem, which is the point of having felt it.

Two things to know if you re-run it against your own organization:

- It reads `CONTENT_DELIVERY_KEY` -- the **server-side** key, not `VITE_CONTENT_DELIVERY_KEY`. This
  runs in a terminal, and a browser-safe key is restricted by `Origin`, which Node never sends. Same
  distinction as `scripts/sitemap.mjs`, for the same reason.
- The doc comment above each type carries that Contract's id and version **in your organization**,
  so regenerating changes those comments. Expect that much diff and nothing more.

`content-model/` and `seed/` are two routes to the same place. The bundles are the fast path — import
one and the model exists. The script is the *legible* path: the entire model in one readable file,
which you can diff between step tags to see exactly what each step added. It authenticates against
the authoring API with a browser session cookie, which is not a supported integration path, so the
tutorial never asks you to run it.
