import { describe, it, expect } from 'vitest'
import { sanitize, expandPlaceAbbreviations } from '../dharohar-core.js'

describe('sanitize() — XSS / input safety', () => {
  // ── HAPPY PATH ───────────────────────────────────────────────
  it('returns a normal name unchanged', () => {
    expect(sanitize('Rahul Sharma')).toBe('Rahul Sharma')
  })

  it('trims leading and trailing whitespace', () => {
    expect(sanitize('   Priya   ')).toBe('Priya')
  })

  // ── SECURITY / EDGE CASES ─────────────────────────────────────
  it('strips angle brackets to neutralise script tags', () => {
    expect(sanitize('<script>alert(1)</script>')).not.toContain('<')
    expect(sanitize('<script>alert(1)</script>')).not.toContain('>')
  })

  it('strips quote characters that could break out of HTML attributes', () => {
    const result = sanitize(`name" onmouseover="alert(1)`)
    expect(result).not.toContain('"')
  })

  it('strips the javascript: protocol', () => {
    expect(sanitize('javascript:alert(1)').toLowerCase()).not.toContain('javascript:')
  })

  it('enforces the default max length of 100 characters', () => {
    const longString = 'a'.repeat(500)
    expect(sanitize(longString).length).toBe(100)
  })

  it('respects a custom max length', () => {
    expect(sanitize('hello world', 5).length).toBe(5)
  })

  it('returns an empty string for non-string input instead of throwing', () => {
    expect(sanitize(null)).toBe('')
    expect(sanitize(undefined)).toBe('')
    expect(sanitize(12345)).toBe('')
    expect(sanitize({})).toBe('')
    expect(sanitize([])).toBe('')
  })

  it('returns an empty string for an empty string', () => {
    expect(sanitize('')).toBe('')
  })
})

describe('expandPlaceAbbreviations()', () => {
  // ── HAPPY PATH ───────────────────────────────────────────────
  it('expands "Junc" to "junction"', () => {
    expect(expandPlaceAbbreviations('Patna Junc')).toBe('Patna junction')
  })

  it('expands multiple abbreviations in the same query', () => {
    expect(expandPlaceAbbreviations('Rly Stn nr Mkt')).toBe('railway station near market')
  })

  it('is case-insensitive when matching abbreviations', () => {
    expect(expandPlaceAbbreviations('JUNC')).toBe('junction')
    expect(expandPlaceAbbreviations('Jn')).toBe('junction')
  })

  it('leaves full words and unknown words unchanged', () => {
    expect(expandPlaceAbbreviations('Boring Road')).toBe('Boring Road')
    expect(expandPlaceAbbreviations('Gandhi Maidan')).toBe('Gandhi Maidan')
  })

  // ── EDGE CASES ───────────────────────────────────────────────
  it('returns an empty string for empty or invalid input', () => {
    expect(expandPlaceAbbreviations('')).toBe('')
    expect(expandPlaceAbbreviations(null)).toBe('')
    expect(expandPlaceAbbreviations(undefined)).toBe('')
  })

  it('handles a single-word query', () => {
    expect(expandPlaceAbbreviations('jn')).toBe('junction')
  })
})
