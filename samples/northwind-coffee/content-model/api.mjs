// ---------------------------------------------------------------------------------------------
// INTERNAL TOOLING. This is not a supported way to put content into ebitex, and the tutorial
// never asks you to run it.
//
// It talks to `/content/v1/*` -- the *authoring* API that the Content app itself uses, which is
// authenticated with a browser session cookie rather than a key. There is no public authoring
// API today: a delivery key is read-only and delivery-only. So this script exists for one
// reason, and it is a good one -- reading it is the clearest way to see an entire content model
// as data, in dependency order, in one file. Diff `content-model/` between two step tags and you
// can see precisely what each step of the tutorial added.
//
// To put this content into your own organization, import a bundle from `seed/` instead. That is
// a real, supported, shipped path, and it is what the tutorial tells you to do.
// ---------------------------------------------------------------------------------------------

export class ContentApiError extends Error {
  constructor(method, path, status, body) {
    super(`${method} ${path} → ${status}${body ? `: ${typeof body === 'string' ? body : JSON.stringify(body)}` : ''}`)
    this.status = status
    this.body = body
  }
}

export function createContentApi({ baseUrl, cookie, environmentId, deliveryEnvironmentId, log = () => {} }) {
  const base = baseUrl.replace(/\/+$/, '')
  // Publishing, host mapping, and keys resolve "the" delivery environment from the authoring one;
  // an authoring environment mapped to several targets (Production + Acceptance) must name it.
  const deliveryQuery = deliveryEnvironmentId ? `?deliveryEnvironmentId=${deliveryEnvironmentId}` : ''

  async function request(method, path, body) {
    const headers = { Cookie: cookie, Accept: 'application/json' }
    if (environmentId) headers['X-Content-Environment'] = environmentId
    if (body !== undefined) headers['Content-Type'] = 'application/json'
    const response = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
    log(`${method} ${path} → ${response.status}`)
    if (response.status === 204) return undefined
    const text = await response.text()
    let parsed
    try {
      parsed = text ? JSON.parse(text) : undefined
    } catch {
      parsed = text
    }
    if (!response.ok) throw new ContentApiError(method, path, response.status, parsed)
    return parsed
  }

  /**
   * Uploads one blob (raw bytes, not JSON — spec 448-product-pages-cms). Returns the descriptor
   * `{ blobId, contentType, sizeBytes }`, which is exactly a Blob field's stored value. The store
   * is content-addressed, so re-uploading identical bytes is a safe no-op returning the same id.
   */
  async function uploadBlob(bytes, contentType) {
    const headers = { Cookie: cookie, Accept: 'application/json', 'Content-Type': contentType }
    if (environmentId) headers['X-Content-Environment'] = environmentId
    const response = await fetch(`${base}/content/v1/blobs`, { method: 'POST', headers, body: bytes })
    log(`POST /content/v1/blobs (${contentType}) → ${response.status}`)
    const text = await response.text()
    let parsed
    try {
      parsed = text ? JSON.parse(text) : undefined
    } catch {
      parsed = text
    }
    if (!response.ok) throw new ContentApiError('POST', '/content/v1/blobs', response.status, parsed)
    return parsed
  }

  const get = (path) => request('GET', path)
  const post = (path, body) => request('POST', path, body)
  const put = (path, body) => request('PUT', path, body)
  const patch = (path, body) => request('PATCH', path, body)
  const del = (path) => request('DELETE', path)

  /**
   * Publish plan/execute became async bulk-operation jobs (spec 470-bulk-operations-async-jobs):
   * the POST answers 202 `{ id, status }` and the old synchronous response shape now arrives as
   * the finished run's `result`. Kick off, then poll `GET /bulk-operations/{id}` until the run
   * settles — `succeeded` returns `result`, `failed` throws its `error` detail. Found live by spec
   * 505-blog-page-cms's verification pass, the first script run against post-#470 main.
   */
  async function runBulkOperation(path, body) {
    const kickoff = await post(path, body)
    for (let attempt = 0; ; attempt++) {
      if (attempt > 300) throw new ContentApiError('POST', path, 202, `bulk operation ${kickoff.id} still ${kickoff.status} after ${attempt} polls`)
      await new Promise((resolve) => setTimeout(resolve, attempt < 10 ? 500 : 2000))
      const run = await get(`/content/v1/bulk-operations/${kickoff.id}`)
      if (run.status === 'succeeded') return run.result
      if (run.status === 'failed') throw new ContentApiError('POST', path, 202, run.error ?? `bulk operation ${kickoff.id} failed`)
      kickoff.status = run.status
    }
  }

  return {
    get,
    post,
    put,
    patch,
    del,

    // ---- environments ----
    environments: () => get('/content/v1/environments'),
    createEnvironment: (kind, name) => post('/content/v1/environments', { kind, name }),
    replaceDeliveryTargets: (authoringId, deliveryIds) =>
      put(`/content/v1/environments/${authoringId}/delivery-targets`, { deliveryEnvironmentIds: deliveryIds, reassign: false }),
    deleteEnvironment: (id) => del(`/content/v1/environments/${id}`),

    // ---- contracts ----
    listContracts: async () => (await get('/content/v1/contracts?pageSize=200')).items,
    getContract: (id) => get(`/content/v1/contracts/${id}`),
    createContract: (input) => post('/content/v1/contracts', input),
    updateContract: (id, input) => put(`/content/v1/contracts/${id}`, input),

    // ---- templates ----
    listTemplates: async () => (await get('/content/v1/templates?pageSize=200')).items,
    getTemplate: (id) => get(`/content/v1/templates/${id}`),
    createTemplate: (input) => post('/content/v1/templates', input),
    updateTemplate: (id, input) => put(`/content/v1/templates/${id}`, input),

    // ---- adapters ----
    listAdapters: () => get('/content/v1/adapters'),
    getAdapter: (id) => get(`/content/v1/adapters/${id}`),
    createAdapter: (input) => post('/content/v1/adapters', input),
    updateAdapter: (id, input) => patch(`/content/v1/adapters/${id}`, input),
    // spec 536-search-polymorphic-cards: previews a named Adapter's projection of one real
    // Component — { content, warnings }.
    previewAdapter: (adapterId, provider, key) => post('/content/v1/adapters/preview', { adapterId, provider, key }),

    // ---- streams (spec 524-marketing-site-search: the first content-model script to author one) ----
    listStreams: () => get('/content/v1/streams'),
    getStream: (id) => get(`/content/v1/streams/${id}`),
    createStream: (input) => post('/content/v1/streams', input),
    updateStream: (id, input) => put(`/content/v1/streams/${id}`, input),

    // ---- taxonomy (spec 513-blog-index-page: the Topics group backing blog-page's category field) ----
    listCategoryGroups: () => get('/content/v1/taxonomy/groups'),
    createCategoryGroup: (externalId, name) => post('/content/v1/taxonomy/groups', { externalId, name, metadataFields: null }),
    listCategories: (groupId) => get(`/content/v1/taxonomy/groups/${groupId}/categories`),
    createCategory: (input) => post('/content/v1/taxonomy/categories', input),

    // ---- blobs ----
    uploadBlob,

    // ---- folders & components ----
    listFolders: () => get('/content/v1/folders'),
    createFolder: (name, parentFolderId) => post('/content/v1/folders', { name, parentFolderId }),
    findComponents: async (search) => (await get(`/content/v1/components?search=${encodeURIComponent(search)}&pageSize=100`)).items,
    getComponent: (id) => get(`/content/v1/components/${id}`),
    createComponent: (input) => post('/content/v1/components', input),
    updateComponent: (id, input) => put(`/content/v1/components/${id}`, input),

    // ---- experience tree ----
    listSites: () => get('/content/v1/experience/sites'),
    createSite: (name) => post('/content/v1/experience/sites', { name }),
    getNode: (id) => get(`/content/v1/experience/nodes/${id}`),
    listChildren: (id) => get(`/content/v1/experience/nodes/${id}/children`),
    createNode: (parentNodeId, name, slug) => post('/content/v1/experience/nodes', { parentNodeId, name, slug }),
    setPresentationPayload: (id, presentation) => put(`/content/v1/experience/nodes/${id}/payload`, { kind: 'presentation', presentation }),

    // ---- publishing & delivery ----
    planPublish: (kind, id) => runBulkOperation('/content/v1/publish/plan', { kind, id, deliveryEnvironmentId }),
    publish: (items) => runBulkOperation('/content/v1/publish', { items, deliveryEnvironmentId }),
    getSiteHosts: (rootId) => get(`/content/v1/delivery/sites/${rootId}/hosts${deliveryQuery}`),
    replaceSiteHosts: (rootId, hosts) => put(`/content/v1/delivery/sites/${rootId}/hosts${deliveryQuery}`, { hosts }),
    listDeliveryKeys: () => get('/content/v1/delivery/keys'),
    createDeliveryKey: (name, allowedOrigins) =>
      post('/content/v1/delivery/keys', { name, expiresAtUtc: null, deliveryEnvironmentId, allowedOrigins, allowedIpRanges: [] }),
  }
}
