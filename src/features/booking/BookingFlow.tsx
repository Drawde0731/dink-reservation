import { useState } from 'react'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { BookingProgressBar } from './components/BookingProgressBar'
import { Step1Date } from './steps/Step1Date'
import { Step2Slot } from './steps/Step2Slot'
import { Step3Details } from './steps/Step3Details'
import { Step4Summary } from './steps/Step4Summary'
import { useVenueData } from './hooks/useVenueData'
import type { BookingFlowState } from './types'

const INITIAL_STATE: BookingFlowState = {
  step: 1,
  selection: {
    date: null,
    courtId: null,
    courtName: null,
    startTime: null,
    endTime: null,
    durationMinutes: 60,
  },
  guest: { name: '', email: '', phone: '' },
}

export function BookingFlow() {
  const { data, loading, error } = useVenueData()
  const [flow, setFlow] = useState<BookingFlowState>(INITIAL_STATE)
  // Phase 6 wires isSubmitting to the PayMongo payment intent call
  const [isSubmitting] = useState(false)

  function updateSelection(partial: Partial<BookingFlowState['selection']>) {
    setFlow(f => ({
      ...f,
      selection: { ...f.selection, ...partial },
      // Reset time selection when date changes
      ...(partial.date && partial.date !== f.selection.date
        ? { selection: { ...f.selection, ...partial, courtId: null, courtName: null, startTime: null, endTime: null } }
        : {}),
    }))
  }

  function updateGuest(partial: Partial<BookingFlowState['guest']>) {
    setFlow(f => ({ ...f, guest: { ...f.guest, ...partial } }))
  }

  function next() { setFlow(f => ({ ...f, step: Math.min(4, f.step + 1) as BookingFlowState['step'] })) }
  function back() { setFlow(f => ({ ...f, step: Math.max(1, f.step - 1) as BookingFlowState['step'] })) }

  // ponytail: Phase 6 replaces this stub with the PayMongo payment intent flow
  function handleBook() {
    console.log('[Phase 6] Wire PayMongo here:', { selection: flow.selection, guest: flow.guest })
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner label="Loading venue details…" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-700 font-medium">Couldn't load venue data.</p>
        <p className="text-sm text-red-600 mt-1">{error ?? 'Unknown error'}</p>
        <button
          type="button"
          className="mt-3 text-sm text-red-700 underline"
          onClick={() => window.location.reload()}
        >
          Try again
        </button>
      </div>
    )
  }

  if (!data.settings) {
    return (
      <div className="rounded-xl border border-brand-border bg-brand-surface p-6 text-center">
        <p className="text-text-muted">Venue configuration not found. Please contact us.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <BookingProgressBar currentStep={flow.step} />

      <div className="bg-white rounded-2xl border border-brand-border p-6 shadow-sm">
        {flow.step === 1 && (
          <Step1Date
            selection={flow.selection}
            settings={data.settings}
            onUpdate={updateSelection}
            onNext={next}
          />
        )}
        {flow.step === 2 && (
          <Step2Slot
            selection={flow.selection}
            courts={data.courts}
            pricing={data.pricing}
            hours={data.hours}
            settings={data.settings}
            onUpdate={updateSelection}
            onNext={next}
            onBack={back}
          />
        )}
        {flow.step === 3 && (
          <Step3Details
            guest={flow.guest}
            onUpdate={updateGuest}
            onNext={next}
            onBack={back}
          />
        )}
        {flow.step === 4 && (
          <Step4Summary
            selection={flow.selection}
            guest={flow.guest}
            pricing={data.pricing}
            onBack={back}
            onBook={handleBook}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  )
}
