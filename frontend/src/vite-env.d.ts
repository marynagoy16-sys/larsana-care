/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_ENABLE_DEV_LOGIN?: string
  readonly VITE_PLATFORM_WEB_URL?: string
  readonly VITE_ENABLE_PAYMENT_SIMULATION?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
