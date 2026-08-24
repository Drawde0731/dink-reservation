import { describe, expect, test } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  test('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  test('resolves tailwind conflicts — last class wins', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  test('handles conditional classes', () => {
    expect(cn('base', false && 'excluded', true && 'included')).toBe('base included')
  })

  test('handles undefined and null gracefully', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end')
  })
})
