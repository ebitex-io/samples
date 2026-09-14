'use client'

import { createContext, useContext, type ReactNode } from 'react'

import { DEFAULT_LOCALE } from '@/lib/locales'

/**
 * The locale the current page is in, for the client components that need it.
 *
 * ---- Why a context, and why it is set by the server ----
 *
 * The locale is a fact the **server** reported: `GET /path` resolved the request address and said
 * which locale it named (`result.locale`). The page reads it off the result and provides it here,
 * so a client component asks this context and gets the server's answer.
 *
 * It used to be read off the pathname instead (`splitLocale(usePathname())`), which meant this app
 * held its own copy of the rule the server applies -- which segment is a prefix, which locale is
 * bare. Two copies of one rule agree until the configuration changes, and then disagree silently.
 * Under server-side addressing the pathname is simply passed through, so there is nothing for this
 * app to parse, and nothing here does.
 */
const LocaleContext = createContext<string>(DEFAULT_LOCALE)

export function LocaleProvider({ locale, children }: { locale: string; children: ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
}

/** The locale the page was resolved in, as the server reported it. */
export function useLocale(): string {
  return useContext(LocaleContext)
}
