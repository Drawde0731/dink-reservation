export function ContactPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-3xl font-bold text-brand-green-dark">Contact Us</h1>
      {/* TODO: Replace with real contact details before launch */}
      <div className="mt-6 space-y-2 text-text-muted">
        <p>
          <span className="font-medium text-text-primary">Location:</span> Marilao,
          Bulacan
        </p>
        <p>
          <span className="font-medium text-text-primary">Email:</span>{' '}
          <span className="italic text-text-muted">[add business email]</span>
        </p>
        <p>
          <span className="font-medium text-text-primary">Phone:</span>{' '}
          <span className="italic text-text-muted">[add business phone]</span>
        </p>
      </div>
    </div>
  )
}
