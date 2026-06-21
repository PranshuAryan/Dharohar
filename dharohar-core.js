/**
 * dharohar-core.js
 * ──────────────────────────────────────────────────────────────
 * Pure, framework-free carbon-footprint calculation functions
 * shared across Dharohar's pages (DailyTracker, report, forest,
 * suggestions). Extracted into one module so the same constants
 * and formulas are used everywhere instead of being duplicated
 * and re-typed in every HTML file — this also makes everything
 * here unit-testable.
 *
 * Usage in browser pages:
 *   <script type="module">
 *     import { sanitize, co2ForTravel, co2ForHomeEnergy } from './dharohar-core.js'
 *   </script>
 *
 * Usage in tests:
 *   import { sanitize, co2ForTravel } from '../dharohar-core.js'
 */

// ── CONSTANTS ────────────────────────────────────────────────────

/** kg CO2 emitted per km, by travel mode (India-specific estimates) */
export const CO2_PER_KM = {
  ola: 0.16,
  auto: 0.09,
  bus: 0.008,
  metro: 0.004,
  train: 0.003,
  flight: 0.255,
  walk: 0
}

/** Average Indian daily carbon footprint, in kg CO2/day */
export const AVG_INDIAN_KG_PER_DAY = 5.2

/** kg of CO2 a mature tree absorbs per year (used for "trees equivalent") */
export const KG_CO2_PER_TREE_PER_YEAR = 22

/** kg of O2 released per kg of CO2 absorbed via photosynthesis (32g/mol O2 ÷ 44g/mol CO2 × stoichiometric ratio) */
export const O2_RELEASED_PER_KG_CO2 = 0.727

/** kg of oxygen an average adult human needs to breathe per day */
export const HUMAN_O2_NEED_KG_PER_DAY = 0.84

/** Phone charges equivalent per kg of CO2 (rough real-world estimate) */
export const PHONE_CHARGES_PER_KG_CO2 = 129

// ── SANITIZATION ─────────────────────────────────────────────────

/**
 * Strips HTML-significant characters and the javascript: protocol from
 * user-supplied strings before they are ever inserted into the DOM.
 * Always prefer textContent over innerHTML, but call this first regardless
 * as defence-in-depth.
 *
 * @param {*} str - value to sanitize (non-strings return '')
 * @param {number} [maxLen=100] - maximum length to keep
 * @returns {string} sanitized, trimmed, length-capped string
 */
export function sanitize(str, maxLen = 100) {
  if (!str || typeof str !== 'string') return ''
  return str
    .replace(/[<>"'`]/g, '')
    .replace(/javascript:/gi, '')
    .trim()
    .slice(0, maxLen)
}

// ── TRAVEL CO2 ───────────────────────────────────────────────────

/**
 * Calculates CO2 (kg) emitted for a single trip.
 * @param {string} mode - one of the keys in CO2_PER_KM
 * @param {number} distanceKm - distance travelled in km (must be >= 0)
 * @returns {number} kg CO2, rounded to 3 decimal places
 * @throws {Error} if distanceKm is negative or not a finite number
 */
export function co2ForTravel(mode, distanceKm) {
  if (typeof distanceKm !== 'number' || !Number.isFinite(distanceKm) || distanceKm < 0) {
    throw new Error('distanceKm must be a non-negative finite number')
  }
  const factor = CO2_PER_KM[mode]
  if (factor === undefined) {
    // Unknown mode — fail safe to 0 rather than throwing, since
    // the UI should never block a save over an unrecognised mode.
    return 0
  }
  return parseFloat((distanceKm * factor).toFixed(3))
}

/**
 * Sums CO2 across a list of trip objects ({ mode, distanceKm }).
 * @param {Array<{mode:string, distanceKm:number}>} trips
 * @returns {number} total kg CO2, rounded to 3 decimal places
 */
export function totalTravelCo2(trips) {
  if (!Array.isArray(trips)) return 0
  const total = trips.reduce((sum, t) => sum + co2ForTravel(t.mode, t.distanceKm), 0)
  return parseFloat(total.toFixed(3))
}

// ── HOME ENERGY CO2 ──────────────────────────────────────────────

/**
 * AC emissions scale up the colder the thermostat is set below 24°C —
 * each degree below 24°C adds 6% more CO2 to account for the extra
 * compressor load.
 * @param {number} tempC - AC thermostat setting in Celsius
 * @returns {number} multiplier (1.0 at 24°C or warmer)
 */
export function getACTempFactor(tempC) {
  if (typeof tempC !== 'number' || !Number.isFinite(tempC)) return 1
  return 1 + Math.max(0, 24 - tempC) * 0.06
}

/**
 * Calculates total home-energy CO2 (kg) for one day from appliance usage.
 * @param {Object} usage
 * @param {number} usage.acHours
 * @param {number} usage.acTemp
 * @param {number} usage.geyserHours
 * @param {number} usage.tvHours
 * @param {number} usage.fanHours
 * @param {number} usage.gasHours
 * @param {boolean} usage.washingMachine
 * @returns {{ total:number, breakdown:Object }} total kg CO2 and per-appliance breakdown
 */
export function co2ForHomeEnergy(usage = {}) {
  const acHours        = numOrZero(usage.acHours)
  const acTemp          = typeof usage.acTemp === 'number' ? usage.acTemp : 24
  const geyserHours     = numOrZero(usage.geyserHours)
  const tvHours         = numOrZero(usage.tvHours)
  const fanHours        = numOrZero(usage.fanHours)
  const gasHours        = numOrZero(usage.gasHours)
  const washingMachine  = !!usage.washingMachine

  const acCo2    = round3(acHours * 1.3 * getACTempFactor(acTemp))
  const geyserCo2 = round3(geyserHours * 1.2)
  const tvCo2    = round3(tvHours * 0.1)
  const fanCo2   = round3(fanHours * 0.03)
  const gasCo2   = round3(gasHours * 0.22)
  const washCo2  = washingMachine ? 0.6 : 0

  const total = round3(acCo2 + geyserCo2 + tvCo2 + fanCo2 + gasCo2 + washCo2)

  return {
    total,
    breakdown: { acCo2, geyserCo2, tvCo2, fanCo2, gasCo2, washCo2 }
  }
}

// ── EQUIVALENTS / IMPACT ─────────────────────────────────────────

/**
 * @param {number} co2Kg
 * @returns {number} equivalent number of full phone charges
 */
export function phoneChargesEquivalent(co2Kg) {
  return Math.round(numOrZero(co2Kg) * PHONE_CHARGES_PER_KG_CO2)
}

/**
 * @param {number} co2Kg
 * @returns {number} equivalent "tree-years" of CO2 absorption
 */
export function treesEquivalent(co2Kg) {
  return numOrZero(co2Kg) / KG_CO2_PER_TREE_PER_YEAR
}

/**
 * Converts saved CO2 into days of breathable oxygen for one person,
 * using the CO2→O2 photosynthesis ratio and average daily human O2 need.
 * @param {number} co2SavedKg
 * @returns {number} days of oxygen (can be fractional)
 */
export function daysOfOxygen(co2SavedKg) {
  const o2Kg = numOrZero(co2SavedKg) * O2_RELEASED_PER_KG_CO2
  return o2Kg / HUMAN_O2_NEED_KG_PER_DAY
}

/**
 * Determines which plant type should grow for a given day's CO2 saved
 * (vs the average Indian). Mirrors the thresholds used in forest.html.
 * @param {number} savedKg - positive number representing kg saved that day
 * @returns {'grass'|'sapling'|'bamboo'|'tree'}
 */
export function plantTypeForSaving(savedKg) {
  const saved = numOrZero(savedKg)
  if (saved >= 4) return 'tree'
  if (saved >= 2.5) return 'bamboo'
  if (saved >= 1) return 'sapling'
  return 'grass'
}

/**
 * Computes progress toward the user's next "tree" milestone.
 * @param {number} totalSavedKg - cumulative CO2 saved
 * @returns {{ percent:number, remainingKg:number, treeNumber:number }}
 */
export function treeProgress(totalSavedKg) {
  const saved = Math.max(0, numOrZero(totalSavedKg))
  const progressIntoCurrent = saved % KG_CO2_PER_TREE_PER_YEAR
  const percent = (progressIntoCurrent / KG_CO2_PER_TREE_PER_YEAR) * 100
  const remainingKg = round3(KG_CO2_PER_TREE_PER_YEAR - progressIntoCurrent)
  const treeNumber = Math.floor(saved / KG_CO2_PER_TREE_PER_YEAR) + 1
  return { percent: round3(percent), remainingKg, treeNumber }
}

/**
 * @param {number} totalCo2Kg - a day's (or period's) total CO2 in kg
 * @returns {number} difference vs the average Indian (negative = better than average)
 */
export function vsAvgIndian(totalCo2Kg) {
  return round3(numOrZero(totalCo2Kg) - AVG_INDIAN_KG_PER_DAY)
}

// ── INDIAN PLACE-NAME ABBREVIATION EXPANSION ──────────────────────

export const PLACE_ABBREVIATIONS = {
  junc: 'junction', jn: 'junction', jcn: 'junction', jct: 'junction',
  rly: 'railway', rlwy: 'railway', rw: 'railway',
  st: 'station', stn: 'station', sta: 'station',
  rd: 'road', mkt: 'market', apt: 'airport', arpt: 'airport',
  intl: 'international', nr: 'near', opp: 'opposite',
  ph: 'phase', sec: 'sector', blk: 'block',
  clny: 'colony', col: 'colony', soc: 'society',
  hosp: 'hospital', hsp: 'hospital',
  univ: 'university', coll: 'college'
}

/**
 * Expands common Indian place-name abbreviations word-by-word so that
 * partial/abbreviated input (e.g. "Patna Junc") matches full place names
 * (e.g. "Patna Junction") in geocoding lookups.
 * @param {string} query
 * @returns {string}
 */
export function expandPlaceAbbreviations(query) {
  if (!query || typeof query !== 'string') return ''
  return query
    .split(' ')
    .map(word => PLACE_ABBREVIATIONS[word.toLowerCase()] || word)
    .join(' ')
}

// ── INTERNAL HELPERS ──────────────────────────────────────────────

function numOrZero(v) {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0
}

function round3(v) {
  return parseFloat(v.toFixed(3))
}
