import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../lib/cn'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

/* ─── Scroll-reveal ──────────────────────────────────────────────────── */
function useScrollReveal(ready: boolean) {
  useEffect(() => {
    if (!ready) return
    const observer = new IntersectionObserver(
      entries =>
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('is-revealed')
            observer.unobserve(e.target)
          }
        }),
      { threshold: 0.12 }
    )
    document.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [ready])
}

/* ─── Primary CTA ────────────────────────────────────────────────────── */
function BookCTA({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const sizes = {
    sm: 'px-4 py-2 text-sm min-h-[40px]',
    md: 'px-6 py-3 text-base min-h-[48px]',
    lg: 'px-8 py-3.5 text-base min-h-[52px]',
  }
  return (
    <Link
      to="/book"
      className={cn(
        'inline-flex items-center justify-center font-bold rounded-lg',
        'bg-[#E76F51] text-white hover:bg-[#d4623f] active:scale-[0.98]',
        'transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E76F51] focus-visible:ring-offset-2',
        sizes[size],
        className
      )}
    >
      Book a Court
    </Link>
  )
}

/* ─── Navigation ─────────────────────────────────────────────────────── */
const NAV_LINKS = [
  { label: 'Courts', href: '#courts' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Location', href: '#location' },
  { label: 'FAQ', href: '#faq' },
]

function Nav() {
  const [scrolled, setScrolled] = useState(() => window.scrollY > 60)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <header
      className={cn(
        'fixed top-0 inset-x-0 z-50 transition-all duration-300',
        'bg-[#0d1a10]/96 backdrop-blur-md border-b border-white/5',
        scrolled ? 'shadow-lg' : 'border-transparent'
      )}
    >
      <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="text-white font-black text-sm tracking-[0.15em] uppercase hover:opacity-75 transition-opacity"
        >
          Beanstalk Dink
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8" aria-label="Site navigation">
          {NAV_LINKS.map(l => (
            <a
              key={l.label}
              href={l.href}
              className="text-sm font-medium text-white/65 hover:text-white transition-colors duration-150"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:block">
          <BookCTA size="sm" />
        </div>

        {/* Mobile: CTA + hamburger */}
        <div className="flex md:hidden items-center gap-3">
          <BookCTA size="sm" className="!px-3 !py-1.5 !text-xs !min-h-[36px]" />
          <button
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="w-9 h-9 flex flex-col items-center justify-center gap-1.5 flex-shrink-0"
          >
            <span
              className={cn(
                'block w-5 h-0.5 bg-white transition-all duration-200',
                menuOpen && 'translate-y-2 rotate-45'
              )}
            />
            <span
              className={cn(
                'block w-5 h-0.5 bg-white transition-all duration-200',
                menuOpen && 'opacity-0'
              )}
            />
            <span
              className={cn(
                'block w-5 h-0.5 bg-white transition-all duration-200',
                menuOpen && '-translate-y-2 -rotate-45'
              )}
            />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#0d1a10]/98 backdrop-blur-md border-t border-white/5 px-6 py-4">
          {NAV_LINKS.map(l => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="block py-3.5 text-base font-medium text-white/75 hover:text-white border-b border-white/5 last:border-b-0 transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>
      )}
    </header>
  )
}

/* ─── FAQ data + accordion ───────────────────────────────────────────── */
const FAQS = [
  {
    q: 'Do I need an account to book?',
    a: 'No. Just enter your name, email, and phone number — no registration or password required.',
  },
  {
    q: 'How much does a court cost?',
    a: '₱500 per hour, per court. Both courts are priced the same.',
  },
  {
    q: 'How does the deposit work?',
    a: "You pay ₱100 per hour online to hold your slot. For a 3-hour booking, that's ₱300 now. The remaining court fee is settled at the venue on the day.",
  },
  {
    q: 'Can I book multiple hours?',
    a: 'Yes. Select multiple consecutive time slots — for example, 3 PM, 4 PM, and 5 PM — and they merge into a single 3-hour block.',
  },
  {
    q: 'Can I book both courts at the same time?',
    a: 'Yes. You can pick time slots on both courts in one booking session.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'Deposits are processed through PayMongo. You can pay via GCash, Maya, or any major credit or debit card.',
  },
  {
    q: 'How do I receive my booking confirmation?',
    a: 'A confirmation email with your booking reference is sent immediately after payment.',
  },
  {
    q: 'What is the cancellation policy?',
    a: 'Cancel at least 24 hours before your session for a full deposit refund. Cancellations within 24 hours and no-shows forfeit the deposit.',
  },
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-brand-border">
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between py-5 text-left gap-4 group"
      >
        <span className="font-semibold text-text-primary group-hover:text-[#276749] transition-colors leading-snug">
          {q}
        </span>
        <span
          className={cn(
            'flex-shrink-0 text-[#276749] transition-transform duration-200',
            open && 'rotate-45'
          )}
        >
          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
          </svg>
        </span>
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-300 ease-in-out',
          open ? 'max-h-64 pb-5' : 'max-h-0'
        )}
      >
        <p className="text-text-muted leading-relaxed text-sm">{a}</p>
      </div>
    </div>
  )
}

/* ─── Page ───────────────────────────────────────────────────────────── */
export function HomePage() {
  const [loading, setLoading] = useState(true)
  useScrollReveal(!loading)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1400)
    return () => clearTimeout(t)
  }, [])

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-[#0d1a10]">
        <p className="text-white text-xl font-black tracking-widest italic">Sip. Dink. Repeat.</p>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div>
      <Nav />

      {/* ══ HERO ══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden min-h-[100dvh] flex flex-col justify-center">
        {/* Court photo */}
        <div
          className="absolute inset-0 bg-center bg-cover bg-no-repeat"
          style={{ backgroundImage: "url('/hero.avif')" }}
          aria-hidden="true"
        />
        {/* Dark gradient: heavier left, lighter right, vignette bottom */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(110deg, rgba(13,26,16,0.95) 0%, rgba(13,26,16,0.82) 38%, rgba(13,26,16,0.50) 65%, rgba(13,26,16,0.22) 100%), linear-gradient(to top, rgba(13,26,16,0.82) 0%, transparent 45%)',
          }}
          aria-hidden="true"
        />

        {/* Illustrated hero graphic — sporty pickleball + geometric energy */}
        <svg
          className="absolute right-0 top-0 h-full w-auto max-w-[56%] pointer-events-none select-none"
          viewBox="0 0 720 900"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          preserveAspectRatio="xMaxYMid slice"
        >
          <defs>
            <radialGradient id="hg-ball" cx="50%" cy="40%" r="55%">
              <stop offset="0%" stopColor="#c8e44a" />
              <stop offset="60%" stopColor="#9DC41A" />
              <stop offset="100%" stopColor="#6a8e10" />
            </radialGradient>
            <radialGradient id="hg-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#9DC41A" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#9DC41A" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="hg-orange-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#E76F51" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#E76F51" stopOpacity="0" />
            </radialGradient>
            <filter id="hg-blur">
              <feGaussianBlur stdDeviation="18" />
            </filter>
          </defs>

          {/* Ambient glow behind ball */}
          <ellipse cx="480" cy="340" rx="260" ry="260" fill="url(#hg-glow)" filter="url(#hg-blur)" />

          {/* Diagonal speed-lines (orange accent) */}
          <g stroke="#E76F51" strokeWidth="2.5" strokeLinecap="round" opacity="0.55">
            <line x1="560" y1="50" x2="720" y2="180" />
            <line x1="530" y1="70" x2="700" y2="200" />
            <line x1="590" y1="30" x2="720" y2="140" />
            <line x1="610" y1="10" x2="720" y2="110" />
          </g>

          {/* Court lines top-right — perspective partial court */}
          <g stroke="#9DC41A" strokeWidth="2" opacity="0.35" fill="none" strokeLinecap="round">
            {/* outer boundary */}
            <rect x="390" y="80" width="300" height="500" rx="4" />
            {/* net (horizontal midline) */}
            <line x1="390" y1="330" x2="690" y2="330" strokeDasharray="12 8" strokeWidth="3" />
            {/* kitchen lines */}
            <line x1="390" y1="230" x2="690" y2="230" />
            <line x1="390" y1="430" x2="690" y2="430" />
            {/* center service line */}
            <line x1="540" y1="230" x2="540" y2="430" />
          </g>

          {/* Large pickleball — hero element */}
          {/* shadow */}
          <ellipse cx="484" cy="354" rx="148" ry="148" fill="rgba(0,0,0,0.45)" filter="url(#hg-blur)" />
          {/* body */}
          <circle cx="480" cy="340" r="145" fill="url(#hg-ball)" />
          {/* holes pattern — 40 holes arranged in 5 rings */}
          {[
            /* ring 1 — 8 holes */
            ...[0,45,90,135,180,225,270,315].map(a => ({
              cx: 480 + Math.cos(a * Math.PI/180) * 105,
              cy: 340 + Math.sin(a * Math.PI/180) * 105,
              r: 9,
            })),
            /* ring 2 — 8 holes */
            ...[22,67,112,157,202,247,292,337].map(a => ({
              cx: 480 + Math.cos(a * Math.PI/180) * 68,
              cy: 340 + Math.sin(a * Math.PI/180) * 68,
              r: 9,
            })),
            /* ring 3 — 4 holes */
            ...[0,90,180,270].map(a => ({
              cx: 480 + Math.cos(a * Math.PI/180) * 33,
              cy: 340 + Math.sin(a * Math.PI/180) * 33,
              r: 9,
            })),
          ].map((h, i) => (
            <circle key={i} cx={h.cx} cy={h.cy} r={h.r} fill="#1B6B2E" />
          ))}
          {/* specular highlight */}
          <ellipse cx="425" cy="285" rx="44" ry="28" fill="rgba(255,255,255,0.18)" transform="rotate(-30 425 285)" />

          {/* Small orbiting ball — orange accent */}
          <circle cx="652" cy="168" r="38" fill="#E76F51" opacity="0.92" />
          <ellipse cx="638" cy="158" rx="12" ry="7" fill="rgba(255,255,255,0.22)" transform="rotate(-30 638 158)" />
          {/* orange ball holes */}
          {[0,90,180,270].map((a, i) => (
            <circle
              key={i}
              cx={652 + Math.cos(a * Math.PI/180) * 22}
              cy={168 + Math.sin(a * Math.PI/180) * 22}
              r={4.5}
              fill="#c45733"
            />
          ))}

          {/* Motion arc — ball trajectory */}
          <path
            d="M 652 168 Q 590 260 480 340"
            stroke="#E76F51"
            strokeWidth="2.5"
            strokeDasharray="8 10"
            fill="none"
            opacity="0.45"
          />

          {/* Tiny scatter balls */}
          <circle cx="350" cy="620" r="18" fill="#9DC41A" opacity="0.3" />
          <circle cx="680" cy="600" r="12" fill="#E76F51" opacity="0.25" />
          <circle cx="310" cy="200" r="10" fill="#9DC41A" opacity="0.2" />

          {/* Bottom orange glow */}
          <ellipse cx="480" cy="820" rx="200" ry="120" fill="url(#hg-orange-glow)" filter="url(#hg-blur)" />
        </svg>

        <div className="relative mx-auto w-full max-w-6xl px-6 pt-28 pb-16">
          {/* Pre-label */}
          <p
            className="text-[0.65rem] font-bold tracking-[0.28em] uppercase text-[#9DC41A]/80 mb-6"
            style={{ animation: 'fadeUp 0.6s ease both', animationDelay: '0.1s' }}
          >
            Beanstalk Dink · Marilao, Bulacan
          </p>

          {/* Headline */}
          <h1 className="text-5xl sm:text-7xl lg:text-[5.5rem] font-black text-white leading-[0.9] tracking-tight max-w-3xl">
            <span
              className="block"
              style={{ animation: 'fadeUp 0.7s ease both', animationDelay: '0.25s' }}
            >
              Your Court.
            </span>
            <span
              className="block text-[#9DC41A]"
              style={{ animation: 'fadeUp 0.7s ease both', animationDelay: '0.4s' }}
            >
              Your Game.
            </span>
          </h1>

          {/* Supporting copy */}
          <p
            className="mt-8 text-base sm:text-lg text-white/65 max-w-md leading-relaxed"
            style={{ animation: 'fadeUp 0.6s ease both', animationDelay: '0.55s' }}
          >
            Book a pickleball court in Marilao, Bulacan — online, in minutes. No account required.
          </p>

          {/* CTAs */}
          <div
            className="mt-10 flex flex-wrap items-center gap-4"
            style={{ animation: 'fadeUp 0.6s ease both', animationDelay: '0.7s' }}
          >
            <BookCTA size="lg" className="shadow-xl shadow-black/30" />
            <a
              href="#courts"
              className={cn(
                'inline-flex items-center justify-center font-semibold rounded-lg',
                'px-6 py-3.5 text-base min-h-[52px]',
                'text-white border border-white/25 hover:bg-white/10',
                'transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50'
              )}
            >
              Explore Courts
            </a>
          </div>

          {/* Trust signals */}
          <div
            className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/50"
            style={{ animation: 'fadeUp 0.6s ease both', animationDelay: '0.85s' }}
          >
            {['No account needed', '₱100 / hr deposit', 'Instant email confirmation'].map(
              item => (
                <span key={item} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#9DC41A] flex-shrink-0" />
                  {item}
                </span>
              )
            )}
          </div>
        </div>

        {/* Scroll cue */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/25 animate-bounce"
          style={{ animation: 'fadeIn 1s ease both 1.6s, bounce 1s infinite 2.6s' }}
          aria-hidden="true"
        >
          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </section>

      {/* ══ STATS ═════════════════════════════════════════════════════ */}
      <section className="bg-[#0d1a10] border-b border-white/5">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/[0.08]">
            {[
              { num: '02', label: 'Courts' },
              { num: '₱500', label: 'Per hour' },
              { num: '16h', label: 'Open daily' },
              { num: '₱100', label: 'Deposit / hr' },
            ].map((s, i) => (
              <div
                key={s.label}
                className="py-9 px-4 sm:px-6 text-center"
                data-reveal
                data-delay={String(i + 1)}
              >
                <p className="text-4xl sm:text-5xl font-black text-white leading-none tracking-tight">
                  {s.num}
                </p>
                <p className="text-[0.6rem] font-bold uppercase tracking-[0.22em] text-white/35 mt-3">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16" data-reveal>
            <p className="text-[0.65rem] font-bold tracking-[0.25em] uppercase text-[#276749] mb-3">
              How it works
            </p>
            <h2 className="text-4xl sm:text-5xl font-black text-text-primary leading-tight">
              Book in under
              <br />
              3 minutes.
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-12 sm:gap-10">
            {[
              {
                n: '01',
                title: 'Pick a date & time',
                body: 'Browse available slots up to 30 days ahead. Choose one hour or stack multiple for a longer session.',
              },
              {
                n: '02',
                title: 'Enter your details',
                body: "Name, email, and mobile number. No account, no password — that's all we need.",
              },
              {
                n: '03',
                title: 'Pay the deposit',
                body: '₱100 per hour via GCash, Maya, or card through PayMongo. Settle the balance at the venue on the day.',
              },
            ].map((step, i) => (
              <div
                key={step.n}
                className="relative"
                data-reveal
                data-delay={String(i + 1)}
              >
                {/* Ghost number */}
                <span className="text-[7.5rem] font-black text-[#F2FAF5] leading-none absolute -top-8 -left-3 select-none pointer-events-none">
                  {step.n}
                </span>
                <div className="relative pt-10 pl-1">
                  <p className="text-[0.6rem] font-bold tracking-[0.22em] uppercase text-[#276749] mb-2">
                    Step {step.n}
                  </p>
                  <h3 className="text-xl font-black text-text-primary mb-3 leading-snug">
                    {step.title}
                  </h3>
                  <p className="text-sm text-text-muted leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center" data-reveal>
            <BookCTA size="lg" />
          </div>
        </div>
      </section>

      {/* ══ COURTS ════════════════════════════════════════════════════ */}
      <section id="courts" className="py-24 bg-brand-cream border-t border-brand-border">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16" data-reveal>
            <p className="text-[0.65rem] font-bold tracking-[0.25em] uppercase text-[#276749] mb-3">
              The courts
            </p>
            <h2 className="text-4xl sm:text-5xl font-black text-text-primary leading-tight">
              Two courts.
              <br />
              Same great rate.
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {[
              {
                n: '01',
                name: 'Court One',
                desc: 'Full-size pickleball court with quality lighting. Suitable for singles and doubles play.',
              },
              {
                n: '02',
                name: 'Court Two',
                desc: 'Full-size pickleball court with quality lighting. Suitable for singles and doubles play.',
              },
            ].map((court, i) => (
              <div
                key={court.name}
                className="group relative overflow-hidden rounded-2xl bg-[#0d1a10] min-h-[380px] flex flex-col justify-between p-8"
                data-reveal
                data-delay={String(i + 1)}
              >
                {/* Background photo */}
                <div
                  className="absolute inset-0 bg-center bg-cover bg-no-repeat opacity-25 group-hover:opacity-40 group-hover:scale-105 transition-all duration-700 ease-out"
                  style={{ backgroundImage: "url('/hero.avif')" }}
                  aria-hidden="true"
                />

                {/* Top: court number */}
                <div className="relative">
                  <span className="text-[5.5rem] font-black leading-none select-none text-white/[0.07]">
                    {court.n}
                  </span>
                </div>

                {/* Bottom: info */}
                <div className="relative space-y-5">
                  <div>
                    <p className="text-[0.6rem] font-bold tracking-[0.22em] uppercase text-[#9DC41A]/70 mb-1.5">
                      Beanstalk Dink
                    </p>
                    <h3 className="text-2xl font-black text-white">{court.name}</h3>
                    <p className="text-sm text-white/50 mt-2 leading-relaxed">{court.desc}</p>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[0.58rem] uppercase tracking-widest text-white/30 font-bold mb-1">
                        Rate
                      </p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-white">₱500</span>
                        <span className="text-white/35 text-sm font-medium">/ hr</span>
                      </div>
                    </div>
                    <BookCTA
                      size="sm"
                      className="!bg-[#9DC41A] !text-[#0d1a10] hover:!bg-[#88b016] !font-black"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Deposit note */}
          <div
            className="mt-6 flex items-start gap-4 bg-white rounded-2xl border border-brand-border p-5 sm:p-6"
            data-reveal
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#276749] flex items-center justify-center text-white font-black text-sm">
              ₱
            </div>
            <div>
              <p className="font-bold text-text-primary">₱100 per hour secures your slot</p>
              <p className="text-sm text-text-muted mt-0.5">
                Book 3 hours on both courts? That's ₱600 deposit total. Remaining court fee is
                settled at the venue.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ CINEMATIC STRIP ═══════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-[#0d1a10] flex items-center justify-center" style={{ minHeight: '44vh' }}>
        {/* Abstract pickleball court — top-down geometry */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 1200 440"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Court surface */}
          <rect x="160" y="40" width="880" height="360" rx="6" fill="#122318" />
          {/* Outer boundary */}
          <rect x="160" y="40" width="880" height="360" rx="6" fill="none" stroke="#9DC41A" strokeWidth="3" opacity="0.35" />
          {/* Center line */}
          <line x1="600" y1="40" x2="600" y2="400" stroke="#9DC41A" strokeWidth="2" opacity="0.25" />
          {/* Kitchen lines (non-volley zones) — left */}
          <rect x="160" y="113" width="220" height="214" fill="none" stroke="#9DC41A" strokeWidth="2" opacity="0.2" />
          {/* Kitchen lines — right */}
          <rect x="820" y="113" width="220" height="214" fill="none" stroke="#9DC41A" strokeWidth="2" opacity="0.2" />
          {/* Net */}
          <line x1="160" y1="220" x2="1040" y2="220" stroke="white" strokeWidth="3" opacity="0.18" strokeDasharray="8 5" />
          {/* Center service line — top half */}
          <line x1="380" y1="113" x2="820" y2="113" stroke="#9DC41A" strokeWidth="1.5" opacity="0.18" />
          {/* Center service line — bottom half */}
          <line x1="380" y1="327" x2="820" y2="327" stroke="#9DC41A" strokeWidth="1.5" opacity="0.18" />
          {/* Mid service line */}
          <line x1="600" y1="113" x2="600" y2="327" stroke="#9DC41A" strokeWidth="1.5" opacity="0.18" />
          {/* Pickleball — subtle, right side */}
          <circle cx="940" cy="340" r="36" fill="#9DC41A" opacity="0.08" />
          <circle cx="940" cy="340" r="36" fill="none" stroke="#9DC41A" strokeWidth="2" opacity="0.15" />
          <circle cx="940" cy="340" r="6" fill="none" stroke="#9DC41A" strokeWidth="1.5" opacity="0.2" />
          <ellipse cx="940" cy="318" rx="5" ry="3" fill="#9DC41A" opacity="0.15" />
          <ellipse cx="940" cy="362" rx="5" ry="3" fill="#9DC41A" opacity="0.15" />
          <ellipse cx="918" cy="340" rx="3" ry="5" fill="#9DC41A" opacity="0.15" />
          <ellipse cx="962" cy="340" rx="3" ry="5" fill="#9DC41A" opacity="0.15" />
        </svg>

        {/* Dark vignette */}
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(13,26,16,0.75) 100%)' }}
          aria-hidden="true"
        />

        {/* Text */}
        <div className="relative text-center px-6 py-16" data-reveal>
          <p className="text-[0.6rem] font-bold tracking-[0.3em] uppercase text-[#9DC41A]/60 mb-4">
            Beanstalk Dink
          </p>
          <p className="text-3xl sm:text-5xl lg:text-6xl font-black text-white/90 tracking-tight leading-tight">
            The game is on.
            <br />
            <span className="text-[#9DC41A]">The court is yours.</span>
          </p>
        </div>
      </section>

      {/* ══ LOCATION & HOURS ══════════════════════════════════════════ */}
      <section id="location" className="py-24 bg-white border-t border-brand-border">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16" data-reveal>
            <p className="text-[0.65rem] font-bold tracking-[0.25em] uppercase text-[#276749] mb-3">
              Find us
            </p>
            <h2 className="text-4xl sm:text-5xl font-black text-text-primary">Find the court.</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-8">
            {/* Hours */}
            <div data-reveal>
              <h3 className="text-base font-black text-text-primary mb-5 flex items-center gap-2">
                <svg className="w-4 h-4 text-[#276749]" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
                Operating hours
              </h3>
              <div className="rounded-2xl border border-brand-border overflow-hidden divide-y divide-brand-border">
                {[
                  'Monday',
                  'Tuesday',
                  'Wednesday',
                  'Thursday',
                  'Friday',
                  'Saturday',
                  'Sunday',
                ].map(day => (
                  <div
                    key={day}
                    className="flex justify-between px-5 py-3.5 text-sm hover:bg-brand-surface transition-colors"
                  >
                    <span className="text-text-muted">{day}</span>
                    <span className="font-semibold text-text-primary tabular-nums">
                      8:00 AM – 12:00 AM
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-text-muted mt-3 pl-1">
                Last booking slot starts at 11:00 PM.
              </p>
            </div>

            {/* Location */}
            <div className="space-y-5" data-reveal data-delay="2">
              <div>
                <h3 className="text-base font-black text-text-primary mb-5 flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-[#276749]"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Location
                </h3>
                <div className="rounded-2xl border border-brand-border p-6 space-y-5">
                  <div>
                    <p className="font-black text-xl text-text-primary">Beanstalk Dink</p>
                    <p className="text-text-muted text-sm mt-1">Marilao, Bulacan, Philippines</p>
                  </div>
                  <div className="space-y-2.5 text-sm text-text-muted">
                    {/* TODO: replace with real contact details */}
                    <p className="flex gap-3 items-center">
                      <span>📞</span>
                      <span>+63 XXX XXX XXXX</span>
                    </p>
                    <p className="flex gap-3 items-center">
                      <span>✉️</span>
                      <span>contact@beanstalldink.com</span>
                    </p>
                  </div>
                  <a
                    href="https://maps.google.com/?q=Marilao+Bulacan+Philippines"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#276749] hover:underline"
                  >
                    Open in Google Maps
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                </div>
              </div>

              <div className="rounded-2xl border border-brand-border p-6">
                <p className="font-bold text-text-primary mb-2">Cancellation policy</p>
                <p className="text-sm text-text-muted leading-relaxed">
                  Cancel 24+ hours before your session for a full deposit refund. No-shows forfeit
                  the deposit.
                </p>
                <Link
                  to="/cancellation-policy"
                  className="text-sm text-[#276749] underline mt-3 inline-block hover:opacity-75 transition-opacity"
                >
                  Read full policy →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FAQ ═══════════════════════════════════════════════════════ */}
      <section id="faq" className="py-24 bg-brand-cream border-t border-brand-border">
        <div className="mx-auto max-w-3xl px-6">
          <div className="mb-12" data-reveal>
            <p className="text-[0.65rem] font-bold tracking-[0.25em] uppercase text-[#276749] mb-3">
              Common questions
            </p>
            <h2 className="text-4xl sm:text-5xl font-black text-text-primary">
              Questions answered.
            </h2>
          </div>
          <div data-reveal data-delay="2">
            {FAQS.map(f => (
              <FAQItem key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ═════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-[#0d1a10]">
        <div
          className="absolute inset-0 bg-center bg-cover bg-no-repeat opacity-15"
          style={{ backgroundImage: "url('/hero.avif')" }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, #0d1a10 0%, rgba(13,26,16,0.75) 55%, transparent 100%)',
          }}
          aria-hidden="true"
        />
        <div
          className="relative mx-auto max-w-6xl px-6 py-28 sm:py-36 text-center"
          data-reveal
        >
          <p className="text-[0.65rem] font-bold tracking-[0.28em] uppercase text-[#9DC41A]/70 mb-5">
            Ready to play?
          </p>
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tight mb-4">
            Ready to Dink?
          </h2>
          <p className="text-white/45 max-w-sm mx-auto mb-12 leading-relaxed text-base">
            Your next game is a few clicks away. Reserve in under 3 minutes — no account required.
          </p>
          <BookCTA size="lg" className="!px-12 shadow-2xl shadow-black/50" />
        </div>
      </section>
    </div>
  )
}
