import { cn } from '../../lib/cn'
import type { BookingStatus, PaymentStatus } from '../../types'

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'held'

export interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-green-100 text-green-800',
  warning: 'bg-amber-100 text-amber-800',
  error: 'bg-red-100 text-red-800',
  info: 'bg-sky-100 text-sky-800',
  neutral: 'bg-brand-surface text-text-muted',
  held: 'bg-brand-green-light text-brand-green-dark',
}

export function Badge({ variant = 'neutral', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}

const BOOKING_VARIANT: Record<BookingStatus, BadgeVariant> = {
  pending: 'neutral',
  held: 'held',
  confirmed: 'success',
  cancelled: 'error',
  completed: 'info',
  expired: 'neutral',
  no_show: 'warning',
}

const BOOKING_LABEL: Record<BookingStatus, string> = {
  pending: 'Pending',
  held: 'Hold',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  completed: 'Completed',
  expired: 'Expired',
  no_show: 'No Show',
}

const PAYMENT_VARIANT: Record<PaymentStatus, BadgeVariant> = {
  pending: 'warning',
  paid: 'success',
  failed: 'error',
  refunded: 'info',
  partially_refunded: 'info',
}

const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  pending: 'Pending',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
  partially_refunded: 'Partial Refund',
}

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return <Badge variant={BOOKING_VARIANT[status]}>{BOOKING_LABEL[status]}</Badge>
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <Badge variant={PAYMENT_VARIANT[status]}>{PAYMENT_LABEL[status]}</Badge>
}
