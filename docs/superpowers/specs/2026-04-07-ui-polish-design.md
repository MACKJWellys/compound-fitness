# UI Polish & Animation Design
**Date:** 2026-04-07
**Scope:** Visual and UX improvements across Session Screen, Dashboard, PR Book, and a new muscle illustration "moment" animation.

---

## Overview

A full polish pass across the app's three most-used screens. All changes stay within the existing aesthetic: `#111` background, IBM Plex Mono, Push=#E8634A / Pull=#4A90D9 / Legs=#5BBD72. No new screens, no new data models. Pure presentation layer.

---

## 1. Session Screen

### 1.1 Header — 2-row layout

**Current:** One row with four elements (← BACK, session name, COMPLETE, MUSCLES chip) crammed together, especially problematic on narrow screens.

**New layout:**
- **Row 1:** Session name (large, session colour) on the left · COMPLETE button on the right
- **Row 2:** ← BACK button · subtitle (e.g. "Chest · Triceps · 3/6 done") · MUSCLES chip on the right
- A thin progress bar (see 1.2) sits flush below row 2, no padding

The BACK button moves to a secondary visual position (row 2, left) — it's always accessible but no longer competes with the session name for prominence.

### 1.2 Session progress bar

A 2px coloured bar immediately below the header, spanning full width, coloured in the session's accent colour. Width = `completedExercises / exercises.length * 100%`. Updates live as sets are logged. An exercise counts as "started" when at least one set has a reps value > 0.

### 1.3 Floating rest timer

**Current:** Timer appears inline in the exercise card header and disappears when the user scrolls away.

**New:** A fixed-position pill in the lower-right corner of the session screen (above any safe-area inset). Always visible regardless of scroll position. Contains:
- A small coloured dot (session colour) with a soft glow
- The countdown in `M:SS` format, session colour, bold
- A `✕` tap target to dismiss

The pill appears when a timer starts and disappears when it reaches zero or is dismissed. It does not appear in history mode.

---

## 2. Dashboard

### 2.1 Bodyweight — sparkline trend

**Current:** A single number input with no historical context.

**New:** The number input remains (same position, same edit behaviour). To its right, a small SVG sparkline shows the last 28 days of bodyweight entries as a line chart. Below the number, a delta label shows the change vs 7 days ago (e.g. `↓ 0.4 this week` in `#4A90D9`, or `↑ 0.6` in muted orange). Days with no entry are skipped; the line only plots recorded values. If fewer than 2 data points exist in the window, the sparkline is hidden.

### 2.2 Next session card — exercise chips

**Current:** Session name + subtitle + START button. Flat, low visual weight.

**New additions (same card, same colour scheme):**
- Thin accent bar at the very top of the card (3px, session colour, full width, slightly transparent)
- Exercise count pill (top-right): e.g. `6 exercises` in session-colour text on a tinted background
- Exercise preview chips below the subtitle: first 3 exercise names as small tinted chips, then a `+N more` chip in grey if there are more. These are display-only, not tappable.

START and CHANGE buttons remain unchanged.

### 2.3 Tab bar — live session indicator

When `getActiveSession()` returns a non-null value (a session is in progress), the HOME tab receives:
- A 2px accent bar along its top edge, in the session's colour, with a soft glow shadow
- A 5px filled dot in the session's colour, positioned top-right of the HOME icon

Both elements are hidden when no session is active. Colour matches the in-progress session type (Push=orange, Pull=blue, Legs=green). This updates reactively from `savedSessionData` already tracked in `App.jsx`.

---

## 3. PR Book

### 3.1 Inline best PR per exercise

Each exercise row in the list gains a right-aligned display of its best logged PR: `{weight}kg × {reps}` in the section's accent colour (bold weight, muted reps). "Best" = the entry with the single highest weight value across all rep counts for that exercise in `getPRBook()`. If two entries tie on weight, prefer the one with fewer reps. If no PR exists for an exercise, show `no PR yet` in `#555` italic. Tapping a row still opens the full PR history sheet as before.

### 3.2 Coloured section headers

The PUSH / PULL / LEGS section headers are replaced with a compound divider row:
- 3px left rule in section colour
- Section label (e.g. `PUSH`) in section colour, bold, small caps
- Faint horizontal rule extending to the right in section colour at ~14% opacity
- Exercise count at the far right (e.g. `11 exercises`) in section colour at ~40% opacity

---

## 4. Muscle Illustration — "The Moment"

A full-screen cinematic animation plays each time the Dashboard mounts — on initial app load and whenever the user switches to the HOME tab from another tab. It does not play when returning from the session overlay (closing a session without completing it does not remount the Dashboard). It is not shown in session or history views.

**Zero-state:** If no muscles have weekly volume (e.g. fresh install, or a week with no sessions logged), the moment is skipped entirely — no overlay, no animation. The illustration renders normally in its dashboard position.

### 4.1 Sequence

| Phase | Duration | What happens |
|---|---|---|
| Expand | 450ms | Dashboard fades to ~95% black overlay; illustration scales up from its dashboard position to fill ~72vw centred on screen |
| Muscle fly-in | ~950ms | Trained muscles animate in (see 4.2); untrained muscles are invisible during this phase |
| Settle pause | ~550ms | All muscles landed; a still moment |
| Contract | 550ms | Illustration scales back to dashboard position; overlay fades out; dashboard fades in; untrained muscles fade in simultaneously |

**Total duration:** ~2.5 seconds.

### 4.2 Muscle fly-in animation

Trained muscles (those with weekly volume > 0) animate in from the sides of the screen in four staggered waves, top-to-bottom:

| Wave | Muscles | Direction | Duration | Delay |
|---|---|---|---|---|
| 1 | Left delt, Right delt | From respective sides | 0.85s | 0.05s |
| 2 | Chest | From left | 0.85s | 0.20s |
| 3 | Left tri, Right tri | From respective sides | 0.50s | 0.30s |
| 4 | Abs | From right | 0.50s | 0.38s |

The animation accelerates in the second half: waves 1–2 run at full duration (0.85s), waves 3–4 run at 1.7× speed (0.50s). Each muscle overshoots its target by ~4% then springs back (cubic-bezier easing).

Left-side muscles fly in from the left; right-side muscles from the right. Bilateral pairs arrive simultaneously. Centre muscles (chest, abs) alternate sides.

### 4.3 Flash on landing

At the moment each wave settles (65% through its animation duration), a brief `brightness(4.5)` filter flash fires on those muscles and decays over 220ms. This gives each landing a spark of contact energy — a visual analogue of a magnetic snap.

### 4.4 Haptic feedback

On each wave's settle moment, `navigator.vibrate(25)` fires — a single 25ms pulse. Four pulses total, one per wave, timed to the exact frame each wave lands. Gracefully ignored on devices that don't support the Vibration API.

### 4.5 Untrained muscles during the moment

During the full-screen phase, untrained muscle groups (grey fills) are hidden entirely — `opacity: 0`. Only trained muscles exist against the black background, making the illustration feel earned rather than pre-populated. Untrained muscles fade back in (`transition: opacity 0.4s`) as the overlay lifts during the contract phase.

### 4.6 Implementation notes

- The animation is triggered by a React effect on Dashboard mount (runs once per mount)
- `savedSessionData` and the session screen are unaffected — the moment plays on the underlying dashboard layer, not the session overlay
- The illustration SVG paths need `overflow: visible` and an outer `overflow: hidden` clip on the stage container to allow muscles to fly in from outside the SVG bounds
- The stage container uses `position: fixed` and CSS transitions on `width`, `height`, `bottom`, and `transform` to handle the expand/contract

---

## Out of Scope

- Weight stepper (+/− buttons) on set entry rows
- Copy last set shortcut
- Calendar screen (unchanged)
- Programme screen (unchanged)
- Any changes to data models or storage
