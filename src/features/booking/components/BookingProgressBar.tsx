import { cn } from '../../../lib/cn'
import type { BookingStep } from '../types'

const STEPS: { n: BookingStep; label: string }[] = [
  { n: 1, label: 'Date' },
  { n: 2, label: 'Time' },
  { n: 3, label: 'Details' },
  { n: 4, label: 'Review' },
]

interface Props {
  currentStep: BookingStep
}

export function BookingProgressBar({ currentStep }: Props) {
  return (
    <nav aria-label="Booking steps" className="w-full">
      <ol className="flex items-center justify-between">
        {STEPS.map(({ n, label }, i) => {
          const done = n < currentStep
          const active = n === currentStep

          return (
            <li key={n} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1">
                <div
                  aria-current={active ? 'step' : undefined}
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors',
                    done && 'bg-brand-green-dark text-white',
                    active && 'bg-brand-orange-vivid text-white ring-2 ring-brand-orange-vivid ring-offset-2',
                    !done && !active && 'bg-brand-border text-text-muted',
                  )}
                >
                  {done ? (
                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <path d="M3 8l3.5 3.5 6.5-6.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : n}
                </div>
                <span className={cn(
                  'text-xs font-medium hidden sm:block',
                  active ? 'text-text-primary' : 'text-text-muted',
                )}>
                  {label}
                </span>
              </div>

              {i < STEPS.length - 1 && (
                <div className={cn(
                  'flex-1 h-0.5 mx-2',
                  done ? 'bg-brand-green-dark' : 'bg-brand-border',
                )} />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
