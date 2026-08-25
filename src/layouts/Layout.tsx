import { Link, Outlet } from 'react-router-dom'

export function Layout() {
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
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link
            to="/"
            className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#276749] focus-visible:ring-offset-2 rounded"
          >
            {/* Mini court mark */}
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-green-dark text-white text-xs font-black leading-none select-none">
              BD
            </span>
            <span className="text-lg font-bold tracking-tight text-brand-green-dark group-hover:opacity-80 transition-opacity">
              Beanstalk Dink
            </span>
          </Link>
          <Link
            to="/book"
            className="rounded-lg bg-[#E76F51] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#d4623f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E76F51] focus-visible:ring-offset-2"
          >
            Book Now
          </Link>
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
