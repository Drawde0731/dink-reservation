import { useParams } from 'react-router-dom'

export function BookingDetailPage() {
  const { reference } = useParams<{ reference: string }>()
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-3xl font-bold text-brand-green-dark">
        Booking {reference}
      </h1>
      <p className="mt-2 text-text-muted">
        Booking confirmation and management — Phase 3.
      </p>
    </div>
  )
}
