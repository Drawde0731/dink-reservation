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

export function App() {
  return (
    <BrowserRouter>
      <Routes>
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
      </Routes>
    </BrowserRouter>
  )
}
