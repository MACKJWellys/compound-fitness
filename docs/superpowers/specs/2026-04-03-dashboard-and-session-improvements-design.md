# Design: Dashboard & Session Improvements
**Date:** 2026-04-03

## Summary

Five changes to the Compound Fitness PWA:
1. Add current date display to the dashboard header
2. Fix calendar/dashboard being one day ahead (timezone bug in `toDateStr`)
3. Fix weekly volume inaccuracy for chest and rear delts
4. Allow viewing and editing past completed sessions
5. Change week strip to rolling 7-day window ending with today

---

## 1. Current Date on Dashboard

**What:** Add a formatted date line to the dashboard header, below the `WEEK X · PHASE` subtitle.

**Format:** `THU 3 APR 2026` (uppercase, locale-aware)

**Implementation:** Compute inline in `Dashboard.jsx` using `new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()`. No new utilities needed.

**Location:** Between the `WEEK X · PHASE` line and the progress bar, styled like the existing subtitle (`fontSize: 11, color: '#666', letterSpacing: '0.12em'`).

---

## 2. Calendar Date Bug Fix (Timezone)

**Root cause:** `toDateStr()` in `dateUtils.js` calls `date.toISOString().slice(0, 10)`, which converts to UTC before extracting the date string. In BST (UTC+1), `new Date(2026, 3, 3)` (Thursday April 3 at midnight local) becomes `2026-04-02T23:00:00Z`, so `toDateStr()` returns `'2026-04-02'` — one day behind. Since calendar cells use this to look up sessions, a session saved on Thursday (stored as `'2026-04-03'`) appears in Friday's cell (whose key is `'2026-04-03'`).

**Fix:** Change `toDateStr()` to use local date parts:

```js
export function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
```

**Affected files:** `src/utils/dateUtils.js` only. All callers (`Dashboard.jsx`, `Calendar.jsx`, `storage.js`) automatically benefit.

**Data safety:** Sessions saved mid-day already have the correct local date (e.g., noon BST → UTC is still the same calendar date). No migration needed.

---

## 3. Muscle Mapping Fixes

**Problem A — Incline bench not counting as chest:**
`'30° DB Incline Bench'` has `primary: ['Upper Chest']`, but `VOLUME_TARGETS_DEFAULT` has no `'Upper Chest'` entry — only `'Chest': 14`. So all incline bench sets contribute zero to the chest illustration. With 4 sets of incline bench in Push A, the user only sees 3 sets of chest (from Cable Crossover), not 7.

**Fix:** Change `'30° DB Incline Bench'` primary from `['Upper Chest']` to `['Chest']`.

**Problem B — Rear Delt Machine Fly missing from mappings:**
`'Rear Delt Machine Fly'` (used in Pull B) has no entry in `MUSCLE_MAPPINGS`. Any volume calculation touching Pull B would throw or silently skip rear delts.

**Fix:** Add `'Rear Delt Machine Fly': { primary: ['Rear Delts'], secondary: [] }` to `MUSCLE_MAPPINGS`.

**Cleanup:** Remove `'Upper Chest'` from the `MUSCLE_ORDER` array in `Dashboard.jsx` since nothing maps to it after the fix.

**Affected files:** `src/data/muscleMappings.js`, `src/screens/Dashboard.jsx` (MUSCLE_ORDER only).

---

## 4. View and Edit Past Sessions

### Storage

Add `updateSession(id, updatedEntry)` to `storage.js`:
- Loads `SESSION_LOG` from localStorage
- Finds the entry with matching `id`
- Overwrites it with `updatedEntry`
- Saves back to localStorage

### App.jsx

- Add `historySession` state (null or a session log object)
- Add `onViewSession(session)` callback — sets `historySession`
- Pass `onViewSession` down to both `Dashboard` and `Calendar`
- When `historySession` is set, render `<SessionScreen historySession={historySession} onClose={() => setHistorySession(null)} />` instead of the active session screen

### SessionScreen

Accept optional `historySession` prop. Behaviour changes when present:

**Initialisation:**
- Exercise list comes from `historySession.exercises` (preserving any substitutions/custom exercises from that session)
- `setsPerExercise` is pre-populated from `historySession.exercises[i].sets` — each saved set `{ weight, reps, note }` maps directly
- The number of set rows rendered per exercise equals the number of logged sets (since only sets with reps > 0 are saved, there are no empty trailing rows to infer)
- Initial rating and notes come from `historySession.rating` and `historySession.note`

**UI differences in history mode:**
- Small `HISTORY` badge displayed in the session header (e.g., shows date of the original session)
- Rest timer is hidden (no auto-start on reps entry)
- Live muscle volume chip toggle is hidden
- `ACTIVE_SESSION` localStorage is not written during set entry
- "Complete Session" button is replaced with "Save Changes"

**Save Changes:**
- Calls `updateSession(historySession.id, { ...historySession, exercises: [reconstructed from setsPerExercise], rating, note })`
- Calls `onClose()` to return to the previous screen

### Dashboard — Week Strip

- Week strip day cells that have a `logEntry` (completed session) become tappable
- On tap: call `onViewSession(logEntry)`
- Visual affordance: add a subtle tap highlight (already styled with background colour, no extra chrome needed)

### Calendar — DayEditModal

- When `session` is present for the day (i.e., a completed session exists), add a "View Workout" button in the modal
- Button calls `onViewSession(session)` and closes the modal
- Styled consistently with the existing modal action buttons

---

## 5. Rolling Week View (Today = Rightmost)

**Current behaviour:** `weekDays` is built from `getWeekStart()` + 7 days, always showing Mon–Sun of the current calendar week.

**New behaviour:** A trailing 7-day window ending with today. If today is Thursday, the strip shows: Fri, Sat, Sun, Mon, Tue, Wed, **Thu**.

**Implementation in `Dashboard.jsx`:**

```js
const weekDays = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (6 - i)); // index 6 = today
  return d;
});
```

Day labels: replace the static `DAY_LABELS = ['M','T','W','T','F','S','S']` array with a dynamic label derived from each day's `getDay()`:

```js
const DAY_LETTER = ['S', 'M', 'T', 'W', 'T', 'F', 'S']; // index by getDay()
// used as: DAY_LETTER[day.getDay()]
```

`todayStr` comparison for highlight remains unchanged — the rightmost cell will always match.

**`getWeeklyVolume` note:** This function receives the week start date for the current Mon–Sun week. The rolling strip may show sessions from the previous calendar week (e.g., last Friday). Those sessions already exist in the log and will display correctly in the strip regardless — `getWeeklyVolume` is independent of the strip logic and doesn't need to change.

---

## Files Changed

| File | Changes |
|------|---------|
| `src/utils/dateUtils.js` | Fix `toDateStr` to use local date parts |
| `src/data/muscleMappings.js` | Fix incline bench → Chest; add Rear Delt Machine Fly |
| `src/data/storage.js` | Add `updateSession(id, entry)` |
| `src/screens/Dashboard.jsx` | Date display; rolling week strip; clickable completed days; remove Upper Chest from MUSCLE_ORDER |
| `src/screens/Calendar.jsx` | Add "View Workout" button in DayEditModal |
| `src/screens/SessionScreen.jsx` | Add `historySession` prop + history mode behaviour |
| `src/App.jsx` | Add `historySession` state + `onViewSession` handler; wire to both Dashboard and Calendar |
