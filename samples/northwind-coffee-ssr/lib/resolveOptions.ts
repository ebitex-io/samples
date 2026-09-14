import 'server-only'
import { cookies } from 'next/headers'

import { BUYER_COOKIE, contextFor, parseBuyerType } from '@/lib/buyerType'

/**
 * The options every resolve of the current page is made with -- built in exactly one place.
 *
 * ---- Why this is a module and not three identical object literals ----
 *
 * A page is resolved three times per request: by the layout (for `<html lang>`), by
 * `generateMetadata`, which runs before the render tree exists, and by the page component. Those
 * cost **one** `/path` request rather than three, because the SDK's request cache collapses
 * concurrent callers asking for the same location.
 *
 * "The same location" includes the options. The personalization context is part of the cache key
 * -- it has to be, or one reader's variant could be served to another -- so two callers that differ
 * on it are two different questions and get two different requests.
 *
 * The failure mode is what makes this worth a file. Passing no context, or a slightly different
 * one, is not a type error and not a visible bug: every call succeeds, every one renders correctly,
 * and the page quietly costs more than it should. Nothing fails, so nothing tells you. One function
 * means the callers cannot drift apart, and the check for it is to *count* requests rather than to
 * read the code and agree with it.
 *
 * There is no locale in here any more. It is part of the **address** (`/fr/cafes`), which goes to
 * `resolveLocation` exactly as it arrived; the server reads the locale off it, and the SDK sends no
 * `locale=` beside it -- the server would refuse one.
 */
export async function resolveOptions() {
  const cookieStore = await cookies()
  const buyerType = parseBuyerType(cookieStore.get(BUYER_COOKIE)?.value)
  return { context: contextFor(buyerType) }
}

/**
 * The request path, as it arrived -- `/fr/cafes/ethiopia-guji` stays `/fr/cafes/ethiopia-guji`.
 *
 * The catch-all hands it over as segments, so it is re-joined, and that is all that happens to it.
 * It used to be split here into a locale and "the path the CMS should be asked for"; the server does
 * that now, with the site's own configuration rather than this app's copy of it.
 */
export function requestPath(segments: string[] | undefined): string {
  return '/' + (segments ?? []).join('/')
}
