export function CancellationPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold text-brand-green-dark">
        Cancellation & Refund Policy
      </h1>
      <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Placeholder — replace with your approved policy before launch.
      </p>

      <div className="mt-8 divide-y divide-brand-border">
        <div className="py-5">
          <h2 className="font-semibold text-text-primary">
            Cancellation 24+ hours before your session
          </h2>
          <p className="mt-1 text-text-muted">
            Your ₱100 reservation deposit will be refunded in full.
          </p>
        </div>
        <div className="py-5">
          <h2 className="font-semibold text-text-primary">
            Cancellation less than 24 hours before your session
          </h2>
          <p className="mt-1 text-text-muted">
            The reservation deposit is non-refundable.
          </p>
        </div>
        <div className="py-5">
          <h2 className="font-semibold text-text-primary">No-show</h2>
          <p className="mt-1 text-text-muted">The reservation deposit is forfeited.</p>
        </div>
        <div className="py-5">
          <h2 className="font-semibold text-text-primary">Venue cancellation</h2>
          <p className="mt-1 text-text-muted">
            Full refund or venue credit at your choice.
          </p>
        </div>
      </div>
    </div>
  )
}
