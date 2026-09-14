/**
 * Presentation-only formatting.
 *
 * The price is stored as a plain number, not as "£14.50", because a formatted string is a
 * presentation decision baked into content -- it cannot be localized, cannot be sorted, and cannot
 * be compared. Deciding what a number *looks like* is this file's job.
 */
/**
 * The currency is the app's decision, not the content's, and it is exported so that anything
 * else needing to name it -- the `Product` JSON-LD in `lib/pageMetadata.ts` -- reads it here
 * rather than inventing one. An invented currency is a wrong price, not a missing one.
 */
export const PRICE_CURRENCY = 'GBP'

const PRICE = new Intl.NumberFormat('en-GB', { style: 'currency', currency: PRICE_CURRENCY })

export const formatPrice = (value: number) => PRICE.format(value)

export const formatWeight = (grams: number) => `${grams}g`
