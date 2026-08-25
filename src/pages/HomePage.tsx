import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../lib/cn'

// Button-styled link helper — keeps the homepage self-contained without
// adding an `as` prop to the shared Button component (which has tests).
function LinkButton({
  to,
  href,
  variant = 'primary',
  size = 'md',
  className,
  children,
}: {
  to?: string
  href?: string
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  children: ReactNode
}) {
  const base = cn(
    'inline-flex items-center justify-center rounded-lg font-semibold transition-colors duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#276749] focus-visible:ring-offset-2',
    variant === 'primary' && 'bg-[#E76F51] text-white hover:bg-[#d4623f]',
    variant === 'secondary' && 'bg-brand-green-light text-text-primary hover:bg-[#92c5a6]',
    size === 'sm' && 'px-3 py-1.5 text-sm min-h-[36px]',
    size === 'md' && 'px-5 py-2.5 text-base min-h-[44px]',
    size === 'lg' && 'px-6 py-3 text-lg min-h-[52px]',
    className,
  )
  if (href) return <a href={href} className={base}>{children}</a>
  return <Link to={to ?? '/'} className={base}>{children}</Link>
}

// Pricing and hours shown here are static marketing content reflecting the
// values seeded in the database. If pricing or hours ever change, update
// both the seed migration and this page.

function CourtIcon() {
  return (
    <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="4" y="12" width="40" height="24" rx="2" />
      <line x1="24" y1="12" x2="24" y2="36" />
      <line x1="4" y1="24" x2="44" y2="24" />
      <circle cx="24" cy="24" r="5" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-brand-green-dark flex-shrink-0 mt-0.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M3 8l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function LocationIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
    </svg>
  )
}

export function HomePage() {
  return (
    <div className="bg-brand-cream">

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-brand-border">
        {/* Court photo */}
        <div
          className="absolute inset-0 bg-center bg-cover bg-no-repeat"
          style={{ backgroundImage: "url('/hero.avif')" }}
          aria-hidden="true"
        />
        {/* Premium dark gradient — stronger at top/bottom, lighter in centre so photo shows */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.45) 50%, rgba(0,0,0,0.72) 100%)' }}
          aria-hidden="true"
        />

        <div className="relative container mx-auto px-4 py-20 sm:py-28 lg:py-36 max-w-4xl text-center">
          {/* Location pill */}
          <div className="inline-flex items-center gap-2 text-white/90 font-medium text-sm mb-5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5">
            <CourtIcon />
            <span>Marilao, Bulacan</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight drop-shadow-md">
            Your Court.
            <br />
            <span className="text-[#7ed4a0]">Your Game.</span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-white/80 max-w-xl mx-auto leading-relaxed">
            Reserve a pickleball court at Beanstalk Dink in Marilao, Bulacan.
            Online booking in minutes — no account needed.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <LinkButton to="/book" variant="primary" size="lg" className="sm:px-8">
              Book a Court
            </LinkButton>
            <LinkButton href="#schedule" variant="secondary" size="lg" className="!bg-white/10 !text-white border border-white/30 hover:!bg-white/20 backdrop-blur-sm">
              View Schedule &amp; Pricing
            </LinkButton>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-white/70">
            <span className="flex items-center gap-1.5"><CheckIcon /> No account required</span>
            <span className="flex items-center gap-1.5"><CheckIcon /> ₱100 deposit secures your slot</span>
            <span className="flex items-center gap-1.5"><CheckIcon /> Instant confirmation by email</span>
          </div>
        </div>
      </section>

      {/* ── How it Works ─────────────────────────────────────────────── */}
      <section className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">Book in 3 minutes</h2>
          <p className="text-text-muted mt-2">No account, no hassle — just your name, email, and phone.</p>
        </div>

        <ol className="grid sm:grid-cols-3 gap-6">
          {[
            {
              n: '01',
              title: 'Pick a date & time',
              body: 'Browse available slots and choose a time that works for you — up to 30 days ahead.',
            },
            {
              n: '02',
              title: 'Enter your details',
              body: 'Your name, email address, and mobile number. That\'s the only information we need.',
            },
            {
              n: '03',
              title: 'Pay the ₱100 deposit',
              body: 'Secure your slot with a ₱100 deposit via QR Ph / GCash. Pay the balance on court day.',
            },
          ].map(step => (
            <li key={step.n} className="bg-white rounded-2xl border border-brand-border p-6 shadow-sm relative overflow-hidden">
              <span className="absolute top-4 right-4 text-5xl font-black text-brand-surface select-none leading-none">{step.n}</span>
              <h3 className="font-bold text-text-primary text-lg mb-2 relative">{step.title}</h3>
              <p className="text-sm text-text-muted leading-relaxed relative">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Courts & Pricing ─────────────────────────────────────────── */}
      <section id="schedule" className="bg-white border-y border-brand-border">
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">Courts & Pricing</h2>
            <p className="text-text-muted mt-2">Two dedicated pickleball courts — same rate for both.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 mb-8">
            {[
              {
                name: 'Court One',
                description: 'Full-size pickleball court, suited for singles and doubles play.',
              },
              {
                name: 'Court Two',
                description: 'Full-size pickleball court, suited for singles and doubles play.',
              },
            ].map(court => (
              <div key={court.name} className="rounded-2xl border border-brand-border bg-brand-cream p-6 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-center text-brand-green-dark">
                    <CourtIcon />
                  </div>
                  <div>
                    <h3 className="font-bold text-text-primary">{court.name}</h3>
                    <p className="text-xs text-text-muted">Beanstalk Dink</p>
                  </div>
                </div>

                <p className="text-sm text-text-muted">{court.description}</p>

                <div className="border-t border-brand-border pt-4 flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold text-text-primary">₱500</span>
                  <span className="text-sm text-text-muted">/ hour</span>
                </div>

                <LinkButton to="/book" variant="primary" size="sm">
                  Book this court
                </LinkButton>
              </div>
            ))}
          </div>

          {/* Deposit callout */}
          <div className="rounded-xl bg-brand-surface border border-brand-border p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-orange flex items-center justify-center text-white font-bold text-lg">
              ₱
            </div>
            <div>
              <p className="font-semibold text-text-primary">₱100 reservation deposit required</p>
              <p className="text-sm text-text-muted mt-0.5">
                The deposit is paid online to secure your slot. The remaining ₱400 balance is settled at the venue on the day of play.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Schedule & Location ───────────────────────────────────────── */}
      <section className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="grid sm:grid-cols-2 gap-8">

          {/* Operating hours */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ClockIcon />
              <h2 className="text-xl font-bold text-text-primary">Operating Hours</h2>
            </div>
            <div className="bg-white rounded-2xl border border-brand-border divide-y divide-brand-border overflow-hidden">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                <div key={day} className="flex justify-between px-4 py-3 text-sm">
                  <span className="text-text-muted">{day}</span>
                  <span className="font-medium text-text-primary">8:00 AM – 12:00 AM</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-text-muted mt-2 pl-1">
              Last booking slot starts at 11:00 PM.
            </p>
          </div>

          {/* Location */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <LocationIcon />
              <h2 className="text-xl font-bold text-text-primary">Location</h2>
            </div>

            <div className="bg-white rounded-2xl border border-brand-border p-5 space-y-4">
              <div>
                <p className="font-semibold text-text-primary">Beanstalk Dink</p>
                <p className="text-text-muted text-sm mt-0.5">Marilao, Bulacan</p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex gap-2 text-text-muted">
                  <span className="text-lg">📞</span>
                  {/* TODO: replace with real contact number */}
                  <span>+63 XXX XXX XXXX</span>
                </div>
                <div className="flex gap-2 text-text-muted">
                  <span className="text-lg">✉️</span>
                  {/* TODO: replace with real contact email */}
                  <span>contact@beanstalldink.com</span>
                </div>
              </div>

              <a
                href="https://maps.google.com/?q=Marilao+Bulacan+Philippines"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-brand-green-dark font-medium hover:underline"
              >
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M7 13l-5-5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 8h11" strokeLinecap="round" />
                  <path d="M9 5l4 3-4 3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Open in Google Maps
              </a>
            </div>

            {/* Cancellation quick note */}
            <div className="mt-4 bg-white rounded-2xl border border-brand-border p-5">
              <p className="text-sm font-semibold text-text-primary mb-1">Cancellation Policy</p>
              <p className="text-sm text-text-muted">
                Cancel 24+ hours before your session for a full deposit refund.
                No-shows forfeit the deposit.
              </p>
              <Link
                to="/cancellation-policy"
                className="text-sm text-brand-green-dark underline mt-2 inline-block hover:opacity-80"
              >
                Read full policy
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────── */}
      <section className="bg-brand-green-dark text-white">
        <div className="container mx-auto px-4 py-14 max-w-2xl text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Ready to play?</h2>
          <p className="text-brand-green-light mb-7 text-sm">
            Pick your slot and reserve your court in under 3 minutes.
          </p>
          <LinkButton to="/book" variant="primary" size="lg" className="sm:px-10">
            Book a Court Now
          </LinkButton>
        </div>
      </section>

    </div>
  )
}
