import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

/**
 * The one thing vitest needs that `next dev` and `next build` supply for it: the `@/` alias.
 *
 * It is declared in `tsconfig.json` under `paths`, which TypeScript uses to *type-check* an import
 * and no runtime uses to resolve one. Next's own bundler reads it; vitest does not, so without this
 * a module importing `@/lib/…` fails to resolve at test time while typechecking perfectly.
 *
 * Note also that vitest transpiles and does not type-check, so a green `npm test` says nothing
 * about types -- `npx tsc --noEmit` is the check for those, and CI runs both.
 */
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('.', import.meta.url)) },
  },
})
