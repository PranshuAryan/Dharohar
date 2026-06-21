import { describe, it, expect } from 'vitest'
import { co2ForHomeEnergy, getACTempFactor } from '../dharohar-core.js'

describe('getACTempFactor()', () => {
  it('returns 1.0 (no penalty) at exactly 24°C', () => {
    expect(getACTempFactor(24)).toBe(1)
  })

  it('returns 1.0 for any temp at or above 24°C (no extra penalty for warmer settings)', () => {
    expect(getACTempFactor(28)).toBe(1)
    expect(getACTempFactor(30)).toBe(1)
  })

  it('increases by 6% per degree below 24°C', () => {
    expect(getACTempFactor(23)).toBeCloseTo(1.06, 5)
    expect(getACTempFactor(20)).toBeCloseTo(1.24, 5)
    expect(getACTempFactor(16)).toBeCloseTo(1.48, 5)
  })

  it('falls back to 1 for invalid input', () => {
    expect(getACTempFactor(NaN)).toBe(1)
    expect(getACTempFactor('cold')).toBe(1)
    expect(getACTempFactor(undefined)).toBe(1)
  })
})

describe('co2ForHomeEnergy()', () => {
  // ── HAPPY PATH ───────────────────────────────────────────────
  it('calculates correct total for a typical day', () => {
    const result = co2ForHomeEnergy({
      acHours: 4, acTemp: 24,
      geyserHours: 1, tvHours: 2, fanHours: 6, gasHours: 1,
      washingMachine: true
    })
    // ac: 4*1.3*1=5.2, geyser:1.2, tv:0.2, fan:0.18, gas:0.22, wash:0.6
    expect(result.total).toBeCloseTo(5.2 + 1.2 + 0.2 + 0.18 + 0.22 + 0.6, 2)
  })

  it('applies the AC temperature penalty correctly inside the total', () => {
    const warm = co2ForHomeEnergy({ acHours: 2, acTemp: 24 })
    const cold = co2ForHomeEnergy({ acHours: 2, acTemp: 18 })
    expect(cold.total).toBeGreaterThan(warm.total)
    expect(cold.breakdown.acCo2).toBeCloseTo(2 * 1.3 * 1.36, 3)
  })

  it('returns a breakdown object with all six appliance keys', () => {
    const result = co2ForHomeEnergy({})
    expect(result.breakdown).toHaveProperty('acCo2')
    expect(result.breakdown).toHaveProperty('geyserCo2')
    expect(result.breakdown).toHaveProperty('tvCo2')
    expect(result.breakdown).toHaveProperty('fanCo2')
    expect(result.breakdown).toHaveProperty('gasCo2')
    expect(result.breakdown).toHaveProperty('washCo2')
  })

  // ── EDGE CASES ───────────────────────────────────────────────
  it('returns 0 total when no usage object is given', () => {
    expect(co2ForHomeEnergy().total).toBe(0)
  })

  it('returns 0 total for an empty usage object', () => {
    expect(co2ForHomeEnergy({}).total).toBe(0)
  })

  it('adds exactly 0.6kg when washing machine is used, 0 when not', () => {
    expect(co2ForHomeEnergy({ washingMachine: true }).breakdown.washCo2).toBe(0.6)
    expect(co2ForHomeEnergy({ washingMachine: false }).breakdown.washCo2).toBe(0)
    expect(co2ForHomeEnergy({}).breakdown.washCo2).toBe(0)
  })

  // ── BOUNDARY / INVALID INPUT ──────────────────────────────────
  it('treats negative or non-numeric hour values as zero rather than crashing', () => {
    const result = co2ForHomeEnergy({ acHours: -5, tvHours: 'lots', fanHours: null })
    expect(Number.isFinite(result.total)).toBe(true)
  })

  it('handles a maxed-out 24-hour day for every appliance without error', () => {
    const result = co2ForHomeEnergy({
      acHours: 24, acTemp: 16, geyserHours: 24, tvHours: 24,
      fanHours: 24, gasHours: 24, washingMachine: true
    })
    expect(Number.isFinite(result.total)).toBe(true)
    expect(result.total).toBeGreaterThan(0)
  })
})
