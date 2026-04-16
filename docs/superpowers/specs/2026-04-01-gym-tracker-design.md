# Summer 2026 Gym Tracker — Design Spec
_Brainstormed and approved: 2026-04-01_

---

## Overview

A Progressive Web App (PWA) installed on a Google Pixel 8 Pro homescreen that replaces the current Excel + Google Keep workout tracking setup. The app covers the 12-week Summer 2026 PPL programme (April 1 – June 24, 2026). It combines three currently separate tools: the programme reference (existing JSX), the PR tracking spreadsheet (Excel), and daily habit/bodyweight logging (ad hoc notes).

**Goal:** Faster, more pleasant, and more complete than a spreadsheet. Everything one tap away at the gym.

---

## Tech Stack

- **Framework:** React 18 + Vite
- **PWA:** `vite-plugin-pwa` — generates manifest and service worker automatically. Android "Add to Home Screen" install, full-screen, no browser chrome.
- **Storage:** localStorage (on-device, no backend, no accounts)
- **Font:** IBM Plex Mono
- **Colour palette:**
  - Push sessions: `#E8634A`
  - Pull sessions: `#4A90D9`
  - Legs sessions: `#5BBD72`
  - Background: `#111`
  - Cards: `#141414` / `#1a1a1a`
- **Target viewport:** 393px wide, Pixel 8 Pro portrait. Thumb-friendly tap targets throughout.
- **Offline:** Must work fully offline. All data on-device.

---

## Data Model (localStorage)

### 1. `programme` — static, seeded at first launch

The full 6-day PPL split with all exercise data. Never changes at runtime.

```
{
  sessions: [
    {
      name: "Push A",
      subtitle: "Upper Chest & Delts Focus",
      colour: "#E8634A",
      exercises: [
        {
          name: string,
          priority: boolean,         // true = KEY badge
          sets: string,              // e.g. "4"
          reps: string,              // e.g. "8–10"
          rest: string,              // e.g. "2–3 min"
          restSeconds: number,       // parsed rest for timer, e.g. 150
          note: string,              // coaching note verbatim
          primaryMuscles: string[],  // e.g. ["Upper Chest"]
          secondaryMuscles: string[] // e.g. ["Front Delts", "Triceps"]
        }
      ]
    }
    // ... Push A, Pull A, Legs A, Push B, Pull B, Legs B
  ],
  progression: [...],   // 3 phase descriptions
  nonNegotiables: [...] // 7 rules
}
```

### 2. `prBook` — per exercise, per rep count

Pre-seeded from Excel data on first launch. Updated whenever the user logs a new PR.

```
{
  "Flat Barbell Bench Press": {
    6:  [{ weight: 82.5, date: "2026-02-04" }, { weight: 80, date: "2026-01-30" }],
    8:  [{ weight: 82.5, date: "2026-03-09" }, ...],
    10: [...],
    12: [...],
    14: [...]
  },
  "30° DB Incline Bench": { ... },
  // ... all exercises
}
```

Weight unit: kg. Dumbbell weights stored as per-hand (e.g. 26 = 26kg each hand, displayed as "26s").
Entries sorted newest-first within each rep count.

### 3. `sessionLog` — per completed session

```
[
  {
    id: string,                   // uuid
    date: string,                 // ISO date
    sessionName: string,          // e.g. "Push A"
    exercises: [
      {
        name: string,
        sets: [
          {
            weight: number,
            reps: number,
            note: string          // optional freetext e.g. "barely", "9f10"
          }
        ]
      }
    ],
    rating: number,               // 1–10
    note: string                  // optional session note
  }
]
```

### 4. `dailyLog` — per calendar day

```
{
  "2026-04-01": {
    bodyweight: 69.2,             // kg, one decimal, null if not logged
    habits: {
      sauna: true,
      protein: false,
      stretch: true
    }
  }
}
```

### 5. `appState` — rolling programme position

```
{
  lastCompletedSession: "Legs A"  // drives next-session suggestion
}
```

---

## Rolling Session Cycle

The programme is a rolling 7-step cycle, not fixed to calendar days:

```
Push A → Pull A → Legs A → Push B → Pull B → Legs B → Rest → Push A → ...
```

Next session is always derived from `appState.lastCompletedSession`. When the user completes a session, `lastCompletedSession` is updated and the dashboard auto-suggests the next in sequence. One tap override lets the user pick any session manually.

**Rest day handling:** After completing Legs B, the dashboard shows a "Rest Day" card (no START button, just a message and the CHANGE override). The user taps "Done — advance to Push A" to move the cycle forward, or uses CHANGE to start any session early. Rest days are not logged as sessions — they are a transient UI state only.

**Week number vs session cycle:** These are two independent things:
- **Phase/week label** on the dashboard header ("Week 4 · Foundation") is **calendar-based**: `Math.ceil((today - April 1, 2026) / 7)`. Foundation = weeks 1–4, Push = weeks 5–8, Peak = weeks 9–12.
- **Next session suggestion** is **rolling cycle-based**: always derived from `lastCompletedSession`, independent of the calendar.

---

## Navigation

Four bottom tabs, always visible except during an active session:

1. **Home** (⌂) — Dashboard
2. **PR Book** (↑) — Full PR book, browseable by exercise
3. **Programme** (≡) — Programme reference, progression phases, non-negotiables
4. **Cal** (▦) — 3-month scrollable calendar (April, May, June 2026)

Session mode is a full-screen overlay — tab bar hidden while a session is active.

---

## Screen 1: Dashboard (Home Tab)

### Layout (top to bottom, scrollable)

**Programme header**
- Title: "SUMMER 2026"
- Subtitle: "Week N · [Phase Name] Phase" (calculated from `lastCompletedSession` count)
- Thin progress bar: percentage of 12 weeks complete
- Micro label: "N of 12 weeks · X% complete"

**Next session card**
- Background tinted with session colour
- Label: "NEXT SESSION"
- Large session name (e.g. "Push A")
- Subtitle: session subtitle + exercise count
- Two buttons: `▶ START` (primary, session colour) + `CHANGE` (ghost)
- Tapping CHANGE reveals a 2×3 grid of all 6 session tiles to pick from

**This Week strip**
- 7 day columns (Mon–Sun of current calendar week)
- Each column: day letter → session dot (coloured by session type if logged, dashed empty if not) → bodyweight if logged
- Today's column has its day letter in session colour

**Today row**
- Bodyweight input (tap to enter, kg one decimal)
- Three habit dots (sauna, protein, stretch) — tap to toggle on/off. Filled = done, outlined = not done.

**Weekly Muscle Volume illustration**
- Front and back anatomical SVG figure, side by side
- Volume colouring (independent of session type):
  - `#1e1e1e` (no sets logged this week)
  - Dim yellow (< 50% of weekly target)
  - Bright yellow `#f5c800` (50–99% of target)
  - Green `#5BBD72` (100%+ — target met)
  - Amber `#f5a623` (> 120% — overreaching signal)
- Volume = sum of logged sets weighted by primary (1×) / secondary (0.5×) muscle mapping
- Resets each Monday
- Small legend below figure
- Subtle 2-column text breakdown per muscle group: "Side Delts 8/8", "Chest 7/14" etc.

**Illustration quality note:** The SVG body figure must be **production-quality anatomical line art** — closely matching the reference image provided (detailed muscle separation, bold outlines, individual muscle region paths for chest, delts, biceps, triceps, abs, serratus, obliques, quads, hamstrings, calves, traps, lats, glutes). This is a priority visual element. The implementation phase must include dedicated time for SVG polish.

---

## Screen 2: Session Mode (Active Workout)

Entered by tapping START on the dashboard. Full-screen, tab bar hidden.

### Session header
- Session name + subtitle
- Progress indicator: "Exercise 2 of 6"
- Top-right: collapsible muscle volume tab (see below)

### Collapsible session illustration
- Small tab/chip in the top-right of the session header, labelled with a muscle icon or "MUSCLES"
- Tap to expand: shows a compact front+back SVG figure tracking volume for **this session only** (sets logged so far vs prescribed sets for this session's exercises)
- Session illustration uses the same yellow→green colouring as the weekly version but scoped to this session's targets
- Tap again to collapse
- Does not interfere with scrolling the exercise list

### Exercise cards (scrollable list)

Each exercise card (collapsed default):

```
[Exercise Name]  [KEY badge if priority]           [PR BOOK ↗]
[N sets × reps · rest time]
[▸ coaching note — tap to expand]
```

Expanded state (per-set logging):

```
[Exercise Name]  [KEY]                              [PR BOOK ↗]
[REST: 1:43] ← timer appears here after first set

#   KG        REPS    NOTE
1   [26    ]  [10  ]  [felt solid        ]   ✓
2   [26    ]  [10  ]  [                  ]   ← active row
3   [──────]  [────]  [──────────────────]   ← upcoming (dimmed)
4   [──────]  [────]  [──────────────────]   ← upcoming (dimmed)

[▸ coaching note]
```

**Set logging behaviour:**
- Weight and reps are number inputs; note is a freetext input (any string, e.g. "barely", "9f10", "easy")
- Logging a set (entering weight + reps) auto-starts the rest timer
- Timer counts down from the exercise's prescribed rest time (in seconds, from programme data)
- Timer displayed as MM:SS next to exercise name, in a subtle pill badge
- At 0:00 the timer pulses once then disappears — no alarm, no persistent state
- The session-level muscle illustration updates in real time as sets are logged
- If a set is left blank (no weight AND no reps entered), it does NOT count toward volume. Weight=0 is valid for bodyweight exercises (e.g. unweighted pull-ups) — a set with weight=0 and reps>0 counts normally.

**PR detection:**
- After logging a set, the app checks if weight exceeds the current best at that rep count in `prBook`
- If yes: the reps cell gets a subtle `🏆` or `PB` badge — passive, not intrusive

**Coaching notes:**
- Collapsed by default under each exercise card
- Verbatim from the programme data (all coaching notes preserved exactly)
- Tap to expand/collapse

**Session completion:**
- "Complete Session" button at the bottom of the exercise list
- Opens a modal: rate session 1–10 (tap one of 10 numbered buttons) + optional freetext note
- On confirm: saves to `sessionLog`, updates `appState.lastCompletedSession`, returns to dashboard

---

## Screen 2a: PR Book Bottom Sheet

Triggered by tapping "PR BOOK ↗" on any exercise card during a session, or from the standalone PR Book tab.

**Structure:**
- Handle pill at top (swipe down to dismiss)
- Exercise name + "PR Book · all-time history"
- Rep range tabs scrolling horizontally: All | 6 reps | 8 reps | 10 reps | 12 reps | 14 reps | (any other logged rep counts)
- **Philosophy:** The PR book is a reference menu for auto-regulation. The user scans what they've hit at different rep ranges and decides on the day what they're going for. No targets, no goal columns — just history.

**Per rep range section (in "All" view):**
```
6 reps                                    82.5 kg ← best
  ┌─────────────────────────────────────────┐
  │ 82.5 kg        PB badge        4 Feb   │  ← highlighted
  │ 80 kg                          30 Jan  │
  └─────────────────────────────────────────┘
  [weight kg ___________] [ + Log 6RM ]

8 reps                                    82.5 kg ← best
  ...
```

**Adding a new rep range:**
- "New rep range" section at the bottom: `[reps ___] [weight kg ___] [+ Log]`

**From the PR Book tab (not in session):**
- Exercise picker at top (search or scroll list)
- Same bottom sheet layout rendered full-page
- Pre-seeded with all Excel PR data on first launch

---

## Screen 3: Programme Reference Tab

Essentially the existing JSX programme reference, integrated as a tab:

- 6-day session tabs (Push A, Pull A, Legs A, Push B, Pull B, Legs B)
- Each session: exercise cards with sets/reps/rest, expandable coaching notes, KEY badges
- Session rotation overview (collapsible)
- 12-week progression phases (Foundation / Push / Peak) — expandable
- Non-negotiables section

No interactive logging from this tab — read-only reference.

---

## Exercise-to-Muscle Mapping

Powers both the weekly dashboard illustration and the in-session illustration.

| Exercise | Primary | Secondary |
|----------|---------|-----------|
| 30° DB Incline Bench | Upper Chest | Front Delts, Triceps |
| Seated DB OHP | Front Delts | Triceps |
| Cable Lateral Raises | Side Delts | — |
| Standing Cable Crossover | Chest | Front Delts |
| Tricep Superset: OH Ext → Pushdown | Triceps | — |
| Weighted Cable Crunch | Abs | — |
| Weighted Pull-ups | Lats, Upper Back | Biceps |
| Chest-Supported BB Row | Mid Back, Lats | Biceps, Rear Delts |
| Rear Delt Cable Fly | Rear Delts | — |
| Paused Kettlebell Shrugs | Traps | — |
| Seated Stretched Cable Curl | Biceps | — |
| Hanging Leg Raises | Abs | — |
| DB Pullover (Posture) | Lats | Chest |
| Zercher Squat | Quads | Glutes, Core |
| Leg Press | Quads | Glutes |
| Leg Extensions | Quads | — |
| Lying Leg Curl | Hamstrings | — |
| Standing Calf Raises | Calves | — |
| Decline Weighted Crunch + KB Obliques | Abs, Obliques | — |
| Flat Barbell Bench Press | Chest | Front Delts, Triceps |
| DB Lateral Raises (Paused) | Side Delts | — |
| Standing BB OHP | Front Delts | Triceps |
| Decline Weighted Crunch | Abs | — |
| Pull-ups (Bodyweight Volume) | Lats, Upper Back | Biceps |
| Close-Grip Cable Row | Mid Back, Lats | Biceps |
| Rear Delt Machine Fly | Rear Delts | — |
| Reverse Dragon Flag Progression | Abs | — |
| Romanian Deadlift | Hamstrings, Glutes | Lower Back |
| Hip Thrust | Glutes | Hamstrings |
| Bulgarian Split Squat | Quads, Glutes | — |
| Oblique Cable Crunch | Obliques | — |

Volume credit: primary muscles = 1× logged sets, secondary muscles = 0.5× logged sets.

### Weekly Volume Targets (editable, defaults from programme)

| Muscle Group | Default Target (sets/week) |
|-------------|---------------------------|
| Chest | 14 |
| Upper Back / Lats | 15 |
| Side Delts | 8 |
| Rear Delts | 8 |
| Front Delts | 6 |
| Triceps | 6 |
| Biceps | 6 |
| Traps | 6 |
| Quads | 13 |
| Hamstrings | 10 |
| Glutes | 7 |
| Calves | 8 |
| Abs / Core | 12 |
| Obliques | 6 |

---

## PR Seed Data (pre-loaded on first launch)

All data from the Excel PR tracker. Dates in format YYYY-MM-DD. "s" suffix = per dumbbell.

### Push
| Exercise | Reps | Entries (weight, date) |
|----------|------|------------------------|
| 30° DB Incline Bench | 6 | 28s (2026-01-30) |
| | 8 | 26s (2026-01-28) |
| | 10 | 22s (2025-11-27), 26s |
| Flat Barbell Bench | 6 | 80 (2026-01-30), 82.5 (2026-02-04) |
| | 8 | 75 (2026-02-04), 80 (2026-02-10), 82.5 (2026-03-09) |
| | 10 | 70 (2026-02-04), 73 (2026-02-06), 75 (2026-02-23) |
| | 12 | 70 (2026-02-08), 72.5 (2026-02-13) |
| | 14 | 67.5 (2026-02-10) |
| Seated DB OHP | 6 | 22s (2026-02-06) |
| | 8 | 18s, 20s (2026-02-04), 22s (2026-02-08) |
| | 10 | 18s (2026-02-06), 20s (2026-03-09) |
| | 14 | 16s (2026-02-08) |
| Standing BB OHP | 8 | 40 (2026-03-27) |
| | 10 | 35 (2026-01-30) |
| Lateral Raise DB (paused) | 12 | 10s |
| | 14 | 7.5s (2026-02-06) |
| | 16 | 7.5s (2026-02-13) |
| Overhead Cable Triceps | 12 | 15 |
| | 16 | 12.5 (2026-02-13) |
| Weighted Decline Crunch | 10 | 5 |
| | 12 | 2.5 (2026-02-06) |

### Pull
| Exercise | Reps | Entries |
|----------|------|---------|
| Weighted Pull-up | 5 | 20 |
| | 6 | 10, 12.5 (2026-02-14) |
| | 8 | bw, 10 (2026-02-05) |
| Chest-Supported Row | 6 | 62.5 (2026-02-05), 70 (2026-02-14) |
| | 8 | 60, 75 (2026-03-31) |
| | 10 | 50 (2026-02-05), 55 (2026-03-31) |
| Close-Grip Cable Row | 10 | 50 (2026-03-28) |
| | 12 | 40 (2026-03-28) |
| Rear Delt Cable Fly | 10 | 3.75 (2026-02-14) |
| | 14 | 2.5 |
| Paused KB Shrugs | 12 | 28 (2026-03-31) |

### Legs
| Exercise | Reps | Entries |
|----------|------|---------|
| Zercher Squat | 8 | 90 (2026-01-23) |
| | 10 | 80 (2026-02-13) |
| Leg Extension | 8 | 90 (2025-12-16) |
| | 10 | 85 |
| Romanian Deadlift | 10 | 70 |
| | 12 | 60 |
| Lying Leg Curl | 8 | 40 |
| | 10 | 30 |

---

## Habit Tracking

Three binary toggles per day, displayed as coloured dots on the dashboard and calendar:
1. **Sauna** — `#4A90D9` (blue)
2. **Protein shake** — `#E8634A` (orange)
3. **[Private]** — `#E53935` (red) — no label anywhere in the UI, just a red dot

Tapping a dot toggles it. State persists in `dailyLog`. The third habit has no description exposed in the app — it is always rendered as an unlabelled red dot.

---

## Screen 4: Calendar Tab (Cal)

A full-screen scrollable view showing three monthly calendars stacked vertically: April, May, and June 2026.

### Layout

Each month renders as a standard calendar grid (Mon–Sun columns, rows = weeks). Month title above each grid (e.g. "April 2026").

### Day cell contents

Each day cell is compact and shows (when data exists):

```
┌─────────────────┐
│ 14              │  ← date number; background highlight if session logged
│ 7/10            │  ← session rating (from sessionLog for that date)
│ ● ● ●           │  ← habit dots: blue, orange, red
│ 69.2            │  ← bodyweight (kg)
└─────────────────┘
```

- **Session highlight:** If a session was logged on that date, the day cell gets a coloured background tint matching the session type (Push = orange tint, Pull = blue tint, Legs = green tint). No session = plain dark cell.
- **Rating:** Shows as "7/10" only if a session was completed that day. Hidden on off/rest days unless manually added via day edit.
- **Habit dots:** Three dots (blue, orange, red). Filled = done, hollow = not done. Only shown if any habit was logged that day.
- **Bodyweight:** Shown as a number (e.g. "69.2") if logged for that morning. Omitted if not.
- **Reflection word:** If a reflection was added for that day, shown as tiny italic text (e.g. "tired" or "great"). Max 2 words.
- Future dates: greyed out, not interactive.

### Day edit modal

Tapping any past or present day opens an edit modal (bottom sheet or centered modal) showing:

- Date header (e.g. "Thursday 3 April")
- Session logged that day (read-only label, e.g. "Push A") — or "Rest day / No session" if none
- **Rating:** 1–10 tap selector (same as session completion UI). Editable here regardless of whether a session was logged. Can be added/changed anytime.
- **Reflection:** Short freetext input, 1–2 words or a brief phrase (e.g. "felt great", "tired", "sore"). Available every day including off days.
- **Habit toggles:** Three dots to tap on/off (same as dashboard)
- **Bodyweight:** Number input (kg, one decimal)
- Save / dismiss

**Storage:** Rating edits from the calendar update the corresponding `sessionLog` entry for that date. Reflection, habits, and bodyweight are stored in `dailyLog` keyed by date.

**`dailyLog` updated to include reflection:**
```
{
  "2026-04-01": {
    bodyweight: 69.2,
    habits: { sauna: true, protein: true, private: false },
    reflection: "solid session"
  }
}
```

---

## Bodyweight Tracking

- Single number input per day (kg, one decimal place)
- Logged from the Today row on the dashboard
- Displayed on the week strip for each day it was logged
- Weekly average shown as a subtle figure somewhere on the dashboard (low priority / polish phase)

---

## Polish Phase (explicit requirement)

After the functional MVP is complete and all features work correctly, a dedicated polish phase must be completed before the app is considered done. This phase covers:

**Visual polish:**
- SVG body illustration refined to production quality — close to the reference anatomical line-art image provided. Detailed muscle separation, bold outlines, clear individual regions for all muscle groups including full legs. This is the single most important visual element in the app.
- Typography tightening — spacing, sizing, weight hierarchy across all screens
- Transition and micro-animation review — rest timer appearance/disappearance, sheet slide-up, illustration colour transitions
- Dark theme consistency audit — all backgrounds, borders, and text opacities checked for coherence

**UX polish:**
- Tap target audit — all interactive elements minimum 44px touch target
- Keyboard handling — number inputs on mobile, dismissal behaviour
- Edge cases — first launch (no data), rest day state, mid-week start, skipped sessions
- Session in progress persistence — if user closes the app mid-session, state is restored on reopen
- Bottom sheet swipe-to-dismiss gesture
- Haptic feedback on key interactions (set logged, PR detected, session completed) — if supported by PWA

**Performance:**
- App shell loads instantly (< 1s on device)
- No layout shift on load
- SVG illustration renders without jank during real-time updates

---

## Out of Scope

- User accounts / cloud sync
- Multiple users
- Nutrition tracking
- Custom programme editing (programme is fixed for 12 weeks)
- Push notifications
- Apple / iOS support (Android PWA only)
