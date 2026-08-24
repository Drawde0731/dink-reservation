// Route guard: redirect to /admin/login if no active session.

import { Navigate, Outlet } from 'react-router-dom'
import { useAdminAuth } from '../hooks/useAdminAuth'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'

export function RequireAdmin() {
  const { session, loading } = useAdminAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-cream">
        <LoadingSpinner />
      </div>
    )
  }

  if (!session) return <Navigate to="/admin/login" replace />

  return <Outlet />
}
