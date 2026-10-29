# Starter kit site

A small React site that renders the **ebitex starter kit**: the generic Contracts, Templates and categories you install once into an
organization (Content → Starter kits) and then edit as your own. It draws the experience the kit installs with
[`@ebitex/starter-kit-react`](https://developers.ebitex.io/reference/starter-kit-react/) and the Content SDK, with Tailwind CSS 4.

The renderer lives in the package, so this sample holds only what a site decides for itself:

| File | What it decides |
|---|---|
| `src/lib/content.ts` | The Content client, and `ebitexRenderers()` (the kit's Templates, keyed by Template). Replace an entry to redraw one Template, or add your own |
| `src/lib/ebitex.tsx` | What this site changes about the kit: here, that links navigate client-side. |
| `src/index.css` | Tailwind, the kit's tokens, and any token you redefine |
| `src/components/ModeToggle.tsx` | A corner switch for light, dark or system colour mode |

It is meant to get you running and then be taken over. Redefine a `--ebitex-*` token to change a colour, replace a Template's entry in `renderers`
to redraw it or add a Template of your own, or run `npx starter-kit-eject src/kit` to copy the renderer into this project and drop the
dependency. The full walk-through is [Start a client site from the starter kit](https://developers.ebitex.io/getting-started/starter-kit/).

## Run it

1. Install the kit in your organization: Content → **Starter kits**. Leave "Include the demo experience" on, and connect Assets when the
   page asks. Then publish the demo (the site root `ebitex demo`).
2. Create a delivery key (Content → Configure → Delivery). For a deployed site use a browser-safe key restricted to your origin: the key
   ships inside the bundle.
3. `cp .env.example .env` and set `VITE_CONTENT_DELIVERY_KEY`.
4. `npm install && npm run dev`, then open <http://localhost:5190>.

To see another theme, open **Demo: home** in Content and change its Theme; to see an appearance, set one in a section's Template settings.

## Tests

`npm test` renders the experience from `src/test/fixtures/home-delivery.json`, a real Delivery API answer for the demo experience
(captured from a production organization with `resolveLocation`, with one uploaded asset chosen for the media section). A renderer proved
on a hand-written fixture can pass while drawing nothing against the real server, so refresh that file from a real response if the kit's
shape changes.
