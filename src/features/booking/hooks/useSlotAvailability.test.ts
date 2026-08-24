import { describe, it, expect } from 'vitest'
import { generateSlots } from './useSlotAvailability'

describe('generateSlots', () => {
  it('generates slots from 08:00 to midnight (closes_next_day)', () => {
    const slots = generateSlots('08:00', '00:00', true, 60)
    expect(slots[0].startTime).toBe('08:00')
    expect(slots[0].endTime).toBe('09:00')
    expect(slots[slots.length - 1].startTime).toBe('23:00')
    expect(slots[slots.length - 1].endTime).toBe('00:00')
    // 08:00 → 23:00 = 16 slots
    expect(slots).toHaveLength(16)
  })

  it('all generated slots are marked available (Phase 3 stub)', () => {
    const slots = generateSlots('08:00', '00:00', true, 60)
    expect(slots.every(s => s.isAvailable)).toBe(true)
  })

  it('enforces slot boundary — last slot ends exactly at close', () => {
    // Close at 22:00, slot is 60 min: last valid start is 21:00
    const slots = generateSlots('08:00', '22:00', false, 60)
    const last = slots[slots.length - 1]
    expect(last.startTime).toBe('21:00')
    expect(last.endTime).toBe('22:00')
  })

  it('does not generate a slot that would extend past closing', () => {
    // Close at 22:00 — 22:00 start + 60 min = 23:00 > close, must not appear
    const slots = generateSlots('08:00', '22:00', false, 60)
    const startTimes = slots.map(s => s.startTime)
    expect(startTimes).not.toContain('22:00')
  })

  it('returns empty when venue is closed all day (open === close)', () => {
    // This shouldn't happen in practice but shouldn't crash either
    const slots = generateSlots('22:00', '22:00', false, 60)
    expect(slots).toHaveLength(0)
  })

  it('handles 30-minute slots', () => {
    const slots = generateSlots('08:00', '10:00', false, 30)
    expect(slots).toHaveLength(4)
    expect(slots.map(s => s.startTime)).toEqual(['08:00', '08:30', '09:00', '09:30'])
  })

  it('midnight endTime is formatted as 00:00 not 24:00', () => {
    const slots = generateSlots('23:00', '00:00', true, 60)
    expect(slots).toHaveLength(1)
    expect(slots[0].endTime).toBe('00:00')
  })
})
