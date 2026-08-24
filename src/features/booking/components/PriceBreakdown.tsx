import { formatPHP } from '../../../lib/constants'

interface Props {
  pricePerHour: number  // centavos
  depositAmount: number // centavos
  durationMinutes: number
}

export function PriceBreakdown({ pricePerHour, depositAmount, durationMinutes }: Props) {
  const hours = durationMinutes / 60
  const totalFee = pricePerHour * hours
  const balanceDue = totalFee - depositAmount

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-text-muted">
          Court fee ({hours === 1 ? '1 hour' : `${hours} hours`})
        </span>
        <span className="text-text-primary font-medium">{formatPHP(totalFee)}</span>
      </div>

      <div className="flex justify-between text-sm">
        <span className="text-text-muted">Reservation deposit (pay now)</span>
        <span className="text-brand-orange-vivid font-semibold">−{formatPHP(depositAmount)}</span>
      </div>

      <div className="border-t border-brand-border pt-2 flex justify-between text-sm">
        <span className="text-text-muted">Balance due at venue</span>
        <span className="text-text-primary font-medium">{formatPHP(balanceDue)}</span>
      </div>

      <div className="border-t border-brand-border pt-2 flex justify-between">
        <span className="font-semibold text-text-primary">Pay online today</span>
        <span className="font-bold text-brand-orange-vivid text-lg">{formatPHP(depositAmount)}</span>
      </div>
    </div>
  )
}
