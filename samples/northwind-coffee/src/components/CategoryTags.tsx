import type { CategoryDescriptor } from '@ebitex/content-sdk'

/**
 * The delivered category descriptor also carries `resolved`, which is `false` once the category
 * has been deleted. The SDK's published type does not declare it yet (@ebitex/content-sdk 0.9.66),
 * so it is widened here rather than worked around by testing something else -- `resolved` is the
 * field the API documents as the signal, and reading anything else would be guessing.
 */
type DeliveredCategory = CategoryDescriptor & { resolved?: boolean }

/**
 * Renders one or more Category field values.
 *
 * A category value stores a pointer, never a label. The `value` you see here is the category's own
 * current text, read live at delivery time -- so renaming "Medium-dark" in Settings renames it on
 * every page at once, with nothing republished. That is the deliberate exception to the rule that
 * published content is frozen, and it is why a closed set like roast level belongs in a taxonomy
 * rather than in a text field on every coffee.
 *
 * `resolved: false` means the category has since been deleted. Rendering nothing is the honest
 * response; rendering a dangling id is not.
 */
export function CategoryTags({ categories }: { categories: (CategoryDescriptor | undefined)[] }) {
  const present = (categories as (DeliveredCategory | undefined)[]).filter(
    (c): c is DeliveredCategory => c !== undefined && c.resolved !== false && Boolean(c.value),
  )
  if (present.length === 0) return null

  return (
    <ul className="mt-4 flex flex-wrap gap-2">
      {present.map((c) => (
        <li
          key={c.key}
          className="rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent"
        >
          {c.value}
        </li>
      ))}
    </ul>
  )
}
