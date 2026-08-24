import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { BookingProgressBar } from './components/BookingProgressBar'
import { Step1Date } from './steps/Step1Date'
import { Step2Slot } from './steps/Step2Slot'
import { Step3Details } from './steps/Step3Details'
import { Step4Summary } from './steps/Step4Summary'
import { useVenueData } from './hooks/useVenueData'
import { supabase } from '../../lib/supabase'
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

export interface HoldError {
  code: string
  message: string
}

export function BookingFlow() {
  const { data, loading, error } = useVenueData()
  const [flow, setFlow] = useState<BookingFlowState>(INITIAL_STATE)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [holdError, setHoldError] = useState<HoldError | null>(null)
  const navigate = useNavigate()

  function updateSelection(partial: Partial<BookingFlowState['selection']>) {
    setFlow(f => {
      // Reset court/time when date changes
      const dateChanged = partial.date !== undefined && partial.date !== f.selection.date
      return {
        ...f,
        selection: {
          ...f.selection,
          ...partial,
          ...(dateChanged
            ? { courtId: null, courtName: null, startTime: null, endTime: null }
            : {}),
        },
      }
    })
  }

  function updateGuest(partial: Partial<BookingFlowState['guest']>) {
    setFlow(f => ({ ...f, guest: { ...f.guest, ...partial } }))
  }

  function next() { setFlow(f => ({ ...f, step: Math.min(4, f.step + 1) as BookingFlowState['step'] })) }
  function back() { setFlow(f => ({ ...f, step: Math.max(1, f.step - 1) as BookingFlowState['step'] })) }

  // Calls the create-hold Edge Function.
  // Phase 6 inserts the PayMongo payment step after this succeeds:
  //   1. create-hold → { booking_reference, hold_expires_at, management_token }
  //   2. (Phase 6) create PayMongo payment intent → redirect to PayMongo checkout
  //   3. (Phase 6) PayMongo webhook → confirm booking → send email (Phase 7)
  //   4. Redirect to /booking/{reference}?token={management_token}
  async function handleBook() {
    const { selection, guest } = flow
    if (!selection.courtId || !selection.date || !selection.startTime || !selection.endTime) return

    setIsSubmitting(true)
    setHoldError(null)

    try {
      const { data: result, error: fnErr } = await supabase.functions.invoke('create-hold', {
        body: {
          court_id: selection.courtId,
          date: selection.date,
          start_time: selection.startTime,
          end_time: selection.endTime,
          customer_name: guest.name.trim(),
          customer_email: guest.email.trim().toLowerCase(),
          customer_phone: guest.phone.trim(),
        },
      })

      if (fnErr) {
        setHoldError({ code: 'NETWORK_ERROR', message: fnErr.message })
        return
      }

      if (result?.error) {
        setHoldError({ code: result.code ?? 'UNKNOWN', message: result.error })
        // If the slot was taken, go back to step 2 so they can pick another time
        if (result.code === 'SLOT_TAKEN') {
          setFlow(f => ({ ...f, step: 2, selection: { ...f.selection, courtId: null, courtName: null, startTime: null, endTime: null } }))
        }
        return
      }

      // Phase 6: here we'd redirect to PayMongo. For now, navigate to confirmation.
      // The management_token is passed in the URL; Phase 7 (email) will also send it.
      const ref = result.booking_reference as string
      const token = result.management_token as string
      navigate(`/booking/${ref}?token=${token}`)
    } finally {
      setIsSubmitting(false)
    }
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

      {holdError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">{holdError.message}</p>
          {holdError.code === 'SLOT_TAKEN' && (
            <p className="text-xs text-red-600 mt-1">
              Someone else booked that slot just now. Please select a different time.
            </p>
          )}
        </div>
      )}

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
