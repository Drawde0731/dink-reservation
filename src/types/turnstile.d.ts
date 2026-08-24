// Cloudflare Turnstile global — loaded from CDN on Step 4 of the booking flow.
// No npm package; the script injects window.turnstile at runtime.

interface TurnstileOptions {
  sitekey: string
  callback?: (token: string) => void
  'error-callback'?: () => void
  'expired-callback'?: () => void
  theme?: 'auto' | 'light' | 'dark'
}

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: TurnstileOptions) => string
      remove: (widgetId: string) => void
      reset: (widgetId: string) => void
      getResponse: (widgetId: string) => string | undefined
    }
  }
}

export {}
