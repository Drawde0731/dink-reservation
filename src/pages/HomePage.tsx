import { Link } from 'react-router-dom'

export function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-4xl font-bold text-brand-green-dark sm:text-5xl">
        Your Court. Your Game.
      </h1>
      <p className="mt-4 max-w-lg text-lg text-text-muted">
        Book your pickleball session at Beanstalk Dink in Marilao, Bulacan. Reserve
        online in seconds — no account needed.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to="/book"
          className="inline-flex min-h-[52px] items-center rounded-lg bg-[#E76F51] px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-[#d4623f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#276749] focus-visible:ring-offset-2"
        >
          Book a Court
        </Link>
        <Link
          to="/book"
          className="inline-flex min-h-[52px] items-center rounded-lg border border-brand-border bg-white px-6 py-3 text-lg font-semibold text-text-primary transition-colors hover:bg-brand-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#276749] focus-visible:ring-offset-2"
        >
          View Availability
        </Link>
      </div>
      {/* Full homepage — Phase 3 */}
    </div>
  )
}
