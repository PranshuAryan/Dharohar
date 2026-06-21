// ══════════════════════════════════════════════════════════════
// 🔒 DHAROHAR AUTH GUARD — paste this at top of EVERY protected page
// (dashboard.html, report.html, suggestions.html, forest.html)
// This blocks anyone who tries to access pages by typing URL directly
// ══════════════════════════════════════════════════════════════

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL  = 'YOUR_SUPABASE_URL'
const SUPABASE_ANON = 'YOUR_SUPABASE_ANON_KEY'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
})

// ── GUARD: Check session immediately on page load ─────────────
async function guardPage() {
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error || !session?.user) {
    // 🔒 No session — kick back to login immediately
    // Use replace() so back button doesn't bring them back to protected page
    window.location.replace('index.html')
    return null
  }

  // 🔒 Check token not expired
  const expiresAt = session.expires_at * 1000
  if (Date.now() >= expiresAt) {
    await supabase.auth.signOut()
    window.location.replace('index.html')
    return null
  }

  // 🔒 Verify user ID exists and is a valid UUID format
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidPattern.test(session.user.id)) {
    await supabase.auth.signOut()
    window.location.replace('index.html')
    return null
  }

  return session.user // safe to use
}

// ── SIGN OUT FUNCTION — use this for logout buttons ──────────
async function signOut() {
  await supabase.auth.signOut()
  window.location.replace('index.html')
}

// ── SANITIZE — always use before putting any user data in DOM ─
function sanitize(str) {
  if (!str || typeof str !== 'string') return ''
  return str.replace(/[<>"'`]/g, '').replace(/javascript:/gi, '').trim().slice(0, 100)
}

// ── USAGE IN YOUR PAGE ────────────────────────────────────────
// const user = await guardPage()
// if (!user) return  // stops rest of code if not logged in
// 
// // Now safe to use user.id for all Supabase queries
// const { data } = await supabase
//   .from('trips')
//   .select('*')
//   .eq('user_id', user.id)  // 🔒 always filter by user.id from session
//                             // NEVER from URL params or localStorage

export { supabase, guardPage, signOut, sanitize }
