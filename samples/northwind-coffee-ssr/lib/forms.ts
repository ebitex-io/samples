/**
 * Where an embedded ebitex Form is served from.
 *
 * This site knows nothing else about Forms and makes no API call to it: an iframe and the shared
 * `embed.js` script are the entire integration surface. That is the same embed any customer of
 * ebitex Forms gets, which is exactly why the sample uses it rather than re-rendering a form from
 * its own definition.
 *
 * Both values are build-time, because Next inlines a `NEXT_PUBLIC_` variable into the bundle.
 * Setting them after the build has no effect.
 *
 * The prefix is doing real work here, and it is worth contrasting with `CONTENT_DELIVERY_KEY` in
 * `lib/content.ts`. These two values *must* reach the browser -- they build the `src` of an iframe
 * the visitor's own browser loads -- so they are public by construction and named accordingly. The
 * delivery key must not, so it carries no prefix and lives behind `import 'server-only'`. In this
 * sample the naming is the whole distinction, which is why Next's convention is a good one.
 */
export const formsBaseUrl = process.env.NEXT_PUBLIC_FORMS_BASE_URL ?? 'https://forms.ebitex.io'

/**
 * Your organization's slug, which appears in every public form URL. Northwind Coffee embeds only
 * its own forms, so this is configuration rather than content -- a per-page slug field would let
 * an author embed some other organization's form by accident and buy nothing in return.
 */
export const formsOrgSlug = process.env.NEXT_PUBLIC_FORMS_ORG_SLUG ?? ''
