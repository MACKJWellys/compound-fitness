import { useState, useCallback, useEffect, useRef } from 'react';
import { getPRBook, addPREntry, saveSession, advanceNextSession, getSessionVolume, getWeeklyVolume, getVolumeTargets, saveActiveSession, getActiveSession, updateSession, deleteSession, getExerciseHistory } from '../data/storage';
import { toDateStr } from '../utils/dateUtils';
import MuscleIllustration from '../components/MuscleIllustration';
import { DAYS, FREESTYLE_QUICK_ADDS } from '../data/programme';
import { MUSCLE_MAPPINGS } from '../data/muscleMappings';

// ── design tokens ─────────────────────────────────────────────────────────────

const T = {
  fg: 'var(--fg)',
  muted: 'var(--fg-muted)',
  subtle: 'var(--fg-subtle)',
  faint: 'var(--fg-faint)',
  border: 'var(--border)',
  card: 'var(--card)',
  mutedBg: 'var(--muted)',
  bg: 'var(--bg)',
};
const AMBER = '#F0A500';
const DANGER = '#f87171';

const I = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
const Icon = {
  back: <svg {...I}><path d="m15 18-6-6 6-6" /></svg>,
  up: <svg {...I}><path d="m18 15-6-6-6 6" /></svg>,
  down: <svg {...I}><path d="m6 9 6 6 6-6" /></svg>,
  swap: <svg {...I}><path d="M8 3 4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4" /></svg>,
  history: <svg {...I}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
  trophy: <svg {...I}><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" /><path d="M17 6h3v2a3 3 0 0 1-3 3M7 6H4v2a3 3 0 0 0 3 3" /></svg>,
  plus: <svg {...I}><path d="M12 5v14M5 12h14" /></svg>,
  check: <svg {...I} strokeWidth={2.5}><path d="M20 6 9 17l-5-5" /></svg>,
  x: <svg {...I}><path d="M18 6 6 18M6 6l12 12" /></svg>,
  trash: <svg {...I}><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>,
  body: <svg {...I}><circle cx="12" cy="4.5" r="2.5" /><path d="M8 9.5h8l-1 5.5v6h-2.5v-5h-1v5H9v-6z" /></svg>,
};

// Pick readable text colour for a solid button of the given hex colour
function textOn(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return '#fff';
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return lum > 0.6 ? '#09090b' : '#fff';
}

function IconBtn({ onClick, label, active, colour, children, style }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="btn btn-ghost btn-icon"
      style={{
        width: 30, height: 30, borderRadius: 6,
        color: active ? textOn(colour) : T.subtle,
        background: active ? colour : undefined,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function SectionLabel({ children, style }) {
  return <div style={{ fontSize: 12, fontWeight: 500, color: T.muted, marginBottom: 8, ...style }}>{children}</div>;
}

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

const SET_GRID = '22px 1fr 1fr 1.3fr 30px';

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

  const numInput = { height: 36, fontSize: 14, fontWeight: 500, textAlign: 'center', padding: '0 6px', width: '100%', color: dimmed ? T.faint : T.fg };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: SET_GRID,
      gap: 6,
      marginBottom: 6,
      alignItems: 'center',
      opacity: dimmed ? 0.45 : 1,
      borderRadius: 8,
      boxShadow: glowing ? `0 0 0 2px ${AMBER}88` : 'none',
      transition: glowing ? 'none' : 'box-shadow 0.8s ease, opacity 0.2s ease',
    }}>
      <div className="num" style={{ fontSize: 12, color: T.subtle, textAlign: 'center' }}>{setNum}</div>
      <input
        type="number"
        min="0"
        step="0.5"
        placeholder="—"
        value={setData.weight}
        onChange={(e) => onChange('weight', e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
        className="input"
        style={numInput}
        disabled={dimmed}
        inputMode="decimal"
        aria-label={`Set ${setNum} weight`}
      />
      <input
        type="number"
        min="0"
        placeholder="—"
        value={setData.reps}
        onChange={(e) => onChange('reps', e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
        className="input"
        style={numInput}
        disabled={dimmed}
        inputMode="numeric"
        aria-label={`Set ${setNum} reps`}
      />
      <input
        type="text"
        placeholder=""
        value={setData.note}
        onChange={(e) => onChange('note', e.target.value)}
        className="input"
        style={{ ...numInput, fontFamily: 'var(--font-sans)', fontWeight: 400, fontSize: 13, textAlign: 'left', padding: '0 10px' }}
        disabled={dimmed}
        aria-label={`Set ${setNum} note`}
      />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 36 }}>
        {isPR ? (
          <span className="badge num" style={{ height: 20, padding: '0 5px', fontSize: 10, fontWeight: 600, color: AMBER, background: `${AMBER}1a`, border: `1px solid ${AMBER}44` }}>PR</span>
        ) : isLogged ? (
          <span style={{ color: colour, display: 'flex' }}>{Icon.check}</span>
        ) : (
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: T.faint }} />
        )}
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

  const loggedCount = ensuredSets.filter((s) => { const r = parseInt(s.reps); return !isNaN(r) && r > 0; }).length;

  return (
    <div
      className="card"
      style={{
        padding: '14px 14px 10px',
        marginBottom: 12,
        borderColor: snapping || allComplete ? `${colour}66` : undefined,
        boxShadow: snapping ? `0 0 0 1px ${colour}, 0 0 18px ${colour}55` : undefined,
        transition: snapping ? 'none' : 'box-shadow 0.5s ease, border-color 0.5s ease',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <button
          onClick={() => exercise.note && setNoteExpanded((v) => !v)}
          style={{
            flex: 1, minWidth: 0, textAlign: 'left', background: 'none', border: 'none', padding: 0,
            fontFamily: 'var(--font-sans)', cursor: exercise.note ? 'pointer' : 'default',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: T.fg, lineHeight: 1.3, letterSpacing: '-0.01em' }}>
              {exercise.name}
            </span>
            {exercise.priority && (
              <span className="badge" style={{ height: 18, padding: '0 6px', fontSize: 10, fontWeight: 600, color: colour, background: `${colour}1a`, border: `1px solid ${colour}33` }}>Key</span>
            )}
          </div>
          <div style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>
            {exercise.sets} sets × {exercise.reps}{exercise.rest ? ` · ${exercise.rest} rest` : ''}
            {exercise.note && <span style={{ color: T.faint }}> · {noteExpanded ? 'hide note' : 'note'}</span>}
          </div>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0, marginTop: -4, marginRight: -6 }}>
          {onMoveUp && <IconBtn onClick={onMoveUp} label="Move up">{Icon.up}</IconBtn>}
          {onMoveDown && <IconBtn onClick={onMoveDown} label="Move down">{Icon.down}</IconBtn>}
          {onSubstitute && <IconBtn onClick={onSubstitute} label="Swap exercise">{Icon.swap}</IconBtn>}
          {onOpenHistory && <IconBtn onClick={() => onOpenHistory(exercise)} label="History">{Icon.history}</IconBtn>}
          <IconBtn onClick={() => onOpenPRSheet(exercise)} label="PR book">{Icon.trophy}</IconBtn>
        </div>
      </div>

      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: SET_GRID, gap: 6, margin: '12px 0 4px' }}>
        {['', 'kg', 'Reps', 'Note', ''].map((h, i) => (
          <div key={i} style={{ fontSize: 11, fontWeight: 500, color: T.subtle, textAlign: i === 3 ? 'left' : 'center', paddingLeft: i === 3 ? 10 : 0 }}>{h}</div>
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

      {/* Mini progress */}
      <div style={{ height: 2, background: T.mutedBg, borderRadius: 999, marginTop: 6 }}>
        <div style={{ height: '100%', width: `${(loggedCount / maxSets) * 100}%`, background: colour, borderRadius: 999, transition: 'width 0.25s ease' }} />
      </div>

      {/* Coaching note */}
      {noteExpanded && exercise.note && (
        <div style={{ marginTop: 10, fontSize: 13, color: T.muted, lineHeight: 1.55, borderTop: `1px solid ${T.border}`, paddingTop: 10 }}>
          {exercise.note}
        </div>
      )}
    </div>
  );
}

// ── Bottom sheet shell ────────────────────────────────────────────────────────

function Sheet({ title, subtitle, onClose, children, maxHeight = '75vh' }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 150 }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: T.card,
        borderTop: '1px solid var(--border-strong)',
        borderRadius: '16px 16px 0 0', zIndex: 160,
        maxHeight, overflowY: 'auto',
        padding: '0 20px calc(28px + env(safe-area-inset-bottom, 0px))',
        fontFamily: 'var(--font-sans)',
        boxShadow: '0 -16px 48px rgba(0,0,0,0.55)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 14px' }}>
          <div style={{ width: 36, height: 4, background: 'var(--muted-2)', borderRadius: 2 }} />
        </div>
        {title && <div style={{ fontSize: 16, fontWeight: 600, color: T.fg, letterSpacing: '-0.01em' }}>{title}</div>}
        {subtitle && <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{subtitle}</div>}
        <div style={{ marginTop: title || subtitle ? 16 : 0 }}>{children}</div>
      </div>
    </>
  );
}

function FieldLabel({ children }) {
  return <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: T.muted, marginBottom: 6 }}>{children}</label>;
}

const fieldInput = { height: 40, fontSize: 14, padding: '0 10px', width: '100%', fontFamily: 'var(--font-sans)' };

// ── PR Bottom Sheet ───────────────────────────────────────────────────────────

function PRBottomSheet({ exercise, colour, onClose }) {
  const [prBook, setPrBook] = useState(() => getPRBook());
  const [repInput, setRepInput] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [dateInput, setDateInput] = useState('');

  const exPRs = prBook[exercise.name] || {};
  const repKeys = Object.keys(exPRs).map(Number).sort((a, b) => a - b);
  const canSave = weightInput.trim() && repInput;

  function handleSavePR() {
    if (!canSave) return;
    addPREntry(exercise.name, parseInt(repInput), weightInput.trim(), dateInput.trim() || undefined);
    setPrBook(getPRBook());
    setWeightInput('');
    setDateInput('');
    setRepInput('');
  }

  return (
    <Sheet title={exercise.name} subtitle="PR book" onClose={onClose}>
      {repKeys.length === 0 ? (
        <div style={{ fontSize: 13, color: T.subtle, marginBottom: 16 }}>No PRs logged yet</div>
      ) : (
        repKeys.map((rep) => {
          const entries = (exPRs[rep] || []).slice(0, 6);
          const best = entries.reduce((m, e) => Math.max(m, parseFloat(e.weight) || 0), 0);
          return (
            <div key={rep} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span className="num" style={{ fontSize: 12, color: T.subtle, minWidth: 28, flexShrink: 0 }}>
                {rep} <span style={{ color: T.faint }}>×</span>
              </span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {entries.map((entry, ci) => {
                  const w = parseFloat(entry.weight) || 0;
                  const isBest = w === best && best > 0;
                  let dateLabel = '';
                  if (entry.date) {
                    const parts = entry.date.match(/(\d{4})-(\d{2})-(\d{2})/);
                    dateLabel = parts ? `${parseInt(parts[3])}.${parseInt(parts[2])}` : entry.date;
                  }
                  return (
                    <span key={ci} className="badge num" style={{
                      color: isBest ? T.fg : T.muted,
                      border: `1px solid ${isBest ? colour + '66' : 'rgba(255,255,255,0.07)'}`,
                      background: isBest ? `${colour}1a` : undefined,
                    }}>
                      {entry.weight}
                      {dateLabel && <span style={{ fontSize: 10, color: T.subtle }}>{dateLabel}</span>}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })
      )}

      <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 16, marginTop: 8 }}>
        <SectionLabel>Log a PR</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: 8, marginBottom: 10 }}>
          <div>
            <FieldLabel>Reps</FieldLabel>
            <input type="number" min="1" inputMode="numeric" value={repInput} onChange={(e) => setRepInput(e.target.value)} className="input" style={fieldInput} />
          </div>
          <div>
            <FieldLabel>Weight (kg)</FieldLabel>
            <input type="text" inputMode="decimal" placeholder="82.5" value={weightInput} onChange={(e) => setWeightInput(e.target.value)} className="input" style={fieldInput} />
          </div>
          <div>
            <FieldLabel>Date</FieldLabel>
            <input type="text" placeholder="dd.mm" value={dateInput} onChange={(e) => setDateInput(e.target.value)} className="input" style={fieldInput} />
          </div>
        </div>
        <button
          onClick={handleSavePR}
          disabled={!canSave}
          className="btn btn-primary"
          style={{ width: '100%', backgroundColor: colour, color: textOn(colour), opacity: canSave ? 1 : 0.45, cursor: canSave ? 'pointer' : 'not-allowed' }}
        >
          Save PR
        </button>
      </div>
    </Sheet>
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
    <Sheet title={exercise.name} subtitle="Previous sessions" onClose={onClose}>
      {history.length === 0 ? (
        <div style={{ fontSize: 13, color: T.subtle }}>No previous sessions logged</div>
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
              background: T.bg,
              border: `1px solid ${idx === 0 ? colour + '55' : T.border}`,
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              marginBottom: 8,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: idx === 0 ? T.fg : T.muted }}>
                    {formatDate(entry.date)}
                  </span>
                  <span style={{ fontSize: 12, color: T.subtle }}>{entry.sessionName}</span>
                </div>
                {entry.rating && (
                  <span className="num" style={{ fontSize: 12, color: T.subtle }}>{entry.rating}/10</span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '20px 1fr', gap: '2px 8px' }}>
                {loggedSets.map((s, si) => (
                  <div key={si} style={{ display: 'contents' }}>
                    <div className="num" style={{ fontSize: 11, color: T.faint, textAlign: 'right', lineHeight: '20px' }}>{si + 1}</div>
                    <div className="num" style={{ fontSize: 13, color: T.fg, lineHeight: '20px', display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ fontWeight: 500 }}>{s.weight}kg</span>
                      <span style={{ color: T.faint }}>×</span>
                      <span>{s.reps}</span>
                      {s.note && <span style={{ fontSize: 11, color: T.subtle, fontFamily: 'var(--font-sans)' }}>{s.note}</span>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="num" style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 11, color: T.subtle }}>
                <span>{loggedSets.length} sets</span>
                {totalKg > 0 && <span>{Math.round(totalKg)} kg total</span>}
                {bestSet.w > 0 && <span>top {bestSet.w}×{bestSet.r}</span>}
              </div>

              {entry.note && (
                <div style={{ fontSize: 12, color: T.subtle, marginTop: 8, borderTop: `1px solid ${T.border}`, paddingTop: 8 }}>
                  {entry.note}
                </div>
              )}
            </div>
          );
        })
      )}
    </Sheet>
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
  const exerciseMap = {};
  DAYS.forEach((day) => {
    day.exercises.forEach((ex) => {
      if (!exerciseMap[ex.name]) exerciseMap[ex.name] = { ...ex };
    });
  });

  const groups = {};
  Object.entries(exerciseMap).forEach(([name, ex]) => {
    const mapping = MUSCLE_MAPPINGS[name];
    const group = mapping?.primary?.[0] || 'Other';
    if (!groups[group]) groups[group] = [];
    groups[group].push(ex);
  });

  const orderedGroups = [];
  const order = priorityMuscle
    ? [priorityMuscle, ...MUSCLE_GROUP_ORDER.filter((g) => g !== priorityMuscle)]
    : MUSCLE_GROUP_ORDER;
  order.forEach((g) => {
    if (groups[g]) orderedGroups.push({ group: g, exercises: groups[g] });
  });
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

function GroupedExerciseList({ grouped, priorityMuscle, colour, disabledName, onPick }) {
  return grouped.map(({ group, exercises }) => (
    <div key={group}>
      <div style={{
        fontSize: 12, fontWeight: 500,
        color: group === priorityMuscle ? colour : T.subtle,
        padding: '12px 0 4px',
        borderTop: `1px solid ${T.border}`,
      }}>
        {group}
      </div>
      {exercises.map((ex) => {
        const disabled = ex.name === disabledName;
        return (
          <button
            key={ex.name}
            onClick={() => !disabled && onPick(ex)}
            className="menu-item"
            style={{ color: disabled ? T.faint : T.fg, cursor: disabled ? 'default' : 'pointer', padding: '0 8px' }}
          >
            {ex.name}
          </button>
        );
      })}
    </div>
  ));
}

// ── Substitute Sheet ──────────────────────────────────────────────────────────

function SubstituteSheet({ colour, currentExercise, onSelect, onClose }) {
  const priorityMuscle = getPrimaryMuscle(currentExercise?.name);
  const grouped = getGroupedExercises(priorityMuscle);

  return (
    <Sheet title="Swap exercise" subtitle={currentExercise ? `Replacing ${currentExercise.name}` : null} onClose={onClose} maxHeight="70vh">
      <GroupedExerciseList grouped={grouped} priorityMuscle={priorityMuscle} colour={colour} disabledName={currentExercise?.name} onPick={onSelect} />
    </Sheet>
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
  const canAdd = name.trim() && muscleGroup;

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
    if (!canAdd) return;
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

  return (
    <Sheet title={showCustom ? 'Custom exercise' : 'Add exercise'} subtitle={showCustom ? 'Name it and pick the muscle it trains' : 'From the programme, or make your own'} onClose={onClose}>
      {!showCustom ? (
        <>
          <button onClick={() => setShowCustom(true)} className="btn btn-outline" style={{ width: '100%', marginBottom: 4 }}>
            {Icon.plus}
            Custom exercise
          </button>
          <GroupedExerciseList grouped={grouped} priorityMuscle={null} colour={colour} onPick={handlePickExercise} />
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <FieldLabel>Exercise name</FieldLabel>
            <input type="text" placeholder="e.g. Cable Face Pull" value={name} onChange={(e) => setName(e.target.value)} className="input" style={fieldInput} autoFocus />
          </div>
          <div>
            <FieldLabel>Muscle group</FieldLabel>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {MUSCLE_GROUP_ORDER.map((g) => {
                const active = muscleGroup === g;
                return (
                  <button key={g} onClick={() => setMuscleGroup(g)} className="badge tap" style={{
                    height: 30, padding: '0 10px', cursor: 'pointer',
                    background: active ? colour : undefined,
                    borderColor: active ? colour : undefined,
                    color: active ? textOn(colour) : T.muted,
                  }}>
                    {g}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <FieldLabel>Sets</FieldLabel>
              <input type="number" min="1" inputMode="numeric" value={sets} onChange={(e) => setSets(e.target.value)} className="input" style={fieldInput} />
            </div>
            <div style={{ flex: 1 }}>
              <FieldLabel>Reps</FieldLabel>
              <input type="number" min="1" inputMode="numeric" value={reps} onChange={(e) => setReps(e.target.value)} className="input" style={fieldInput} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleAddCustom} disabled={!canAdd} className="btn btn-primary" style={{ flex: 1, backgroundColor: colour, color: textOn(colour), opacity: canAdd ? 1 : 0.45, cursor: canAdd ? 'pointer' : 'not-allowed' }}>
              Add to session
            </button>
            <button onClick={() => setShowCustom(false)} className="btn btn-outline">Back</button>
          </div>
        </div>
      )}
    </Sheet>
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
        background: T.bg,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-sans)',
        cursor: 'pointer',
        padding: 24,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 500, color: T.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
        Session complete
      </div>
      <div style={{ fontSize: 30, fontWeight: 600, color: T.fg, letterSpacing: '-0.02em', marginBottom: 4 }}>
        {session.name}
      </div>
      <div style={{ fontSize: 13, color: T.subtle, marginBottom: 40 }}>
        {session.subtitle}
      </div>

      <div style={{ display: 'flex', gap: 48, marginBottom: detectedPRs.length > 0 ? 36 : 0 }}>
        <div style={{ textAlign: 'center' }}>
          <div className="num" style={{ fontSize: 40, fontWeight: 600, color: T.fg, letterSpacing: '-0.02em', lineHeight: 1 }}>{totalSets}</div>
          <div style={{ fontSize: 12, color: T.subtle, marginTop: 8 }}>sets</div>
        </div>
        {totalKg > 0 && (
          <div style={{ textAlign: 'center' }}>
            <div className="num" style={{ fontSize: 40, fontWeight: 600, color: T.fg, letterSpacing: '-0.02em', lineHeight: 1 }}>
              {Math.round(totalKg).toLocaleString()}
            </div>
            <div style={{ fontSize: 12, color: T.subtle, marginTop: 8 }}>kg moved</div>
          </div>
        )}
      </div>

      {detectedPRs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          {detectedPRs.map((pr, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: AMBER }}>
              {Icon.trophy}
              <span>{pr.exerciseName}</span>
              <span className="num" style={{ color: T.fg }}>{pr.weight}kg × {pr.reps}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: T.mutedBg }}>
        <div style={{ height: '100%', background: session.colour, animation: 'summaryDrain 2.5s linear forwards' }} />
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
  const saveDateLabel = new Date(`${saveDateStr}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const onColour = textOn(session.colour);

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
      if (!targetDateStr && !session.freestyle) {
        advanceNextSession();
      }
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

  const title = isHistory ? 'Edit session' : targetDateStr ? 'Save workout' : 'Session complete';
  const subtitle = isHistory ? 'Update sets, rating or notes' : `${session.name} · ${saveDateLabel} · rate it`;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
      zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      fontFamily: 'var(--font-sans)',
    }}>
      <div className="card" style={{ padding: 22, width: '100%', maxWidth: 420, boxShadow: 'var(--shadow-md)' }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: T.fg, letterSpacing: '-0.01em', marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 13, color: T.muted, marginBottom: 20 }}>{subtitle}</div>

        <FieldLabel>Rating</FieldLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 18 }}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
            const active = rating === n;
            return (
              <button key={n} onClick={() => setRating(n)} className="btn btn-outline num" style={{
                height: 38, padding: 0,
                background: active ? session.colour : undefined,
                borderColor: active ? session.colour : undefined,
                color: active ? onColour : T.muted,
                fontWeight: active ? 600 : 500,
              }}>
                {n}
              </button>
            );
          })}
        </div>

        <FieldLabel>Notes</FieldLabel>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="How did it feel? Any PRs?"
          rows={3}
          className="input"
          style={{ width: '100%', fontFamily: 'var(--font-sans)', fontSize: 14, padding: '10px 12px', resize: 'vertical', marginBottom: 18, lineHeight: 1.5 }}
        />

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleSave} disabled={!rating} className="btn btn-primary" style={{
            flex: 1, backgroundColor: session.colour, color: onColour,
            opacity: rating ? 1 : 0.45, cursor: rating ? 'pointer' : 'not-allowed',
          }}>
            {isHistory ? 'Save changes' : 'Save session'}
          </button>
          <button onClick={onCancel} className="btn btn-outline">Back</button>
        </div>
      </div>
    </div>
  );
}

// ── Freestyle quick-add ──────────────────────────────────────────────────────

function FreestyleQuickAdd({ remaining, empty, onAdd }) {
  if (remaining.length === 0) return null;

  if (empty) {
    return (
      <div style={{ marginBottom: 12 }}>
        <SectionLabel>Pick a movement</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {remaining.map((q) => (
            <button key={q.name} onClick={() => onAdd(q)} className="card tap" style={{
              padding: '16px 14px', textAlign: 'left', cursor: 'pointer',
              fontFamily: 'var(--font-sans)', color: T.fg,
            }}>
              <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 4 }}>{q.name}</div>
              <div style={{ fontSize: 12, color: T.muted }}>{q.sets} × {q.reps}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <SectionLabel>Quick add</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {remaining.map((q) => (
          <button key={q.name} onClick={() => onAdd(q)} className="card tap" style={{
            display: 'flex', alignItems: 'center', gap: 10,
            height: 46, padding: '0 8px 0 14px', cursor: 'pointer',
            fontFamily: 'var(--font-sans)', color: T.fg, textAlign: 'left',
          }}>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{q.name}</span>
            <span style={{ fontSize: 12, color: T.subtle }}>{q.sets} × {q.reps}</span>
            <span style={{ width: 30, height: 30, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.muted, background: T.mutedBg }}>
              {Icon.plus}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

// All known exercise definitions — used to look up definitions for history / saved exercises
const allProgrammeExercises = [...DAYS.flatMap((d) => d.exercises), ...FREESTYLE_QUICK_ADDS];

export default function SessionScreen({ session, sessionIndex, onBack, onComplete, onDelete, historySession, targetDateStr }) {
  const isHistoryMode = !!historySession;
  const isLiveSession = !isHistoryMode && !targetDateStr;
  const displayDateStr = historySession?.date || targetDateStr || toDateStr(new Date());
  const displayDateLabel = new Date(`${displayDateStr}T12:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
  const headerMeta = isHistoryMode ? `History · ${displayDateLabel}` : targetDateStr ? `Log for ${displayDateLabel}` : null;

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

  const weeklyVolumeBase = useRef(() => {
    const rollingStart = new Date();
    rollingStart.setDate(rollingStart.getDate() - 6);
    rollingStart.setHours(0, 0, 0, 0);
    return getWeeklyVolume(rollingStart);
  });
  const volumeTargets = useRef(getVolumeTargets());
  const pulsedMuscles = useRef(new Set());
  const [pulsingMuscles, setPulsingMuscles] = useState([]);

  const sessionExercisesWithSets = exercises.map((ex, i) => ({
    name: ex.name,
    sets: setsPerExercise[i] || [],
    prescribedSets: parseMaxSets(ex.sets),
  }));
  const { volume: sessionVol, targets: sessionTgts } = getSessionVolume(sessionExercisesWithSets);

  const completedExercises = setsPerExercise.filter((sets) =>
    sets.some((s) => String(s.reps).length > 0 && s.reps !== '')
  ).length;

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

  const colour = session.colour;
  const onColour = textOn(colour);
  const isFreestyle = !!session.freestyle;
  const remainingQuickAdds = isFreestyle
    ? FREESTYLE_QUICK_ADDS.filter((q) => !exercises.some((e) => e.name === q.name))
    : [];
  const progressPct = exercises.length > 0 ? (completedExercises / exercises.length) * 100 : 0;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: T.bg, zIndex: 100,
      display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-sans)', color: T.fg,
    }}>
      {/* ── Sticky Header ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 110,
        background: 'rgba(9, 9, 11, 0.85)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${T.border}`,
        padding: 'calc(12px + env(safe-area-inset-top, 0px)) 16px 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onBack} aria-label="Back" className="btn btn-outline btn-icon" style={{ flexShrink: 0 }}>
            {Icon.back}
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {session.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.muted, marginTop: 2, minWidth: 0 }}>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{headerMeta || session.subtitle}</span>
              <span style={{ color: T.faint, flexShrink: 0 }}>·</span>
              <span className="num" style={{ flexShrink: 0 }}>{completedExercises}/{exercises.length}</span>
            </div>
          </div>
          {!isHistoryMode && (
            <IconBtn
              onClick={() => setMuscleChipOpen((v) => !v)}
              label="Muscles worked"
              active={muscleChipOpen}
              colour={colour}
              style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${muscleChipOpen ? colour : 'var(--border)'}`, background: muscleChipOpen ? colour : T.bg }}
            >
              {Icon.body}
            </IconBtn>
          )}
          <button onClick={handleComplete} className="btn btn-primary" style={{ height: 36, padding: '0 14px', fontSize: 13, backgroundColor: colour, color: onColour, flexShrink: 0 }}>
            {isHistoryMode ? 'Save' : 'Complete'}
          </button>
        </div>
        {/* Progress bar */}
        <div style={{ height: 3, background: T.mutedBg, margin: '12px -16px 0' }}>
          <div style={{ height: '100%', width: `${progressPct}%`, background: colour, transition: 'width 0.3s ease' }} />
        </div>
      </div>

      {/* ── Muscle Illustration Panel ── */}
      {muscleChipOpen && (
        <div style={{
          background: T.card,
          borderBottom: `1px solid ${T.border}`,
          padding: '12px 16px',
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
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px calc(28px + env(safe-area-inset-bottom, 0px))' }}>
        {isHistoryMode && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button onClick={handleDeleteWorkout} className="btn btn-ghost" style={{ height: 34, padding: '0 10px', fontSize: 13, color: DANGER }}>
              {Icon.trash}
              Delete workout
            </button>
          </div>
        )}

        {exercises.map((exercise, i) => (
          <ExerciseCard
            key={`${exercise.name}-${i}`}
            exercise={exercise}
            colour={colour}
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

        {isFreestyle && !isHistoryMode && (
          <FreestyleQuickAdd
            remaining={remainingQuickAdds}
            empty={exercises.length === 0}
            onAdd={(q) => handleAddCustomExercise({ ...q, priority: false })}
          />
        )}

        {!isHistoryMode && (
          <button onClick={() => setShowCustomExercise(true)} className="btn btn-outline" style={{ width: '100%', height: 44, marginBottom: 12 }}>
            {Icon.plus}
            Add exercise
          </button>
        )}

        <button onClick={handleComplete} className="btn btn-primary" style={{
          width: '100%', height: 48, fontSize: 15, marginTop: 4,
          backgroundColor: colour, color: onColour,
        }}>
          {isHistoryMode ? 'Save changes' : 'Complete session'}
        </button>
      </div>

      {prSheetExercise && (
        <PRBottomSheet exercise={prSheetExercise} colour={colour} onClose={() => setPrSheetExercise(null)} />
      )}

      {historyExercise && (
        <HistoryBottomSheet exercise={historyExercise} colour={colour} onClose={() => setHistoryExercise(null)} />
      )}

      {substituteForIdx !== null && (
        <SubstituteSheet
          colour={colour}
          currentExercise={exercises[substituteForIdx]}
          onSelect={(ex) => handleSubstitute(substituteForIdx, ex)}
          onClose={() => setSubstituteForIdx(null)}
        />
      )}

      {showCustomExercise && (
        <AddExerciseSheet colour={colour} onAdd={handleAddCustomExercise} onClose={() => setShowCustomExercise(false)} />
      )}

      {summaryData && (
        <SessionSummaryCard
          session={session}
          totalSets={summaryData.totalSets}
          totalKg={summaryData.totalKg}
          detectedPRs={summaryData.detectedPRs || []}
          onDismiss={handleSummaryDismiss}
        />
      )}

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
        <div className="card" style={{
          position: 'fixed',
          bottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
          right: 16,
          zIndex: 120,
          borderRadius: 999,
          padding: '6px 6px 6px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          boxShadow: 'var(--shadow-md)',
        }}>
          <span style={{ fontSize: 12, color: T.muted }}>Rest</span>
          <span className="num" style={{ color: colour === '#fafafa' ? T.fg : colour, fontSize: 16, fontWeight: 600, minWidth: 40 }}>
            {formatTime(timerSeconds)}
          </span>
          <button onClick={stopTimer} aria-label="Stop timer" className="btn btn-ghost btn-icon" style={{ width: 28, height: 28, borderRadius: 999, color: T.subtle }}>
            {Icon.x}
          </button>
        </div>
      )}
    </div>
  );
}
