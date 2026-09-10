// The shapes a stored document is made of. Shared by model.mjs (which authors them) and
// applyModel.mjs (which sends them), so the two can never disagree about what a value looks like.

/**
 * Drops `null`/`undefined` keys. An optional field is *absent* from a stored document, never
 * `null` -- a component, link or presentation value's compiled schema rejects `null` outright.
 */
export function compact(document) {
  return Object.fromEntries(
    Object.entries(document).filter(([, value]) => value !== null && value !== undefined),
  )
}

/**
 * Content that lives inside whatever holds it, with no independent existence: no entry in the
 * library, no separate publish, nothing else can point at it.
 *
 * Use it when the content genuinely belongs to one place -- a page's own hero, a guide's own
 * steps. Reach for `reference` instead when several things share the content, or when it is worth
 * finding on its own. That is a modelling question about the content, not a performance one.
 */
export function inline(contract, document) {
  return {
    mode: 'inline',
    contract: contract.id,
    contractVersion: contract.latestVersion.versionNumber,
    document: compact(document),
  }
}

/** A pointer to a Component in the library, which many things may share. */
export function reference(component, contextualValues) {
  const value = { mode: 'reference', provider: 'core', key: component.id }
  if (contextualValues) value.contextualValues = contextualValues
  return value
}

/**
 * A reference bound *through an Adapter* -- the same pointer, plus the name of a mapping to run on
 * the way out.
 *
 * The stored value still points at the original Component and nothing is copied. What changes is
 * what a renderer is handed: the Adapter's **output** Contract, with the binding's `contract`
 * descriptor rewritten to match, so a slot expecting a card can be filled by a coffee.
 *
 * `{ id }` names a saved Adapter. A mapping can also be written inline on one binding, which is the
 * right call for a one-off and the wrong one for something three cards share -- this Adapter is
 * named because it is reused, and because a named one can be corrected in a single place.
 */
export function adapted(component, adapter) {
  return { mode: 'reference', provider: 'core', key: component.id, adapter: { id: adapter.id } }
}

export function templateVersion(template) {
  return template.latestVersionNumber ?? template.latestVersion?.versionNumber
}

/**
 * A Template paired with the content to render through it. This is what the front end dispatches
 * on: the Template's external id picks `src/presentations/<id>.tsx`, and the component is what
 * that renderer is handed.
 */
export function presentation(template, component, settings = {}) {
  return { template: template.id, templateVersion: templateVersion(template), component, settings }
}

/**
 * A link to another page in this site.
 *
 * Note what is *not* stored: the URL. Only the target node's identity is, and the Delivery API
 * resolves the current localized path for it on every request. Move the target page and every link
 * to it follows; unpublish it and `url` comes back null, which is the honest answer rather than a
 * link into a 404.
 *
 * This is why `external` should be reserved for genuinely external destinations. The API enforces
 * that anyway -- an external URL must be absolute, so `/coffees` is rejected outright.
 */
export function experienceLink(node) {
  return { kind: 'experience', target: { provider: 'core', key: node.id, kind: 'experience' } }
}

/**
 * A Category field's value: a pointer to one entry in a taxonomy, keyed by `<group>/<key>`.
 *
 * Notice what is *not* stored: the label. "Light" is the category's own current value, read live
 * at delivery, so renaming it in Settings renames it on every page at once without republishing
 * anything.
 */
export function categoryValue(categories, group, key) {
  return { provider: 'core', key: categories[`${group}/${key}`].id }
}
