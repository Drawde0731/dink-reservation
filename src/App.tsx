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
import { AdminLoginPage } from './pages/admin/AdminLoginPage'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminWalkInPage } from './pages/admin/AdminWalkInPage'
import { AdminBlockPage } from './pages/admin/AdminBlockPage'
import { AdminPricingPage } from './pages/admin/AdminPricingPage'
import { AdminAuditPage } from './pages/admin/AdminAuditPage'
import { AdminLayout } from './features/admin/components/AdminLayout'
import { RequireAdmin } from './features/admin/components/RequireAdmin'

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

        {/* Admin routes */}
        <Route path="admin/login" element={<AdminLoginPage />} />
        <Route path="admin" element={<RequireAdmin />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="walk-in" element={<AdminWalkInPage />} />
            <Route path="block" element={<AdminBlockPage />} />
            <Route path="pricing" element={<AdminPricingPage />} />
            <Route path="audit" element={<AdminAuditPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
