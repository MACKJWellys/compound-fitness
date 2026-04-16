# Summer 2026 PPL Gym Tracker — Vision Spec

## What This Is

A PWA (Progressive Web App) that lives on a Google Pixel 8 Pro homescreen and replaces the current Google Sheets-based gym tracking workflow. It combines three things that currently exist separately: a PPL programme reference (currently a React artifact), a PR tracking spreadsheet (currently Google Sheets), and daily habit/bodyweight tracking (currently ad hoc). The app runs April 1 – June 24, 2026 (12 weeks).

**Target format:** PWA with manifest for Android "Add to Home Screen" install. Full-screen, no browser chrome, own icon. Lightweight — localStorage or IndexedDB for on-device storage, no backend, no accounts.

---

## Three Modes

### 1. Dashboard (Home Screen)

The first thing you see when you open the app. Shows:

- **Programme week indicator:** "Week 4 of 12 — Foundation Phase" with a progress bar. Calculated from today's date vs programme start date (April 1, 2026). Phase labels: Weeks 1–4 = Foundation, Weeks 5–8 = Push, Weeks 9–12 = Peak.

- **Weekly calendar row:** Mon–Sun, each day showing:
  - Which session was completed (e.g. "Push A") with the user's rating out of 10, if done
  - Morning bodyweight if logged (user has bathroom scales)
  - Three small coloured habit dots: sauna, protein shake, stretch (tap to toggle on/off for that day)
  - Empty/rest state if nothing logged

- **Weekly body illustration:** Front-and-back anatomical silhouette (stylised, clean — not a medical diagram). Muscle groups are coloured on a spectrum:
  - Grey = no volume yet this week
  - Partial fill (use programme accent colours) = some sets logged but target not met
  - Bright green = weekly volume target met
  - Amber/orange = significantly over target (overtraining signal)
  
  This illustration aggregates ALL completed sessions for the current week. It resets each Monday.

  The volume targets per muscle group should be derived from the programme (see Exercise-to-Muscle Mapping below) and should be editable by the user.

### 2. Session Mode (Active Workout)

Accessed by tapping a session from the dashboard or selecting from a session list. Shows the exercises for that day in order.

**Each exercise card shows:**
- Exercise name with a small tappable "PR" text/button next to it
- Prescribed sets × reps, rest time
- An input for actual working sets completed (just a number — e.g. "4" or "3")
- The coaching note from the programme (expandable, collapsed by default)
- Priority exercises are visually distinguished (the programme flags certain exercises as "KEY")

**PR button interaction:** Tapping "PR" next to an exercise name opens an inline panel or overlay showing a compact table identical in structure to the Excel PR tracker — rep counts down the left, PR entries (weight + date) across columns. The user can view their history and also add a new PR entry right there. This replaces the Excel spreadsheet entirely.

**Set logging and body illustration:** As the user logs completed sets for each exercise, a session-level body illustration updates in real time. This illustration is visible during the workout (perhaps at the top of the session view or as a collapsible panel) and shows which muscles have been hit so far in THIS session. Logging "4" on incline bench immediately credits chest (primary), front delts (secondary), triceps (secondary). By the end of the session, the user can see the full picture of what they trained today.

**Session completion:** When all exercises are done (or the user is finished), they tap "Complete Session," rate it out of 10, and optionally add a text note. The session data (sets per exercise, PRs logged, rating, note) is saved and feeds into the weekly dashboard illustration.

**Important:** If the user doesn't log sets for an exercise (leaves it at 0 or blank), that exercise's volume is NOT credited to the body illustration. The illustration must be grounded in actual logged working sets, not prescribed sets.

### 3. Programme Reference

The full 6-day PPL programme with all exercises, sets, reps, rest times, coaching notes, and priority flags. This is essentially the existing JSX artifact but accessible as a tab/page within the app rather than the primary interaction.

Also includes:
- The 12-week progression phases (Foundation / Push / Peak) with descriptions
- The non-negotiables (nutrition, lateral raise frequency, leg day commitment, PR logging, back care, progression rule, rest days)
- The weekly session rotation (Push A → Pull A → Legs A → Push B → Pull B → Legs B → Rest)

---

## The Programme

### 6-Day PPL Split

#### Push A — Upper Chest & Delts Focus
| # | Exercise | Sets | Reps | Rest | Priority |
|---|----------|------|------|------|----------|
| 1 | 30° DB Incline Bench | 4 | 8–10 | 2–3 min | KEY |
| 2 | Seated DB OHP | 3 | 8–10 | 2 min | |
| 3 | Cable Lateral Raises | 4 | 12–15 | 60s | KEY |
| 4 | Standing Cable Crossover | 3 | 12–15 | 60s | |
| 5 | Tricep Superset: OH Ext → Pushdown | 3 | 10–12 + to failure | 90s | |
| 6 | Weighted Cable Crunch | 3 | 12–15 | 60s | |

#### Pull A — Horizontal Pull & Biceps
| # | Exercise | Sets | Reps | Rest | Priority |
|---|----------|------|------|------|----------|
| 1 | Weighted Pull-ups | 4 | 5–6 | 2–3 min | KEY |
| 2 | Chest-Supported BB Row | 4 | 8–10 | 2 min | KEY |
| 3 | Rear Delt Cable Fly | 4 | 12–15 | 60s | KEY |
| 4 | Paused Kettlebell Shrugs | 3 | 12–15 | 60s | |
| 5 | Seated Stretched Cable Curl | 3 | 10–12 | 60s | |
| 6 | Hanging Leg Raises | 3 | 10–12 | 60s | |
| 7 | DB Pullover (Posture) | 2 | 12–14 | 60s | |

#### Legs A — Quad Focus
| # | Exercise | Sets | Reps | Rest | Priority |
|---|----------|------|------|------|----------|
| 1 | Zercher Squat | 4 | 8–10 | 3 min | KEY |
| 2 | Leg Press | 3 | 10–12 | 2 min | KEY |
| 3 | Leg Extensions | 3 | 12–15 | 60s | |
| 4 | Lying Leg Curl | 3 | 10–12 | 60s | |
| 5 | Standing Calf Raises | 4 | 15–20 | 60s | |
| 6 | Decline Weighted Crunch + KB Obliques | 3+3 | 10–12 / 12 each side | 60s | |

#### Push B — Flat Press & Shoulders
| # | Exercise | Sets | Reps | Rest | Priority |
|---|----------|------|------|------|----------|
| 1 | Flat Barbell Bench Press | 4 | 6–8 | 3 min | KEY |
| 2 | DB Lateral Raises (Paused) | 4 | 12–15 | 60s | KEY |
| 3 | Standing BB OHP | 3 | 8–10 | 2 min | |
| 4 | Standing Cable Crossover | 3 | 12–15 | 60s | |
| 5 | Tricep Superset: OH Ext → Pushdown | 3 | 10–12 + to failure | 90s | |
| 6 | Decline Weighted Crunch | 3 | 10–12 | 60s | |

#### Pull B — Vertical Pull & Arms
| # | Exercise | Sets | Reps | Rest | Priority |
|---|----------|------|------|------|----------|
| 1 | Pull-ups (Bodyweight Volume) | 3 | Max (aim 8–12) | 2 min | |
| 2 | Close-Grip Cable Row | 4 | 10–12 | 2 min | KEY |
| 3 | Rear Delt Machine Fly | 4 | 12–15 | 60s | KEY |
| 4 | Paused Kettlebell Shrugs | 3 | 12–15 | 60s | |
| 5 | Seated Stretched Cable Curl | 3 | 10–12 | 60s | |
| 6 | Reverse Dragon Flag Progression | 3 | 8–10 | 60s | |

#### Legs B — Hamstring & Glute Focus
| # | Exercise | Sets | Reps | Rest | Priority |
|---|----------|------|------|------|----------|
| 1 | Romanian Deadlift | 4 | 8–10 | 2–3 min | KEY |
| 2 | Lying Leg Curl | 4 | 10–12 | 90s | KEY |
| 3 | Hip Thrust | 3 | 10–12 | 90s | |
| 4 | Bulgarian Split Squat | 3 | 10 each leg | 90s | |
| 5 | Leg Extensions | 3 | 15–20 | 60s | |
| 6 | Standing Calf Raises | 4 | 15–20 | 60s | |
| 7 | Oblique Cable Crunch | 3 | 12 each side | 60s | |

### Coaching Notes

Every exercise has a personalised coaching note (sourced from the user's training history). These are stored in the programme data and shown as expandable text on each exercise card. The full notes are in the source JSX file — they reference specific weights the user has hit, technique cues, and historical context. They should be preserved verbatim.

### Progression Phases

- **Weeks 1–4 — Foundation:** Hit all sessions. Learn the leg movements. Keep 1–2 reps in reserve. Dial in nutrition: 2,400–2,600 kcal, 140g+ protein. Weigh yourself 3× per week.
- **Weeks 5–8 — Push:** Add weight when you hit the top of the rep range for all sets. Push lateral raises to 4× per week. Introduce drop sets on last set of isolation work.
- **Weeks 9–12 — Peak:** Target 73–74kg bodyweight. Top sets closer to failure. Add 5th set to pull-ups and rows if recovering well. Optional slight calorie drop in final 2 weeks.

### Progression Rule

When you hit the top of the prescribed rep range for ALL prescribed sets, add 2.5kg (barbell) or 2kg (dumbbell) next session. If you miss reps, stay at the same weight.

---

## PR Book Data Model

Each exercise has a PR table. Structure per exercise:

```
Exercise Name
├── Rep Count (e.g. 6, 8, 10, 12, 14)
│   ├── PR #1: { weight, date }
│   ├── PR #2: { weight, date }
│   └── ... up to PR #8
```

The rep counts are specific to each exercise (not universal). The app should be pre-seeded with all existing PR data from the Excel file. Here is the full seed data:

### Push PRs
**30° DB Incline Bench:**
- 6 reps: 28s (30.3)
- 8 reps: 26s (28.3)
- 10 reps: 22s (27.3), 26s

**Flat Barbell Bench:**
- 6 reps: 80 (30.1), 82.5 (4.2)
- 8 reps: 75 (4.2), 80 (10.2), 82.5 (9.3)
- 10 reps: 70 (4.2), 73 (6.2), 75 (23.2)
- 12 reps: 70 (8.2), 72.5 (13.2)
- 14 reps: 67.5 (10.2)

**Seated DB OHP:**
- 6 reps: 22s (6.2)
- 8 reps: 18s, 20s (4.2), 22s (8.2)
- 10 reps: 18s (6.2), 20s (9.3)
- 14 reps: 16s (8.2)

**Standing BB OHP:**
- 8 reps: 40 (27.3)
- 10 reps: 35 (30.3)

**Lateral Raise DB (paused):**
- 12 reps: 10s
- 14 reps: 7.5s (6.2)
- 16 reps: 7.5 (13.2)

**Pec Deck / Machine Fly:**
- 10 reps: 25 (8.2)
- 12 reps: 20 (6.2)

**Overhead Cable Triceps:**
- 12 reps: 15
- 16 reps: 12.5 (13.2)

**Weighted Decline Crunch:**
- 10 reps: 5kg
- 12 reps: 2.5 (6.2)

### Pull PRs
**Weighted Pull-up:**
- 5 reps: 20
- 6 reps: 10, 12.5 (14.2)
- 8 reps: bw, 10 (5.2)

**Chest-Supported Row (machine):**
- 6 reps: 62.5 (5.2), 70 (14.2)
- 8 reps: 60, 75 (31.3)
- 10 reps: 50 (5.2), 55 (31.3)

**Close-Grip Cable Row:**
- 10 reps: 50 (28.3)
- 12 reps: 40 (28.3)

**RDL:**
- 10 reps: 70
- 12 reps: 60

**Rear Delt Cable Fly:**
- 10 reps: 3.75 (14.2)
- 14 reps: 2.5

**Paused KB Shrugs:**
- 12 reps: 20+8 (31.3)

**Hammer Curl (unilateral):**
- 10 reps: 10

### Legs PRs
**Zercher Squat:**
- 8 reps: 90 (23.1)
- 10 reps: 80 (13.2)

**Leg Extension:**
- 8 reps: 90 (16.12)
- 10 reps: 85

**RDL:**
- 10 reps: 70
- 12 reps: 60

**Lying Leg Curl:**
- 8 reps: 40
- 10 reps: 30

Note: "s" suffix on dumbbell weights means "per dumbbell" (e.g. "28s" = 28kg each hand). Date format in parentheses is (day.month), e.g. (30.3) = March 30th. Some entries lack dates (older PRs carried over from memory).

### 12-Week Targets (for reference display)

| Exercise | Current Best | Week 6 Target | Week 12 Target |
|----------|-------------|---------------|----------------|
| 30° DB Incline Bench | 28s×8 | 28s×10 | 30s×8 |
| Flat BB Bench | 82.5×8 | 85×8 | 87.5×8 |
| Seated DB OHP | 22s×8 | 22s×10 | 24s×8 |
| Standing BB OHP | 40×8 | 42.5×8 | 45×8 |
| Lateral Raise (paused) | 10s×12 | 10s×15 | 12s×12 |
| Weighted Pull-up | 15×5 | 15×6 | 17.5×5 |
| Chest-Supp Row | 75×8 | 75×10 | 80×8 |
| Close Cable Row | 50×10 | 55×10 | 60×10 |
| RDL | 70×10 | 75×10 | 80×10 |
| Rear Delt Fly | 3.75×10 | 3.75×14 | 5×10 |
| KB Shrugs (paused) | 28×12 | 28×15 | 32×12 |
| Squat / Zercher | 90×8 | 90×10 | 100×8 |
| Leg Press | New | Set baseline | Progress 10% |
| Leg Extension | 90×8 | 90×10 | 100×8 |
| Lying Leg Curl | 40×8 | 40×12 | 45×10 |
| Bulgarian Split Squat | New | 12kg×10 each | 16kg×10 each |

---

## Exercise-to-Muscle Group Mapping

This powers the body illustration. Each exercise credits its primary muscle(s) at 1× the logged sets and secondary muscles at 0.5×.

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
| Hanging Leg Raises | Abs (lower) | — |
| DB Pullover (Posture) | Lats | Chest |
| Zercher Squat | Quads | Glutes, Core |
| Leg Press | Quads | Glutes |
| Leg Extensions | Quads | — |
| Lying Leg Curl | Hamstrings | — |
| Standing Calf Raises | Calves | — |
| Decline Weighted Crunch + KB Obliques | Abs, Obliques | — |
| Flat Barbell Bench Press | Chest | Front Delts, Triceps |
| DB Lateral Raises (Paused) | Side Delts | — |
| Standing BB OHP | Front Delts | Triceps, Core |
| Decline Weighted Crunch | Abs | — |
| Pull-ups (Bodyweight Volume) | Lats, Upper Back | Biceps |
| Close-Grip Cable Row | Mid Back, Lats | Biceps |
| Rear Delt Machine Fly | Rear Delts | — |
| Reverse Dragon Flag Progression | Abs (lower), Core | — |
| Romanian Deadlift | Hamstrings, Glutes | Lower Back |
| Hip Thrust | Glutes | Hamstrings |
| Bulgarian Split Squat | Quads, Glutes | — |
| Oblique Cable Crunch | Obliques | — |

### Suggested Weekly Volume Targets (sets per muscle group)

These should be editable by the user. Starting defaults derived from the programme:

| Muscle Group | Weekly Target (sets) | Derived From |
|-------------|---------------------|--------------|
| Chest | 14 | Push A (7) + Push B (7) |
| Upper Back / Lats | 15 | Pull A (8) + Pull B (7) |
| Side Delts | 8–12 | Push A (4) + Push B (4) + optional pull day sets |
| Rear Delts | 8 | Pull A (4) + Pull B (4) |
| Front Delts | ~6 (secondary) | Covered by pressing movements |
| Triceps | ~6 (secondary + direct) | Supersets on both push days |
| Biceps | 6 | Pull A (3) + Pull B (3) |
| Traps | 6 | Pull A (3) + Pull B (3) |
| Quads | 13 | Legs A (10) + Legs B (3) |
| Hamstrings | 10 | Legs A (3) + Legs B (8) |
| Glutes | ~7 | Legs A (secondary) + Legs B (direct) |
| Calves | 8 | Legs A (4) + Legs B (4) |
| Abs / Core | 12 | Spread across all days |
| Obliques | 6 | Legs A (3) + Legs B (3) |

---

## Habit & Bodyweight Tracking

### Daily Habits (toggle dots on the calendar)
1. **Sauna** — binary yes/no
2. **Protein Shake** — binary yes/no
3. **Stretch** — binary yes/no

### Bodyweight
- Single number input (kg, one decimal) per day
- Logged in the morning
- Displayed on the calendar day cell
- Nice-to-have: a small trend line or weekly average somewhere on the dashboard

---

## Non-Negotiables (displayed in Programme Reference)

1. **Eat.** 2,400–2,600 kcal daily. 140g+ protein. Don't train fasted.
2. **Lateral raises 4× per week.** Push A, Push B, and quick 3×15 at end of both Pull days if time allows.
3. **Don't skip legs.** Two leg days per week, every week, no exceptions.
4. **Log your PRs.** After every session, if you hit a new best at any rep count, log it.
5. **Respect the lower back.** Warm up with light rows before heavy pulls. If back feels off, swap RDLs for leg curls.
6. **Progression rule.** Top of rep range for all sets → add 2.5kg (barbell) or 2kg (DB). Miss reps → stay.
7. **Rest days matter.** One full rest day per week minimum.

---

## Design Notes

- **Font:** Monospace (IBM Plex Mono or similar) — matches the existing programme aesthetic
- **Colour scheme:** Push = #E8634A (warm red), Pull = #4A90D9 (blue), Legs = #5BBD72 (green). These are already established in the existing artifact.
- **Body illustration colours:** Grey (0 volume) → programme accent colour (partial) → bright green (target met) → amber (over target)
- **Mobile-first:** This will be used exclusively on a Pixel 8 Pro. Design for ~412px viewport width. Thumb-friendly tap targets. No horizontal scrolling.
- **Speed:** The app needs to be fast. Opening it, selecting a session, logging sets, checking PRs — all of these should feel instant. No loading spinners, no animations that block interaction.
- **Offline:** Must work fully offline. All data is on-device.

---

## Data Architecture Summary

All data stored on-device (localStorage / IndexedDB). Key entities:

1. **Programme** — static. The 6-day split with all exercise data, coaching notes, progression phases, non-negotiables.
2. **PR Book** — per exercise, per rep count, ordered list of PRs (weight + date). Pre-seeded from Excel data above.
3. **Session Log** — per completed session: date, session type (e.g. Push A), sets completed per exercise, rating (1–10), optional note.
4. **Daily Log** — per day: bodyweight, habit toggles (sauna, protein shake, stretch).
5. **Volume Targets** — per muscle group, editable weekly set targets.
6. **Programme Config** — start date (April 1, 2026), current week calculation.
