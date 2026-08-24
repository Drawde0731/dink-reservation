// Admin layout: sidebar nav + top bar with sign-out.
// Used by all /admin/* pages (except /admin/login).

import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { cn } from '../../../lib/cn'

const nav = [
  { to: '/admin', label: 'Dashboard', icon: '📅', end: true },
  { to: '/admin/walk-in', label: 'Walk-in Booking', icon: '🎾' },
  { to: '/admin/block', label: 'Block Court', icon: '🚫' },
  { to: '/admin/pricing', label: 'Pricing', icon: '💰' },
  { to: '/admin/audit', label: 'Audit Log', icon: '📋' },
]

export function AdminLayout() {
  const navigate = useNavigate()

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen bg-brand-cream">
      {/* Sidebar */}
      <aside className="flex w-56 flex-col border-r border-brand-border bg-white">
        <div className="border-b border-brand-border px-4 py-5">
          <p className="font-bold text-brand-green-dark">Beanstalk Dink</p>
          <p className="text-xs text-text-muted">Admin Panel</p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map(({ to, label, icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[#276749] text-white'
                    : 'text-text-primary hover:bg-brand-surface',
                )
              }
            >
              <span>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-brand-border p-3">
          <button
            onClick={signOut}
            className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}
