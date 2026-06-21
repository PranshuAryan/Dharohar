import { describe, it, expect } from 'vitest'
import {
  phoneChargesEquivalent,
  treesEquivalent,
  daysOfOxygen,
  plantTypeForSaving,
  treeProgress,
  vsAvgIndian,
  AVG_INDIAN_KG_PER_DAY
} from '../dharohar-core.js'

describe('phoneChargesEquivalent()', () => {
  it('converts kg CO2 to phone charges using the documented rate', () => {
    expect(phoneChargesEquivalent(1)).toBe(129)
    expect(phoneChargesEquivalent(2)).toBe(258)
  })

  it('returns 0 for 0 kg or invalid input', () => {
    expect(phoneChargesEquivalent(0)).toBe(0)
    expect(phoneChargesEquivalent(null)).toBe(0)
    expect(phoneChargesEquivalent(undefined)).toBe(0)
  })
})

describe('treesEquivalent()', () => {
  it('returns 1.0 trees for exactly 22kg CO2 (one tree-year)', () => {
    expect(treesEquivalent(22)).toBeCloseTo(1, 5)
  })

  it('returns a fraction for less than 22kg', () => {
    expect(treesEquivalent(4.4)).toBeCloseTo(0.2, 5)
  })

  it('returns 0 for 0kg', () => {
    expect(treesEquivalent(0)).toBe(0)
  })
})

describe('daysOfOxygen()', () => {
  it('converts saved CO2 into days of human oxygen need using the real ratio', () => {
    // 10kg CO2 -> 7.27kg O2 -> 7.27/0.84 = 8.654... days
    expect(daysOfOxygen(10)).toBeCloseTo(8.654, 2)
  })

  it('returns 0 for 0kg saved', () => {
    expect(daysOfOxygen(0)).toBe(0)
  })

  it('never returns a negative number for positive input', () => {
    expect(daysOfOxygen(0.001)).toBeGreaterThan(0)
  })
})

describe('plantTypeForSaving()', () => {
  // ── BOUNDARY VALUES — this is exactly where bugs hide ─────────
  it('returns "grass" for 0 kg saved', () => {
    expect(plantTypeForSaving(0)).toBe('grass')
  })

  it('returns "grass" for just under 1kg', () => {
    expect(plantTypeForSaving(0.99)).toBe('grass')
  })

  it('returns "sapling" at exactly 1kg (lower boundary)', () => {
    expect(plantTypeForSaving(1)).toBe('sapling')
  })

  it('returns "sapling" for just under 2.5kg', () => {
    expect(plantTypeForSaving(2.49)).toBe('sapling')
  })

  it('returns "bamboo" at exactly 2.5kg (lower boundary)', () => {
    expect(plantTypeForSaving(2.5)).toBe('bamboo')
  })

  it('returns "bamboo" for just under 4kg', () => {
    expect(plantTypeForSaving(3.99)).toBe('bamboo')
  })

  it('returns "tree" at exactly 4kg (lower boundary)', () => {
    expect(plantTypeForSaving(4)).toBe('tree')
  })

  it('returns "tree" for very large savings', () => {
    expect(plantTypeForSaving(100)).toBe('tree')
  })

  it('treats negative or invalid savings as "grass" rather than throwing', () => {
    expect(plantTypeForSaving(-5)).toBe('grass')
    expect(plantTypeForSaving(null)).toBe('grass')
    expect(plantTypeForSaving(undefined)).toBe('grass')
  })
})

describe('treeProgress()', () => {
  it('reports 0% progress and tree #1 at 0kg saved', () => {
    const p = treeProgress(0)
    expect(p.percent).toBe(0)
    expect(p.treeNumber).toBe(1)
    expect(p.remainingKg).toBeCloseTo(22, 3)
  })

  it('reports 50% progress at 11kg saved', () => {
    const p = treeProgress(11)
    expect(p.percent).toBeCloseTo(50, 3)
    expect(p.remainingKg).toBeCloseTo(11, 3)
  })

  it('rolls over to tree #2 correctly just after 22kg', () => {
    const p = treeProgress(23)
    expect(p.treeNumber).toBe(2)
    expect(p.percent).toBeCloseTo((1 / 22) * 100, 2)
  })

  it('clamps negative totals to 0 instead of going negative', () => {
    const p = treeProgress(-10)
    expect(p.percent).toBe(0)
    expect(p.treeNumber).toBe(1)
  })
})

describe('vsAvgIndian()', () => {
  it('returns a negative number when the user emits less than average (good day)', () => {
    expect(vsAvgIndian(3)).toBeCloseTo(3 - AVG_INDIAN_KG_PER_DAY, 3)
    expect(vsAvgIndian(3)).toBeLessThan(0)
  })

  it('returns a positive number when the user emits more than average', () => {
    expect(vsAvgIndian(8)).toBeGreaterThan(0)
  })

  it('returns exactly 0 when emissions equal the average', () => {
    expect(vsAvgIndian(AVG_INDIAN_KG_PER_DAY)).toBe(0)
  })
})
