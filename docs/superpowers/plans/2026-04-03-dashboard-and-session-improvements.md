# Dashboard & Session Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix a timezone date bug, muscle volume miscounting, and add current date display, rolling week strip, and past-session view/edit.

**Architecture:** Changes span the data layer (storage, mappings, date utils), the dashboard UI, and the session screen. The history mode for SessionScreen is implemented by passing an optional `historySession` prop; when present, it pre-fills sets, hides active-only controls, and saves via `updateSession` instead of `saveSession`. App.jsx owns the `historySession` state and passes an `onViewSession` handler down to both Dashboard and Calendar.

**Tech Stack:** React 19, Vite 8, localStorage for persistence, no test framework (verification via `npm run build` and manual dev-server checks)

---

## File Map

| File | Change |
|------|--------|
| `app/src/utils/dateUtils.js` | Fix `toDateStr` to use local date parts |
| `app/src/data/muscleMappings.js` | Fix incline bench → Chest; add Rear Delt Machine Fly |
| `app/src/data/storage.js` | Add `updateSession(id, entry)` export |
| `app/src/screens/Dashboard.jsx` | Date display; rolling week; clickable completed days; remove Upper Chest from MUSCLE_ORDER; accept `onViewSession` prop |
| `app/src/screens/SessionScreen.jsx` | Accept `historySession` prop; history mode behaviour in init, header, buttons, and CompletionModal |
| `app/src/App.jsx` | `historySession` state; `handleViewSession`; wire `onViewSession` to Dashboard and Calendar; pass `historySession` to SessionScreen |
| `app/src/screens/Calendar.jsx` | Accept `onViewSession` prop; add "View Workout" button in DayEditModal |

---

## Task 1: Fix timezone bug in toDateStr

**Files:**
- Modify: `app/src/utils/dateUtils.js`

- [ ] **Step 1: Open the file and replace `toDateStr`**

  In `app/src/utils/dateUtils.js`, replace lines 10–12:

  ```js
  export function toDateStr(date) {
    return date.toISOString().slice(0, 10); // YYYY-MM-DD
  }
  ```

  with:

  ```js
  export function toDateStr(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  ```

- [ ] **Step 2: Verify build passes**

  Run in `app/`:
  ```
  npm run build
  ```
  Expected: build completes with no errors.

- [ ] **Step 3: Commit**

  ```bash
  git -C "app" add src/utils/dateUtils.js
  git -C "app" commit -m "fix: use local date parts in toDateStr to avoid UTC timezone offset"
  ```

---

## Task 2: Fix muscle mappings

**Files:**
- Modify: `app/src/data/muscleMappings.js`
- Modify: `app/src/screens/Dashboard.jsx` (MUSCLE_ORDER only)

- [ ] **Step 1: Fix incline bench mapping**

  In `app/src/data/muscleMappings.js`, line 2, change:

  ```js
  '30° DB Incline Bench': { primary: ['Upper Chest'], secondary: ['Front Delts', 'Triceps'] },
  ```

  to:

  ```js
  '30° DB Incline Bench': { primary: ['Chest'], secondary: ['Front Delts', 'Triceps'] },
  ```

- [ ] **Step 2: Add missing Rear Delt Machine Fly entry**

  In `app/src/data/muscleMappings.js`, add one line after line 10 (`'Rear Delt Cable Fly'` entry):

  ```js
  'Rear Delt Machine Fly': { primary: ['Rear Delts'], secondary: [] },
  ```

- [ ] **Step 3: Remove Upper Chest from MUSCLE_ORDER in Dashboard**

  In `app/src/screens/Dashboard.jsx`, find the `MUSCLE_ORDER` array (around line 40):

  ```js
  const MUSCLE_ORDER = [
    'Chest', 'Upper Chest', 'Front Delts', 'Side Delts', 'Rear Delts',
  ```

  Change it to:

  ```js
  const MUSCLE_ORDER = [
    'Chest', 'Front Delts', 'Side Delts', 'Rear Delts',
  ```

- [ ] **Step 4: Verify build passes**

  ```
  npm run build
  ```
  Expected: no errors.

- [ ] **Step 5: Commit**

  ```bash
  git -C "app" add src/data/muscleMappings.js src/screens/Dashboard.jsx
  git -C "app" commit -m "fix: map incline bench to Chest, add Rear Delt Machine Fly mapping, remove phantom Upper Chest"
  ```

---

## Task 3: Add updateSession to storage

**Files:**
- Modify: `app/src/data/storage.js`

- [ ] **Step 1: Add updateSession function**

  In `app/src/data/storage.js`, after the closing brace of `updateSessionRating` (currently ending around line 45), add:

  ```js
  // Overwrite an existing session entry by id
  export function updateSession(id, updatedEntry) {
    const log = getSessionLog();
    const idx = log.findIndex((s) => s.id === id);
    if (idx !== -1) {
      log[idx] = updatedEntry;
      set(KEYS.SESSION_LOG, log);
    }
  }
  ```

- [ ] **Step 2: Verify build passes**

  ```
  npm run build
  ```
  Expected: no errors.

- [ ] **Step 3: Commit**

  ```bash
  git -C "app" add src/data/storage.js
  git -C "app" commit -m "feat: add updateSession to storage for editing past sessions"
  ```

---

## Task 4: Dashboard — date display, rolling week strip, clickable completed days

**Files:**
- Modify: `app/src/screens/Dashboard.jsx`

- [ ] **Step 1: Accept onViewSession prop**

  Change the function signature on line 68 from:

  ```js
  export default function Dashboard({ onStartSession }) {
  ```

  to:

  ```js
  export default function Dashboard({ onStartSession, onViewSession }) {
  ```

- [ ] **Step 2: Add current date display in the header**

  In `Dashboard.jsx`, find the header section. After the `WEEK {week} · {phase.toUpperCase()}` div (around lines 157–167), add a date line immediately below it, before the progress bar div:

  ```jsx
  <div
    style={{
      fontSize: 11,
      color: '#555',
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      marginBottom: 10,
    }}
  >
    {new Date().toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).toUpperCase()}
  </div>
  ```

- [ ] **Step 3: Replace static week strip with rolling 7-day window**

  Find the `weekDays` array construction (around lines 127–131):

  ```js
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  ```

  Replace both with:

  ```js
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i)); // index 6 = today (rightmost)
    return d;
  });

  const DAY_LETTER = ['S', 'M', 'T', 'W', 'T', 'F', 'S']; // indexed by getDay()
  ```

- [ ] **Step 4: Update day label usage in the week strip JSX**

  In the week strip render (around line 310), find:

  ```jsx
  {DAY_LABELS[i]}
  ```

  Replace with:

  ```jsx
  {DAY_LETTER[day.getDay()]}
  ```

  (Note: the loop variable is `day` — the `Date` object from `weekDays`. Make sure the `map` destructures correctly. The existing map is `weekDays.map((day, i) => { ... })` so `day` is the Date object and `i` is the index.)

- [ ] **Step 5: Make completed day cells tappable**

  In the week strip, find the outer `<div>` for each day cell (around line 298). It currently has no `onClick`. Add an `onClick` and a `cursor` style:

  Find:
  ```jsx
  return (
    <div
      key={dStr}
      style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
    >
  ```

  Replace with:
  ```jsx
  return (
    <div
      key={dStr}
      onClick={() => logEntry && onViewSession && onViewSession(logEntry)}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        cursor: logEntry ? 'pointer' : 'default',
      }}
    >
  ```

- [ ] **Step 6: Verify build passes**

  ```
  npm run build
  ```
  Expected: no errors.

- [ ] **Step 7: Verify visually in dev server**

  Run `npm run dev` in `app/`. Open the app. Check:
  - Dashboard header shows today's date (e.g. `THU 3 APR 2026`)
  - Week strip ends with today on the right
  - The 6 days before today are shown to the left
  - Any completed day cells are now tappable (cursor changes to pointer on hover — on desktop)

- [ ] **Step 8: Commit**

  ```bash
  git -C "app" add src/screens/Dashboard.jsx
  git -C "app" commit -m "feat: dashboard date display, rolling week strip ending today, clickable past sessions"
  ```

---

## Task 5: SessionScreen — history mode

**Files:**
- Modify: `app/src/screens/SessionScreen.jsx`

- [ ] **Step 1: Import updateSession**

  At the top of `app/src/screens/SessionScreen.jsx`, the existing import from storage is:

  ```js
  import { getPRBook, addPREntry, saveSession, advanceNextSession, getSessionVolume, saveActiveSession, getActiveSession } from '../data/storage';
  ```

  Add `updateSession` to it:

  ```js
  import { getPRBook, addPREntry, saveSession, advanceNextSession, getSessionVolume, saveActiveSession, getActiveSession, updateSession } from '../data/storage';
  ```

- [ ] **Step 2: Update CompletionModal to support history mode**

  Find the `CompletionModal` component signature (around line 450):

  ```js
  function CompletionModal({ session, sessionIndex, exercises, setsPerExercise, onSave, onCancel }) {
    const [rating, setRating] = useState(null);
    const [note, setNote] = useState('');
  ```

  Replace with:

  ```js
  function CompletionModal({ session, sessionIndex, exercises, setsPerExercise, onSave, onCancel, historySession }) {
    const isHistory = !!historySession;
    const [rating, setRating] = useState(historySession?.rating ?? null);
    const [note, setNote] = useState(historySession?.note ?? '');
  ```

- [ ] **Step 3: Update CompletionModal handleSave to branch on history mode**

  Inside `CompletionModal`, find the `handleSave` function:

  ```js
  function handleSave() {
    if (!rating) return;
    const exerciseData = exercises.map((ex, i) => ({
      name: ex.name,
      sets: (setsPerExercise[i] || []).filter((s) => {
        const r = parseInt(s.reps);
        return !isNaN(r) && r > 0;
      }),
    }));
    saveSession({
      date: toDateStr(new Date()),
      sessionName: session.name,
      sessionIndex,
      exercises: exerciseData,
      rating,
      note: note.trim(),
      completedAt: new Date().toISOString(),
    });
    advanceNextSession();
    onSave();
  }
  ```

  Replace with:

  ```js
  function handleSave() {
    if (!rating) return;
    const exerciseData = exercises.map((ex, i) => ({
      name: ex.name,
      sets: (setsPerExercise[i] || []).filter((s) => {
        const r = parseInt(s.reps);
        return !isNaN(r) && r > 0;
      }),
    }));
    if (isHistory) {
      updateSession(historySession.id, {
        ...historySession,
        exercises: exerciseData,
        rating,
        note: note.trim(),
      });
    } else {
      saveSession({
        date: toDateStr(new Date()),
        sessionName: session.name,
        sessionIndex,
        exercises: exerciseData,
        rating,
        note: note.trim(),
        completedAt: new Date().toISOString(),
      });
      advanceNextSession();
    }
    onSave();
  }
  ```

- [ ] **Step 4: Update CompletionModal heading and save button text**

  Inside `CompletionModal`'s JSX, find the heading div:

  ```jsx
  <div style={{ fontSize: 20, fontWeight: 700, color: session.colour, letterSpacing: '0.04em', marginBottom: 6 }}>
    SESSION COMPLETE
  </div>
  <div style={{ fontSize: 13, color: '#555', marginBottom: 24 }}>
    {session.name} · Rate this session
  </div>
  ```

  Replace with:

  ```jsx
  <div style={{ fontSize: 20, fontWeight: 700, color: session.colour, letterSpacing: '0.04em', marginBottom: 6 }}>
    {isHistory ? 'EDIT SESSION' : 'SESSION COMPLETE'}
  </div>
  <div style={{ fontSize: 13, color: '#555', marginBottom: 24 }}>
    {session.name} · {isHistory ? 'Update sets, rating or notes' : 'Rate this session'}
  </div>
  ```

  Find the save button text inside `CompletionModal`:

  ```jsx
  SAVE SESSION
  ```

  Replace with:

  ```jsx
  {isHistory ? 'SAVE CHANGES' : 'SAVE SESSION'}
  ```

- [ ] **Step 5: Update the main SessionScreen component signature and init logic**

  Find the `SessionScreen` function signature and initial state (around lines 540–550):

  ```js
  export default function SessionScreen({ session, sessionIndex, onBack, onComplete }) {
    // Each exercise gets an array of set objects: [{ weight: '', reps: '', note: '' }, ...]
    const [exercises, setExercises] = useState(() => session.exercises.map((ex) => ({ ...ex })));
    const [setsPerExercise, setSetsPerExercise] = useState(() => {
      const saved = getActiveSession();
      if (saved && saved.sessionName === session.name && Array.isArray(saved.setsPerExercise)) {
        // Restore saved set data, padded/truncated to match current exercise count
        return session.exercises.map((_, i) => saved.setsPerExercise[i] || []);
      }
      return session.exercises.map(() => []);
    });
  ```

  Replace with:

  ```js
  export default function SessionScreen({ session, sessionIndex, onBack, onComplete, historySession }) {
    const isHistoryMode = !!historySession;

    // All programme exercises flat list — used to look up definitions for history exercises
    const allProgrammeExercises = DAYS.flatMap((d) => d.exercises);

    const [exercises, setExercises] = useState(() => {
      if (isHistoryMode) {
        return historySession.exercises.map((histEx) => {
          const progEx = allProgrammeExercises.find((e) => e.name === histEx.name);
          return progEx
            ? { ...progEx }
            : { name: histEx.name, sets: String(histEx.sets.length), reps: '—', priority: false };
        });
      }
      return session.exercises.map((ex) => ({ ...ex }));
    });

    const [setsPerExercise, setSetsPerExercise] = useState(() => {
      if (isHistoryMode) {
        return historySession.exercises.map((ex) => ex.sets || []);
      }
      const saved = getActiveSession();
      if (saved && saved.sessionName === session.name && Array.isArray(saved.setsPerExercise)) {
        return session.exercises.map((_, i) => saved.setsPerExercise[i] || []);
      }
      return session.exercises.map(() => []);
    });
  ```

- [ ] **Step 6: Skip saveActiveSession in useEffect when in history mode**

  Find the `useEffect` that saves the active session (around lines 571–577):

  ```js
  useEffect(() => {
    saveActiveSession({
      sessionName: session.name,
      sessionIndex,
      setsPerExercise,
    });
  }, [setsPerExercise, session.name, sessionIndex]);
  ```

  Replace with:

  ```js
  useEffect(() => {
    if (isHistoryMode) return;
    saveActiveSession({
      sessionName: session.name,
      sessionIndex,
      setsPerExercise,
    });
  }, [setsPerExercise, session.name, sessionIndex, isHistoryMode]);
  ```

- [ ] **Step 7: Update the sticky header — replace COMPLETE button and MUSCLES button**

  In the sticky header JSX (around lines 659–683), find:

  ```jsx
  <button onClick={handleComplete} style={{
    background: session.colour, border: 'none', borderRadius: 6, color: '#fff',
    fontSize: 11, fontFamily: 'var(--font)', fontWeight: 700,
    letterSpacing: '0.06em', padding: '6px 12px', cursor: 'pointer', flexShrink: 0,
  }}>
    COMPLETE
  </button>
  <button
    onClick={() => setMuscleChipOpen((v) => !v)}
    style={{
      background: muscleChipOpen ? session.colour : '#1e1e1e',
      border: `1px solid ${session.colour}55`,
      borderRadius: 16,
      color: muscleChipOpen ? '#fff' : session.colour,
      fontSize: 10,
      fontFamily: 'var(--font)',
      fontWeight: 700,
      letterSpacing: '0.08em',
      padding: '5px 10px',
      cursor: 'pointer',
      flexShrink: 0,
    }}
  >
    MUSCLES
  </button>
  ```

  Replace with:

  ```jsx
  <button onClick={handleComplete} style={{
    background: session.colour, border: 'none', borderRadius: 6, color: '#fff',
    fontSize: 11, fontFamily: 'var(--font)', fontWeight: 700,
    letterSpacing: '0.06em', padding: '6px 12px', cursor: 'pointer', flexShrink: 0,
  }}>
    {isHistoryMode ? 'SAVE CHANGES' : 'COMPLETE'}
  </button>
  {!isHistoryMode && (
    <button
      onClick={() => setMuscleChipOpen((v) => !v)}
      style={{
        background: muscleChipOpen ? session.colour : '#1e1e1e',
        border: `1px solid ${session.colour}55`,
        borderRadius: 16,
        color: muscleChipOpen ? '#fff' : session.colour,
        fontSize: 10,
        fontFamily: 'var(--font)',
        fontWeight: 700,
        letterSpacing: '0.08em',
        padding: '5px 10px',
        cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      MUSCLES
    </button>
  )}
  {isHistoryMode && (
    <span style={{ fontSize: 10, color: '#888', letterSpacing: '0.08em', flexShrink: 0 }}>
      HISTORY ·{' '}
      {new Date(historySession.date + 'T12:00:00').toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
      })}
    </span>
  )}
  ```

- [ ] **Step 8: Update the bottom COMPLETE SESSION button and hide ADD EXERCISE in history mode**

  In the scrollable exercise list section, find the two buttons at the bottom (around lines 721–739):

  ```jsx
  <button
    onClick={() => setShowCustomExercise(true)}
    style={{
      width: '100%', background: 'none', border: '1px dashed #2a2a2a',
      borderRadius: 10, color: '#555', fontSize: 12,
      fontFamily: 'var(--font)', letterSpacing: '0.08em',
      padding: '12px 0', marginBottom: 10, cursor: 'pointer',
    }}
  >
    + ADD EXERCISE
  </button>

  <button onClick={handleComplete} style={{
    width: '100%', background: session.colour, border: 'none', borderRadius: 10,
    color: '#fff', fontSize: 14, fontFamily: 'var(--font)', fontWeight: 700,
    letterSpacing: '0.1em', padding: '16px 0', marginTop: 10, cursor: 'pointer',
  }}>
    COMPLETE SESSION
  </button>
  ```

  Replace with:

  ```jsx
  {!isHistoryMode && (
    <button
      onClick={() => setShowCustomExercise(true)}
      style={{
        width: '100%', background: 'none', border: '1px dashed #2a2a2a',
        borderRadius: 10, color: '#555', fontSize: 12,
        fontFamily: 'var(--font)', letterSpacing: '0.08em',
        padding: '12px 0', marginBottom: 10, cursor: 'pointer',
      }}
    >
      + ADD EXERCISE
    </button>
  )}

  <button onClick={handleComplete} style={{
    width: '100%', background: session.colour, border: 'none', borderRadius: 10,
    color: '#fff', fontSize: 14, fontFamily: 'var(--font)', fontWeight: 700,
    letterSpacing: '0.1em', padding: '16px 0', marginTop: 10, cursor: 'pointer',
  }}>
    {isHistoryMode ? 'SAVE CHANGES' : 'COMPLETE SESSION'}
  </button>
  ```

- [ ] **Step 9: Pass historySession to CompletionModal**

  Find the `{showModal && ...}` block at the bottom of the SessionScreen render. It renders `CompletionModal`. Find:

  ```jsx
  {showModal && (
    <CompletionModal
      session={session}
      sessionIndex={sessionIndex}
      exercises={exercises}
      setsPerExercise={setsPerExercise}
      onSave={handleSave}
      onCancel={() => setShowModal(false)}
    />
  )}
  ```

  Replace with:

  ```jsx
  {showModal && (
    <CompletionModal
      session={session}
      sessionIndex={sessionIndex}
      exercises={exercises}
      setsPerExercise={setsPerExercise}
      onSave={handleSave}
      onCancel={() => setShowModal(false)}
      historySession={historySession}
    />
  )}
  ```

- [ ] **Step 10: In history mode, hide SWAP and move controls by not passing them**

  In the `exercises.map` inside the scrollable list (around line 706), find:

  ```jsx
  <ExerciseCard
    key={`${exercise.name}-${i}`}
    exercise={exercise}
    colour={session.colour}
    sets={setsPerExercise[i] || []}
    onSetsChange={(newSets) => handleSetsChange(i, newSets)}
    prBook={prBook}
    onOpenPRSheet={(ex) => setPrSheetExercise(ex)}
    onMoveUp={i > 0 ? () => moveExercise(i, i - 1) : null}
    onMoveDown={i < exercises.length - 1 ? () => moveExercise(i, i + 1) : null}
    onSubstitute={() => setSubstituteForIdx(i)}
  />
  ```

  Replace with:

  ```jsx
  <ExerciseCard
    key={`${exercise.name}-${i}`}
    exercise={exercise}
    colour={session.colour}
    sets={setsPerExercise[i] || []}
    onSetsChange={(newSets) => handleSetsChange(i, newSets)}
    prBook={prBook}
    onOpenPRSheet={(ex) => setPrSheetExercise(ex)}
    onMoveUp={isHistoryMode || i === 0 ? null : () => moveExercise(i, i - 1)}
    onMoveDown={isHistoryMode || i === exercises.length - 1 ? null : () => moveExercise(i, i + 1)}
    onSubstitute={isHistoryMode ? null : () => setSubstituteForIdx(i)}
  />
  ```

- [ ] **Step 11: Verify build passes**

  ```
  npm run build
  ```
  Expected: no errors.

- [ ] **Step 12: Commit**

  ```bash
  git -C "app" add src/screens/SessionScreen.jsx
  git -C "app" commit -m "feat: SessionScreen history mode — pre-fill sets, SAVE CHANGES, updateSession on save"
  ```

---

## Task 6: App.jsx — wire historySession state and onViewSession handler

**Files:**
- Modify: `app/src/App.jsx`

- [ ] **Step 1: Add historySession state**

  In `App.jsx`, after the `activeSessionIndex` state (around line 93), add:

  ```js
  const [historySession, setHistorySession] = useState(null);
  ```

- [ ] **Step 2: Add handleViewSession and handleHistorySave**

  After the `handleSessionComplete` function (around line 107), add:

  ```js
  function handleViewSession(logEntry) {
    const dayDef = DAYS.find((d) => d.name === logEntry.sessionName) || DAYS[0];
    const idx = DAYS.indexOf(dayDef);
    setActiveSessionIndex(idx >= 0 ? idx : 0);
    setActiveSession(dayDef);
    setHistorySession(logEntry);
  }

  function handleHistorySave() {
    setHistorySession(null);
    setActiveSession(null);
  }
  ```

- [ ] **Step 3: Pass historySession to SessionScreen and update onBack/onComplete**

  Find the existing `SessionScreen` render:

  ```jsx
  {activeSession && (
    <SessionScreen
      session={activeSession}
      sessionIndex={activeSessionIndex}
      onBack={handleEndSession}
      onComplete={handleSessionComplete}
    />
  )}
  ```

  Replace with:

  ```jsx
  {activeSession && (
    <SessionScreen
      session={activeSession}
      sessionIndex={activeSessionIndex}
      onBack={historySession ? handleHistorySave : handleEndSession}
      onComplete={historySession ? handleHistorySave : handleSessionComplete}
      historySession={historySession}
    />
  )}
  ```

- [ ] **Step 4: Pass onViewSession to Dashboard and Calendar**

  Find:

  ```jsx
  {activeTab === 'home' && <Dashboard onStartSession={handleStartSession} />}
  ```

  Replace with:

  ```jsx
  {activeTab === 'home' && <Dashboard onStartSession={handleStartSession} onViewSession={handleViewSession} />}
  ```

  Find:

  ```jsx
  {activeTab === 'calendar' && <Calendar />}
  ```

  Replace with:

  ```jsx
  {activeTab === 'calendar' && <Calendar onViewSession={handleViewSession} />}
  ```

- [ ] **Step 5: Verify build passes**

  ```
  npm run build
  ```
  Expected: no errors.

- [ ] **Step 6: Manually verify dashboard week strip**

  Run `npm run dev`. On the dashboard, if there is a completed session in the rolling 7-day strip, tap it. Confirm that the session screen opens in history mode showing the correct date badge and the exercises/sets pre-filled.

- [ ] **Step 7: Commit**

  ```bash
  git -C "app" add src/App.jsx
  git -C "app" commit -m "feat: App.jsx wires historySession state and onViewSession to Dashboard and Calendar"
  ```

---

## Task 7: Calendar — "View Workout" button in DayEditModal

**Files:**
- Modify: `app/src/screens/Calendar.jsx`

- [ ] **Step 1: Accept onViewSession prop in Calendar**

  Change the Calendar component signature (around line 246):

  ```js
  export default function Calendar() {
  ```

  to:

  ```js
  export default function Calendar({ onViewSession }) {
  ```

- [ ] **Step 2: Accept onViewSession in DayEditModal and add the button**

  Change the `DayEditModal` signature (around line 126):

  ```js
  function DayEditModal({ dateStr, sessionEntry, dailyEntry, onSave, onClose }) {
  ```

  to:

  ```js
  function DayEditModal({ dateStr, sessionEntry, dailyEntry, onSave, onClose, onViewSession }) {
  ```

  Inside `DayEditModal`, find the block that renders the session name (around lines 168–175):

  ```jsx
  {sessionEntry && (
    <div style={{ fontSize: 11, color: sessionColour || '#888', marginBottom: 16, letterSpacing: '0.06em' }}>
      {sessionEntry.sessionName}
    </div>
  )}
  ```

  Replace with:

  ```jsx
  {sessionEntry && (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <div style={{ fontSize: 11, color: sessionColour || '#888', letterSpacing: '0.06em' }}>
        {sessionEntry.sessionName}
      </div>
      {onViewSession && (
        <button
          onClick={() => { onClose(); onViewSession(sessionEntry); }}
          style={{
            background: 'none',
            border: `1px solid ${sessionColour || '#555'}55`,
            borderRadius: 6,
            color: sessionColour || '#888',
            fontSize: 10,
            fontFamily: 'var(--font)',
            fontWeight: 700,
            letterSpacing: '0.08em',
            padding: '5px 10px',
            cursor: 'pointer',
          }}
        >
          VIEW WORKOUT
        </button>
      )}
    </div>
  )}
  ```

- [ ] **Step 3: Pass onViewSession from Calendar to DayEditModal**

  Find the `DayEditModal` usage (around line 287):

  ```jsx
  <DayEditModal
    dateStr={editDay}
    sessionEntry={sessionByDate[editDay]}
    dailyEntry={dailyLog[editDay] || {}}
    onSave={(data, rating) => handleSaveDay(editDay, data, rating)}
    onClose={() => setEditDay(null)}
  />
  ```

  Replace with:

  ```jsx
  <DayEditModal
    dateStr={editDay}
    sessionEntry={sessionByDate[editDay]}
    dailyEntry={dailyLog[editDay] || {}}
    onSave={(data, rating) => handleSaveDay(editDay, data, rating)}
    onClose={() => setEditDay(null)}
    onViewSession={onViewSession}
  />
  ```

- [ ] **Step 4: Verify build passes**

  ```
  npm run build
  ```
  Expected: no errors.

- [ ] **Step 5: Manually verify end-to-end**

  Run `npm run dev`. Navigate to the Calendar tab. Tap a day that has a completed session. Confirm:
  - The modal shows a "VIEW WORKOUT" button next to the session name
  - Tapping it closes the modal and opens the SessionScreen in history mode
  - Sets are pre-filled with the original logged data
  - Header shows the `HISTORY · <date>` badge instead of the MUSCLES button
  - "COMPLETE SESSION" button reads "SAVE CHANGES"
  - Editing a set and tapping "SAVE CHANGES" saves without advancing the next session index

- [ ] **Step 6: Commit**

  ```bash
  git -C "app" add src/screens/Calendar.jsx
  git -C "app" commit -m "feat: calendar DayEditModal — VIEW WORKOUT button opens past session in history mode"
  ```
