/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONTENT_DELIVERY_KEY?: string
  readonly VITE_CONTENT_API_BASE_URL?: string
  readonly VITE_CONTENT_SITE_ID?: string
  readonly VITE_FORMS_BASE_URL?: string
  readonly VITE_FORMS_ORG_SLUG?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
