# 🌳 Dharohar — Your Carbon Legacy

> An India-first carbon footprint tracker that turns everyday choices into a living, growing forest.

**🔗 Live Demo:** [mydharohar.netlify.app](https://mydharohar.netlify.app/)

Built for **Google PromptWars: Virtual** (Google for Developers × Hack2Skill)

---

## 🌿 What is Dharohar?

**Dharohar** (Hindi for *"legacy"* or *"heritage"*) is a web app that helps Indians understand, track, and reduce their daily carbon footprint — without the friction that makes most sustainability apps feel like chores.

Instead of generic global averages, Dharohar benchmarks every user against the **real average Indian carbon footprint (5.2 kg CO₂/day)** and turns their progress into a personal, animated forest that grows one mindful day at a time.

---

## 🎯 The Problem

Most carbon tracking apps:
- Use global, not local, emission data — irrelevant to Indian users
- Require tedious manual logging that people abandon after a few days
- Show raw numbers (kg CO₂) that mean nothing emotionally
- Have no real connection between effort and visible reward

**Dharohar solves all four.**

---

## ✨ Core Features

### 🔐 Effortless Onboarding
One-click Google Sign-In via Supabase Auth. No forms, no passwords. A warm, personalised "Namaste" welcome card greets every new user.

### 📍 Daily Tracker
- Tap-to-select travel modes (Ola, Auto, Bus, Metro, Train, Flight, Walk)
- Free place-name autocomplete (OpenStreetMap Nominatim) with **Indian abbreviation expansion** (e.g. "Patna Junc" → "Patna Junction")
- Real road-distance calculation via OSRM (Open Source Routing Machine)
- Home energy sliders — AC (with temperature-based CO₂ scaling), geyser, TV, fan, gas stove, washing machine
- Live running CO₂ total with instant comparison to the average Indian

### 📊 Personal Report
Visual breakdown of travel vs. home energy emissions, weekly/monthly trends, and streaks.

### 💡 AI-Powered Suggestions (Groq + Llama 3.3 70B)
Personalised, specific advice generated from the user's **actual logged data** — not generic tips. E.g. *"Your most used mode is Ola — try Metro once this week to save ~1.5 kg CO₂."*

### 🌳 The Living Forest
The emotional core of the app. Every day a user beats the average Indian footprint, a plant grows in their personal forest:

| CO₂ saved that day | Plant grown |
|---|---|
| 0–1 kg | 🌱 Grass tuft |
| 1–2.5 kg | 🌿 Sapling |
| 2.5–4 kg | 🎋 Bamboo |
| 4+ kg | 🌳 Full tree |

Trees animate onto screen on every visit, accompanied by real-life equivalents (phone charges saved, auto-rickshaw km avoided, oxygen-days produced) calculated from actual atmospheric science — not arbitrary numbers.

### 📤 Shareable Forest Card
Generates a public, no-login-required link (`forest-view.html`) so users can share their progress on WhatsApp/Instagram/LinkedIn — a built-in growth loop.

---

## 🛠️ Tech Stack

| Layer | Tool | Why |
|---|---|---|
| Frontend | Pure HTML, CSS, JavaScript | Zero build step, instantly deployable, fast to iterate inside Antigravity |
| Auth & Database | **Supabase** (PostgreSQL + Auth) | Real SQL for aggregations (weekly/monthly totals), built-in Row Level Security |
| AI Suggestions | **Groq API** (`llama-3.3-70b-versatile`) | Near-instant inference (~300+ tokens/sec) for a snappy personalised-coach feel |
| Place Autocomplete | **Nominatim (OpenStreetMap)** | Free, no API key, works well for Indian places with custom abbreviation expansion |
| Distance Calculation | **OSRM (Open Source Routing Machine)** | Free real road-distance routing, no billing required |
| Fonts | Playfair Display + Inter (Google Fonts) | Editorial warmth + clean readability |
| Dev Environment | **Google Antigravity** | AI-native IDE used to scaffold, iterate, and debug every page |

---

## 🔒 Security

- Row Level Security (RLS) enabled on every Supabase table — users can only ever access their own data
- Auth guard on every protected page — blocks direct URL access without a valid session
- XSS-safe rendering (`textContent`, sanitisation functions) — never `innerHTML` with user-controlled data
- Whitelisted redirect URLs to prevent open-redirect attacks
- Rate-limited login attempts
- Content-Security-Policy headers on every page

---

## 📐 Data Model (Supabase)

```
profiles            → id, full_name, email, current_streak, total_co2_saved_kg, total_trees_planted
travel_logs         → user_id, date, mode, from_place, to_place, distance_km, co2_kg
home_energy_logs    → user_id, date, ac_hours, ac_temp, geyser_hours, tv_hours, fan_hours, gas_stove_hours, washing_machine, co2_kg
daily_logs          → user_id, date, travel_co2_kg, energy_co2_kg, total_co2_kg, vs_avg_indian
```

All tables have RLS policies scoped to `auth.uid() = user_id`.

---

## 🤖 How AI Was Used (Build-in-Public)

This project was built using a **Claude + Google Antigravity** workflow:

1. **Ideation & architecture** — Claude was used to break down the problem statement, design the data model, and plan the page-by-page user flow before any code was written.
2. **Code generation** — Full HTML/CSS/JS for each page (login, daily tracker, report, AI suggestions, living forest) was generated through iterative natural-language prompting.
3. **Debugging loop** — Errors and bugs were pasted back into the AI conversation; fixes were re-applied directly inside Antigravity's editor.
4. **Security hardening** — A dedicated audit pass was run to identify and patch XSS, open-redirect, and session-handling vulnerabilities.
5. **Runtime AI** — Groq's `llama-3.3-70b-versatile` model powers the in-app "AI Suggestions" page, generating live personalised insights from each user's real Supabase data on every page load.

**What GenAI handled:** boilerplate UI, CSS animations, Supabase query syntax, security pattern implementation, copywriting for suggestions.

**What was human-designed:** the core product idea (India-benchmarked tracking + the Living Forest growth mechanic), the emotional/UX direction, the choice of free-tier tools to avoid billing friction, and all final review/QA of generated code.

---

## 🚀 Try It Live

👉 **[mydharohar.netlify.app](https://mydharohar.netlify.app/)** — sign in with Google and start tracking immediately.

---

## 🖥️ Running Locally

1. Clone this repo
2. Open the folder with **Live Server** (VS Code extension) or **Google Antigravity**
3. Create a [Supabase](https://supabase.com) project and run the SQL schema in `/sql/schema.sql`
4. Enable **Google OAuth** in Supabase Authentication → Providers
5. Paste your `SUPABASE_URL` and `SUPABASE_ANON_KEY` into each HTML file's `<script type="module">` block
6. Get a free [Groq API key](https://console.groq.com) and paste it into `suggestions.html`
7. Open `index.html` via `http://127.0.0.1:5500` (not `file://`, OAuth requires an http origin)

---

## 📁 File Structure

```
dharohar/
├── index.html              # Login + welcome (Supabase Google Auth)
├── DailyTracker.html        # Daily activity logger (travel + home energy)
├── report.html              # Personal carbon report & trends
├── suggestions.html         # Groq-powered AI suggestions
├── forest.html               # Living Forest — animated growth + share
├── forest-view.html          # Public shareable forest card (no login)
└── README.md
```

**Deployment:** Hosted on Netlify — static files, zero build step, instant deploys on push.

---

## 🇮🇳 Made with 🤍 in India

Dharohar isn't just a tracker — it's meant to feel like leaving something behind. A *Dharohar* for the next generation.
