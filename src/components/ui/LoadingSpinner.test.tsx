import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { LoadingSpinner } from './LoadingSpinner'

test('has status role for screen readers', () => {
  render(<LoadingSpinner />)
  expect(screen.getByRole('status')).toBeInTheDocument()
})

test('exposes custom label to screen readers', () => {
  render(<LoadingSpinner label="Loading courts…" />)
  expect(screen.getByText('Loading courts…')).toBeInTheDocument()
})

test('default label is accessible', () => {
  render(<LoadingSpinner />)
  expect(screen.getByText('Loading…')).toBeInTheDocument()
})
