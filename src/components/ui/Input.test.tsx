import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Input } from './Input'

describe('Input', () => {
  it('renders with an accessible label', () => {
    render(<Input label="Full Name" />)
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument()
  })

  it('marks the input as required', () => {
    render(<Input label="Email" required />)
    expect(screen.getByLabelText(/Email/)).toBeRequired()
  })

  it('shows error message with aria-invalid', () => {
    render(<Input label="Phone" error="Invalid phone number" />)
    expect(screen.getByLabelText('Phone')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid phone number')
  })

  it('hides helper text when error is present', () => {
    render(<Input label="Email" error="Required" helperText="Use your real email" />)
    expect(screen.queryByText('Use your real email')).not.toBeInTheDocument()
  })

  it('shows helper text when no error', () => {
    render(<Input label="Email" helperText="We'll send your confirmation here" />)
    expect(screen.getByText("We'll send your confirmation here")).toBeInTheDocument()
  })

  it('accepts user input', async () => {
    render(<Input label="Full Name" />)
    await userEvent.type(screen.getByLabelText('Full Name'), 'Maria Santos')
    expect(screen.getByLabelText('Full Name')).toHaveValue('Maria Santos')
  })
})
