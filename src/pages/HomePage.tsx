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
      <section className="relative overflow-hidden min-h-[92vh] flex flex-col justify-center">
        {/* Court photo */}
        <div
          className="absolute inset-0 bg-center bg-cover bg-no-repeat"
          style={{ backgroundImage: "url('/hero.avif')" }}
          aria-hidden="true"
        />
        {/* Gradient: dark left + dark bottom, photo bleeds right */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(105deg, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.72) 40%, rgba(0,0,0,0.35) 70%, rgba(0,0,0,0.20) 100%), linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 40%)' }}
          aria-hidden="true"
        />

        <div className="relative container mx-auto px-6 pt-14 pb-8 sm:pt-20 sm:pb-10 max-w-5xl">
          {/* Pre-label */}
          <p className="text-xs font-bold tracking-[0.22em] uppercase text-[#7ed4a0]/80 mb-5">
            Beanstalk Dink · Marilao, Bulacan
          </p>

          {/* Main headline */}
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-white leading-[0.92] tracking-tight max-w-2xl">
            Your Court.
            <br />
            <span className="text-[#7ed4a0]">Your Game.</span>
          </h1>

          <p className="mt-7 text-base sm:text-lg text-white/70 max-w-md leading-relaxed">
            Book a pickleball court online in minutes. No account needed —
            just your name and a ₱100 deposit to secure your slot.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <LinkButton to="/book" variant="primary" size="lg" className="!px-8 !text-base shadow-lg">
              Book a Court
            </LinkButton>
            <LinkButton
              href="#schedule"
              variant="secondary"
              size="lg"
              className="!bg-white/10 !text-white !border !border-white/30 hover:!bg-white/20"
            >
              See Pricing
            </LinkButton>
          </div>

          <div className="mt-6 flex flex-wrap gap-x-7 gap-y-2 text-sm text-white/55">
            <span className="flex items-center gap-1.5"><CheckIcon /> No account required</span>
            <span className="flex items-center gap-1.5"><CheckIcon /> ₱100 deposit secures your slot</span>
            <span className="flex items-center gap-1.5"><CheckIcon /> Instant confirmation</span>
          </div>
        </div>

      </section>

      {/* ── Stats strip ──────────────────────────────────────────────── */}
      <section className="bg-[#111] border-y border-white/5">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/10">
            {[
              { num: '2', label: 'Courts' },
              { num: '₱500', label: 'Per hour' },
              { num: '16 hrs', label: 'Open daily' },
              { num: '₱100', label: 'To reserve' },
            ].map(stat => (
              <div key={stat.label} className="py-4 px-6 text-center">
                <p className="text-2xl sm:text-3xl font-black text-white leading-none">{stat.num}</p>
                <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it Works ─────────────────────────────────────────────── */}
      <section className="container mx-auto px-6 py-20 max-w-5xl">
        <div className="mb-12">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-brand-green-dark mb-2">How it works</p>
          <h2 className="text-3xl sm:text-4xl font-black text-text-primary">Book in 3 minutes</h2>
        </div>

        <ol className="grid sm:grid-cols-3 gap-px bg-brand-border overflow-hidden rounded-2xl border border-brand-border">
          {[
            {
              n: '01',
              title: 'Pick a date & time',
              body: 'Browse available slots — up to 30 days ahead. Select one hour or book multiple hours.',
            },
            {
              n: '02',
              title: 'Enter your details',
              body: 'Name, email, and mobile number. That\'s it — no account, no password.',
            },
            {
              n: '03',
              title: 'Pay the deposit',
              body: 'Secure your slot with a ₱100/hr deposit via QR Ph or GCash. Settle the balance on court day.',
            },
          ].map(step => (
            <li key={step.n} className="bg-white p-8 relative overflow-hidden">
              <span className="absolute -bottom-3 -right-1 text-[7rem] font-black text-brand-surface select-none leading-none pointer-events-none">
                {step.n}
              </span>
              <p className="text-xs font-bold tracking-[0.15em] uppercase text-brand-green-dark mb-3">Step {step.n}</p>
              <h3 className="font-black text-text-primary text-xl mb-3 leading-tight relative">{step.title}</h3>
              <p className="text-sm text-text-muted leading-relaxed relative">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Courts & Pricing ─────────────────────────────────────────── */}
      <section id="schedule" className="bg-brand-cream border-y border-brand-border">
        <div className="container mx-auto px-6 py-20 max-w-5xl">
          <div className="mb-12">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-brand-green-dark mb-2">The courts</p>
            <h2 className="text-3xl sm:text-4xl font-black text-text-primary">Two courts, same great rate</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 mb-8">
            {[
              { name: 'Court One', description: 'Full-size pickleball court. Singles and doubles. Good lighting.' },
              { name: 'Court Two', description: 'Full-size pickleball court. Singles and doubles. Good lighting.' },
            ].map(court => (
              <div key={court.name} className="rounded-2xl border border-brand-border bg-white p-7 flex flex-col gap-5 group hover:border-brand-green-dark transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-black text-text-primary">{court.name}</h3>
                    <p className="text-sm text-text-muted mt-1">{court.description}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-brand-surface flex items-center justify-center text-brand-green-dark flex-shrink-0">
                    <CourtIcon />
                  </div>
                </div>

                <div className="border-t border-brand-border pt-5 flex items-end justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-0.5">Rate</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-text-primary">₱500</span>
                      <span className="text-sm text-text-muted font-medium">/ hour</span>
                    </div>
                  </div>
                  <LinkButton to="/book" variant="primary" size="sm" className="!font-bold">
                    Book now
                  </LinkButton>
                </div>
              </div>
            ))}
          </div>

          {/* Deposit callout */}
          <div className="rounded-xl border-l-4 border-[#276749] bg-white border border-brand-border pl-6 pr-5 py-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#276749] flex items-center justify-center text-white font-black text-sm">
              ₱
            </div>
            <div>
              <p className="font-bold text-text-primary">₱100 per hour — paid online to reserve</p>
              <p className="text-sm text-text-muted mt-0.5">
                Book 3 hours? That's ₱300 deposit now. The remaining court fee is settled at the venue on the day.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Schedule & Location ───────────────────────────────────────── */}
      <section className="container mx-auto px-6 py-20 max-w-5xl">
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
      <section className="bg-[#111] text-white">
        <div className="container mx-auto px-6 py-20 max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-8">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#7ed4a0]/70 mb-3">Ready to play?</p>
            <h2 className="text-3xl sm:text-4xl font-black leading-tight">
              Your court is waiting.
            </h2>
            <p className="text-white/50 mt-2 text-sm">
              Reserve online in 3 minutes — ₱100/hr deposit, no account needed.
            </p>
          </div>
          <div className="flex-shrink-0">
            <LinkButton to="/book" variant="primary" size="lg" className="!px-10 !text-base shadow-lg whitespace-nowrap">
              Book a Court
            </LinkButton>
          </div>
        </div>
      </section>

    </div>
  )
}
