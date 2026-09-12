/**
 * Stream external ids, named once.
 *
 * Shared because the query now has two halves in two files — the browser asks this site
 * (`components/CoffeeGrid.tsx`), and this site asks the CMS (`app/api/coffees/route.ts`). A
 * constant duplicated across a client/server boundary is exactly the kind that drifts, and the
 * failure is a 404 from the CMS rather than anything the type system would catch.
 */
export const COFFEE_STREAM = 'coffees'
