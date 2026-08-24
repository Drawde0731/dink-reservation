import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './layouts/Layout'
import { AboutPage } from './pages/AboutPage'
import { BookPage } from './pages/BookPage'
import { BookingDetailPage } from './pages/BookingDetailPage'
import { CancellationPolicyPage } from './pages/CancellationPolicyPage'
import { ContactPage } from './pages/ContactPage'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PrivacyPage } from './pages/PrivacyPage'
import { TermsPage } from './pages/TermsPage'
import { LoadingSpinner } from './components/ui/LoadingSpinner'

// Admin routes lazy-loaded — customers never download admin code
const AdminLoginPage    = lazy(() => import('./pages/admin/AdminLoginPage').then(m => ({ default: m.AdminLoginPage })))
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })))
const AdminWalkInPage   = lazy(() => import('./pages/admin/AdminWalkInPage').then(m => ({ default: m.AdminWalkInPage })))
const AdminBlockPage    = lazy(() => import('./pages/admin/AdminBlockPage').then(m => ({ default: m.AdminBlockPage })))
const AdminPricingPage  = lazy(() => import('./pages/admin/AdminPricingPage').then(m => ({ default: m.AdminPricingPage })))
const AdminAuditPage    = lazy(() => import('./pages/admin/AdminAuditPage').then(m => ({ default: m.AdminAuditPage })))
const AdminLayout       = lazy(() => import('./features/admin/components/AdminLayout').then(m => ({ default: m.AdminLayout })))
const RequireAdmin      = lazy(() => import('./features/admin/components/RequireAdmin').then(m => ({ default: m.RequireAdmin })))

function AdminFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-cream">
      <LoadingSpinner />
    </div>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="book" element={<BookPage />} />
          <Route path="booking/:reference" element={<BookingDetailPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="terms" element={<TermsPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="cancellation-policy" element={<CancellationPolicyPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Admin routes — lazy loaded, separate chunk */}
        <Route
          path="admin/login"
          element={
            <Suspense fallback={<AdminFallback />}>
              <AdminLoginPage />
            </Suspense>
          }
        />
        <Route
          path="admin"
          element={
            <Suspense fallback={<AdminFallback />}>
              <RequireAdmin />
            </Suspense>
          }
        >
          <Route
            element={
              <Suspense fallback={<AdminFallback />}>
                <AdminLayout />
              </Suspense>
            }
          >
            <Route index element={<Suspense fallback={<AdminFallback />}><AdminDashboardPage /></Suspense>} />
            <Route path="walk-in" element={<Suspense fallback={<AdminFallback />}><AdminWalkInPage /></Suspense>} />
            <Route path="block" element={<Suspense fallback={<AdminFallback />}><AdminBlockPage /></Suspense>} />
            <Route path="pricing" element={<Suspense fallback={<AdminFallback />}><AdminPricingPage /></Suspense>} />
            <Route path="audit" element={<Suspense fallback={<AdminFallback />}><AdminAuditPage /></Suspense>} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
