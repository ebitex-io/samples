import 'server-only'
import { cookies } from 'next/headers'

import { BUYER_COOKIE, contextFor, parseBuyerType } from '@/lib/buyerType'
import { localeFrom } from '@/lib/locales'

/**
 * The options every resolve of the current page is made with -- built in exactly one place.
 *
 * ---- Why this is a module and not two identical object literals ----
 *
 * A page is resolved twice per request: once by `generateMetadata`, which runs before the render
 * tree exists, and once by the page component. Those two cost **one** `/path` request rather than
 * two, because the SDK's request cache collapses concurrent callers asking for the same location.
 *
 * "The same location" includes the options. The locale and the personalization context are part of
 * the cache key -- they have to be, or one reader's variant could be served to another -- so two
 * callers that differ on either are two different questions and get two different requests.
 *
 * The failure mode is what makes this worth a file. Passing no context, or a slightly different
 * one, is not a type error and not a visible bug: both calls succeed, both render correctly, and
 * the page quietly costs twice what it should. Nothing fails, so nothing tells you. One function
 * means the two cannot drift apart, and the check for it is to *count* requests rather than to
 * read the code and agree with it.
 */
export async function resolveOptionsFor(searchParams: Record<string, string | string[] | undefined>) {
  const cookieStore = await cookies()
  const locale = localeFrom(searchParams.lang)
  const buyerType = parseBuyerType(cookieStore.get(BUYER_COOKIE)?.value)
  return { locale, context: contextFor(buyerType) }
}
