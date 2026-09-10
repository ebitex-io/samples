/**
 * Where an embedded ebitex Form is served from.
 *
 * This site knows nothing else about Forms and makes no API call to it: an iframe and the shared
 * `embed.js` script are the entire integration surface. That is the same embed any customer of
 * ebitex Forms gets, which is exactly why the sample uses it rather than re-rendering a form from
 * its own definition.
 *
 * Both values are build-time, because Vite inlines them into the bundle. Setting them after the
 * build has no effect.
 */
export const formsBaseUrl = import.meta.env.VITE_FORMS_BASE_URL ?? 'https://forms.ebitex.io'

/**
 * Your organization's slug, which appears in every public form URL. Northwind Coffee embeds only
 * its own forms, so this is configuration rather than content -- a per-page slug field would let
 * an author embed some other organization's form by accident and buy nothing in return.
 */
export const formsOrgSlug = import.meta.env.VITE_FORMS_ORG_SLUG ?? ''
