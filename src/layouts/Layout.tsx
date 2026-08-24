import { Link, Outlet } from 'react-router-dom'

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-brand-cream">
      <header className="border-b border-brand-border bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link
            to="/"
            className="rounded text-xl font-bold text-brand-green-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#276749] focus-visible:ring-offset-2"
          >
            Beanstalk Dink
          </Link>
          <nav>
            <Link
              to="/book"
              className="inline-flex min-h-[44px] items-center rounded-lg bg-[#E76F51] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#d4623f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#276749] focus-visible:ring-offset-2"
            >
              Book a Court
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
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
              <Link to="/terms" className="transition-colors hover:text-text-primary">
                Terms
              </Link>
              <Link to="/privacy" className="transition-colors hover:text-text-primary">
                Privacy
              </Link>
              <Link
                to="/cancellation-policy"
                className="transition-colors hover:text-text-primary"
              >
                Cancellation Policy
              </Link>
              <Link to="/contact" className="transition-colors hover:text-text-primary">
                Contact
              </Link>
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
