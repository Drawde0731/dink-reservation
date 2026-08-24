import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Badge, BookingStatusBadge, PaymentStatusBadge } from './Badge'

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Confirmed</Badge>)
    expect(screen.getByText('Confirmed')).toBeInTheDocument()
  })
})

describe('BookingStatusBadge', () => {
  it('renders confirmed', () => {
    render(<BookingStatusBadge status="confirmed" />)
    expect(screen.getByText('Confirmed')).toBeInTheDocument()
  })

  it('renders held', () => {
    render(<BookingStatusBadge status="held" />)
    expect(screen.getByText('Hold')).toBeInTheDocument()
  })

  it('renders no_show with space', () => {
    render(<BookingStatusBadge status="no_show" />)
    expect(screen.getByText('No Show')).toBeInTheDocument()
  })

  it('renders all statuses without throwing', () => {
    const statuses = [
      'pending',
      'held',
      'confirmed',
      'cancelled',
      'completed',
      'expired',
      'no_show',
    ] as const
    for (const status of statuses) {
      const { unmount } = render(<BookingStatusBadge status={status} />)
      unmount()
    }
  })
})

describe('PaymentStatusBadge', () => {
  it('renders paid', () => {
    render(<PaymentStatusBadge status="paid" />)
    expect(screen.getByText('Paid')).toBeInTheDocument()
  })

  it('renders partially_refunded as readable label', () => {
    render(<PaymentStatusBadge status="partially_refunded" />)
    expect(screen.getByText('Partial Refund')).toBeInTheDocument()
  })
})
