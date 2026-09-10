/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONTENT_DELIVERY_KEY?: string
  readonly VITE_CONTENT_API_BASE_URL?: string
  readonly VITE_CONTENT_SITE_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
