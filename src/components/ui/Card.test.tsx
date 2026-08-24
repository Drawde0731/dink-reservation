import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Card } from './Card'

test('renders children', () => {
  render(<Card>Court One</Card>)
  expect(screen.getByText('Court One')).toBeInTheDocument()
})

test('renders as article element when specified', () => {
  render(<Card as="article">Content</Card>)
  expect(screen.getByRole('article')).toBeInTheDocument()
})
