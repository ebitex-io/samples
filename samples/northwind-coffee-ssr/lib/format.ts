/**
 * Presentation-only formatting.
 *
 * The price is stored as a plain number, not as "£14.50", because a formatted string is a
 * presentation decision baked into content -- it cannot be localized, cannot be sorted, and cannot
 * be compared. Deciding what a number *looks like* is this file's job.
 */
const PRICE = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' })

export const formatPrice = (value: number) => PRICE.format(value)

export const formatWeight = (grams: number) => `${grams}g`
