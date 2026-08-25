import { Link, Outlet, useLocation } from 'react-router-dom'

export function Layout() {
  const { pathname } = useLocation()
  const onBookPage = pathname.startsWith('/book') || pathname.startsWith('/booking')

  return (
    <div className="flex min-h-screen flex-col bg-brand-cream">
      {/* Accessibility: skip nav for keyboard/screen-reader users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[#276749] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:outline-none"
      >
        Skip to content
      </a>

      <header className="border-b border-brand-border bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          {/* Left: empty spacer so logo stays centred */}
          <div className="w-28" />

          <Link
            to="/"
            className="text-xl font-bold text-brand-green-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#276749] focus-visible:ring-offset-2 rounded"
          >
            Beanstalk Dink
          </Link>

          {/* Right: Book a Court only shown on non-booking pages */}
          <div className="w-28 flex justify-end">
            {!onBookPage && (
              <Link
                to="/book"
                className="inline-flex min-h-[44px] items-center rounded-lg bg-[#E76F51] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#d4623f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#276749] focus-visible:ring-offset-2"
              >
                Book a Court
              </Link>
            )}
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-brand-border bg-white">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-text-primary">Beanstalk Dink</p>
              <p className="text-sm text-text-muted">Marilao, Bulacan</p>
            </div>
            <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-text-muted">
              <Link to="/terms" className="transition-colors hover:text-text-primary">Terms</Link>
              <Link to="/privacy" className="transition-colors hover:text-text-primary">Privacy</Link>
              <Link to="/cancellation-policy" className="transition-colors hover:text-text-primary">Cancellation Policy</Link>
              <Link to="/contact" className="transition-colors hover:text-text-primary">Contact</Link>
            </nav>
          </div>
          <p className="mt-6 text-xs text-text-muted">
            © {new Date().getFullYear()} Beanstalk Dink. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
