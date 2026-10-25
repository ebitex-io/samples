# Starter kit renderer

A reference renderer for the **ebitex starter kit**: the generic, best-practice Contracts and
Templates every organization can opt in to (Content → Settings → Realms), drawn as a real site with
React, Tailwind CSS 4 and a light and a dark theme.

The kit stores *what* a page says. This sample decides *how it looks*. Nothing here is special to ebitex's
own apps: it reads the Content Delivery API through `@ebitex/content-sdk`, so you can replace any file with
your own design and keep the content.

## What it draws

| Kit Contract | Renderer | Reads |
|---|---|---|
| `kit-experience` (a page) | `src/presentations/kit-page.tsx` | SEO fields, an inline hero, a list of sections |
| `kit-hero` | `Hero` in `src/kit/blocks.tsx` | heading, lead, media, two actions; `layout` = `split` puts the image beside the text |
| `kit-rich-text` | `RichTextBlock` | body |
| `kit-media` | `MediaBlock` | media, alt, caption; `aspect` |
| `kit-card` | `Card` | title, summary, media, action; `emphasis` = `high` |
| `kit-feature` | `Feature` | icon, title, body |
| `kit-banner` | `Banner` | message, action; `tone` = `info`, `success`, `warning`, `danger` |
| `kit-cta` | `Cta` | heading, body, two actions |
| `kit-tabs`, `kit-accordion`, `kit-grid` | `src/kit/containers.tsx` | `items`; tab and accordion labels, `openByDefault`, grid `columns` and per-item `span` |

A page's sections are Component **references**, not Template envelopes, so `src/kit/Section.tsx` dispatches on each
section's Contract. A section the renderer does not know (a Contract of your own that inherits `kit-presentation`)
draws nothing and leaves `data-kit-unknown` in the DOM, so a page never breaks on content a newer kit or you added.

### How a section is placed

Layout, width, background, anchor, tone, emphasis, columns, tab labels and the like are **contextual fields**: their
values come from whatever references the Component, so one Component can be reused in many places with different
settings. The demo page places one banner twice, as information and as a warning. The kit declares those fields as
free text, so the words in `src/lib/vocab.ts` are this renderer's convention. A word it does not know falls back to
the default instead of breaking the page.

## Run it

1. In an organization that has opted in to the starter kit, create a delivery key (Content → Configure → Delivery).
2. `cp .env.example .env` and set `VITE_CONTENT_DELIVERY_KEY`. For a deployed site use a browser-safe key restricted to
   your origin: the key ships inside the bundle.
3. Put the demo page in your organization: import `seed/starter-kit-demo.bundle.json` (Content → Configure →
   Export and import), then publish the site root.
4. `npm install && npm run dev`, then open <http://localhost:5190>. The corner switch changes the theme.

The bundle names the kit's Contracts and Templates so the page's references resolve, and marks each with the
kit's realm key. On import, an item carrying that key is mapped onto your organization's own kit row and is never
written, so importing the demo does not copy the kit into your realm. It has no images (a blob belongs to one
organization); add your own to the hero, a card or a media section.

## Change the look

Every colour is a token in `src/index.css` (a light set and a dark set). Components use only the token utilities
(`bg-surface`, `text-ink`, `border-line`, `bg-accent`), never a literal colour, so a new look is a change to that
one block. Dark follows the reader's system until they choose with the switch.

## Tests

`npm test` renders the page from `src/test/fixtures/home-delivery.json`, a real Delivery API answer for the demo
page (with an uploaded image) captured with `resolveLocation` and edited only to replace the host name. A renderer
proved on a hand-written fixture can pass while drawing nothing against the real server, so refresh that file from a
real response if the kit's shape changes.

## Regenerate the seed

`content/demo.mjs` is the demo content and `content/kit.bundle.json` is the kit as ebitex ships it. After changing
either: `node content/build-demo.mjs`.
