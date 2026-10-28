/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string
  readonly VITE_REGION?: string
  readonly VITE_FLAP_WINDOW_SEC?: string
  readonly VITE_POLL_MS?: string
  readonly VITE_NUM_WORKERS?: string
  readonly VITE_BATCH?: string
  readonly VITE_TENANTS?: string
  readonly VITE_READ_ONLY?: string
  readonly VITE_MAIL_GATEWAY?: string
  readonly VITE_SLACK_WEBHOOK?: string
  readonly VITE_PAGERDUTY_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.module.scss' {
  const classes: Readonly<Record<string, string>>
  export default classes
}
