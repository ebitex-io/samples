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
