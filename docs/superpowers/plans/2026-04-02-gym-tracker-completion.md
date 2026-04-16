# Gym Tracker Full Completion Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the Compound Fitness PWA to a fully polished, spec-complete state covering all missing features identified in the audit.

**Architecture:** The app is React 18 + Vite at `app/src/`. State lives in localStorage via `data/storage.js`. Each screen is a file in `screens/`. The `MuscleIllustration` component is shared between Dashboard and Session. Tasks are structured so foundational data-model changes come first, then independent features can be built in parallel by sub-agents.

**Tech Stack:** React 18, Vite, localStorage, IBM Plex Mono, SVG for muscle illustrations, no external UI libraries.

---

## File Map

**Modified files:**
- `app/src/data/storage.js` — fix dailyLog schema (`private` key, `reflection` field), fix `getWeeklyVolume` to read per-set data, add `getSessionVolumeForExercises` helper
- `app/src/screens/Dashboard.jsx` — fix HABIT_CONFIG (private/red/unlabelled), add front/back flip to illustration, add muscle text breakdown
- `app/src/screens/SessionScreen.jsx` — full per-set logging (weight/reps/note rows), rest timer, PR detection, in-session muscle chip, exercise reorder/substitute/custom add
- `app/src/screens/PRBook.jsx` — remove 12-week targets section, remove `TWELVE_WEEK_TARGETS` import
- `app/src/App.jsx` — add Calendar tab (4th tab)
- `app/src/components/MuscleIllustration.jsx` — polish SVG to match reference image, add `mode` prop (`weekly`/`session`), add `view` prop (`front`/`back`), back-view paths

**New files:**
- `app/src/screens/Calendar.jsx` — 3-month scrollable calendar + day-edit modal
- `app/src/components/MuscleIllustrationBack.jsx` — back-view SVG (traps, lats, rear delts, hamstrings, glutes, calves)

---

## Task 1: Data Model Fixes

**Files:**
- Modify: `app/src/data/storage.js`

This is the foundation. Everything else reads from storage, so fix the schema first.

- [ ] **Step 1: Fix `getDayEntry` default habits key**

In `storage.js` line 49, change the default habits object from `stretch` to `private`:

```js
export function getDayEntry(dateStr) {
  const log = getDailyLog();
  return log[dateStr] || { weight: null, habits: { sauna: false, protein: false, private: false }, reflection: '' };
}
```

- [ ] **Step 2: Add `reflection` to `saveDailyEntry` (no change needed — it merges)**

The existing merge in `saveDailyEntry` already handles new fields. Verify it will persist `reflection`:

```js
// Already correct — log[dateStr] = { ...log[dateStr], ...data }
// Callers just need to pass { reflection: '...' }
```

- [ ] **Step 3: Add `getSessionVolumeForExercises` — computes per-exercise set volume for session illustration**

Add after `getWeeklyVolume`:

```js
// Returns { [muscleGroup]: { logged: number, target: number } }
// exercisesWithSets = [{ name: string, sets: [{ weight, reps, note }], prescribedSets: number }]
export function getSessionVolume(exercisesWithSets) {
  const volume = {};
  const targets = {};
  exercisesWithSets.forEach((ex) => {
    const mapping = MUSCLE_MAPPINGS[ex.name];
    if (!mapping) return;
    const prescribedSets = ex.prescribedSets || 0;
    // Accumulate targets
    mapping.primary.forEach((m) => {
      targets[m] = (targets[m] || 0) + prescribedSets;
    });
    mapping.secondary.forEach((m) => {
      targets[m] = (targets[m] || 0) + prescribedSets * 0.5;
    });
    // Accumulate logged
    const loggedSets = (ex.sets || []).filter((s) => s.reps > 0 || (s.weight === 0 && s.reps > 0)).length;
    mapping.primary.forEach((m) => {
      volume[m] = (volume[m] || 0) + loggedSets;
    });
    mapping.secondary.forEach((m) => {
      volume[m] = (volume[m] || 0) + loggedSets * 0.5;
    });
  });
  return { volume, targets };
}
```

- [ ] **Step 4: Fix `getWeeklyVolume` to handle new per-set exercise format**

The new `sessionLog` entries will store `exercises[].sets[]` arrays instead of `setsLogged`. Update the aggregation to handle both old and new format:

```js
export function getWeeklyVolume(weekStartDate) {
  const log = getSessionLog();
  const weekStart = new Date(weekStartDate);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const volume = {};

  log.forEach((session) => {
    const sessionDate = new Date(session.completedAt || session.date);
    if (sessionDate >= weekStart && sessionDate < weekEnd) {
      (session.exercises || []).forEach((ex) => {
        // Support both old format (setsLogged number) and new format (sets array)
        let setsLogged = 0;
        if (Array.isArray(ex.sets)) {
          setsLogged = ex.sets.filter((s) => s.reps > 0).length;
        } else {
          setsLogged = parseInt(ex.setsLogged) || 0;
        }
        if (setsLogged === 0) return;
        const mapping = MUSCLE_MAPPINGS[ex.name];
        if (!mapping) return;
        mapping.primary.forEach((muscle) => {
          volume[muscle] = (volume[muscle] || 0) + setsLogged;
        });
        mapping.secondary.forEach((muscle) => {
          volume[muscle] = (volume[muscle] || 0) + setsLogged * 0.5;
        });
      });
    }
  });

  return volume;
}
```

- [ ] **Step 5: Verify app still runs**

Run `cd "/c/Users/wells/Desktop/Compound Fitness/app" && npm run dev` — confirm no console errors on load.

---

## Task 2: Third Habit Fix (Private, Red, Unlabelled)

**Files:**
- Modify: `app/src/screens/Dashboard.jsx`
- Modify: `app/src/data/storage.js` (already handled in Task 1)

- [ ] **Step 1: Update HABIT_CONFIG in Dashboard.jsx**

Replace lines 32–36:

```js
const HABIT_CONFIG = [
  { key: 'sauna', label: 'sauna', colour: '#4A90D9' },
  { key: 'protein', label: 'prot', colour: '#E8634A' },
  { key: 'private', label: null, colour: '#E53935' },
];
```

- [ ] **Step 2: Update habit label rendering to skip null labels**

In Dashboard.jsx around line 376–382, the label row maps `label` to a span. Update to render nothing for null:

```jsx
<div style={{ display: 'flex', gap: 12 }}>
  {HABIT_CONFIG.map(({ key, label }) => (
    <span key={key} style={{ fontSize: 9, color: '#444', width: 22, textAlign: 'center' }}>
      {label || ''}
    </span>
  ))}
</div>
```

- [ ] **Step 3: Fix `toggleHabit` default habits object**

In Dashboard.jsx line 91:

```js
const current = todayEntry.habits || { sauna: false, protein: false, private: false };
```

- [ ] **Step 4: Verify habit renders correctly**

In browser: three dots shown on dashboard — blue (sauna), orange (protein), red (no label). Toggling each persists across reload.

---

## Task 3: Per-Set Logging in Session Mode

**Files:**
- Modify: `app/src/screens/SessionScreen.jsx`

This is the largest change. The `ExerciseCard` goes from a simple counter to a per-set row UI with weight, reps, and note inputs. The rest timer fires after each set is logged.

- [ ] **Step 1: Add rest timer hook at top of SessionScreen.jsx**

```jsx
import { useState, useCallback, useEffect, useRef } from 'react';

function useRestTimer() {
  const [timerSeconds, setTimerSeconds] = useState(null); // null = not running
  const intervalRef = useRef(null);

  function startTimer(seconds) {
    clearInterval(intervalRef.current);
    setTimerSeconds(seconds);
    intervalRef.current = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function stopTimer() {
    clearInterval(intervalRef.current);
    setTimerSeconds(null);
  }

  useEffect(() => () => clearInterval(intervalRef.current), []);

  return { timerSeconds, startTimer, stopTimer };
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
```

- [ ] **Step 2: Rewrite ExerciseCard to per-set row UI**

Replace the entire `ExerciseCard` function (lines 162–297) with:

```jsx
function ExerciseCard({ exercise, colour, sets, onSetsChange, prBook, onPRDetected }) {
  const [noteExpanded, setNoteExpanded] = useState(false);
  const [prOpen, setPrOpen] = useState(false);
  const { timerSeconds, startTimer } = useRestTimer();

  const maxSets = parseMaxSets(exercise.sets);

  // Ensure sets array has maxSets rows
  const ensuredSets = Array.from({ length: maxSets }, (_, i) => sets[i] || { weight: '', reps: '', note: '' });

  function handleSetChange(setIdx, field, value) {
    const next = ensuredSets.map((s, i) => (i === setIdx ? { ...s, [field]: value } : s));
    onSetsChange(next);

    // Auto-start rest timer when reps is entered
    if (field === 'reps' && value && exercise.restSeconds) {
      startTimer(exercise.restSeconds);
    }

    // PR detection
    if ((field === 'reps' || field === 'weight') && value) {
      const updatedSet = { ...ensuredSets[setIdx], [field]: value };
      const w = parseFloat(updatedSet.weight);
      const r = parseInt(updatedSet.reps);
      if (!isNaN(w) && !isNaN(r) && r > 0) {
        const exPRs = prBook[exercise.name] || {};
        const repKey = String(r);
        const best = (exPRs[repKey] || []).reduce((max, e) => {
          const ew = parseFloat(e.weight);
          return ew > max ? ew : max;
        }, 0);
        if (w > best) onPRDetected(setIdx);
      }
    }
  }

  const cardBg = exercise.priority ? `${colour}12` : '#1a1a1a';
  const cardBorder = exercise.priority ? `1px solid ${colour}40` : '1px solid #2a2a2a';

  return (
    <div style={{ background: cardBg, border: cardBorder, borderRadius: 10, padding: '14px 14px 12px', marginBottom: 10 }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
        <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setNoteExpanded((v) => !v)}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#e8e8e8', lineHeight: 1.3 }}>{exercise.name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {exercise.priority && (
            <span style={{ background: colour, color: '#fff', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', borderRadius: 3, padding: '2px 6px' }}>KEY</span>
          )}
          {timerSeconds !== null && (
            <span style={{ background: '#1e1e1e', border: `1px solid ${colour}55`, borderRadius: 10, fontSize: 11, color: colour, padding: '2px 8px', fontWeight: 700 }}>
              {formatTime(timerSeconds)}
            </span>
          )}
          <button
            onClick={() => setPrOpen((v) => !v)}
            style={{ background: 'none', border: 'none', color: '#555', fontSize: 11, fontFamily: 'var(--font)', cursor: 'pointer', padding: '2px 4px', letterSpacing: '0.04em' }}
          >
            PR {prOpen ? '▾' : '▸'}
          </button>
        </div>
      </div>

      {/* Subtitle */}
      <div style={{ fontSize: 11, color: '#555', marginBottom: 10 }}>
        {exercise.sets} sets × {exercise.reps}{exercise.rest ? ` · ${exercise.rest} rest` : ''}
      </div>

      {/* Per-set rows */}
      <div style={{ marginBottom: 8 }}>
        {/* Column headers */}
        <div style={{ display: 'grid', gridTemplateColumns: '18px 64px 56px 1fr 20px', gap: 4, marginBottom: 4 }}>
          {['#', 'KG', 'REPS', 'NOTE', ''].map((h, i) => (
            <div key={i} style={{ fontSize: 9, color: '#444', letterSpacing: '0.08em' }}>{h}</div>
          ))}
        </div>
        {ensuredSets.map((s, i) => {
          const isLogged = s.reps !== '' && s.reps !== undefined;
          const dimmed = i > 0 && !ensuredSets[i - 1].reps;
          return (
            <SetRow
              key={i}
              setNum={i + 1}
              setData={s}
              colour={colour}
              dimmed={dimmed}
              isLogged={isLogged}
              onChange={(field, val) => handleSetChange(i, field, val)}
            />
          );
        })}
      </div>

      {/* Coaching note */}
      {noteExpanded && exercise.note && (
        <div style={{ marginTop: 10, fontSize: 12, color: '#666', lineHeight: 1.5, borderTop: '1px solid #2a2a2a', paddingTop: 10 }}>
          {exercise.note}
        </div>
      )}

      {prOpen && <PRPanel exercise={exercise} colour={colour} />}
    </div>
  );
}
```

- [ ] **Step 3: Add `SetRow` component (above ExerciseCard)**

```jsx
function SetRow({ setNum, setData, colour, dimmed, isLogged, onChange }) {
  const inputBase = {
    background: '#222',
    border: '1px solid #2a2a2a',
    borderRadius: 4,
    color: '#e8e8e8',
    fontSize: 13,
    fontFamily: 'var(--font)',
    padding: '5px 6px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    opacity: dimmed ? 0.3 : 1,
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '18px 64px 56px 1fr 20px', gap: 4, marginBottom: 4, alignItems: 'center', opacity: dimmed ? 0.4 : 1 }}>
      <div style={{ fontSize: 10, color: '#555', textAlign: 'right' }}>{setNum}</div>
      <input
        type="number"
        min="0"
        step="0.5"
        placeholder="—"
        value={setData.weight}
        onChange={(e) => onChange('weight', e.target.value)}
        style={inputBase}
        disabled={dimmed}
      />
      <input
        type="number"
        min="0"
        placeholder="—"
        value={setData.reps}
        onChange={(e) => onChange('reps', e.target.value)}
        style={inputBase}
        disabled={dimmed}
      />
      <input
        type="text"
        placeholder=""
        value={setData.note}
        onChange={(e) => onChange('note', e.target.value)}
        style={{ ...inputBase, fontSize: 11 }}
        disabled={dimmed}
      />
      <div style={{ fontSize: 12, color: isLogged ? colour : '#2a2a2a', textAlign: 'center' }}>
        {isLogged ? '✓' : '·'}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Update `SessionScreen` state from array of counts to array of set-arrays**

Replace the state in `SessionScreen` (line 457–460):

```jsx
export default function SessionScreen({ session, sessionIndex, onBack, onComplete }) {
  // Each exercise gets an array of set objects: [{ weight: '', reps: '', note: '' }, ...]
  const [setsPerExercise, setSetsPerExercise] = useState(
    () => session.exercises.map(() => [])
  );
  const [prFlash, setPrFlash] = useState({}); // { 'exIdx-setIdx': true }
  const [showModal, setShowModal] = useState(false);

  const prBook = getPRBook();

  const handleSetsChange = useCallback((exIdx, newSets) => {
    setSetsPerExercise((prev) => {
      const next = [...prev];
      next[exIdx] = newSets;
      return next;
    });
  }, []);

  function handlePRDetected(exIdx, setIdx) {
    const key = `${exIdx}-${setIdx}`;
    setPrFlash((prev) => ({ ...prev, [key]: true }));
  }
```

- [ ] **Step 5: Update `ExerciseCard` usage in the render loop**

In the `SessionScreen` render (around line 565–572):

```jsx
{session.exercises.map((exercise, i) => (
  <ExerciseCard
    key={exercise.name}
    exercise={exercise}
    colour={session.colour}
    sets={setsPerExercise[i] || []}
    onSetsChange={(newSets) => handleSetsChange(i, newSets)}
    prBook={prBook}
    onPRDetected={(setIdx) => handlePRDetected(i, setIdx)}
  />
))}
```

- [ ] **Step 6: Update `CompletionModal` and `saveSession` call to use new format**

In `CompletionModal.handleSave` (around line 306–319), update the exercises mapping:

```js
function handleSave() {
  if (!rating) return;
  const exercises = session.exercises.map((ex, i) => ({
    name: ex.name,
    sets: (setsPerExercise[i] || []).filter((s) => s.reps !== '' && s.reps !== undefined),
  }));
  saveSession({
    date: toDateStr(new Date()),
    sessionName: session.name,
    sessionIndex,
    exercises,
    rating,
    note: note.trim(),
    completedAt: new Date().toISOString(),
  });
  advanceNextSession();
  onSave();
}
```

- [ ] **Step 7: Verify in browser**

Start a session. For any exercise, tap to expand (or it should be auto-expanded). Enter weight + reps for set 1. Verify: rest timer appears, next set row becomes available, checkmark appears on set 1. Complete session and verify sessionLog in localStorage has `sets: [{weight, reps, note}, ...]`.

---

## Task 4: PR Book Bottom Sheet from Session

**Files:**
- Modify: `app/src/screens/SessionScreen.jsx`

Replace the inline `PRPanel` with a bottom sheet that slides up from the bottom. This is accessible from session view only.

- [ ] **Step 1: Add `PRBottomSheet` component above `ExerciseCard`**

```jsx
function PRBottomSheet({ exercise, colour, onClose }) {
  const [prBook, setPrBook] = useState(() => getPRBook());
  const [repInput, setRepInput] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [dateInput, setDateInput] = useState('');

  const exPRs = prBook[exercise.name] || {};
  const repKeys = Object.keys(exPRs).map(Number).sort((a, b) => a - b);

  function handleSavePR() {
    if (!weightInput.trim() || !repInput) return;
    addPREntry(exercise.name, parseInt(repInput), weightInput.trim(), dateInput.trim() || undefined);
    setPrBook(getPRBook());
    setWeightInput('');
    setDateInput('');
    setRepInput('');
  }

  const inputStyle = {
    background: '#222', border: '1px solid #333', borderRadius: 4,
    color: '#e8e8e8', fontSize: 12, fontFamily: 'var(--font)',
    padding: '5px 8px', outline: 'none',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 150 }}
      />
      {/* Sheet */}
      <div
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: '#1a1a1a', borderTop: `2px solid ${colour}`,
          borderRadius: '16px 16px 0 0', zIndex: 160,
          maxHeight: '75vh', overflowY: 'auto',
          padding: '0 20px 40px',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
          <div style={{ width: 36, height: 4, background: '#333', borderRadius: 2 }} />
        </div>
        <div style={{ fontSize: 11, color: colour, letterSpacing: '0.12em', fontWeight: 700, marginBottom: 4 }}>
          PR BOOK
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#e8e8e8', marginBottom: 16 }}>
          {exercise.name}
        </div>

        {/* PR table */}
        {repKeys.length === 0 ? (
          <div style={{ fontSize: 12, color: '#444', marginBottom: 16 }}>No PRs logged yet</div>
        ) : (
          repKeys.map((rep) => {
            const entries = (exPRs[rep] || []).slice(0, 6);
            const best = entries.reduce((m, e) => Math.max(m, parseFloat(e.weight) || 0), 0);
            return (
              <div key={rep} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: colour, fontWeight: 700 }}>{rep} REPS</span>
                  <span style={{ fontSize: 10, color: '#888' }}>best {best} kg</span>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {entries.map((entry, ci) => (
                    <span
                      key={ci}
                      style={{
                        background: ci === 0 ? `${colour}22` : '#141414',
                        border: `1px solid ${ci === 0 ? colour + '55' : '#2a2a2a'}`,
                        borderRadius: 4, padding: '3px 8px',
                        fontSize: 11, color: ci === 0 ? '#e8e8e8' : '#666',
                      }}
                    >
                      {entry.weight}{entry.date ? `  ${entry.date}` : ''}
                    </span>
                  ))}
                </div>
              </div>
            );
          })
        )}

        {/* Add PR */}
        <div style={{ borderTop: '1px solid #2a2a2a', paddingTop: 14, marginTop: 4 }}>
          <div style={{ fontSize: 10, color: '#555', letterSpacing: '0.1em', marginBottom: 8 }}>LOG PR</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <label style={{ fontSize: 9, color: '#444' }}>REPS</label>
              <input type="number" min="1" value={repInput} onChange={(e) => setRepInput(e.target.value)}
                style={{ ...inputStyle, width: 52 }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <label style={{ fontSize: 9, color: '#444' }}>WEIGHT kg</label>
              <input type="text" placeholder="82.5" value={weightInput} onChange={(e) => setWeightInput(e.target.value)}
                style={{ ...inputStyle, width: 80 }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <label style={{ fontSize: 9, color: '#444' }}>DATE (opt)</label>
              <input type="text" placeholder="dd.mm" value={dateInput} onChange={(e) => setDateInput(e.target.value)}
                style={{ ...inputStyle, width: 72 }} />
            </div>
            <button
              onClick={handleSavePR}
              disabled={!weightInput.trim() || !repInput}
              style={{
                background: colour, border: 'none', borderRadius: 4, color: '#fff',
                fontSize: 11, fontFamily: 'var(--font)', fontWeight: 700,
                letterSpacing: '0.06em', padding: '6px 14px',
                cursor: weightInput.trim() && repInput ? 'pointer' : 'not-allowed',
                opacity: weightInput.trim() && repInput ? 1 : 0.5,
              }}
            >
              SAVE PR
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Replace `PRPanel` usage in `ExerciseCard` with sheet trigger**

In `ExerciseCard`, replace the `{prOpen && <PRPanel ... />}` line and the `prOpen` state with:

```jsx
// In ExerciseCard, add prop: onOpenPRSheet
function ExerciseCard({ exercise, colour, sets, onSetsChange, prBook, onPRDetected, onOpenPRSheet }) {
  // ...remove prOpen state, add onClick for PR button:
  // button: onClick={() => onOpenPRSheet(exercise)}
}
```

- [ ] **Step 3: Manage sheet state at `SessionScreen` level**

In `SessionScreen`:

```jsx
const [prSheetExercise, setPrSheetExercise] = useState(null);
// In render, below the exercise list:
{prSheetExercise && (
  <PRBottomSheet
    exercise={prSheetExercise}
    colour={session.colour}
    onClose={() => setPrSheetExercise(null)}
  />
)}
// Pass onOpenPRSheet={(ex) => setPrSheetExercise(ex)} to each ExerciseCard
```

- [ ] **Step 4: Verify bottom sheet**

Tap PR button on any exercise in session view. Sheet slides up from bottom, showing PR history table and add form. Swipe/tap backdrop closes it.

---

## Task 5: Remove 12-Week Targets from PR Book

**Files:**
- Modify: `app/src/screens/PRBook.jsx`

- [ ] **Step 1: Remove the import**

Remove line 2:
```js
import { TWELVE_WEEK_TARGETS } from '../data/prSeed';
```

- [ ] **Step 2: Remove the entire `CollapsibleSection` block for 12-WEEK TARGETS**

Delete from PRBook.jsx (lines 341–376):
```jsx
{/* 12-Week Targets */}
<CollapsibleSection label="12-WEEK TARGETS" colour="#888" defaultOpen={true}>
  ...
</CollapsibleSection>
```

- [ ] **Step 3: Remove `targetCellStyle` function and `CollapsibleSection` if unused**

`CollapsibleSection` is still used for PUSH/PULL/LEGS. Remove only `targetCellStyle` (lines 399–411).

- [ ] **Step 4: Verify PR Book renders without targets block, only PUSH/PULL/LEGS sections.**

---

## Task 6: In-Session Muscle Illustration Chip

**Files:**
- Modify: `app/src/components/MuscleIllustration.jsx` — add `mode` and `view` props
- Modify: `app/src/screens/SessionScreen.jsx` — add collapsible chip in header

- [ ] **Step 1: Update `MuscleIllustration` to support `session` mode with separate volume/target props**

Add `sessionVolume` and `sessionTargets` props. When `mode === 'session'`, use these instead of `weeklyVolume`/`volumeTargets`:

```jsx
export default function MuscleIllustration({
  weeklyVolume = {},
  volumeTargets = {},
  sessionVolume = {},
  sessionTargets = {},
  mode = 'weekly', // 'weekly' | 'session'
  size = 160,
}) {
  function getMuscleColor(muscleKey) {
    const vol = mode === 'session' ? sessionVolume : weeklyVolume;
    const targets = mode === 'session' ? sessionTargets : volumeTargets;
    const sets = vol[muscleKey] || 0;
    const target = targets[muscleKey] || 10;
    if (sets === 0) return '#1e1e1e';
    const ratio = sets / target;
    if (ratio < 0.5) return '#4a5a3a';
    if (ratio < 1.0) return '#c8b400';
    if (ratio < 1.2) return '#5BBD72';
    return '#F0A500'; // overreaching
  }
  // ... rest of SVG unchanged
}
```

- [ ] **Step 2: Add collapsible chip state to `SessionScreen`**

In `SessionScreen`, add state and import:

```jsx
import { getSessionVolume } from '../data/storage';
import MuscleIllustration from '../components/MuscleIllustration';

// Inside SessionScreen:
const [muscleChipOpen, setMuscleChipOpen] = useState(false);

// Compute session volume from current setsPerExercise state
const sessionExercisesWithSets = session.exercises.map((ex, i) => ({
  name: ex.name,
  sets: setsPerExercise[i] || [],
  prescribedSets: parseMaxSets(ex.sets),
}));
const { volume: sessionVol, targets: sessionTgts } = getSessionVolume(sessionExercisesWithSets);
```

- [ ] **Step 3: Add MUSCLES chip button to session header**

In the sticky header `<div>` (after the COMPLETE button, around line 543):

```jsx
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

- [ ] **Step 4: Render expanded muscle chip below the header**

After the sticky header `</div>` and before the scrollable exercise list:

```jsx
{muscleChipOpen && (
  <div style={{
    background: '#141414',
    borderBottom: '1px solid #2a2a2a',
    padding: '16px',
    display: 'flex',
    justifyContent: 'center',
  }}>
    <MuscleIllustration
      size={120}
      mode="session"
      sessionVolume={sessionVol}
      sessionTargets={sessionTgts}
    />
  </div>
)}
```

- [ ] **Step 5: Verify**

Tap MUSCLES chip in session header. Illustration expands below header. Complete a set — illustration colour updates in real-time. Tap again to collapse.

---

## Task 7: Exercise Management in Session (Reorder / Substitute / Custom)

**Files:**
- Modify: `app/src/screens/SessionScreen.jsx`

- [ ] **Step 1: Add exercises state to `SessionScreen` (instead of reading directly from `session.exercises`)**

```jsx
const [exercises, setExercises] = useState(() => session.exercises.map((ex) => ({ ...ex })));
const [setsPerExercise, setSetsPerExercise] = useState(() => session.exercises.map(() => []));
```

- [ ] **Step 2: Add reorder buttons to each `ExerciseCard`**

Add `onMoveUp` and `onMoveDown` props to `ExerciseCard`. Render small ↑ ↓ buttons in the header row (only show when there are multiple exercises):

```jsx
// In ExerciseCard header row, after exercise name:
<div style={{ display: 'flex', gap: 2 }}>
  {onMoveUp && (
    <button onClick={onMoveUp} style={{ background: 'none', border: '1px solid #2a2a2a', borderRadius: 3, color: '#555', fontSize: 10, padding: '2px 5px', cursor: 'pointer' }}>↑</button>
  )}
  {onMoveDown && (
    <button onClick={onMoveDown} style={{ background: 'none', border: '1px solid #2a2a2a', borderRadius: 3, color: '#555', fontSize: 10, padding: '2px 5px', cursor: 'pointer' }}>↓</button>
  )}
</div>
```

- [ ] **Step 3: Add reorder logic to `SessionScreen`**

```js
function moveExercise(fromIdx, toIdx) {
  setExercises((prev) => {
    const next = [...prev];
    const [removed] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, removed);
    return next;
  });
  setSetsPerExercise((prev) => {
    const next = [...prev];
    const [removed] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, removed);
    return next;
  });
}
```

- [ ] **Step 4: Add SUBSTITUTE button to each card**

Add a ghost button "SWAP" next to the exercise name. Tapping opens an inline picker of all exercises not currently in session (from DAYS programme data):

```jsx
// In ExerciseCard, add onSubstitute prop
// Show a small "SWAP" button in card header
// Tapping calls onSubstitute(exercise)
```

In `SessionScreen`, manage a `substituteForIdx` state. When set, show a simple bottom sheet listing all programme exercises grouped by muscle, tapping one replaces `exercises[substituteForIdx]`:

```jsx
const [substituteForIdx, setSubstituteForIdx] = useState(null);

// Show SubstituteSheet when substituteForIdx !== null
function handleSubstitute(idx, newExercise) {
  setExercises((prev) => {
    const next = [...prev];
    next[idx] = { ...newExercise };
    return next;
  });
  setSetsPerExercise((prev) => {
    const next = [...prev];
    next[idx] = [];
    return next;
  });
  setSubstituteForIdx(null);
}
```

- [ ] **Step 5: Add `SubstituteSheet` component**

```jsx
import { DAYS } from '../data/programme';

function SubstituteSheet({ colour, onSelect, onClose }) {
  // Flatten all exercises from all sessions, deduplicated by name
  const allExercises = [];
  const seen = new Set();
  DAYS.forEach((day) => {
    day.exercises.forEach((ex) => {
      if (!seen.has(ex.name)) {
        seen.add(ex.name);
        allExercises.push({ ...ex, sessionColour: day.colour });
      }
    });
  });

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 150 }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#1a1a1a', borderTop: `2px solid ${colour}`,
        borderRadius: '16px 16px 0 0', zIndex: 160,
        maxHeight: '70vh', overflowY: 'auto',
        padding: '0 20px 40px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
          <div style={{ width: 36, height: 4, background: '#333', borderRadius: 2 }} />
        </div>
        <div style={{ fontSize: 11, color: '#888', letterSpacing: '0.1em', marginBottom: 14 }}>SELECT SUBSTITUTE</div>
        {allExercises.map((ex) => (
          <button
            key={ex.name}
            onClick={() => onSelect(ex)}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              background: 'none', border: 'none', borderBottom: '1px solid #1e1e1e',
              color: '#e8e8e8', fontSize: 13, fontFamily: 'var(--font)',
              padding: '10px 0', cursor: 'pointer',
            }}
          >
            {ex.name}
          </button>
        ))}
      </div>
    </>
  );
}
```

- [ ] **Step 6: Add "+ EXERCISE" button at the bottom of the exercise list**

Above the "COMPLETE SESSION" button:

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
```

- [ ] **Step 7: Add `CustomExerciseSheet` component**

```jsx
function CustomExerciseSheet({ colour, onAdd, onClose }) {
  const [name, setName] = useState('');
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('10');

  function handleAdd() {
    if (!name.trim()) return;
    onAdd({
      name: name.trim(),
      sets,
      reps,
      rest: '',
      restSeconds: 90,
      note: '',
      priority: false,
      primaryMuscles: [],
      secondaryMuscles: [],
    });
    onClose();
  }

  const inputStyle = {
    background: '#222', border: '1px solid #2a2a2a', borderRadius: 4,
    color: '#e8e8e8', fontSize: 13, fontFamily: 'var(--font)',
    padding: '8px 10px', outline: 'none', width: '100%', boxSizing: 'border-box',
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 150 }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#1a1a1a', borderTop: `2px solid ${colour}`,
        borderRadius: '16px 16px 0 0', zIndex: 160,
        padding: '0 20px 40px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
          <div style={{ width: 36, height: 4, background: '#333', borderRadius: 2 }} />
        </div>
        <div style={{ fontSize: 11, color: '#888', letterSpacing: '0.1em', marginBottom: 14 }}>ADD EXERCISE</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={{ fontSize: 9, color: '#444', letterSpacing: '0.08em' }}>EXERCISE NAME</label>
            <input type="text" placeholder="e.g. Cable Face Pull" value={name} onChange={(e) => setName(e.target.value)}
              style={{ ...inputStyle, marginTop: 4 }} autoFocus />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 9, color: '#444', letterSpacing: '0.08em' }}>SETS</label>
              <input type="number" min="1" value={sets} onChange={(e) => setSets(e.target.value)}
                style={{ ...inputStyle, marginTop: 4 }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 9, color: '#444', letterSpacing: '0.08em' }}>REPS</label>
              <input type="number" min="1" value={reps} onChange={(e) => setReps(e.target.value)}
                style={{ ...inputStyle, marginTop: 4 }} />
            </div>
          </div>
          <button
            onClick={handleAdd}
            disabled={!name.trim()}
            style={{
              background: name.trim() ? colour : '#333', border: 'none', borderRadius: 8,
              color: '#fff', fontSize: 13, fontFamily: 'var(--font)', fontWeight: 700,
              padding: '12px 0', cursor: name.trim() ? 'pointer' : 'not-allowed',
              opacity: name.trim() ? 1 : 0.6, marginTop: 4,
            }}
          >
            ADD TO SESSION
          </button>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 8: Wire custom exercise add to session state**

```js
function handleAddCustomExercise(exerciseDef) {
  setExercises((prev) => [...prev, exerciseDef]);
  setSetsPerExercise((prev) => [...prev, []]);
}
```

- [ ] **Step 9: Verify**

In session: ↑/↓ buttons reorder exercises correctly, SWAP opens substitute sheet, selecting an exercise replaces the card, + ADD EXERCISE adds a custom exercise at the bottom with working set logging rows.

---

## Task 8: Calendar Tab

**Files:**
- Create: `app/src/screens/Calendar.jsx`
- Modify: `app/src/App.jsx`

- [ ] **Step 1: Create `Calendar.jsx` scaffold**

```jsx
import { useState } from 'react';
import { getSessionLog, getDailyLog, saveDailyEntry } from '../data/storage';
import { toDateStr } from '../utils/dateUtils';
import { DAYS } from '../data/programme';

const MONTHS = [
  { year: 2026, month: 3 },  // April (0-indexed)
  { year: 2026, month: 4 },  // May
  { year: 2026, month: 5 },  // June
];

const SESSION_COLOURS = {
  'Push A': '#E8634A', 'Push B': '#E8634A',
  'Pull A': '#4A90D9', 'Pull B': '#4A90D9',
  'Legs A': '#5BBD72', 'Legs B': '#5BBD72',
};

const HABIT_COLOURS = ['#4A90D9', '#E8634A', '#E53935'];
const HABIT_KEYS = ['sauna', 'protein', 'private'];

export default function Calendar() {
  const [sessionLog] = useState(() => getSessionLog());
  const [dailyLog, setDailyLog] = useState(() => getDailyLog());
  const [editDay, setEditDay] = useState(null); // dateStr | null

  const todayStr = toDateStr(new Date());

  // Build lookup maps
  const sessionByDate = {};
  sessionLog.forEach((s) => {
    const d = (s.date || '').slice(0, 10);
    if (d) sessionByDate[d] = s;
  });

  function handleDayTap(dateStr) {
    if (dateStr > todayStr) return; // Future: ignore
    setEditDay(dateStr);
  }

  function handleSaveDay(dateStr, data) {
    saveDailyEntry(dateStr, data);
    setDailyLog((prev) => ({ ...prev, [dateStr]: { ...(prev[dateStr] || {}), ...data } }));
    setEditDay(null);
  }

  return (
    <div style={{ padding: '20px 16px', fontFamily: 'var(--font)', color: '#e8e8e8', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '0.04em', marginBottom: 20 }}>CALENDAR</div>
      {MONTHS.map((m) => (
        <MonthGrid
          key={`${m.year}-${m.month}`}
          year={m.year}
          month={m.month}
          todayStr={todayStr}
          sessionByDate={sessionByDate}
          dailyLog={dailyLog}
          onDayTap={handleDayTap}
        />
      ))}
      {editDay && (
        <DayEditModal
          dateStr={editDay}
          sessionEntry={sessionByDate[editDay]}
          dailyEntry={dailyLog[editDay] || {}}
          onSave={(data) => handleSaveDay(editDay, data)}
          onClose={() => setEditDay(null)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add `MonthGrid` component**

```jsx
const DAY_HEADERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function MonthGrid({ year, month, todayStr, sessionByDate, dailyLog, onDayTap }) {
  const monthName = new Date(year, month, 1).toLocaleString('en-GB', { month: 'long', year: 'numeric' });
  // Get first day of month (0=Sun, adjusted to Mon=0)
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // Mon = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: '#888', marginBottom: 10, textTransform: 'uppercase' }}>
        {monthName}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
        {DAY_HEADERS.map((h, i) => (
          <div key={i} style={{ fontSize: 9, color: '#444', textAlign: 'center', padding: '2px 0' }}>{h}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;
          const dateStr = toDateStr(new Date(year, month, day));
          const isFuture = dateStr > todayStr;
          const isToday = dateStr === todayStr;
          const session = sessionByDate[dateStr];
          const daily = dailyLog[dateStr] || {};
          const habits = daily.habits || {};
          const sessionColour = session ? SESSION_COLOURS[session.sessionName] : null;

          return (
            <div
              key={day}
              onClick={() => !isFuture && onDayTap(dateStr)}
              style={{
                background: sessionColour ? `${sessionColour}18` : '#141414',
                border: isToday ? '1px solid #555' : `1px solid ${sessionColour ? sessionColour + '30' : '#1e1e1e'}`,
                borderRadius: 6,
                padding: '4px 4px 3px',
                cursor: isFuture ? 'default' : 'pointer',
                opacity: isFuture ? 0.3 : 1,
                minHeight: 52,
              }}
            >
              <div style={{ fontSize: 10, color: isToday ? '#e8e8e8' : '#666', marginBottom: 2 }}>{day}</div>
              {session?.rating && (
                <div style={{ fontSize: 9, color: sessionColour || '#888' }}>{session.rating}/10</div>
              )}
              {(habits.sauna || habits.protein || habits.private) && (
                <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
                  {HABIT_KEYS.map((k, hi) => habits[k] ? (
                    <div key={k} style={{ width: 5, height: 5, borderRadius: '50%', background: HABIT_COLOURS[hi] }} />
                  ) : null)}
                </div>
              )}
              {daily.bodyweight && (
                <div style={{ fontSize: 8, color: '#444', marginTop: 2 }}>{daily.bodyweight}</div>
              )}
              {daily.reflection && (
                <div style={{ fontSize: 8, color: '#555', fontStyle: 'italic', marginTop: 1 }}>
                  {daily.reflection.split(' ').slice(0, 2).join(' ')}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add `DayEditModal` component**

```jsx
function DayEditModal({ dateStr, sessionEntry, dailyEntry, onSave, onClose }) {
  const [habits, setHabits] = useState(() => dailyEntry.habits || { sauna: false, protein: false, private: false });
  const [bodyweight, setBodyweight] = useState(() => dailyEntry.bodyweight != null ? String(dailyEntry.bodyweight) : '');
  const [reflection, setReflection] = useState(() => dailyEntry.reflection || '');
  const [rating, setRating] = useState(() => sessionEntry?.rating ?? null);

  const date = new Date(dateStr + 'T12:00:00');
  const dateLabel = date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  function handleSave() {
    const data = {
      habits,
      reflection: reflection.trim(),
    };
    const bw = parseFloat(bodyweight);
    if (!isNaN(bw)) data.bodyweight = bw;
    onSave(data);
  }

  const inputStyle = {
    background: '#222', border: '1px solid #2a2a2a', borderRadius: 6,
    color: '#e8e8e8', fontSize: 14, fontFamily: 'var(--font)',
    padding: '8px 10px', outline: 'none', width: '100%', boxSizing: 'border-box',
  };

  const HABIT_CONFIG = [
    { key: 'sauna', label: 'sauna', colour: '#4A90D9' },
    { key: 'protein', label: 'protein', colour: '#E8634A' },
    { key: 'private', label: null, colour: '#E53935' },
  ];

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200 }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#1a1a1a', borderTop: '1px solid #2a2a2a',
        borderRadius: '16px 16px 0 0', zIndex: 210,
        maxHeight: '85vh', overflowY: 'auto',
        padding: '0 20px 40px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
          <div style={{ width: 36, height: 4, background: '#333', borderRadius: 2 }} />
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#e8e8e8', marginBottom: 4 }}>{dateLabel}</div>
        {sessionEntry && (
          <div style={{ fontSize: 11, color: SESSION_COLOURS[sessionEntry.sessionName] || '#888', marginBottom: 16 }}>
            {sessionEntry.sessionName}
          </div>
        )}

        {/* Rating (if session logged) */}
        {sessionEntry && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: '#555', letterSpacing: '0.08em', marginBottom: 8 }}>RATING</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button key={n} onClick={() => setRating(n)} style={{
                  width: 34, height: 34,
                  background: rating === n ? (SESSION_COLOURS[sessionEntry.sessionName] || '#555') : '#111',
                  border: `1px solid ${rating === n ? (SESSION_COLOURS[sessionEntry.sessionName] || '#555') : '#333'}`,
                  borderRadius: 5, color: rating === n ? '#fff' : '#555',
                  fontSize: 13, fontFamily: 'var(--font)', cursor: 'pointer',
                }}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Reflection */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: '#555', letterSpacing: '0.08em', marginBottom: 6 }}>REFLECTION</div>
          <input type="text" placeholder="felt great, tired, sore…" value={reflection}
            onChange={(e) => setReflection(e.target.value)} style={inputStyle} />
        </div>

        {/* Habits */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: '#555', letterSpacing: '0.08em', marginBottom: 8 }}>HABITS</div>
          <div style={{ display: 'flex', gap: 16 }}>
            {HABIT_CONFIG.map(({ key, label, colour }) => {
              const done = habits[key] || false;
              return (
                <button key={key} onClick={() => setHabits((h) => ({ ...h, [key]: !h[key] }))}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" fill={done ? colour : 'none'} stroke={done ? colour : '#333'} strokeWidth="1.5" />
                  </svg>
                  {label && <span style={{ fontSize: 9, color: '#444' }}>{label}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bodyweight */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 10, color: '#555', letterSpacing: '0.08em', marginBottom: 6 }}>BODYWEIGHT (KG)</div>
          <input type="number" step="0.1" min="40" max="150" placeholder="69.2"
            value={bodyweight} onChange={(e) => setBodyweight(e.target.value)} style={{ ...inputStyle, width: 120 }} />
        </div>

        {/* Save */}
        <button onClick={handleSave} style={{
          width: '100%', background: '#E8634A', border: 'none', borderRadius: 8,
          color: '#fff', fontSize: 13, fontFamily: 'var(--font)', fontWeight: 700,
          letterSpacing: '0.08em', padding: '13px 0', cursor: 'pointer',
        }}>
          SAVE
        </button>
      </div>
    </>
  );
}
```

- [ ] **Step 4: Add Calendar tab to `App.jsx`**

```jsx
import Calendar from './screens/Calendar';

// Add to TABS array (after PROGRAMME):
{
  id: 'calendar',
  label: 'CAL',
  icon: (active) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="3" y="4" width="14" height="13" rx="1.5" stroke={active ? '#e8e8e8' : '#555'} strokeWidth="1.5" />
      <line x1="3" y1="8" x2="17" y2="8" stroke={active ? '#e8e8e8' : '#555'} strokeWidth="1.5" />
      <line x1="7" y1="2" x2="7" y2="6" stroke={active ? '#e8e8e8' : '#555'} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="13" y1="2" x2="13" y2="6" stroke={active ? '#e8e8e8' : '#555'} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="7" cy="12" r="1" fill={active ? '#e8e8e8' : '#555'} />
      <circle cx="10" cy="12" r="1" fill={active ? '#e8e8e8' : '#555'} />
      <circle cx="13" cy="12" r="1" fill={active ? '#e8e8e8' : '#555'} />
    </svg>
  ),
},

// In the render content area, add:
{activeTab === 'calendar' && <Calendar />}
```

- [ ] **Step 5: Verify**

4 tabs visible. CAL tab shows April, May, June 2026 calendars. Days with sessions show coloured tint. Tapping a day opens the edit modal. Saving persists to localStorage.

---

## Task 9: Dashboard Muscle Illustration — Front/Back Flip + Text Breakdown

**Files:**
- Modify: `app/src/screens/Dashboard.jsx`
- Create: `app/src/components/MuscleIllustrationBack.jsx`

- [ ] **Step 1: Create `MuscleIllustrationBack.jsx` — back view SVG**

The back view shows: Traps, Lats/Upper Back, Rear Delts, Glutes, Hamstrings, Calves. Use the same `getMuscleColor` prop pattern:

```jsx
export default function MuscleIllustrationBack({ weeklyVolume = {}, volumeTargets = {}, sessionVolume = {}, sessionTargets = {}, mode = 'weekly', size = 160 }) {
  function getMuscleColor(muscleKey) {
    const vol = mode === 'session' ? sessionVolume : weeklyVolume;
    const targets = mode === 'session' ? sessionTargets : volumeTargets;
    const sets = vol[muscleKey] || 0;
    const target = targets[muscleKey] || 10;
    if (sets === 0) return '#1e1e1e';
    const ratio = sets / target;
    if (ratio < 0.5) return '#4a5a3a';
    if (ratio < 1.0) return '#c8b400';
    if (ratio < 1.2) return '#5BBD72';
    return '#F0A500';
  }

  return (
    <svg width={size} height={size * 1.6} viewBox="0 0 200 320" style={{ display: 'block' }}>
      {/* Head (back of head) */}
      <ellipse cx="100" cy="30" rx="22" ry="26" fill="#1e1e1e" stroke="#3a3a3a" strokeWidth="1" />
      {/* Neck */}
      <rect x="91" y="54" width="18" height="14" rx="4" fill="#1e1e1e" />

      {/* Traps — upper back, trapezoid shape */}
      <path d="M74 68 Q100 62 126 68 L130 90 Q100 82 70 90Z"
        fill={getMuscleColor('Traps')} stroke="#111" strokeWidth="0.5" />

      {/* Left Rear Delt */}
      <ellipse cx="58" cy="88" rx="15" ry="18"
        fill={getMuscleColor('Rear Delts')} stroke="#111" strokeWidth="0.5" />
      {/* Right Rear Delt */}
      <ellipse cx="142" cy="88" rx="15" ry="18"
        fill={getMuscleColor('Rear Delts')} stroke="#111" strokeWidth="0.5" />

      {/* Upper Back / Lats — large back muscles */}
      {/* Left Lat */}
      <path d="M70 90 Q60 110 62 145 Q66 160 76 158 Q84 148 82 130 Q82 110 76 92Z"
        fill={getMuscleColor('Upper Back / Lats')} stroke="#111" strokeWidth="0.5" />
      {/* Right Lat */}
      <path d="M130 90 Q140 110 138 145 Q134 160 124 158 Q116 148 118 130 Q118 110 124 92Z"
        fill={getMuscleColor('Upper Back / Lats')} stroke="#111" strokeWidth="0.5" />
      {/* Mid Back between lats */}
      <path d="M76 90 Q100 86 124 90 L122 150 Q100 156 78 150Z"
        fill={getMuscleColor('Upper Back / Lats')} stroke="#111" strokeWidth="0.5" />

      {/* Left Triceps (back visible) */}
      <path d="M46 108 Q40 130 42 155 Q46 166 54 163 Q58 148 56 128 Q53 114 49 106Z"
        fill={getMuscleColor('Triceps')} stroke="#111" strokeWidth="0.5" />
      {/* Right Triceps */}
      <path d="M154 108 Q160 130 158 155 Q154 166 146 163 Q142 148 144 128 Q147 114 151 106Z"
        fill={getMuscleColor('Triceps')} stroke="#111" strokeWidth="0.5" />

      {/* Left Forearm */}
      <path d="M42 163 Q38 180 40 196 Q44 204 52 200 Q55 184 54 163Z"
        fill="#1e1e1e" stroke="#3a3a3a" strokeWidth="0.5" />
      {/* Right Forearm */}
      <path d="M158 163 Q162 180 160 196 Q156 204 148 200 Q145 184 146 163Z"
        fill="#1e1e1e" stroke="#3a3a3a" strokeWidth="0.5" />

      {/* Lower Back / Erectors */}
      <path d="M82 152 Q100 148 118 152 L116 186 Q100 190 84 186Z"
        fill="#2a2a2a" stroke="#111" strokeWidth="0.5" />

      {/* Glutes */}
      {/* Left glute */}
      <path d="M74 188 Q68 206 70 228 Q74 242 84 244 Q90 236 88 216 Q87 198 82 188Z"
        fill={getMuscleColor('Glutes')} stroke="#111" strokeWidth="0.5" />
      {/* Right glute */}
      <path d="M126 188 Q132 206 130 228 Q126 242 116 244 Q110 236 112 216 Q113 198 118 188Z"
        fill={getMuscleColor('Glutes')} stroke="#111" strokeWidth="0.5" />
      {/* Glute split */}
      <line x1="100" y1="188" x2="100" y2="244" stroke="#111" strokeWidth="0.5" />

      {/* Hamstrings */}
      {/* Left hamstring */}
      <path d="M72 246 Q68 268 70 292 Q74 304 82 300 Q86 284 84 262 Q83 248 78 246Z"
        fill={getMuscleColor('Hamstrings')} stroke="#111" strokeWidth="0.5" />
      {/* Right hamstring */}
      <path d="M128 246 Q132 268 130 292 Q126 304 118 300 Q114 284 116 262 Q117 248 122 246Z"
        fill={getMuscleColor('Hamstrings')} stroke="#111" strokeWidth="0.5" />

      {/* Knees (back) */}
      <ellipse cx="80" cy="304" rx="10" ry="7" fill="#1e1e1e" stroke="#3a3a3a" strokeWidth="0.5" />
      <ellipse cx="120" cy="304" rx="10" ry="7" fill="#1e1e1e" stroke="#3a3a3a" strokeWidth="0.5" />

      {/* Calves */}
      {/* Left calf */}
      <path d="M72 312 Q68 326 70 338 Q74 342 80 338 Q84 326 82 312Z"
        fill={getMuscleColor('Calves')} stroke="#111" strokeWidth="0.5" />
      {/* Right calf */}
      <path d="M128 312 Q132 326 130 338 Q126 342 120 338 Q116 326 118 312Z"
        fill={getMuscleColor('Calves')} stroke="#111" strokeWidth="0.5" />
    </svg>
  );
}
```

- [ ] **Step 2: Add front/back toggle to Dashboard muscle section**

In Dashboard.jsx, add state:

```jsx
const [muscleView, setMuscleView] = useState('front'); // 'front' | 'back'
```

Update the muscle section:

```jsx
{/* ── Muscle Volume ── */}
<div style={{ padding: '16px', background: '#1a1a1a', borderRadius: 12, border: '1px solid #2a2a2a' }}>
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
    <div style={{ fontSize: 11, letterSpacing: '2px', color: '#666' }}>WEEKLY MUSCLE VOLUME</div>
    <button
      onClick={() => setMuscleView((v) => v === 'front' ? 'back' : 'front')}
      style={{
        background: '#222', border: '1px solid #2a2a2a', borderRadius: 12,
        color: '#888', fontSize: 10, fontFamily: 'var(--font)',
        letterSpacing: '0.08em', padding: '3px 10px', cursor: 'pointer',
      }}
    >
      {muscleView === 'front' ? 'FRONT ↺' : 'BACK ↺'}
    </button>
  </div>
  <div style={{ display: 'flex', justifyContent: 'center' }}>
    {muscleView === 'front'
      ? <MuscleIllustration size={140} weeklyVolume={weeklyVolume} volumeTargets={volumeTargets} />
      : <MuscleIllustrationBack size={140} weeklyVolume={weeklyVolume} volumeTargets={volumeTargets} />
    }
  </div>
  <div style={{ textAlign: 'center', fontSize: 10, color: '#444', marginTop: 8, marginBottom: 14 }}>
    {muscleView === 'front' ? 'front view' : 'back view'} · resets Monday
  </div>
  {/* Text breakdown */}
  <MuscleBreakdown weeklyVolume={weeklyVolume} volumeTargets={volumeTargets} />
</div>
```

- [ ] **Step 3: Add `MuscleBreakdown` component**

```jsx
function MuscleBreakdown({ weeklyVolume, volumeTargets }) {
  const MUSCLE_ORDER = [
    'Chest', 'Upper Chest', 'Front Delts', 'Side Delts', 'Rear Delts',
    'Triceps', 'Biceps', 'Traps', 'Upper Back / Lats',
    'Abs', 'Obliques',
    'Quads', 'Hamstrings', 'Glutes', 'Calves',
  ];

  const entries = MUSCLE_ORDER
    .map((m) => ({ muscle: m, sets: Math.round((weeklyVolume[m] || 0) * 10) / 10, target: volumeTargets[m] || 10 }))
    .filter((e) => e.sets > 0 || e.target > 0);

  if (entries.length === 0) return null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 16px' }}>
      {entries.map(({ muscle, sets, target }) => (
        <div key={muscle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 10, color: '#555' }}>{muscle}</span>
          <span style={{ fontSize: 10, color: sets >= target ? '#5BBD72' : sets > 0 ? '#c8b400' : '#333', fontWeight: 700 }}>
            {sets}/{target}
          </span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Import MuscleIllustrationBack in Dashboard**

```jsx
import MuscleIllustrationBack from '../components/MuscleIllustrationBack';
```

- [ ] **Step 5: Verify**

Dashboard shows WEEKLY MUSCLE VOLUME with FRONT ↺ button. Tap to flip to back view. Text breakdown shows set counts per muscle group.

---

## Task 10: SVG Muscle Illustration Polish (Match Reference Image)

**Files:**
- Modify: `app/src/components/MuscleIllustration.jsx`

The reference image shows: bold outlines on a white background (dark theme inverted), realistic muscle separation — individual pec heads (upper/lower), clear serratus anterior, detailed deltoid heads, biceps/triceps with visible separation, 6-pack abs with clear linea alba and 3 horizontal divisions, VMO teardrop quads. The current SVG is too simple. This task does a full SVG rewrite to closely match the reference.

Key observations from reference image:
- **Body outline** is a single bold outer contour with thick strokes
- **Chest**: Two distinct pec masses with a central notch/sternal line, parallel lines in upper chest indicating clavicular head
- **Abs**: 6-pack with clear 3 horizontal and 1 vertical division, lower abs showing hip flexor region
- **Shoulders**: Round deltoid cap clearly separated from biceps
- **Arms**: Biceps peak visible, triceps horseshoe visible from front
- **Serratus anterior**: Diagonal finger-like projections along ribcage
- **Obliques**: Fan-shaped wrap around from abs to lower ribs
- **Quads**: VMO teardrop clearly visible at knee
- **Overall**: Bold 2px+ strokes, shapes are more anatomically proportioned

- [ ] **Step 1: Rewrite `MuscleIllustration.jsx` with production SVG**

Replace the entire SVG content (keeping `getMuscleColor` function and props interface unchanged) with a more anatomically accurate version. Key changes:
- Stroke weight: `strokeWidth="1.5"` on muscle borders, `strokeWidth="2.5"` on body outline
- Shoulder deltoid as single rounded cap, not just an ellipse
- Chest as two separate rounded-quadrilateral paths with sternal notch
- Serratus anterior as 3 small curved wedges on each side
- Obliques as angled fan shapes below serratus
- Thicker arm paths with better proportions
- Inner lines (abs grid, chest separation) using `stroke="#11111188"` at 1px
- Overall figure scaled to fill `200×320` viewBox with better proportions (head smaller, torso wider, legs fuller)

```jsx
export default function MuscleIllustration({
  weeklyVolume = {},
  volumeTargets = {},
  sessionVolume = {},
  sessionTargets = {},
  mode = 'weekly',
  size = 160,
}) {
  function getMuscleColor(muscleKey) {
    const vol = mode === 'session' ? sessionVolume : weeklyVolume;
    const targets = mode === 'session' ? sessionTargets : volumeTargets;
    const sets = vol[muscleKey] || 0;
    const target = targets[muscleKey] || 10;
    if (sets === 0) return '#1e1e1e';
    const ratio = sets / target;
    if (ratio < 0.5) return '#4a5a3a';
    if (ratio < 1.0) return '#c8b400';
    if (ratio < 1.2) return '#5BBD72';
    return '#F0A500';
  }

  const S = { stroke: '#111', strokeWidth: '1', strokeLinejoin: 'round' };

  return (
    <svg width={size} height={size * 1.6} viewBox="0 0 200 320" style={{ display: 'block' }}>
      {/* ── HEAD ── */}
      <ellipse cx="100" cy="28" rx="20" ry="24" fill="#252525" stroke="#444" strokeWidth="1.5" />
      {/* Neck */}
      <path d="M92 50 L92 64 Q100 66 108 64 L108 50 Q100 52 92 50Z" fill="#252525" stroke="#333" strokeWidth="1" />

      {/* ── TRAPS ── */}
      <path d="M74 66 Q87 60 100 58 Q113 60 126 66 L128 76 Q114 72 100 70 Q86 72 72 76Z"
        fill={getMuscleColor('Traps')} {...S} />

      {/* ── SHOULDER CAPS (Side + Front Delts) ── */}
      {/* Left shoulder */}
      <path d="M72 76 Q56 80 50 98 Q48 112 56 120 Q64 126 72 118 Q76 108 76 94 Q76 82 74 76Z"
        fill={getMuscleColor('Side Delts')} {...S} />
      {/* Front delt overlay (left) */}
      <path d="M72 76 Q66 80 64 92 Q64 104 70 110 Q76 108 76 94 Q76 82 74 76Z"
        fill={getMuscleColor('Front Delts')} {...S} />
      {/* Right shoulder */}
      <path d="M128 76 Q144 80 150 98 Q152 112 144 120 Q136 126 128 118 Q124 108 124 94 Q124 82 126 76Z"
        fill={getMuscleColor('Side Delts')} {...S} />
      {/* Front delt overlay (right) */}
      <path d="M128 76 Q134 80 136 92 Q136 104 130 110 Q124 108 124 94 Q124 82 126 76Z"
        fill={getMuscleColor('Front Delts')} {...S} />

      {/* ── UPPER CHEST ── */}
      {/* Left pec upper */}
      <path d="M76 80 Q88 76 100 76 L100 100 Q88 104 78 100Z"
        fill={getMuscleColor('Upper Chest')} {...S} />
      {/* Right pec upper */}
      <path d="M100 76 Q112 76 124 80 L122 100 Q112 104 100 100Z"
        fill={getMuscleColor('Upper Chest')} {...S} />

      {/* ── CHEST (lower pec) ── */}
      {/* Left pec lower */}
      <path d="M78 100 Q89 104 100 100 L100 126 Q90 132 80 126 Q76 118 76 108Z"
        fill={getMuscleColor('Chest')} {...S} />
      {/* Right pec lower */}
      <path d="M100 100 Q111 104 122 100 L124 126 Q120 132 110 132 Q100 128 100 126Z"
        fill={getMuscleColor('Chest')} {...S} />
      {/* Sternal line */}
      <line x1="100" y1="76" x2="100" y2="126" stroke="#111" strokeWidth="1" />
      {/* Chest detail lines (clavicular head) */}
      <path d="M80 84 Q90 82 98 83" stroke="#111111aa" strokeWidth="0.8" fill="none" />
      <path d="M120 84 Q110 82 102 83" stroke="#111111aa" strokeWidth="0.8" fill="none" />

      {/* ── SERRATUS ANTERIOR ── */}
      {/* Left serratus — 3 finger projections */}
      <path d="M76 108 Q70 112 72 118" stroke={getMuscleColor('Chest')} strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M76 116 Q69 120 70 128" stroke={getMuscleColor('Chest')} strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d="M76 124 Q70 130 72 138" stroke={getMuscleColor('Abs')} strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Right serratus */}
      <path d="M124 108 Q130 112 128 118" stroke={getMuscleColor('Chest')} strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M124 116 Q131 120 130 128" stroke={getMuscleColor('Chest')} strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d="M124 124 Q130 130 128 138" stroke={getMuscleColor('Abs')} strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* ── LATS (front visible) ── */}
      <path d="M70 106 Q60 122 62 148 Q66 158 76 154 Q78 140 78 126 Q78 112 74 106Z"
        fill={getMuscleColor('Upper Back / Lats')} {...S} />
      <path d="M130 106 Q140 122 138 148 Q134 158 124 154 Q122 140 122 126 Q122 112 126 106Z"
        fill={getMuscleColor('Upper Back / Lats')} {...S} />

      {/* ── BICEPS ── */}
      <path d="M56 118 Q48 136 50 158 Q54 168 62 166 Q68 152 66 132 Q63 122 58 116Z"
        fill={getMuscleColor('Biceps')} {...S} />
      <path d="M144 118 Q152 136 150 158 Q146 168 138 166 Q132 152 134 132 Q137 122 142 116Z"
        fill={getMuscleColor('Biceps')} {...S} />

      {/* ── TRICEPS ── */}
      <path d="M50 158 Q46 176 48 192 Q52 202 60 198 Q64 182 62 166Z"
        fill={getMuscleColor('Triceps')} {...S} />
      <path d="M150 158 Q154 176 152 192 Q148 202 140 198 Q136 182 138 166Z"
        fill={getMuscleColor('Triceps')} {...S} />

      {/* ── FOREARMS ── */}
      <path d="M48 192 Q44 210 46 224 Q50 232 58 228 Q62 212 60 198Z"
        fill="#252525" stroke="#3a3a3a" strokeWidth="0.8" />
      <path d="M152 192 Q156 210 154 224 Q150 232 142 228 Q138 212 140 198Z"
        fill="#252525" stroke="#3a3a3a" strokeWidth="0.8" />

      {/* ── ABS ── */}
      {/* Left ab column */}
      <rect x="83" y="128" width="15" height="48" rx="3"
        fill={getMuscleColor('Abs')} {...S} />
      {/* Right ab column */}
      <rect x="102" y="128" width="15" height="48" rx="3"
        fill={getMuscleColor('Abs')} {...S} />
      {/* Horizontal tendon lines */}
      <line x1="83" y1="144" x2="117" y2="144" stroke="#111" strokeWidth="1" />
      <line x1="83" y1="160" x2="117" y2="160" stroke="#111" strokeWidth="1" />
      <line x1="85" y1="176" x2="115" y2="176" stroke="#111" strokeWidth="1" />

      {/* ── OBLIQUES ── */}
      <path d="M79 132 Q72 148 72 166 Q74 178 83 180 L83 176 L83 128Z"
        fill={getMuscleColor('Obliques')} {...S} />
      <path d="M121 132 Q128 148 128 166 Q126 178 117 180 L117 176 L117 128Z"
        fill={getMuscleColor('Obliques')} {...S} />

      {/* ── LOWER ABS / HIP FLEXORS ── */}
      <path d="M83 176 L100 176 L117 176 L114 194 Q100 200 86 194Z"
        fill={getMuscleColor('Abs')} {...S} />
      <line x1="100" y1="176" x2="100" y2="194" stroke="#111" strokeWidth="1" />

      {/* ── QUADS ── */}
      {/* Left quad — outer sweep */}
      <path d="M76 196 Q66 218 68 258 Q70 272 80 278 Q84 268 84 250 Q86 226 82 200Z"
        fill={getMuscleColor('Quads')} {...S} />
      {/* Left quad — inner head */}
      <path d="M86 200 Q84 226 84 250 Q84 264 90 272 Q96 272 98 262 Q100 244 98 218 Q96 204 90 198Z"
        fill={getMuscleColor('Quads')} {...S} />
      {/* Right quad — outer */}
      <path d="M124 196 Q134 218 132 258 Q130 272 120 278 Q116 268 116 250 Q114 226 118 200Z"
        fill={getMuscleColor('Quads')} {...S} />
      {/* Right quad — inner head */}
      <path d="M114 200 Q116 226 116 250 Q116 264 110 272 Q104 272 102 262 Q100 244 102 218 Q104 204 110 198Z"
        fill={getMuscleColor('Quads')} {...S} />
      {/* VMO teardrop — left */}
      <ellipse cx="84" cy="278" rx="9" ry="6"
        fill={getMuscleColor('Quads')} {...S} />
      {/* VMO teardrop — right */}
      <ellipse cx="116" cy="278" rx="9" ry="6"
        fill={getMuscleColor('Quads')} {...S} />

      {/* ── KNEES ── */}
      <ellipse cx="83" cy="286" rx="11" ry="7" fill="#252525" stroke="#3a3a3a" strokeWidth="0.8" />
      <ellipse cx="117" cy="286" rx="11" ry="7" fill="#252525" stroke="#3a3a3a" strokeWidth="0.8" />

      {/* ── CALVES ── */}
      <path d="M74 294 Q68 312 70 328 Q74 334 82 330 Q84 314 82 294Z"
        fill={getMuscleColor('Calves')} {...S} />
      <path d="M126 294 Q132 312 130 328 Q126 334 118 330 Q116 314 118 294Z"
        fill={getMuscleColor('Calves')} {...S} />

      {/* ── OUTER BODY CONTOUR (bold overlay) ── */}
      <path d="M74 66 Q56 70 46 90 Q36 116 38 158 Q40 190 42 220 Q44 240 48 280 Q54 308 68 328 Q74 334 82 330 Q84 308 80 286 Q76 268 76 250 Q74 226 76 196 L86 194 L100 200 L114 194 L124 196 Q126 226 124 250 Q124 268 120 286 Q116 308 118 330 Q126 334 132 328 Q146 308 152 280 Q156 240 158 220 Q160 190 162 158 Q164 116 154 90 Q144 70 126 66 Q114 60 100 58 Q86 60 74 66Z"
        fill="none" stroke="#444" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
```

- [ ] **Step 2: Visual review**

Open the app, go to Dashboard. Compare front illustration against reference image. Key checkpoints:
- Bold outer body contour visible
- Two distinct chest masses with sternal separation
- Serratus projections visible on ribcage sides
- Clear 6-pack with horizontal divisions
- Obliques wrap around outside of abs
- VMO teardrops clearly visible at knees
- Proportions: torso wide, legs clearly separated

- [ ] **Step 3: Refinement round if needed**

If the illustration still doesn't match well, adjust specific paths. Common fixes:
- Chest too narrow: increase `rx` on pec paths
- Abs not centred: adjust x coordinates of `rect` elements
- Serratus not visible: increase strokeWidth to 5-6
- Legs merge together: add gap between quad paths at top by adjusting the `196` y-coordinate starting points to `82 L118` divergence point

---

## Task 11: Polish Round

**Files:**
- Modify: `app/src/screens/Dashboard.jsx`
- Modify: `app/src/screens/SessionScreen.jsx`
- Modify: `app/src/App.jsx`
- Modify: `app/src/index.css`

- [ ] **Step 1: Dashboard — fix CHANGE button to show session picker grid**

Currently CHANGE increments by 1. Per spec, it should reveal a 2×3 grid of all 6 session tiles. Replace `handleChange`:

```jsx
const [showSessionPicker, setShowSessionPicker] = useState(false);

// Replace CHANGE button:
<button onClick={() => setShowSessionPicker((v) => !v)} style={{ ... }}>
  CHANGE {showSessionPicker ? '▾' : '▸'}
</button>

// Below the next session card when showSessionPicker:
{showSessionPicker && (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
    {DAYS.map((session, i) => (
      <button key={session.name} onClick={() => {
        setNextIdx(i);
        setNextSessionIndex(i);
        setShowSessionPicker(false);
      }} style={{
        background: `${session.colour}18`,
        border: `1px solid ${session.colour}44`,
        borderRadius: 8, padding: '10px 12px',
        color: session.colour, fontSize: 12,
        fontFamily: 'var(--font)', fontWeight: 700,
        letterSpacing: '0.06em', cursor: 'pointer',
        textAlign: 'left',
      }}>
        {session.name}
        <div style={{ fontSize: 10, color: '#666', fontWeight: 400, marginTop: 2 }}>
          {session.exercises.length} exercises
        </div>
      </button>
    ))}
  </div>
)}
```

- [ ] **Step 2: Session — add exercise count progress to header**

In the sticky session header, show "2 / 6 exercises" below the session name:

```jsx
// Compute completedExercises:
const completedExercises = setsPerExercise.filter((sets) =>
  sets.some((s) => s.reps !== '' && s.reps !== undefined && parseInt(s.reps) > 0)
).length;

// In header subtitle:
<div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>
  {session.subtitle} · {completedExercises}/{exercises.length}
</div>
```

- [ ] **Step 3: Session — persist in-progress state to localStorage**

If user closes app mid-session, restore on reopen. Add to storage.js:

```js
const KEYS = {
  // ... existing keys
  ACTIVE_SESSION: 'cf_active_session',
};

export function saveActiveSession(data) {
  if (data === null) {
    localStorage.removeItem(KEYS.ACTIVE_SESSION);
  } else {
    set(KEYS.ACTIVE_SESSION, data);
  }
}

export function getActiveSession() {
  return get(KEYS.ACTIVE_SESSION, null);
}
```

In `SessionScreen`, persist `setsPerExercise` on every change:

```jsx
useEffect(() => {
  saveActiveSession({
    sessionName: session.name,
    sessionIndex,
    setsPerExercise,
  });
}, [setsPerExercise, session.name, sessionIndex]);
```

In `App.jsx`, on mount check for active session and restore:

```jsx
const [activeSession, setActiveSession] = useState(() => {
  const saved = getActiveSession();
  if (saved) {
    const sessionDef = DAYS[saved.sessionIndex];
    return sessionDef || null;
  }
  return null;
});
```

- [ ] **Step 4: Global CSS — input number spinners, tap highlight, scroll smoothing**

In `index.css`:

```css
/* Remove number input spinners */
input[type='number']::-webkit-outer-spin-button,
input[type='number']::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type='number'] { -moz-appearance: textfield; }

/* Remove tap highlight on mobile */
* { -webkit-tap-highlight-color: transparent; }

/* Smooth scroll */
html { scroll-behavior: smooth; }

/* Better focus */
input:focus, button:focus { outline: none; }
```

- [ ] **Step 5: Dashboard — minimum touch targets audit**

Ensure all interactive elements are at least 44×44px. Check:
- Habit dot buttons: add `padding: 8px` and `minWidth: 40px; minHeight: 40px`
- PR Book + PR buttons: add `padding: 6px 10px` and `minHeight: 36px`
- Session card START/CHANGE buttons: already `padding: 10px 24px` — OK

- [ ] **Step 6: Keyboard handling — blur inputs on Enter**

In `SetRow`, add `onKeyDown` to weight and reps inputs:

```jsx
onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
```

- [ ] **Step 7: Final check — run through all 4 tabs, start a session, log sets, complete**

- Dashboard: header, next session card, this week strip, habits, muscle illustration all look correct
- PR Book: no 12-week targets, PUSH/PULL/LEGS sections present, add PR works
- Programme: read-only reference, collapsible sections
- Calendar: 3 months visible, tap day opens modal, save persists
- Session: start session, per-set logging, PR sheet, muscle chip, complete with rating

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| Calendar tab (3 months, day edit modal) | Task 8 |
| Third habit = private, red, unlabelled | Task 2 |
| Per-set weight/reps/note logging | Task 3 |
| Rest timer auto-start on set completion | Task 3 |
| PR detection per set | Task 3 |
| In-session muscle illustration (collapsible chip) | Task 6 |
| PR bottom sheet from session | Task 4 |
| Remove 12-week targets | Task 5 |
| Rolling session cycle (already exists, CHANGE fixed) | Task 11 |
| Exercise reorder / substitute / custom add | Task 7 |
| Dashboard illustration front/back flip | Task 9 |
| Muscle text breakdown on dashboard | Task 9 |
| SVG illustration polish to match reference | Task 10 |
| Session in-progress persistence | Task 11 |
| dailyLog `private` key + `reflection` field | Task 1 + 8 |
| sessionLog per-set data model | Task 1 + 3 |

**Dependency order for parallel execution:**
- **Must run first:** Task 1 (data model)
- **Can run in parallel after Task 1:** Tasks 2, 3, 5, 8, 9, 10
- **Depends on Task 3:** Task 4, 6, 7
- **Must run last:** Task 11 (polish, depends on all above)
