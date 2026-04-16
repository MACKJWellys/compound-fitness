# Compound Fitness — Agent Handoff Document

This document gives a new Claude Code agent a complete picture of the app as built, so it can make changes without reading every source file from scratch. Read this instead of the source files unless you need to verify a specific implementation detail.

---

## What the app is

A PWA (Progressive Web App) fitness tracker for a Pixel 8 Pro. It covers a 12-week summer PPL (Push/Pull/Legs) programme running **April 1 – June 24, 2026**. Three tabs: Dashboard, PR Book, Programme. No backend — all data is stored in `localStorage`. Built with **Vite + React 19**, no router.

**To run locally:** `cd app && npm run dev -- --host` then open the printed network URL in Chrome on the phone.  
**To build for production/deploy:** `npm run build` — outputs to `app/dist/`.  
**To preview the production build (PWA service worker active):** `npm run preview`.

The app must be served from HTTPS or localhost for the PWA service worker to install properly. For phone testing via USB, use Android port forwarding: `chrome://inspect/#devices` → Port forwarding → `5173 → localhost:5173`, then visit `http://localhost:5173` on the phone.

---

## Project file map

```
C:/Users/wells/Desktop/Compound Fitness/
├── app/                          ← Vite React project root
│   ├── package.json              ← React 19, vite-plugin-pwa, workbox-precaching
│   ├── vite.config.js            ← VitePWA plugin config (manifest, SW, icons)
│   ├── index.html                ← Entry HTML; theme-color, apple PWA meta tags, icon.svg favicon
│   ├── public/
│   │   ├── icon.svg              ← App icon (dark bg, "CF" in #E8634A)
│   │   ├── icon-192.png          ← Placeholder (SVG content, not real PNG — future improvement)
│   │   └── icon-512.png          ← Placeholder (same)
│   └── src/
│       ├── main.jsx              ← ReactDOM.createRoot, imports index.css
│       ├── index.css             ← Global CSS variables + resets (see Design System below)
│       ├── App.jsx               ← Root: bottom tab nav + session overlay
│       ├── data/
│       │   ├── programme.js      ← Static programme data (DAYS, PROGRESSION, etc.)
│       │   ├── prSeed.js         ← Historical PR seed data + 12-week targets
│       │   ├── muscleMappings.js ← Exercise → muscle group mappings + volume targets
│       │   └── storage.js        ← All localStorage read/write functions
│       ├── utils/
│       │   └── dateUtils.js      ← getWeekStart, toDateStr, getProgrammeWeek
│       ├── components/
│       │   └── MuscleIllustration.jsx ← SVG front-view body diagram
│       └── screens/
│           ├── Dashboard.jsx     ← Home tab
│           ├── SessionScreen.jsx ← Active workout overlay
│           ├── PRBook.jsx        ← PR Book tab
│           └── Programme.jsx     ← Programme reference tab
├── summer-ppl-programme.jsx      ← Original JSX artifact (source of programme data, now superseded)
├── PRs_Summer2026.xlsx           ← Original PR spreadsheet (now seeded into the app)
├── gym-app-vision.md             ← Full original spec document — read this for feature intent
└── finalising.md                 ← This file
```

---

## Design system

Everything uses **inline styles** — no CSS modules, no styled-components. The CSS file only sets global resets and CSS variables.

**CSS variables** (defined in `src/index.css`):
```
--color-push:    #E8634A   (warm red/orange — Push A and Push B sessions)
--color-pull:    #4A90D9   (blue — Pull A and Pull B sessions)
--color-legs:    #5BBD72   (green — Legs A and Legs B sessions)
--color-bg:      #111111   (page background)
--color-surface: #1a1a1a   (card backgrounds)
--color-surface2:#222222
--color-border:  #2a2a2a   (default border colour)
--color-text:    #e8e8e8   (primary text)
--color-muted:   #666666   (secondary/muted text)
--color-green:   #5BBD72
--color-amber:   #F0A500
--font: 'IBM Plex Mono', 'SF Mono', 'Menlo', monospace
```

**Spacing:** multiples of 8px. **Border radius:** 10–12px for cards, 6px for small elements, 4px for tiny badges. **No box-shadows** — use borders instead. **No horizontal scrolling** on the page (412px target width — Pixel 8 Pro).

**Session colour helper** (used in Dashboard.jsx):
```js
function tintedBg(colour) {
  return `color-mix(in srgb, ${colour} 8%, #111111)`;
}
```

---

## App.jsx — routing and state

No router. Tab navigation is pure React state. There are exactly **3 tabs** (ids: `'home'`, `'prbook'`, `'programme'`) rendered in the fixed bottom tab bar.

**Session overlay:** when the user taps START on the dashboard, `activeSession` state is set to the session object and `SessionScreen` mounts as a `position: fixed, inset: 0, zIndex: 100` overlay. The tabs remain in the DOM underneath. When the session is saved or the user presses BACK, `activeSession` is cleared and the overlay unmounts.

Key props passed down:
- `Dashboard` receives `onStartSession(session)` — sets `activeSession` in App
- `SessionScreen` receives `session`, `sessionIndex` (0–5), `onBack`, `onComplete`

---

## data/programme.js

Exports:
- `DAYS` — array of 6 session objects (Push A, Pull A, Legs A, Push B, Pull B, Legs B), each with `{ name, subtitle, colour, exercises[] }`. Each exercise: `{ name, priority, sets, reps, rest, note }`.
- `PROGRESSION` — 3 phases: Foundation (wks 1–4), Push (wks 5–8), Peak (wks 9–12).
- `WEEKLY_STRUCTURE` — 7 items `{ day, session }` (Mon–Sun, last is Rest).
- `NON_NEGOTIABLES` — 7 items `{ title, body }`.
- `PROGRAMME_START = new Date('2026-04-01')`
- `PROGRAMME_END = new Date('2026-06-24')`
- `TOTAL_WEEKS = 12`

**Session order in DAYS array:** index 0=Push A, 1=Pull A, 2=Legs A, 3=Push B, 4=Pull B, 5=Legs B.

---

## data/prSeed.js

Exports:
- `PR_SEED` — object keyed by exercise name → object keyed by rep count (number) → array of `{ weight: string, date: string|null }`. Date format is `"dd.mm"` (e.g. `"9.3"` = March 9). Weight format is a string — `"82.5"` for barbell, `"28s"` for dumbbells (s = per side), `"bw"` for bodyweight.
- `TWELVE_WEEK_TARGETS` — array of `{ exercise, current, w6, w12 }` strings for display.

**Important:** all keys in `PR_SEED` exactly match exercise names in `DAYS` (this was aligned in a fix pass). When adding new exercises to the programme, add a matching key to `PR_SEED` too.

---

## data/muscleMappings.js

Exports:
- `MUSCLE_MAPPINGS` — object keyed by exact exercise name → `{ primary: string[], secondary: string[] }`. Secondary muscles receive 0.5× credit in volume calculations.
- `VOLUME_TARGETS_DEFAULT` — object keyed by muscle group name → integer (target sets/week).

**Important naming:** muscle group keys must match exactly between `MUSCLE_MAPPINGS` values, `VOLUME_TARGETS_DEFAULT` keys, and `MuscleIllustration.jsx`'s `getMuscleColor()` calls. The combined key `'Upper Back / Lats'` is used throughout (not separate `'Lats'` and `'Upper Back'`).

Muscle groups tracked: Chest, Upper Chest, Front Delts, Side Delts, Triceps, Biceps, Upper Back / Lats, Rear Delts, Traps, Quads, Hamstrings, Glutes, Calves, Abs, Obliques, Core, Lower Back.

---

## data/storage.js

All data lives in `localStorage` under these keys:
- `cf_session_log` — array of completed session entries
- `cf_daily_log` — object keyed by `'YYYY-MM-DD'` date strings
- `cf_pr_book` — PR data object (seeded from `PR_SEED` on first load)
- `cf_next_session` — integer 0–5 (index into DAYS)
- `cf_volume_targets` — muscle group → target sets (falls back to `VOLUME_TARGETS_DEFAULT`)

**Exported functions:**

```js
// Session log
getSessionLog()                          // → array of sessions
saveSession(entry)                       // appends; entry shape below

// Session entry shape:
// { id, date: 'YYYY-MM-DD', sessionName, sessionIndex, 
//   exercises: [{name, setsLogged}], rating: 1-10, note: string, completedAt: ISO string }

// Daily log
getDailyLog()                            // → { [dateStr]: { weight, habits } }
saveDailyEntry(dateStr, data)            // merges into existing entry
getDayEntry(dateStr)                     // → { weight: number|null, habits: {sauna, protein, stretch} }

// PR Book
getPRBook()                              // → { [exerciseName]: { [repCount]: [{weight,date}] } }
addPREntry(exerciseName, repCount, weight, date)  // appends entry

// Session index
getNextSessionIndex()                    // → 0-5
setNextSessionIndex(i)                   // sets (wraps with % 6)
advanceNextSession()                     // increments by 1, wraps

// Volume
getVolumeTargets()                       // → { [muscle]: number }
getWeeklyVolume(weekStartDate)           // → { [muscle]: sets } for the 7-day window
```

---

## utils/dateUtils.js

```js
getWeekStart(date?)      // → Date object for Monday of the week containing `date`
toDateStr(date)          // → 'YYYY-MM-DD' string (ISO slice)
getProgrammeWeek(start?) // → { week: 1-12, phase: 'Foundation'|'Push'|'Peak', pct: 0-100 }
                         // phase based on week: 1-4=Foundation, 5-8=Push, 9-12=Peak
                         // pct = (week-1)/12 * 100, rounded
                         // if before programme start: returns { week:1, phase:'Foundation', pct:0 }
```

---

## screens/Dashboard.jsx

The main home screen. Receives `onStartSession(session)` prop from App.

**State:**
- `nextIdx` — int, which session is next (reads `getNextSessionIndex()` on mount)
- `sessionLog`, `dailyLog` — loaded in `useEffect` on mount
- `todayEntry` — today's `{ weight, habits }` from daily log
- `weightInput` — controlled string for the weight input
- `weeklyVolume` — computed from `getWeeklyVolume(weekStart)`
- `volumeTargets` — loaded once from `getVolumeTargets()`

**Session abbreviations** (used in the week strip):
```js
{ 'Push A':'PA', 'Pull A':'PL', 'Legs A':'LA', 'Push B':'PB', 'Pull B':'PLB', 'Legs B':'LB' }
```

**Phase colours** for the progress bar:
```js
{ Foundation: '#4A90D9', Push: '#E8634A', Peak: '#F0A500' }
```

**Habit config:**
```js
[{ key:'sauna', label:'sauna', colour:'#4A90D9' },
 { key:'protein', label:'prot', colour:'#E8634A' },
 { key:'stretch', label:'str', colour:'#5BBD72' }]
```

**Layout sections (top to bottom):**
1. Header — "SUMMER 2026", "WEEK X · PHASE", thin progress bar, "X of 12 weeks · Y% complete"
2. Next Session card — tinted bg (`color-mix`), session name in session colour, START + CHANGE buttons
3. This Week strip — 7 day cells (Mon–Sun), coloured abbreviation badge if session logged, bodyweight below, today has a lighter border
4. TODAY + HABITS row — bodyweight number input (saves on blur) + 3 habit dot toggles side by side
5. WEEKLY MUSCLE VOLUME — `<MuscleIllustration size={140} .../>` centred, "front view · resets Monday" caption

---

## screens/SessionScreen.jsx

Full-screen workout overlay. Receives `session`, `sessionIndex`, `onBack`, `onComplete`.

**Internal components:**
- `PRPanel({ exercise, colour })` — inline PR history table + add-PR form. Shows all entries per rep count (newest highlighted, older dimmed). Reads/writes via `getPRBook()` / `addPREntry()`.
- `ExerciseCard({ exercise, colour, setsLogged, onSetsChange })` — card with name, KEY badge, sets×reps·rest, set counter (−/+, min 0, max `parseMaxSets(exercise.sets)`), expandable coaching note (tap name), PR panel toggle ("PR ▸/▾").
- `CompletionModal({ session, sessionIndex, setsPerExercise, onSave, onCancel })` — fixed overlay with 1–10 rating grid, optional notes textarea, SAVE SESSION button. On save: calls `saveSession(...)`, `advanceNextSession()`, `onSave()`.

**`parseMaxSets(setsStr)`** — sums all numbers in the string (handles `"3+3"` → 6, `"4"` → 4).

**Layout:** sticky header (← BACK, session name/subtitle, COMPLETE button) + scrollable exercise list + COMPLETE SESSION bottom button.

---

## screens/PRBook.jsx

PR Book tab. No props.

**SECTIONS** array defines exercise order per category:
- PUSH (#E8634A): 30° DB Incline Bench, Flat Barbell Bench Press, Seated DB OHP, Standing BB OHP, DB Lateral Raises (Paused), Cable Lateral Raises, Standing Cable Crossover, Tricep Superset: OH Ext → Pushdown, Pec Deck / Machine Fly, Decline Weighted Crunch, Weighted Cable Crunch
- PULL (#4A90D9): Weighted Pull-ups, Pull-ups (Bodyweight Volume), Chest-Supported BB Row, Close-Grip Cable Row, Rear Delt Cable Fly, Rear Delt Machine Fly, Paused Kettlebell Shrugs, Seated Stretched Cable Curl, Hanging Leg Raises, DB Pullover (Posture), Reverse Dragon Flag Progression, Incline DB Curl, Hammer Curl (unilateral), Romanian Deadlift
- LEGS (#5BBD72): Zercher Squat, Leg Press, Leg Extensions, Lying Leg Curl, Hip Thrust, Bulgarian Split Squat, Standing Calf Raises, Decline Weighted Crunch + KB Obliques, Oblique Cable Crunch

**`ExerciseTable`** — renders one exercise's PR data as a CSS grid table (rep rows × up to 6 PR columns). Entry format: `"weight  date"` or just `"weight"` if no date, `"—"` for empty cells. "+ ADD PR" button expands an inline form (reps, weight, optional date).

**Top of screen:** collapsible "12-WEEK TARGETS" section (`defaultOpen={true}`) showing TWELVE_WEEK_TARGETS as a 4-column grid (Exercise / Current / Wk 6 / Wk 12).

**`CollapsibleSection`** component handles PUSH/PULL/LEGS section headers (coloured, with ▾/▸ toggle).

---

## screens/Programme.jsx

Programme reference tab. No props. Imports DAYS, PROGRESSION, NON_NEGOTIABLES, WEEKLY_STRUCTURE from programme.js.

**State:** `activeDay` (0–5) for the day tab selector.

**Layout:**
- Header: "SUMMER 2026" / "12-Week PPL Programme"
- Horizontally scrollable day tabs (Push A through Legs B) — active tab gets session colour border + tinted bg
- Session title + subtitle
- Exercise cards (`ExerciseCard`) — read-only, expandable coaching note ("▸ more" / "▾ less"), KEY badge for priority exercises (always shown in #E8634A regardless of session colour in this tab)
- Three collapsible sections (`CollapsibleBlock`): SESSION ROTATION, 12-WEEK PROGRESSION, NON-NEGOTIABLES

---

## components/MuscleIllustration.jsx

SVG front-view body diagram. Props: `weeklyVolume`, `volumeTargets`, `size` (default 160).

**Colour mapping** (`getMuscleColor(muscleKey)`):
- 0 sets → `#2a2a2a` (grey)
- ratio < 0.5 → `#3a4a3a` (dark)
- ratio < 1.0 → `#4a7a5a` (medium green)
- ratio < 1.5 → `#5BBD72` (bright green = target met)
- ratio ≥ 1.5 → `#F0A500` (amber = over target)

**Muscle regions rendered** (each calls `getMuscleColor` with the exact key below):
- `'Traps'` — trapezoid band at base of neck
- `'Side Delts'` — oval shoulder caps, left and right
- `'Upper Chest'` — upper pec region
- `'Chest'` — lower/mid pec region
- `'Front Delts'` — small ellipses overlapping shoulder/chest join
- `'Biceps'` — upper arm front, left and right
- `'Triceps'` — upper arm outer/back, left and right
- `'Abs'` — central rect with 6-pack grid lines
- `'Obliques'` — flanking the abs, left and right
- `'Quads'` — front thigh, left and right, with VMO teardrop ellipses
- `'Calves'` — lower leg, left and right
- `'Upper Back / Lats'` — lat hint visible from front, left and right

SVG viewBox: `0 0 200 320`. Rendered at `width={size}` `height={size * 1.6}`.

**Note:** this is a front-only view. Hamstrings, Glutes, Rear Delts are tracked in volume data but not visible in the current illustration (the spec mentioned front+back but only front was built).

---

## Known gaps / things not yet built

These are the features the user described as "missing" that prompted this document. A future session will implement them:

1. **Back-view muscle illustration** — Hamstrings, Glutes, Rear Delts, Lower Back are tracked in volume data but not shown. The dashboard shows "front view · resets Monday" — a back view figure alongside the front would complete this.

2. **Bodyweight trend** — The spec mentioned "a small trend line or weekly average somewhere on the dashboard" (nice-to-have). Daily weight is stored but no chart or average is displayed.

3. **Session history / log view** — There is no way to browse past sessions. `getSessionLog()` stores all completed sessions but no UI exposes them.

4. **Volume targets editing** — `getVolumeTargets()` and `cf_volume_targets` key exist in storage, and `VOLUME_TARGETS_DEFAULT` is defined, but there is no UI to edit targets. The spec says they should be editable.

5. **Week strip only shows one session per day** — `sessionByDate` in Dashboard is built as a plain object so if two sessions are logged on the same day, only the second is shown.

6. **PWA icons are SVG placeholders** — `icon-192.png` and `icon-512.png` in `/public` contain SVG data (not real PNGs). Android will use `icon.svg` via the manifest (`sizes: 'any'`). For full compatibility with all Android launchers, real PNG files should replace these.

7. **Dashboard data doesn't refresh after session completion** — after completing a session and returning to the dashboard, the week strip and muscle volume illustration don't update until the page reloads. The dashboard `useEffect` only runs on `todayStr` change (which doesn't change). A refresh mechanism (e.g. a key prop from App.jsx, or an event) is needed.

---

## Data flow summary

```
localStorage
    │
    ├─ cf_pr_book ──────────────► PRBook tab (view + edit)
    │                             SessionScreen PRPanel (view + edit)
    │
    ├─ cf_session_log ──────────► Dashboard week strip (completed sessions)
    │                             Dashboard muscle volume (via getWeeklyVolume)
    │
    ├─ cf_daily_log ────────────► Dashboard week strip (bodyweight per day)
    │                             Dashboard TODAY card (bodyweight + habits)
    │
    ├─ cf_next_session ─────────► Dashboard next session card
    │                             (advanced by SessionScreen on completion)
    │
    └─ cf_volume_targets ───────► MuscleIllustration (via Dashboard)
```

---

## Conventions to follow when making changes

- **Inline styles only** — no CSS modules, no external styling libraries
- **No new dependencies** unless clearly necessary — the app is intentionally lightweight
- **All data through storage.js** — don't read/write localStorage directly in components
- **Exercise names must be consistent** — any exercise name used as a key in `prSeed.js`, `muscleMappings.js`, `PRBook.jsx` SECTIONS, and `programme.js` DAYS must be identical strings. Check all four when adding or renaming exercises.
- **Muscle group names must be consistent** — keys in `MUSCLE_MAPPINGS` values, `VOLUME_TARGETS_DEFAULT`, and `getMuscleColor()` calls must match exactly.
- **Mobile-first** — test mentally at 412px width. No horizontal overflow on the main page.
- **Build check** — always run `npm run build` from the `app/` directory after changes. Build must complete with 0 errors.
