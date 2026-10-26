# Starter kit renderer

A reference renderer for the **ebitex starter kit**: the generic, best-practice Contracts, Templates and categories you
install once into an organization (Content → Starter kits) and then edit as your own. This sample draws the experience the
kit installs as a real site with React, Tailwind CSS 4, themes, appearances and Assets media.

The kit stores *what* an experience says. This sample decides *how it looks*. Nothing here is special to ebitex's own apps:
it reads the Content Delivery API through `@ebitex/content-sdk`, so you can replace any file with your own design and keep
the content. It is meant to get you running quickly and then be taken over: change a token, replace a component, delete what
you do not use.

## What it draws

| Kit Contract | Renderer | Reads |
|---|---|---|
| `ebitex-experience` (and `ebitex-landing`) | `src/presentations/ebitex-experience-template.tsx` | the theme, SEO fields, an inline hero, a list of sections |
| `ebitex-hero` | `Hero` in `src/kit/blocks.tsx` | heading, lead, media, two actions; `layout` is `stacked`, `centered`, `split` or `split-reverse` |
| `ebitex-rich-text` | `RichTextBlock` | body |
| `ebitex-media` | `MediaBlock` | media (an Assets image, video or document), alt, caption; `aspect` |
| `ebitex-card` | `Card` | title, summary, media, action; `emphasis` is `default`, `featured` or `quiet` |
| `ebitex-feature` | `Feature` | icon, title, body |
| `ebitex-banner` | `Banner` | message, action; `tone` is `info`, `success`, `warning` or `critical` |
| `ebitex-cta` | `Cta` | heading, body, two actions |
| `ebitex-tabs`, `ebitex-accordion`, `ebitex-grid` | `src/kit/containers.tsx` | `items`; tab and accordion labels, `openByDefault`, grid `columns` and per-item `span` |

An experience's sections are Component **references**, not Template envelopes, so `src/kit/Section.tsx` dispatches on each
section's Contract. A section the renderer does not know (a Contract of your own that inherits `ebitex-presentation`) draws
nothing and leaves `data-kit-unknown` in the DOM, so a page never breaks on content a newer kit or you added.

## Categories, themes and appearances

Every closed choice in the kit is a **category** from one of the kit's groups (`ebitex-theme`, `-appearance`, `-layout`, `-width`,
`-background`, `-aspect-ratio`, `-emphasis`, `-tone`, `-action-style`), so you can rename or add to them in Content. The Delivery
API hands a renderer a category as a descriptor (`{ kind: "category", path: "ebitex-width/wide", value: "Wide", ... }`) and
nothing else, so **the renderer owns the mapping**: `src/lib/vocab.ts` reads the key after the slash and maps it to this site's
classes and tokens. A key it does not know falls back to the default, so a category you add draws as the default until you teach
the renderer about it.

- **Theme** is chosen once for the whole experience (required, defaults to `default`). It is written as `data-kit-theme` on the
  wrapper and `src/index.css` turns it into a token set: `default` keeps the reader's surfaces, `dark` is a dark experience
  whatever the mode, `brand` changes the accent family.
- **Appearance** is an optional override for one section (`muted`, `inverted`, `brand`, `highlight`). Empty means "use the theme".
  It is written as `data-kit-appearance` on that section's frame and overrides tokens for that subtree only.
- **Mode** (light, dark, or follow the system) belongs to the reader, not the author. The corner switch writes `data-mode` on
  `<html>`; it applies on top of whichever theme the experience has.

Every colour is a token in `src/index.css`, and components use only the token utilities (`bg-surface`, `text-ink`, `border-line`,
`bg-accent`), so a new look is a change to that one file.

## Media

A media field points at an asset in your **Assets** library, which Content reads as `ebitex-image`, `ebitex-video` or
`ebitex-document`. `src/kit/Media.tsx` draws each (an image with its real dimensions, a video with controls and captions, a
document as a download link). A field with nothing chosen draws a labelled placeholder of the same shape, so the layout holds and
a person can see where media goes.

## Run it

1. Install the kit in your organization: Content → **Starter kits**. Leave "Include the demo experience" on, and connect Assets
   when the page asks. Then publish the demo (the site root `ebitex demo`).
2. Create a delivery key (Content → Configure → Delivery). For a deployed site use a browser-safe key restricted to your origin: the
   key ships inside the bundle.
3. `cp .env.example .env` and set `VITE_CONTENT_DELIVERY_KEY`.
4. `npm install && npm run dev`, then open <http://localhost:5190>. The corner switch changes the colour mode.

To see another theme, open **Demo: home** in Content and change its Theme; to see an appearance, set one on a section's placement.

## Tests

`npm test` renders the experience from `src/test/fixtures/home-delivery.json`, a real Delivery API answer for the demo experience
(captured from a production organization with `resolveLocation`, with one uploaded asset chosen for the media section). A renderer
proved on a hand-written fixture can pass while drawing nothing against the real server, so refresh that file from a real response if
the kit's shape changes. `src/lib/vocab.test.ts` pins how a category descriptor is read.
