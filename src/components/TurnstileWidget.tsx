import { useEffect, useRef } from 'react'
import '../types/turnstile.d'

interface Props {
  onVerify: (token: string) => void
  onExpire?: () => void
}

// Loads and renders the Cloudflare Turnstile bot-protection widget.
// In dev mode (VITE_TURNSTILE_SITE_KEY not set), the widget is skipped and
// onVerify is called immediately with a sentinel — the server also skips
// verification when TURNSTILE_SECRET_KEY is absent.
export function TurnstileWidget({ onVerify, onExpire }: Props) {
  const divRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined

  useEffect(() => {
    if (!siteKey) {
      // Dev bypass: auto-verify with sentinel so the rest of the form works
      onVerify('__dev_bypass__')
      return
    }

    const container = divRef.current
    if (!container) return

    function renderWidget() {
      if (!container || !window.turnstile || widgetIdRef.current) return
      widgetIdRef.current = window.turnstile.render(container, {
        sitekey: siteKey!,
        callback: (token) => onVerify(token),
        'error-callback': () => onVerify(''),
        'expired-callback': () => {
          onVerify('')
          onExpire?.()
        },
        theme: 'light',
      })
    }

    if (window.turnstile) {
      renderWidget()
    } else {
      const existingScript = document.querySelector<HTMLScriptElement>('[data-cf-turnstile]')
      if (!existingScript) {
        const s = document.createElement('script')
        s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
        s.async = true
        s.defer = true
        s.dataset.cfTurnstile = ''
        s.onload = renderWidget
        document.head.appendChild(s)
      } else {
        existingScript.addEventListener('load', renderWidget, { once: true })
      }
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
  // onVerify and onExpire are not deps — callers must memoize if needed
  // ponytail: simpler than wrapping in useCallback at every callsite
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey])

  if (!siteKey) return null   // dev: no widget rendered, auto-verified above

  return (
    <div
      ref={divRef}
      aria-label="Bot protection check"
      className="flex justify-center"
    />
  )
}
