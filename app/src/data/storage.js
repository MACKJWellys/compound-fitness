import { PR_SEED } from './prSeed';
import { MUSCLE_MAPPINGS, VOLUME_TARGETS_DEFAULT } from './muscleMappings';

const KEYS = {
  SESSION_LOG: 'cf_session_log',
  DAILY_LOG: 'cf_daily_log',
  PR_BOOK: 'cf_pr_book',
  NEXT_SESSION: 'cf_next_session',
  VOLUME_TARGETS: 'cf_volume_targets',
  ACTIVE_SESSION: 'cf_active_session',
};

function get(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

function set(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Session log: [{id, date, sessionName, sessionIndex, exercises:[{name,setsLogged,notes}], rating, note, completedAt}]
export function getSessionLog() {
  return get(KEYS.SESSION_LOG, []);
}

export function saveSession(entry) {
  const log = getSessionLog();
  log.push({ ...entry, id: Date.now() });
  set(KEYS.SESSION_LOG, log);
}

// Update rating on an existing session entry by date
export function updateSessionRating(dateStr, rating) {
  const log = getSessionLog();
  const entry = log.find((s) => (s.date || '').slice(0, 10) === dateStr);
  if (entry) {
    entry.rating = rating;
    set(KEYS.SESSION_LOG, log);
  }
}

// Overwrite an existing session entry by id
export function updateSession(id, updatedEntry) {
  const log = getSessionLog();
  const idx = log.findIndex((s) => s.id === id);
  if (idx !== -1) {
    log[idx] = updatedEntry;
    set(KEYS.SESSION_LOG, log);
  }
}

// Move a session entry to a different date
export function updateSessionDate(id, newDateStr) {
  const log = getSessionLog();
  const entry = log.find((s) => s.id === id);
  if (entry) {
    entry.date = newDateStr;
    set(KEYS.SESSION_LOG, log);
  }
}

export function deleteSession(id) {
  const log = getSessionLog();
  set(
    KEYS.SESSION_LOG,
    log.filter((session) => session.id !== id)
  );
}

// Daily log: { [dateStr 'YYYY-MM-DD']: { weight: number|null, habits: {sauna:bool, protein:bool, private:bool}, reflection: string } }
export function getDailyLog() {
  return get(KEYS.DAILY_LOG, {});
}

export function saveDailyEntry(dateStr, data) {
  const log = getDailyLog();
  log[dateStr] = { ...log[dateStr], ...data };
  set(KEYS.DAILY_LOG, log);
}

export function getDayEntry(dateStr) {
  const log = getDailyLog();
  return log[dateStr] || { weight: null, habits: { sauna: false, protein: false, private: false }, reflection: '' };
}

// PR Book
export function getPRBook() {
  const stored = get(KEYS.PR_BOOK, null);
  if (!stored) {
    // Deep clone seed
    const seeded = JSON.parse(JSON.stringify(PR_SEED));
    set(KEYS.PR_BOOK, seeded);
    return seeded;
  }
  return stored;
}

export function addPREntry(exerciseName, repCount, weight, date) {
  const book = getPRBook();
  if (!book[exerciseName]) book[exerciseName] = {};
  const repKey = String(repCount);
  if (!book[exerciseName][repKey]) book[exerciseName][repKey] = [];
  book[exerciseName][repKey].push({ weight, date });
  set(KEYS.PR_BOOK, book);
}

// Next session index (0-5 cycling through Push A/Pull A/Legs A/Push B/Pull B/Legs B)
export function getNextSessionIndex() {
  return get(KEYS.NEXT_SESSION, 0);
}

export function setNextSessionIndex(i) {
  set(KEYS.NEXT_SESSION, i % 6);
}

export function advanceNextSession() {
  const current = getNextSessionIndex();
  setNextSessionIndex((current + 1) % 6);
}

// Volume targets
export function getVolumeTargets() {
  return get(KEYS.VOLUME_TARGETS, VOLUME_TARGETS_DEFAULT);
}

// Weekly volume aggregation
// Returns { [muscleGroup]: number }
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
          setsLogged = ex.sets.filter((s) => {
            const r = parseInt(s.reps);
            return !isNaN(r) && r > 0;
          }).length;
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

// Returns { volume: { [muscleGroup]: number }, targets: { [muscleGroup]: number } }
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
    // Accumulate logged (count sets where reps > 0, or weight=0 and reps > 0 for bodyweight)
    const loggedSets = (ex.sets || []).filter((s) => {
      const r = parseInt(s.reps);
      return !isNaN(r) && r > 0;
    }).length;
    mapping.primary.forEach((m) => {
      volume[m] = (volume[m] || 0) + loggedSets;
    });
    mapping.secondary.forEach((m) => {
      volume[m] = (volume[m] || 0) + loggedSets * 0.5;
    });
  });
  return { volume, targets };
}

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

// Exercise history: returns all past session entries containing a given exercise, newest first
export function getExerciseHistory(exerciseName) {
  const log = getSessionLog();
  const results = [];
  for (let i = log.length - 1; i >= 0; i--) {
    const session = log[i];
    const match = (session.exercises || []).find((ex) => ex.name === exerciseName);
    if (match) {
      results.push({
        date: session.date,
        sessionName: session.sessionName,
        rating: session.rating,
        note: session.note,
        sets: match.sets || [],
      });
    }
  }
  return results;
}

// ── Export / Import ──

export function exportAllData() {
  const data = {};
  Object.values(KEYS).forEach((key) => {
    const raw = localStorage.getItem(key);
    if (raw !== null) data[key] = raw;
  });
  return JSON.stringify(data);
}

export function importAllData(jsonString) {
  const data = JSON.parse(jsonString);
  // Validate: must be an object with only cf_ keys
  if (typeof data !== 'object' || data === null) throw new Error('Invalid backup format');
  const validKeys = new Set(Object.values(KEYS));
  Object.entries(data).forEach(([key, value]) => {
    if (!validKeys.has(key)) throw new Error(`Unknown key: ${key}`);
    if (typeof value !== 'string') throw new Error(`Invalid value for ${key}`);
  });
  // All valid — write
  Object.entries(data).forEach(([key, value]) => {
    localStorage.setItem(key, value);
  });
}
