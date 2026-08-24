import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 text-center">
      <p className="text-6xl font-bold text-brand-green-light">404</p>
      <h1 className="mt-4 text-2xl font-bold text-brand-green-dark">Page not found</h1>
      <p className="mt-2 text-text-muted">That page doesn't exist.</p>
      <Link
        to="/"
        className="mt-8 inline-flex min-h-[44px] items-center rounded-lg bg-[#E76F51] px-5 py-2.5 text-base font-semibold text-white transition-colors hover:bg-[#d4623f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#276749] focus-visible:ring-offset-2"
      >
        Back to home
      </Link>
    </div>
  )
}
