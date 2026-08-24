import { BookingFlow } from '../features/booking/BookingFlow'
import { usePageTitle } from '../lib/usePageTitle'

export function BookPage() {
  usePageTitle('Book a Court')
  return (
    <div className="min-h-screen bg-brand-cream py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary">Book a Court</h1>
          <p className="text-text-muted mt-1">Beanstalk Dink · Marilao, Bulacan</p>
        </div>
        <BookingFlow />
      </div>
    </div>
  )
}
