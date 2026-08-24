// Sets document.title dynamically per page.
// Usage: usePageTitle('Book a Court') → "Book a Court — Beanstalk Dink"
// Usage: usePageTitle('') → "Beanstalk Dink — Book a Pickleball Court in Marilao, Bulacan"

import { useEffect } from 'react'

const BRAND = 'Beanstalk Dink'
const BASE_TITLE = `${BRAND} — Book a Pickleball Court in Marilao, Bulacan`

export function usePageTitle(pageTitle?: string) {
  useEffect(() => {
    document.title = pageTitle ? `${pageTitle} — ${BRAND}` : BASE_TITLE
    return () => { document.title = BASE_TITLE }
  }, [pageTitle])
}
