import { useState, useCallback, useEffect, useRef } from 'react';
import { getPRBook, addPREntry, saveSession, advanceNextSession, getSessionVolume, getWeeklyVolume, getVolumeTargets, saveActiveSession, getActiveSession, updateSession, deleteSession, getExerciseHistory } from '../data/storage';
import { toDateStr } from '../utils/dateUtils';
import MuscleIllustration from '../components/MuscleIllustration';
import { DAYS } from '../data/programme';
import { MUSCLE_MAPPINGS } from '../data/muscleMappings';

// ── helpers ───────────────────────────────────────────────────────────────────

function parseMaxSets(setsStr) {
  if (!setsStr) return 5;
  const nums = String(setsStr).match(/\d+/g);
  if (!nums) return 5;
  return nums.reduce((a, b) => a + parseInt(b), 0);
}

// ── Keyframe injection ────────────────────────────────────────────────────────

const SESSION_KEYFRAMES = `@keyframes summaryDrain { from { width: 100%; } to { width: 0%; } }`;
let sessionKFInjected = false;
function ensureSessionKeyframes() {
  if (sessionKFInjected) return;
  const s = document.createElement('style');
  s.setAttribute('data-session-kf', '1');
  s.textContent = SESSION_KEYFRAMES;
  document.head.appendChild(s);
  sessionKFInjected = true;
}

function checkIsPR(exerciseName, reps, weight, prBook) {
  const repInt = parseInt(reps);
  const w = parseFloat(weight);
  if (!reps || isNaN(repInt) || repInt <= 0 || !weight || isNaN(w) || w <= 0) return false;
  const entries = ((prBook || {})[exerciseName] || {})[String(repInt)] || [];
  if (entries.length === 0) return true;
  const best = Math.max(...entries.map((e) => parseFloat(e.weight) || 0));
  return w > best;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function toMiddayIso(dateStr) {
  return new Date(`${dateStr}T12:00:00`).toISOString();
}

// ── Rest Timer Hook ───────────────────────────────────────────────────────────

function useRestTimer() {
  const [timerSeconds, setTimerSeconds] = useState(null);
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

// ── Set Row ───────────────────────────────────────────────────────────────────

function SetRow({ setNum, setData, colour, dimmed, onChange, isPR }) {
  const isLogged = setData.reps !== '' && setData.reps !== undefined && String(setData.reps).length > 0;

  // PR glow: flash when isPR transitions false → true
  const prevIsPRRef = useRef(false);
  const [glowing, setGlowing] = useState(false);
  useEffect(() => {
    if (isPR && !prevIsPRRef.current) {
      setGlowing(true);
      const t = setTimeout(() => setGlowing(false), 100);
      return () => clearTimeout(t);
    }
    prevIsPRRef.current = isPR;
  }, [isPR]);

  const inputBase = {
    background: '#222',
    border: '1px solid #2a2a2a',
    borderRadius: 4,
    color: dimmed ? '#333' : '#e8e8e8',
    fontSize: 13,
    fontFamily: 'var(--font)',
    padding: '5px 6px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '18px 64px 56px 1fr 28px',
      gap: 4,
      marginBottom: 4,
      alignItems: 'center',
      opacity: dimmed ? 0.35 : 1,
      borderRadius: 4,
      boxShadow: glowing ? '0 0 10px 3px #F0A50055' : 'none',
      transition: glowing ? 'none' : 'box-shadow 0.8s ease',
    }}>
      <div style={{ fontSize: 10, color: '#555', textAlign: 'right' }}>{setNum}</div>
      <input
        type="number"
        min="0"
        step="0.5"
        placeholder="—"
        value={setData.weight}
        onChange={(e) => onChange('weight', e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
        style={inputBase}
        disabled={dimmed}
        inputMode="decimal"
      />
      <input
        type="number"
        min="0"
        placeholder="—"
        value={setData.reps}
        onChange={(e) => onChange('reps', e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
        style={inputBase}
        disabled={dimmed}
        inputMode="numeric"
      />
      <input
        type="text"
        placeholder=""
        value={setData.note}
        onChange={(e) => onChange('note', e.target.value)}
        style={{ ...inputBase, fontSize: 11 }}
        disabled={dimmed}
      />
      <div style={{
        fontSize: isPR ? 8 : 12,
        color: isPR ? '#F0A500' : isLogged ? colour : '#2a2a2a',
        textAlign: 'center',
        fontWeight: isPR ? 700 : 400,
        letterSpacing: isPR ? '0.04em' : 0,
      }}>
        {isPR ? 'PR' : isLogged ? '✓' : '·'}
      </div>
    </div>
  );
}

// ── Exercise Card ─────────────────────────────────────────────────────────────

function ExerciseCard({ exercise, colour, sets, onSetsChange, prBook, onOpenPRSheet, onOpenHistory, onMoveUp, onMoveDown, onSubstitute, onStartTimer }) {
  const [noteExpanded, setNoteExpanded] = useState(false);
  const [snapping, setSnapping] = useState(false);
  const prevAllCompleteRef = useRef(false);

  const maxSets = parseMaxSets(exercise.sets);

  // Ensure sets array always has maxSets rows
  const ensuredSets = Array.from({ length: maxSets }, (_, i) =>
    sets[i] || { weight: '', reps: '', note: '' }
  );

  // Detect when all sets complete and trigger snap
  const allComplete = ensuredSets.length > 0 && ensuredSets.every((s) => {
    const r = parseInt(s.reps);
    return !isNaN(r) && r > 0;
  });
  useEffect(() => {
    if (allComplete && !prevAllCompleteRef.current) {
      setSnapping(true);
      const t = setTimeout(() => setSnapping(false), 120);
      return () => clearTimeout(t);
    }
    prevAllCompleteRef.current = allComplete;
  }, [allComplete]);

  function handleSetChange(setIdx, field, value) {
    const next = ensuredSets.map((s, i) => (i === setIdx ? { ...s, [field]: value } : s));
    onSetsChange(next);

    // Auto-start rest timer when reps is entered (and exercise has a rest time)
    if (field === 'reps' && value && exercise.restSeconds) {
      onStartTimer(exercise.restSeconds);
    }
  }

  const cardBg = exercise.priority ? `${colour}12` : '#1a1a1a';
  const cardBorder = snapping ? `1px solid ${colour}` : exercise.priority ? `1px solid ${colour}40` : '1px solid #2a2a2a';
  const cardShadow = snapping ? `0 0 14px 2px ${colour}44` : 'none';

  return (
    <div style={{
      background: cardBg,
      border: cardBorder,
      borderRadius: 10,
      padding: '14px 14px 12px',
      marginBottom: 10,
      boxShadow: cardShadow,
      transition: snapping ? 'none' : 'border 0.5s ease, box-shadow 0.5s ease',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
        <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setNoteExpanded((v) => !v)}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#e8e8e8', lineHeight: 1.3 }}>
            {exercise.name}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          {onMoveUp && (
            <button onClick={onMoveUp} style={{ background: 'none', border: '1px solid #2a2a2a', borderRadius: 3, color: '#555', fontSize: 11, padding: '2px 5px', cursor: 'pointer', lineHeight: 1, fontFamily: 'var(--font)' }}>↑</button>
          )}
          {onMoveDown && (
            <button onClick={onMoveDown} style={{ background: 'none', border: '1px solid #2a2a2a', borderRadius: 3, color: '#555', fontSize: 11, padding: '2px 5px', cursor: 'pointer', lineHeight: 1, fontFamily: 'var(--font)' }}>↓</button>
          )}
          {onSubstitute && (
            <button onClick={onSubstitute} style={{ background: 'none', border: '1px solid #2a2a2a', borderRadius: 3, color: '#555', fontSize: 9, padding: '2px 5px', cursor: 'pointer', letterSpacing: '0.04em', fontFamily: 'var(--font)' }}>SWAP</button>
          )}
          {exercise.priority && (
            <span style={{ background: colour, color: '#fff', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', borderRadius: 3, padding: '2px 6px' }}>KEY</span>
          )}
          {onOpenHistory && (
            <button
              onClick={() => onOpenHistory(exercise)}
              style={{ background: 'none', border: 'none', color: '#555', fontSize: 9, fontFamily: 'var(--font)', cursor: 'pointer', padding: '4px 6px', letterSpacing: '0.04em', minHeight: 32 }}
            >
              HIST
            </button>
          )}
          <button
            onClick={() => onOpenPRSheet(exercise)}
            style={{ background: 'none', border: 'none', color: '#555', fontSize: 11, fontFamily: 'var(--font)', cursor: 'pointer', padding: '4px 6px', letterSpacing: '0.04em', minHeight: 32 }}
          >
            PR ▸
          </button>
        </div>
      </div>

      {/* Subtitle */}
      <div style={{ fontSize: 11, color: '#555', marginBottom: 10 }}>
        {exercise.sets} sets × {exercise.reps}{exercise.rest ? ` · ${exercise.rest} rest` : ''}
      </div>

      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '18px 64px 56px 1fr 20px', gap: 4, marginBottom: 4 }}>
        {['#', 'KG', 'REPS', 'NOTE', ''].map((h, i) => (
          <div key={i} style={{ fontSize: 9, color: '#444', letterSpacing: '0.08em' }}>{h}</div>
        ))}
      </div>

      {/* Per-set rows */}
      {ensuredSets.map((s, i) => {
        // A row is dimmed (upcoming) if the previous row hasn't been logged yet
        const dimmed = i > 0 && !(
          String(ensuredSets[i - 1].reps).length > 0 && ensuredSets[i - 1].reps !== ''
        );
        const isPR = checkIsPR(exercise.name, s.reps, s.weight, prBook);
        return (
          <SetRow
            key={i}
            setNum={i + 1}
            setData={s}
            colour={colour}
            dimmed={dimmed}
            onChange={(field, val) => handleSetChange(i, field, val)}
            isPR={isPR}
          />
        );
      })}

      {/* Coaching note */}
      {noteExpanded && exercise.note && (
        <div style={{ marginTop: 10, fontSize: 12, color: '#666', lineHeight: 1.5, borderTop: '1px solid #2a2a2a', paddingTop: 10 }}>
          {exercise.note}
        </div>
      )}
    </div>
  );
}

// ── PR Bottom Sheet ───────────────────────────────────────────────────────────

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
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 150 }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#1a1a1a', borderTop: `2px solid ${colour}`,
        borderRadius: '16px 16px 0 0', zIndex: 160,
        maxHeight: '75vh', overflowY: 'auto',
        padding: '0 20px 40px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
          <div style={{ width: 36, height: 4, background: '#333', borderRadius: 2 }} />
        </div>
        <div style={{ fontSize: 11, color: colour, letterSpacing: '0.12em', fontWeight: 700, marginBottom: 4 }}>
          PR BOOK
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#e8e8e8', marginBottom: 16 }}>
          {exercise.name}
        </div>

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
                    <span key={ci} style={{
                      background: ci === 0 ? `${colour}22` : '#141414',
                      border: `1px solid ${ci === 0 ? colour + '55' : '#2a2a2a'}`,
                      borderRadius: 4, padding: '3px 8px',
                      fontSize: 11, color: ci === 0 ? '#e8e8e8' : '#666',
                    }}>
                      {entry.weight}{entry.date ? `  ${entry.date}` : ''}
                    </span>
                  ))}
                </div>
              </div>
            );
          })
        )}

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
            <button onClick={handleSavePR} disabled={!weightInput.trim() || !repInput}
              style={{
                background: colour, border: 'none', borderRadius: 4, color: '#fff',
                fontSize: 11, fontFamily: 'var(--font)', fontWeight: 700,
                letterSpacing: '0.06em', padding: '6px 14px',
                cursor: weightInput.trim() && repInput ? 'pointer' : 'not-allowed',
                opacity: weightInput.trim() && repInput ? 1 : 0.5,
              }}>
              SAVE PR
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── History Bottom Sheet ─────────────────────────────────────────────────────

function HistoryBottomSheet({ exercise, colour, onClose }) {
  const history = getExerciseHistory(exercise.name);

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(`${dateStr}T12:00:00`);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 150 }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#1a1a1a', borderTop: `2px solid ${colour}`,
        borderRadius: '16px 16px 0 0', zIndex: 160,
        maxHeight: '75vh', overflowY: 'auto',
        padding: '0 20px 40px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
          <div style={{ width: 36, height: 4, background: '#333', borderRadius: 2 }} />
        </div>
        <div style={{ fontSize: 11, color: colour, letterSpacing: '0.12em', fontWeight: 700, marginBottom: 4 }}>
          HISTORY
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#e8e8e8', marginBottom: 16 }}>
          {exercise.name}
        </div>

        {history.length === 0 ? (
          <div style={{ fontSize: 12, color: '#444', marginBottom: 16 }}>No previous sessions logged</div>
        ) : (
          history.map((entry, idx) => {
            const loggedSets = (entry.sets || []).filter((s) => {
              const r = parseInt(s.reps);
              return !isNaN(r) && r > 0;
            });
            const totalKg = loggedSets.reduce((sum, s) => {
              const w = parseFloat(s.weight) || 0;
              const r = parseInt(s.reps) || 0;
              return sum + w * r;
            }, 0);
            const bestSet = loggedSets.reduce((best, s) => {
              const w = parseFloat(s.weight) || 0;
              return w > (best.w || 0) ? { w, r: parseInt(s.reps) } : best;
            }, {});

            return (
              <div key={idx} style={{
                background: idx === 0 ? `${colour}10` : '#141414',
                border: `1px solid ${idx === 0 ? colour + '30' : '#222'}`,
                borderRadius: 8,
                padding: '12px 14px',
                marginBottom: 8,
              }}>
                {/* Header: date + session name */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: idx === 0 ? colour : '#999' }}>
                      {formatDate(entry.date)}
                    </span>
                    <span style={{ fontSize: 10, color: '#555' }}>{entry.sessionName}</span>
                  </div>
                  {entry.rating && (
                    <span style={{ fontSize: 10, color: '#555' }}>{entry.rating}/10</span>
                  )}
                </div>

                {/* Sets grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '18px 1fr', gap: '2px 6px' }}>
                  {loggedSets.map((s, si) => (
                    <div key={si} style={{ display: 'contents' }}>
                      <div style={{ fontSize: 10, color: '#444', textAlign: 'right', lineHeight: '18px' }}>{si + 1}</div>
                      <div style={{ fontSize: 12, color: '#ccc', lineHeight: '18px', display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontWeight: 600 }}>{s.weight}kg</span>
                        <span style={{ color: '#666' }}>×</span>
                        <span>{s.reps}</span>
                        {s.note && <span style={{ fontSize: 10, color: '#555', fontStyle: 'italic' }}>{s.note}</span>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary line */}
                <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 10, color: '#555' }}>
                  <span>{loggedSets.length} sets</span>
                  {totalKg > 0 && <span>{Math.round(totalKg)} kg total</span>}
                  {bestSet.w > 0 && <span>top {bestSet.w}×{bestSet.r}</span>}
                </div>

                {/* Session note */}
                {entry.note && (
                  <div style={{ fontSize: 10, color: '#555', fontStyle: 'italic', marginTop: 6, borderTop: '1px solid #222', paddingTop: 6 }}>
                    {entry.note}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

// ── Grouped exercise list helper ─────────────────────────────────────────────

const MUSCLE_GROUP_ORDER = [
  'Chest', 'Front Delts', 'Side Delts', 'Triceps',
  'Upper Back / Lats', 'Rear Delts', 'Traps', 'Biceps',
  'Quads', 'Hamstrings', 'Glutes', 'Calves',
  'Abs', 'Obliques',
];

function getGroupedExercises(priorityMuscle) {
  // Build unique exercise list from programme
  const exerciseMap = {};
  DAYS.forEach((day) => {
    day.exercises.forEach((ex) => {
      if (!exerciseMap[ex.name]) exerciseMap[ex.name] = { ...ex };
    });
  });

  // Group by primary muscle using MUSCLE_MAPPINGS
  const groups = {};
  Object.entries(exerciseMap).forEach(([name, ex]) => {
    const mapping = MUSCLE_MAPPINGS[name];
    const group = mapping?.primary?.[0] || 'Other';
    if (!groups[group]) groups[group] = [];
    groups[group].push(ex);
  });

  // Sort groups: priority muscle first, then standard order
  const orderedGroups = [];
  const order = priorityMuscle
    ? [priorityMuscle, ...MUSCLE_GROUP_ORDER.filter((g) => g !== priorityMuscle)]
    : MUSCLE_GROUP_ORDER;
  order.forEach((g) => {
    if (groups[g]) orderedGroups.push({ group: g, exercises: groups[g] });
  });
  // Add any remaining groups not in the standard order
  Object.keys(groups).forEach((g) => {
    if (!orderedGroups.find((og) => og.group === g)) {
      orderedGroups.push({ group: g, exercises: groups[g] });
    }
  });
  return orderedGroups;
}

function getPrimaryMuscle(exerciseName) {
  const mapping = MUSCLE_MAPPINGS[exerciseName];
  return mapping?.primary?.[0] || null;
}

// ── Substitute Sheet ──────────────────────────────────────────────────────────

function SubstituteSheet({ colour, currentExercise, onSelect, onClose }) {
  const priorityMuscle = getPrimaryMuscle(currentExercise?.name);
  const grouped = getGroupedExercises(priorityMuscle);

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
        <div style={{ fontSize: 11, color: '#888', letterSpacing: '0.1em', marginBottom: 4 }}>SELECT SUBSTITUTE</div>
        {currentExercise && (
          <div style={{ fontSize: 10, color: '#444', marginBottom: 14 }}>
            Replacing {currentExercise.name}
          </div>
        )}
        {grouped.map(({ group, exercises }) => (
          <div key={group}>
            <div style={{
              fontSize: 9, color: group === priorityMuscle ? colour : '#555',
              letterSpacing: '0.12em', fontWeight: 700,
              padding: '10px 0 6px',
              borderTop: '1px solid #222',
            }}>
              {group.toUpperCase()}
            </div>
            {exercises.map((ex) => (
              <button key={ex.name} onClick={() => onSelect(ex)} style={{
                display: 'block', width: '100%', textAlign: 'left',
                background: 'none', border: 'none', borderBottom: '1px solid #1a1a1a',
                color: ex.name === currentExercise?.name ? '#444' : '#e8e8e8',
                fontSize: 13, fontFamily: 'var(--font)',
                padding: '8px 0 8px 12px', cursor: ex.name === currentExercise?.name ? 'default' : 'pointer',
              }}>
                {ex.name}
              </button>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

// ── Add Exercise Sheet ───────────────────────────────────────────────────────

function AddExerciseSheet({ colour, onAdd, onClose }) {
  const [showCustom, setShowCustom] = useState(false);
  const [name, setName] = useState('');
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('10');
  const [muscleGroup, setMuscleGroup] = useState('');

  const grouped = getGroupedExercises(null);

  function handlePickExercise(ex) {
    onAdd({
      name: ex.name,
      sets: ex.sets || '3',
      reps: ex.reps || '10',
      rest: ex.rest || '',
      restSeconds: ex.restSeconds || 90,
      note: ex.note || '',
      priority: false,
    });
    onClose();
  }

  function handleAddCustom() {
    if (!name.trim() || !muscleGroup) return;
    // Add to MUSCLE_MAPPINGS at runtime so volume tracks immediately
    if (!MUSCLE_MAPPINGS[name.trim()]) {
      MUSCLE_MAPPINGS[name.trim()] = { primary: [muscleGroup], secondary: [] };
    }
    onAdd({
      name: name.trim(),
      sets,
      reps,
      rest: '',
      restSeconds: 90,
      note: '',
      priority: false,
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
        maxHeight: '75vh', overflowY: 'auto',
        padding: '0 20px 40px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
          <div style={{ width: 36, height: 4, background: '#333', borderRadius: 2 }} />
        </div>
        <div style={{ fontSize: 11, color: '#888', letterSpacing: '0.1em', marginBottom: 14 }}>ADD EXERCISE</div>

        {!showCustom ? (
          <>
            {grouped.map(({ group, exercises }) => (
              <div key={group}>
                <div style={{
                  fontSize: 9, color: '#555', letterSpacing: '0.12em', fontWeight: 700,
                  padding: '10px 0 6px', borderTop: '1px solid #222',
                }}>
                  {group.toUpperCase()}
                </div>
                {exercises.map((ex) => (
                  <button key={ex.name} onClick={() => handlePickExercise(ex)} style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    background: 'none', border: 'none', borderBottom: '1px solid #1a1a1a',
                    color: '#e8e8e8', fontSize: 13, fontFamily: 'var(--font)',
                    padding: '8px 0 8px 12px', cursor: 'pointer',
                  }}>
                    {ex.name}
                  </button>
                ))}
              </div>
            ))}
            <button onClick={() => setShowCustom(true)} style={{
              width: '100%', background: 'none', border: '1px dashed #333',
              borderRadius: 8, color: '#666', fontSize: 12,
              fontFamily: 'var(--font)', letterSpacing: '0.08em',
              padding: '12px 0', marginTop: 14, cursor: 'pointer',
            }}>
              + CUSTOM EXERCISE
            </button>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={{ fontSize: 9, color: '#444', letterSpacing: '0.08em' }}>EXERCISE NAME</label>
              <input type="text" placeholder="e.g. Cable Face Pull" value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ ...inputStyle, marginTop: 4 }} autoFocus />
            </div>
            <div>
              <label style={{ fontSize: 9, color: '#444', letterSpacing: '0.08em' }}>MUSCLE GROUP</label>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                {MUSCLE_GROUP_ORDER.map((g) => (
                  <button key={g} onClick={() => setMuscleGroup(g)} style={{
                    background: muscleGroup === g ? colour : '#222',
                    border: `1px solid ${muscleGroup === g ? colour : '#333'}`,
                    borderRadius: 4, color: muscleGroup === g ? '#fff' : '#888',
                    fontSize: 10, fontFamily: 'var(--font)', padding: '4px 8px',
                    cursor: 'pointer',
                  }}>
                    {g}
                  </button>
                ))}
              </div>
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
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleAddCustom} disabled={!name.trim() || !muscleGroup} style={{
                flex: 1, background: name.trim() && muscleGroup ? colour : '#333', border: 'none', borderRadius: 8,
                color: '#fff', fontSize: 13, fontFamily: 'var(--font)', fontWeight: 700,
                padding: '12px 0', cursor: name.trim() && muscleGroup ? 'pointer' : 'not-allowed',
                opacity: name.trim() && muscleGroup ? 1 : 0.6, marginTop: 4,
              }}>
                ADD TO SESSION
              </button>
              <button onClick={() => setShowCustom(false)} style={{
                background: 'none', border: '1px solid #333', borderRadius: 8,
                color: '#666', fontSize: 13, fontFamily: 'var(--font)',
                padding: '12px 16px', cursor: 'pointer', marginTop: 4,
              }}>
                BACK
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ── Session Summary Card ──────────────────────────────────────────────────────

function SessionSummaryCard({ session, totalSets, totalKg, detectedPRs, onDismiss }) {
  useEffect(() => {
    ensureSessionKeyframes();
    const t = setTimeout(onDismiss, 2600);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      onClick={onDismiss}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: '#0c0c0c',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font)',
        cursor: 'pointer',
      }}
    >
      {/* Accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: session.colour }} />

      <div style={{ fontSize: 10, color: session.colour, letterSpacing: '0.22em', marginBottom: 12 }}>
        SESSION COMPLETE
      </div>
      <div style={{ fontSize: 30, fontWeight: 700, color: '#e8e8e8', letterSpacing: '0.04em', marginBottom: 4 }}>
        {session.name.toUpperCase()}
      </div>
      <div style={{ fontSize: 12, color: '#555', marginBottom: 40 }}>
        {session.subtitle}
      </div>

      <div style={{ display: 'flex', gap: 48, marginBottom: detectedPRs.length > 0 ? 36 : 0 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 34, fontWeight: 700, color: '#e8e8e8', letterSpacing: '-0.01em' }}>{totalSets}</div>
          <div style={{ fontSize: 9, color: '#444', letterSpacing: '0.14em', marginTop: 2 }}>SETS</div>
        </div>
        {totalKg > 0 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 34, fontWeight: 700, color: '#e8e8e8', letterSpacing: '-0.01em' }}>
              {Math.round(totalKg).toLocaleString()}
            </div>
            <div style={{ fontSize: 9, color: '#444', letterSpacing: '0.14em', marginTop: 2 }}>KG MOVED</div>
          </div>
        )}
      </div>

      {detectedPRs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          {detectedPRs.map((pr, i) => (
            <div key={i} style={{ fontSize: 11, color: '#F0A500', letterSpacing: '0.04em' }}>
              ★ {pr.exerciseName} · {pr.weight}kg × {pr.reps}
            </div>
          ))}
        </div>
      )}

      {/* Drain bar */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: '#1a1a1a' }}>
        <div style={{
          height: '100%',
          background: session.colour,
          animation: 'summaryDrain 2.5s linear forwards',
        }} />
      </div>
    </div>
  );
}

// ── Completion Modal ──────────────────────────────────────────────────────────

function CompletionModal({ session, sessionIndex, exercises, setsPerExercise, onSave, onCancel, historySession, targetDateStr }) {
  const isHistory = !!historySession;
  const [rating, setRating] = useState(historySession?.rating ?? null);
  const [note, setNote] = useState(historySession?.note ?? '');
  const saveDateStr = historySession?.date || targetDateStr || toDateStr(new Date());
  const saveDateLabel = new Date(`${saveDateStr}T12:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });

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
        date: saveDateStr,
        sessionName: session.name,
        sessionIndex,
        exercises: exerciseData,
        rating,
        note: note.trim(),
        completedAt: targetDateStr ? toMiddayIso(saveDateStr) : new Date().toISOString(),
      });
      if (!targetDateStr) {
        advanceNextSession();
      }
      // Auto-detect and save new PRs
      const currentBook = getPRBook();
      const sessionBest = {};
      exercises.forEach((ex, exIdx) => {
        (setsPerExercise[exIdx] || []).forEach((s) => {
          const rep = parseInt(s.reps);
          const w = parseFloat(s.weight);
          if (isNaN(rep) || rep <= 0 || isNaN(w) || w <= 0) return;
          const key = String(rep);
          if (!sessionBest[ex.name]) sessionBest[ex.name] = {};
          if (sessionBest[ex.name][key] === undefined || w > sessionBest[ex.name][key]) {
            sessionBest[ex.name][key] = w;
          }
        });
      });
      const newPRs = [];
      Object.entries(sessionBest).forEach(([exName, repMap]) => {
        Object.entries(repMap).forEach(([repKey, w]) => {
          const existing = ((currentBook[exName] || {})[repKey] || []);
          const bestExisting = existing.length > 0 ? Math.max(...existing.map((e) => parseFloat(e.weight) || 0)) : -Infinity;
          if (w > bestExisting) {
            addPREntry(exName, parseInt(repKey), String(w), saveDateStr);
            newPRs.push({ exerciseName: exName, reps: parseInt(repKey), weight: w });
          }
        });
      });

      // Compute summary stats
      let totalSets = 0;
      let totalKg = 0;
      exercises.forEach((ex, exIdx) => {
        (setsPerExercise[exIdx] || []).forEach((s) => {
          const r = parseInt(s.reps);
          const w = parseFloat(s.weight);
          if (!isNaN(r) && r > 0) {
            totalSets += 1;
            if (!isNaN(w) && w > 0) totalKg += w * r;
          }
        });
      });

      onSave({ detectedPRs: newPRs, totalSets, totalKg });
      return;
    }
    onSave({});
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: '#1a1a1a', border: `1px solid ${session.colour}40`,
        borderRadius: 12, padding: '28px 24px', width: '100%', maxWidth: 420,
      }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: session.colour, letterSpacing: '0.04em', marginBottom: 6 }}>
          {isHistory ? 'EDIT SESSION' : targetDateStr ? 'SAVE WORKOUT' : 'SESSION COMPLETE'}
        </div>
        <div style={{ fontSize: 13, color: '#555', marginBottom: 24 }}>
          {session.name} · {isHistory ? 'Update sets, rating or notes' : 'Rate this session'}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button key={n} onClick={() => setRating(n)} style={{
              width: 36, height: 36,
              background: rating === n ? session.colour : '#111',
              border: `1px solid ${rating === n ? session.colour : '#333'}`,
              borderRadius: 5, color: rating === n ? '#fff' : '#666',
              fontSize: 13, fontFamily: 'var(--font)',
              fontWeight: rating === n ? 700 : 400, cursor: 'pointer',
            }}>
              {n}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 11, color: '#555', letterSpacing: '0.08em', marginBottom: 6 }}>NOTES (OPTIONAL)</div>
        <textarea value={note} onChange={(e) => setNote(e.target.value)}
          placeholder="How did it feel? Any PRs?"
          rows={3}
          style={{
            width: '100%', background: '#111', border: '1px solid #2a2a2a', borderRadius: 6,
            color: '#e8e8e8', fontSize: 13, fontFamily: 'var(--font)',
            padding: '10px 12px', outline: 'none', resize: 'vertical',
            boxSizing: 'border-box', marginBottom: 20,
          }}
        />
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleSave} disabled={!rating} style={{
            flex: 1, background: rating ? session.colour : '#333', border: 'none',
            borderRadius: 8, color: '#fff', fontSize: 13, fontFamily: 'var(--font)',
            fontWeight: 700, letterSpacing: '0.08em', padding: '12px 0',
            cursor: rating ? 'pointer' : 'not-allowed', opacity: rating ? 1 : 0.5,
          }}>
            {isHistory ? 'SAVE CHANGES' : 'SAVE SESSION'}
          </button>
          <button onClick={onCancel} style={{
            background: 'none', border: '1px solid #333', borderRadius: 8,
            color: '#666', fontSize: 13, fontFamily: 'var(--font)',
            padding: '12px 20px', cursor: 'pointer',
          }}>
            BACK
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

// All programme exercises flat list — used to look up definitions for history exercises
const allProgrammeExercises = DAYS.flatMap((d) => d.exercises);

export default function SessionScreen({ session, sessionIndex, onBack, onComplete, onDelete, historySession, targetDateStr }) {
  const isHistoryMode = !!historySession;
  const isLiveSession = !isHistoryMode && !targetDateStr;
  const displayDateStr = historySession?.date || targetDateStr || toDateStr(new Date());
  const displayDateLabel = new Date(`${displayDateStr}T12:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
  const headerMeta = isHistoryMode ? `HISTORY · ${displayDateLabel}` : targetDateStr ? `LOG FOR · ${displayDateLabel}` : null;

  const [exercises, setExercises] = useState(() => {
    if (isHistoryMode) {
      return historySession.exercises.map((histEx) => {
        const progEx = allProgrammeExercises.find((e) => e.name === histEx.name);
        return progEx
          ? { ...progEx }
          : { name: histEx.name, sets: String(histEx.sets.length), reps: '—', priority: false };
      });
    }
    const saved = getActiveSession();
    if (saved && saved.sessionName === session.name && Array.isArray(saved.exercises)) {
      return saved.exercises.map((savedEx) => {
        const progEx = allProgrammeExercises.find((e) => e.name === savedEx.name);
        return progEx ? { ...progEx } : savedEx;
      });
    }
    return session.exercises.map((ex) => ({ ...ex }));
  });

  const [setsPerExercise, setSetsPerExercise] = useState(() => {
    if (isHistoryMode) {
      return historySession.exercises.map((ex) => ex.sets || []);
    }
    if (targetDateStr) {
      return session.exercises.map(() => []);
    }
    const saved = getActiveSession();
    if (saved && saved.sessionName === session.name && Array.isArray(saved.setsPerExercise)) {
      const exerciseList = saved.exercises || session.exercises;
      return exerciseList.map((_, i) => saved.setsPerExercise[i] || []);
    }
    return session.exercises.map(() => []);
  });
  const [substituteForIdx, setSubstituteForIdx] = useState(null);
  const [showCustomExercise, setShowCustomExercise] = useState(false);
  const [prSheetExercise, setPrSheetExercise] = useState(null);
  const [historyExercise, setHistoryExercise] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [summaryData, setSummaryData] = useState(null); // { detectedPRs, totalSets, totalKg }
  const [muscleChipOpen, setMuscleChipOpen] = useState(false);
  const { timerSeconds, startTimer, stopTimer } = useRestTimer();

  // Weekly volume base — loaded once at mount so we can detect mid-session target crossings
  const weeklyVolumeBase = useRef(() => {
    const rollingStart = new Date();
    rollingStart.setDate(rollingStart.getDate() - 6);
    rollingStart.setHours(0, 0, 0, 0);
    return getWeeklyVolume(rollingStart);
  });
  const volumeTargets = useRef(getVolumeTargets());
  // Track which muscles have already pulsed this session so they only fire once
  const pulsedMuscles = useRef(new Set());
  const [pulsingMuscles, setPulsingMuscles] = useState([]);

  // Compute session volume from current setsPerExercise
  const sessionExercisesWithSets = exercises.map((ex, i) => ({
    name: ex.name,
    sets: setsPerExercise[i] || [],
    prescribedSets: parseMaxSets(ex.sets),
  }));
  const { volume: sessionVol, targets: sessionTgts } = getSessionVolume(sessionExercisesWithSets);

  const completedExercises = setsPerExercise.filter((sets) =>
    sets.some((s) => String(s.reps).length > 0 && s.reps !== '')
  ).length;

  // Detect when a muscle crosses its weekly target mid-session (Feature 7)
  useEffect(() => {
    if (!muscleChipOpen) return;
    const base = weeklyVolumeBase.current();
    const targets = volumeTargets.current;
    const newPulsers = [];
    Object.entries(sessionVol).forEach(([muscle, addedSets]) => {
      if (pulsedMuscles.current.has(muscle)) return;
      const baseSets = base[muscle] || 0;
      const target = targets[muscle];
      if (!target) return;
      if (baseSets < target && (baseSets + addedSets) >= target) {
        pulsedMuscles.current.add(muscle);
        newPulsers.push(muscle);
      }
    });
    if (newPulsers.length > 0) {
      setPulsingMuscles(newPulsers);
      setTimeout(() => setPulsingMuscles([]), 700);
    }
  }, [sessionVol, muscleChipOpen]);

  const prBook = getPRBook();

  useEffect(() => {
    if (!isLiveSession) return;
    saveActiveSession({
      sessionName: session.name,
      sessionIndex,
      exercises,
      setsPerExercise,
    });
  }, [exercises, setsPerExercise, session.name, sessionIndex, isLiveSession]);

  const handleSetsChange = useCallback((exIdx, newSets) => {
    setSetsPerExercise((prev) => {
      const next = [...prev];
      next[exIdx] = newSets;
      return next;
    });
  }, []);

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

  function handleAddCustomExercise(exerciseDef) {
    setExercises((prev) => [...prev, exerciseDef]);
    setSetsPerExercise((prev) => [...prev, []]);
  }

  function handleComplete() {
    setShowModal(true);
  }

  function handleSave(summary = {}) {
    stopTimer();
    setShowModal(false);
    if (isLiveSession) saveActiveSession(null);
    if (isLiveSession && summary.totalSets > 0) {
      setSummaryData(summary);
    } else {
      if (onComplete) onComplete({ sessionIndex, sessionName: session.name });
    }
  }

  function handleSummaryDismiss() {
    setSummaryData(null);
    if (onComplete) onComplete({ sessionIndex, sessionName: session.name });
  }

  function handleDeleteWorkout() {
    if (!historySession) return;
    const shouldDelete = window.confirm('Are you sure you want to delete this workout?');
    if (!shouldDelete) return;
    deleteSession(historySession.id);
    if (onDelete) onDelete(historySession);
  }

  if (!session) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#111111', zIndex: 100,
      display: 'flex', flexDirection: 'column', fontFamily: 'var(--font)',
    }}>
      {/* ── Sticky Header ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 110, background: '#111111',
        borderTop: `3px solid ${session.colour}`,
        borderBottom: '1px solid #2a2a2a',
        padding: '10px 16px 0',
      }}>
        {/* Row 1: session name + complete */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: session.colour, letterSpacing: '.05em', lineHeight: 1.2 }}>
            {session.name.toUpperCase()}
          </div>
          <button onClick={handleComplete} style={{
            background: session.colour, border: 'none', borderRadius: 6, color: '#fff',
            fontSize: 11, fontFamily: 'var(--font)', fontWeight: 700,
            letterSpacing: '.06em', padding: '7px 14px', cursor: 'pointer', flexShrink: 0,
          }}>
            {isHistoryMode ? 'SAVE CHANGES' : 'COMPLETE'}
          </button>
        </div>
        {/* Row 2: back + subtitle + muscles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 10 }}>
          <button onClick={onBack} style={{
            background: 'none', border: '1px solid #2a2a2a', borderRadius: 6,
            color: '#e8e8e8', padding: '4px 10px', fontSize: 10, fontFamily: 'var(--font)',
            letterSpacing: '.06em', cursor: 'pointer', flexShrink: 0,
          }}>← BACK</button>
          <div style={{ flex: 1, minWidth: 0, fontSize: 10, color: '#555', letterSpacing: '.04em', lineHeight: 1.4 }}>
            {session.subtitle} · {completedExercises}/{exercises.length}
            {headerMeta && <span style={{ color: '#888', marginLeft: 8 }}>{headerMeta}</span>}
          </div>
          {!isHistoryMode && (
            <button onClick={() => setMuscleChipOpen((v) => !v)} style={{
              background: muscleChipOpen ? session.colour : '#1e1e1e',
              border: `1px solid ${session.colour}55`,
              borderRadius: 16, color: muscleChipOpen ? '#fff' : session.colour,
              fontSize: 9, fontFamily: 'var(--font)', fontWeight: 700,
              letterSpacing: '.08em', padding: '4px 10px', cursor: 'pointer', flexShrink: 0,
            }}>MUSCLES</button>
          )}
        </div>
        {/* Progress bar */}
        <div style={{ height: 2, background: '#1e1e1e', margin: '0 -16px' }}>
          <div style={{
            height: '100%',
            width: `${exercises.length > 0 ? (completedExercises / exercises.length) * 100 : 0}%`,
            background: session.colour, opacity: 0.8,
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      {/* ── Muscle Illustration Panel ── */}
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
            pulsingMuscles={pulsingMuscles}
          />
        </div>
      )}

      {/* ── Scrollable Exercise List ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 20px' }}>
        {isHistoryMode && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button
              onClick={handleDeleteWorkout}
              style={{
                background: 'none',
                border: '1px solid #6a2b2b',
                borderRadius: 6,
                color: '#d27a7a',
                fontSize: 10,
                fontFamily: 'var(--font)',
                fontWeight: 700,
                letterSpacing: '0.08em',
                padding: '7px 10px',
                cursor: 'pointer',
              }}
            >
              DELETE
            </button>
          </div>
        )}
        {exercises.map((exercise, i) => (
          <ExerciseCard
            key={`${exercise.name}-${i}`}
            exercise={exercise}
            colour={session.colour}
            sets={setsPerExercise[i] || []}
            onSetsChange={(newSets) => handleSetsChange(i, newSets)}
            prBook={prBook}
            onOpenPRSheet={(ex) => setPrSheetExercise(ex)}
            onOpenHistory={isHistoryMode ? null : (ex) => setHistoryExercise(ex)}
            onMoveUp={isHistoryMode || i === 0 ? null : () => moveExercise(i, i - 1)}
            onMoveDown={isHistoryMode || i === exercises.length - 1 ? null : () => moveExercise(i, i + 1)}
            onSubstitute={isHistoryMode ? null : () => setSubstituteForIdx(i)}
            onStartTimer={startTimer}
          />
        ))}

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
      </div>

      {/* ── PR Bottom Sheet ── */}
      {prSheetExercise && (
        <PRBottomSheet
          exercise={prSheetExercise}
          colour={session.colour}
          onClose={() => setPrSheetExercise(null)}
        />
      )}

      {historyExercise && (
        <HistoryBottomSheet
          exercise={historyExercise}
          colour={session.colour}
          onClose={() => setHistoryExercise(null)}
        />
      )}

      {substituteForIdx !== null && (
        <SubstituteSheet
          colour={session.colour}
          currentExercise={exercises[substituteForIdx]}
          onSelect={(ex) => handleSubstitute(substituteForIdx, ex)}
          onClose={() => setSubstituteForIdx(null)}
        />
      )}

      {showCustomExercise && (
        <AddExerciseSheet
          colour={session.colour}
          onAdd={handleAddCustomExercise}
          onClose={() => setShowCustomExercise(false)}
        />
      )}

      {/* ── Session Summary Card ── */}
      {summaryData && (
        <SessionSummaryCard
          session={session}
          totalSets={summaryData.totalSets}
          totalKg={summaryData.totalKg}
          detectedPRs={summaryData.detectedPRs || []}
          onDismiss={handleSummaryDismiss}
        />
      )}

      {/* ── Completion Modal ── */}
      {showModal && (
        <CompletionModal
          session={session}
          sessionIndex={sessionIndex}
          exercises={exercises}
          setsPerExercise={setsPerExercise}
          onSave={handleSave}
          onCancel={() => setShowModal(false)}
          historySession={historySession}
          targetDateStr={targetDateStr}
        />
      )}

      {/* Floating rest timer pill */}
      {timerSeconds !== null && !isHistoryMode && (
        <div style={{
          position: 'fixed',
          bottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
          right: 16,
          zIndex: 120,
          background: '#111',
          border: `1px solid ${session.colour}66`,
          borderRadius: 20,
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          boxShadow: `0 0 16px ${session.colour}22`,
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: session.colour,
            boxShadow: `0 0 6px ${session.colour}`,
            flexShrink: 0,
          }} />
          <span style={{
            color: session.colour, fontSize: 15, fontWeight: 700,
            fontFamily: 'var(--font)', letterSpacing: '.04em',
          }}>
            {formatTime(timerSeconds)}
          </span>
          <button
            onClick={stopTimer}
            style={{ color: '#444', fontSize: 14, cursor: 'pointer', padding: '4px 8px', lineHeight: 1, flexShrink: 0, background: 'none', border: 'none', fontFamily: 'var(--font)' }}
          >✕</button>
        </div>
      )}
    </div>
  );
}
