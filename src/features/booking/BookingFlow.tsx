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
import type { BookingFlowState, SlotSelection } from './types'

const INITIAL_STATE: BookingFlowState = {
  step: 1,
  date: null,
  selections: [],
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

  function setDate(date: string) {
    setFlow(f => ({ ...f, date, selections: [] }))  // clear selections when date changes
  }

  // Toggle an individual hour slot. Multiple slots per court are allowed.
  function toggleSlot(courtId: string, courtName: string, startTime: string, endTime: string) {
    setFlow(f => {
      const already = f.selections.findIndex(s => s.courtId === courtId && s.startTime === startTime)
      if (already !== -1) {
        return { ...f, selections: f.selections.filter((_, i) => i !== already) }
      }
      const slotMin = data?.settings?.slot_duration_minutes ?? 60
      return { ...f, selections: [...f.selections, { courtId, courtName, startTime, endTime, durationMinutes: slotMin }] }
    })
  }

  // Merge consecutive hour-slots per court into a single SlotSelection for submission.
  // Non-consecutive gaps on the same court produce separate entries (multiple holds).
  function mergeSelections(raw: SlotSelection[]): SlotSelection[] {
    const grouped = new Map<string, SlotSelection[]>()
    for (const s of raw) {
      const arr = grouped.get(s.courtId) ?? []
      arr.push(s)
      grouped.set(s.courtId, arr)
    }
    const merged: SlotSelection[] = []
    for (const slots of grouped.values()) {
      slots.sort((a, b) => a.startTime.localeCompare(b.startTime))
      let cur = { ...slots[0] }
      for (let i = 1; i < slots.length; i++) {
        if (slots[i].startTime === cur.endTime) {
          cur.endTime = slots[i].endTime
          cur.durationMinutes += slots[i].durationMinutes
        } else {
          merged.push(cur)
          cur = { ...slots[i] }
        }
      }
      merged.push(cur)
    }
    return merged
  }

  function updateGuest(partial: Partial<BookingFlowState['guest']>) {
    setFlow(f => ({ ...f, guest: { ...f.guest, ...partial } }))
  }

  function next() { setFlow(f => ({ ...f, step: Math.min(4, f.step + 1) as BookingFlowState['step'] })); window.scrollTo(0, 0) }
  function back() { setFlow(f => ({ ...f, step: Math.max(1, f.step - 1) as BookingFlowState['step'] })); window.scrollTo(0, 0) }

  // Creates holds for all selected slots in parallel, then one combined PayMongo checkout.
  async function handleBook(turnstileToken: string) {
    const { date, guest } = flow
    const selections = mergeSelections(flow.selections)
    if (!date || selections.length === 0) return

    setIsSubmitting(true)
    setHoldError(null)

    try {
      // 1. Create holds for all selections in parallel
      const holdResults = await Promise.all(
        selections.map(sel =>
          supabase.functions.invoke('create-hold', {
            body: {
              court_id: sel.courtId,
              date,
              start_time: sel.startTime,
              end_time: sel.endTime,
              customer_name: guest.name.trim(),
              customer_email: guest.email.trim().toLowerCase(),
              customer_phone: guest.phone.trim(),
              turnstile_token: turnstileToken,
            },
          })
        )
      )

      // Check for any hold errors
      for (let i = 0; i < holdResults.length; i++) {
        const { data: result, error: fnErr } = holdResults[i]
        if (fnErr) {
          setHoldError({ code: 'NETWORK_ERROR', message: fnErr.message })
          return
        }
        if (result?.error) {
          const sel = selections[i]
          const msg = result.code === 'SLOT_TAKEN'
            ? `${sel.courtName} (${sel.startTime}–${sel.endTime}) was just booked by someone else. Please pick a different time.`
            : result.error
          setHoldError({ code: result.code ?? 'UNKNOWN', message: msg })
          if (result.code === 'SLOT_TAKEN') {
            // Remove all raw slots for that court so user picks again
            setFlow(f => ({ ...f, step: 2, selections: f.selections.filter(s => s.courtId !== sel.courtId) }))
          }
          return
        }
      }

      // 2. Collect booking references + management tokens
      const booking_references = holdResults.map(r => r.data.booking_reference as string)
      const management_tokens  = holdResults.map(r => r.data.management_token as string)

      // 3. Create one combined PayMongo checkout session
      const { data: checkoutResult, error: checkoutErr } = await supabase.functions.invoke(
        'create-checkout-session',
        { body: { booking_references, management_tokens } },
      )

      if (checkoutErr || checkoutResult?.error) {
        setHoldError({
          code: checkoutResult?.code ?? 'CHECKOUT_ERROR',
          message: checkoutResult?.error ?? checkoutErr?.message ?? 'Failed to start payment. Your slot is held for 10 minutes.',
        })
        // Navigate to first booking detail page
        navigate(`/booking/${booking_references[0]}?token=${management_tokens[0]}`)
        return
      }

      // 4. Redirect to PayMongo checkout
      window.location.href = checkoutResult.checkout_url as string
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
        </div>
      )}

      <div className="bg-white rounded-2xl border border-brand-border p-6 shadow-sm">
        {flow.step === 1 && (
          <Step1Date
            date={flow.date}
            settings={data.settings}
            onDateSelect={setDate}
            onNext={next}
          />
        )}
        {flow.step === 2 && (
          <Step2Slot
            date={flow.date}
            selections={flow.selections}
            courts={data.courts}
            pricing={data.pricing}
            settings={data.settings}
            onToggleSlot={toggleSlot}
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
            date={flow.date}
            selections={mergeSelections(flow.selections)}
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
