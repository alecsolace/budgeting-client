/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the budgeting-api instance this client talks to. */
  readonly VITE_API_BASE_URL: string
  /** Supabase project URL, e.g. https://xxxxxxxx.supabase.co */
  readonly VITE_SUPABASE_URL: string
  /** Supabase anon/publishable key. Public by design — never the service key. */
  readonly VITE_SUPABASE_ANON_KEY: string
  /** Public origin of this app, used to build the magic-link redirect target. */
  readonly VITE_PUBLIC_SITE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
