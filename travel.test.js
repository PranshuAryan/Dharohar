import { describe, it, expect } from 'vitest'
import { co2ForTravel, totalTravelCo2, CO2_PER_KM } from '../dharohar-core.js'

describe('co2ForTravel()', () => {
  // ── HAPPY PATH ───────────────────────────────────────────────
  it('calculates correct CO2 for an Ola trip', () => {
    expect(co2ForTravel('ola', 10)).toBeCloseTo(1.6, 3)
  })

  it('calculates correct CO2 for a metro trip', () => {
    expect(co2ForTravel('metro', 10)).toBeCloseTo(0.04, 3)
  })

  it('calculates correct CO2 for a flight', () => {
    expect(co2ForTravel('flight', 1000)).toBeCloseTo(255, 3)
  })

  it('matches every documented CO2_PER_KM factor', () => {
    for (const mode of Object.keys(CO2_PER_KM)) {
      const expected = parseFloat((5 * CO2_PER_KM[mode]).toFixed(3))
      expect(co2ForTravel(mode, 5)).toBeCloseTo(expected, 3)
    }
  })

  // ── EDGE CASES ───────────────────────────────────────────────
  it('returns 0 for walking regardless of distance', () => {
    expect(co2ForTravel('walk', 0)).toBe(0)
    expect(co2ForTravel('walk', 50)).toBe(0)
  })

  it('returns 0 kg for a 0 km trip', () => {
    expect(co2ForTravel('ola', 0)).toBe(0)
  })

  it('returns 0 for an unrecognised travel mode instead of throwing', () => {
    expect(co2ForTravel('teleporter', 10)).toBe(0)
  })

  // ── BOUNDARY / INVALID INPUT ─────────────────────────────────
  it('throws for a negative distance', () => {
    expect(() => co2ForTravel('ola', -5)).toThrow()
  })

  it('throws for a non-numeric distance', () => {
    expect(() => co2ForTravel('ola', 'ten')).toThrow()
  })

  it('throws for NaN distance', () => {
    expect(() => co2ForTravel('ola', NaN)).toThrow()
  })

  it('throws for Infinity distance', () => {
    expect(() => co2ForTravel('ola', Infinity)).toThrow()
  })

  it('handles a very large distance without overflow', () => {
    expect(co2ForTravel('ola', 1_000_000)).toBeCloseTo(160000, 1)
  })
})

describe('totalTravelCo2()', () => {
  it('sums CO2 across multiple trips', () => {
    const trips = [
      { mode: 'ola', distanceKm: 10 },   // 1.6
      { mode: 'metro', distanceKm: 20 }, // 0.08
      { mode: 'walk', distanceKm: 5 }    // 0
    ]
    expect(totalTravelCo2(trips)).toBeCloseTo(1.68, 3)
  })

  it('returns 0 for an empty trip list', () => {
    expect(totalTravelCo2([])).toBe(0)
  })

  it('returns 0 when given something other than an array', () => {
    expect(totalTravelCo2(null)).toBe(0)
    expect(totalTravelCo2(undefined)).toBe(0)
    expect(totalTravelCo2('not an array')).toBe(0)
  })

  it('ignores unrecognised modes in the list rather than throwing', () => {
    const trips = [
      { mode: 'ola', distanceKm: 10 },
      { mode: 'unicorn', distanceKm: 100 }
    ]
    expect(totalTravelCo2(trips)).toBeCloseTo(1.6, 3)
  })
})
