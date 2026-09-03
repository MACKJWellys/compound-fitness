import { useState, useEffect, useRef } from 'react';
import { DAYS, PROGRAMME_START, FREESTYLE_SESSION } from '../data/programme';
import {
  getSessionLog,
  getDailyLog,
  getDayEntry,
  saveDailyEntry,
  getNextSessionIndex,
  setNextSessionIndex,
  getWeeklyVolume,
  getVolumeTargets,
} from '../data/storage';
import { toDateStr, getProgrammeWeek } from '../utils/dateUtils';
import MuscleIllustration from '../components/MuscleIllustration';
import MuscleIllustrationBack from '../components/MuscleIllustrationBack';
import MuscleAnimationOverlay from '../components/MuscleAnimationOverlay';

// Session abbreviation map
const SESSION_ABBR = {
  'Push A': 'PA',
  'Pull A': 'PL',
  'Legs A': 'LA',
  'Push B': 'PB',
  'Pull B': 'PLB',
  'Legs B': 'LB',
  Freestyle: 'FS',
};

const PHASE_COLOURS = {
  Foundation: '#4361EE',
  Push: '#C41E2E',
  Peak: '#F0A500',
};

const HABIT_CONFIG = [
  { key: 'sauna', label: 'Sauna', colour: '#4361EE' },
  { key: 'protein', label: 'Protein', colour: '#C41E2E' },
  { key: 'private', label: null, colour: '#E53935' },
];

const MUSCLE_ORDER = [
  'Chest', 'Front Delts', 'Side Delts', 'Rear Delts',
  'Triceps', 'Biceps', 'Traps', 'Upper Back / Lats',
  'Abs', 'Obliques',
  'Quads', 'Hamstrings', 'Glutes', 'Calves',
];

const T = {
  fg: 'var(--fg)',
  muted: 'var(--fg-muted)',
  subtle: 'var(--fg-subtle)',
  faint: 'var(--fg-faint)',
  border: 'var(--border)',
  card: 'var(--card)',
  mutedBg: 'var(--muted)',
};

/* ── Small icons (lucide-style, currentColor) ── */
function IconPlay({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M6 4.5v15a1 1 0 0 0 1.5.87l13-7.5a1 1 0 0 0 0-1.74l-13-7.5A1 1 0 0 0 6 4.5z" />
    </svg>
  );
}
function IconChevron({ open, size = 14 }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ transition: 'transform 0.15s ease', transform: open ? 'rotate(180deg)' : 'none' }}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
function IconCheck({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
function IconTrend({ up, size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      {up ? <path d="M12 19V5M5 12l7-7 7 7" /> : <path d="M12 5v14M19 12l-7 7-7-7" />}
    </svg>
  );
}

function Dot({ colour, size = 8, glow = false }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: size, height: size, borderRadius: '50%',
        background: colour,
        boxShadow: glow ? `0 0 8px ${colour}` : 'none',
        flexShrink: 0,
      }}
    />
  );
}

function SectionLabel({ children, style }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 500, color: T.muted, ...style }}>
      {children}
    </div>
  );
}

function MuscleBreakdown({ weeklyVolume, volumeTargets }) {
  const entries = MUSCLE_ORDER
    .map((m) => ({ muscle: m, sets: Math.round((weeklyVolume[m] || 0) * 10) / 10, target: volumeTargets[m] || 10 }))
    .filter((e) => e.sets > 0 || e.target > 0);

  if (entries.length === 0) return null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 20, marginTop: 16, borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
      {entries.map(({ muscle, sets, target }) => {
        const valueColour = sets >= target ? '#0F8F60' : sets > 0 ? '#E0B70A' : T.faint;
        return (
          <div key={muscle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 24 }}>
            <span style={{ fontSize: 12, color: T.muted }}>{muscle}</span>
            <span className="num" style={{ fontSize: 12, color: valueColour, fontWeight: 500 }}>
              {sets}<span style={{ color: T.faint, fontWeight: 400 }}>/{target}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

const pickerBtn = {
  background: 'var(--bg)',
  border: `1px solid ${T.border}`,
  borderRadius: 'var(--radius-md)',
  padding: '10px 12px',
  textAlign: 'left',
  fontFamily: 'var(--font-sans)',
  cursor: 'pointer',
};

function SessionPicker({ onPick, onFreestyle }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T.border}` }}>
      {DAYS.map((s, i) => (
        <button key={s.name} className="tap" onClick={() => onPick(s, i)} style={pickerBtn}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: T.fg }}>
            <Dot colour={s.colour} size={7} />
            {s.name}
          </div>
          <div style={{ fontSize: 11, color: T.subtle, marginTop: 3, paddingLeft: 15 }}>
            {s.exercises.length} exercises
          </div>
        </button>
      ))}
      <button className="tap" onClick={onFreestyle} style={{ ...pickerBtn, gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Dot colour={FREESTYLE_SESSION.colour} size={7} />
        <span style={{ fontSize: 13, fontWeight: 600, color: T.fg }}>{FREESTYLE_SESSION.name}</span>
        <span style={{ fontSize: 11, color: T.subtle, marginLeft: 'auto' }}>{FREESTYLE_SESSION.subtitle}</span>
      </button>
    </div>
  );
}

function ExerciseChips({ exercises }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
      {exercises.slice(0, 3).map((ex) => (
        <span key={ex.name} className="badge">
          {(ex.name || '').split(' ').slice(0, 3).join(' ')}
        </span>
      ))}
    </div>
  );
}

function InProgressCard({ savedSession, onContinue, onStartNew, showSessionPicker, setNextIdx, setShowSessionPicker, onStartSession }) {
  const sessionDef = DAYS[savedSession.sessionIndex];
  const colour = sessionDef?.colour || '#e8e8e8';

  const exercisesLogged = (savedSession.setsPerExercise || []).filter((sets) =>
    Array.isArray(sets) && sets.some((s) => String(s.reps).length > 0 && s.reps !== '')
  ).length;
  const totalExercises = (savedSession.exercises || []).length;
  const progress = totalExercises ? exercisesLogged / totalExercises : 0;

  return (
    <div className="card" style={{ padding: 16, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 10, position: 'relative' }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: T.fg, letterSpacing: '-0.01em' }}>
          {savedSession.sessionName}
        </div>
        <div style={{ fontSize: 13, color: T.muted }}>
          {exercisesLogged} of {totalExercises} started
        </div>
      </div>

      {/* Session progress */}
      <div style={{ height: 4, background: T.mutedBg, borderRadius: 999, overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ height: '100%', width: `${Math.round(progress * 100)}%`, background: colour, borderRadius: 999, transition: 'width 0.3s ease' }} />
      </div>

      <ExerciseChips exercises={savedSession.exercises || []} />

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button className="btn btn-primary" onClick={onContinue} style={{ backgroundColor: colour, flex: 1 }}>
          <IconPlay />
          Continue
        </button>
        <button className="btn btn-ghost" onClick={onStartNew} aria-expanded={showSessionPicker}>
          Start new
          <IconChevron open={showSessionPicker} />
        </button>
      </div>

      {showSessionPicker && (
        <SessionPicker
          onPick={(s, i) => {
            setNextIdx(i);
            setNextSessionIndex(i);
            setShowSessionPicker(false);
            if (onStartSession) onStartSession(s);
          }}
          onFreestyle={() => {
            setShowSessionPicker(false);
            if (onStartSession) onStartSession(FREESTYLE_SESSION);
          }}
        />
      )}
    </div>
  );
}

function Sparkline({ data, width = 72, height = 32, colour = 'var(--fg-muted)' }) {
  if (data.length < 2) return null;
  const weights = data.map((d) => d.weight);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const range = max - min || 1;

  const points = data
    .map((d) => {
      const x = (d.day / 27) * width;
      const y = height - 4 - ((d.weight - min) / range) * (height - 8);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const last = data[data.length - 1];
  const lx = ((last.day / 27) * width).toFixed(1);
  const ly = (height - 4 - ((last.weight - min) / range) * (height - 8)).toFixed(1);

  return (
    <svg width={width} height={height} style={{ overflow: 'visible', flexShrink: 0, display: 'block' }}>
      <polyline points={points} fill="none" stroke={colour} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r="2.5" fill="var(--fg)" />
    </svg>
  );
}

export default function Dashboard({ onStartSession, onViewSession, savedSession, onContinueSession }) {
  const todayStr = toDateStr(new Date());
  const { week, phase, pct } = getProgrammeWeek(PROGRAMME_START);
  const phaseColour = PHASE_COLOURS[phase] || '#e8e8e8';

  const [nextIdx, setNextIdx] = useState(getNextSessionIndex());
  const [sessionLog, setSessionLog] = useState([]);
  const [dailyLog, setDailyLog] = useState({});
  const [todayEntry, setTodayEntry] = useState(getDayEntry(todayStr));
  const [weightInput, setWeightInput] = useState('');
  const [weeklyVolume, setWeeklyVolume] = useState({});
  const [volumeTargets] = useState(() => getVolumeTargets());
  const [muscleView, setMuscleView] = useState('front'); // 'front' | 'back'
  const [showSessionPicker, setShowSessionPicker] = useState(false);
  const [sparklineData, setSparklineData] = useState([]);
  const [weightDelta, setWeightDelta] = useState(null);
  const [momentPhase, setMomentPhase] = useState('idle');
  const [dataLoaded, setDataLoaded] = useState(false);
  const illustrationRef = useRef(null);
  const [illustrationRect, setIllustrationRect] = useState(null);

  useEffect(() => {
    const log = getSessionLog();
    const daily = getDailyLog();
    setSessionLog(log);
    setDailyLog(daily);

    // 28-day bodyweight sparkline
    const sparkPoints = [];
    for (let i = 27; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = toDateStr(d);
      const logEntry = daily[dStr];
      if (logEntry?.weight != null) {
        sparkPoints.push({ day: 27 - i, weight: logEntry.weight });
      }
    }
    setSparklineData(sparkPoints);

    if (sparkPoints.length >= 2) {
      const recent = sparkPoints[sparkPoints.length - 1].weight;
      const oldPoint = sparkPoints.slice().reverse().find((p) => p.day <= 20);
      setWeightDelta(oldPoint ? recent - oldPoint.weight : null);
    } else {
      setWeightDelta(null);
    }

    const entry = getDayEntry(todayStr);
    setTodayEntry(entry);
    setWeightInput(entry.weight != null ? String(entry.weight) : '');

    const rollingStart = new Date();
    rollingStart.setDate(rollingStart.getDate() - 6);
    rollingStart.setHours(0, 0, 0, 0);
    setWeeklyVolume(getWeeklyVolume(rollingStart));
    setDataLoaded(true);
  }, [todayStr]);

  useEffect(() => {
    if (!dataLoaded) return;
    const hasTrainedMuscles = Object.values(weeklyVolume).some((v) => v > 0);
    if (!hasTrainedMuscles) return;

    // Capture illustration position for FLIP animation
    if (illustrationRef.current) {
      setIllustrationRect(illustrationRef.current.getBoundingClientRect());
    }

    let cancelled = false;
    const schedule = (fn, ms) => setTimeout(() => { if (!cancelled) fn(); }, ms);

    setMomentPhase('expanding');
    const t1 = schedule(() => setMomentPhase('animating'),   500);
    const t2 = schedule(() => setMomentPhase('settling'),    1500);
    const t3 = schedule(() => setMomentPhase('contracting'), 2050);
    const t4 = schedule(() => setMomentPhase('idle'),        2650);

    return () => {
      cancelled = true;
      [t1, t2, t3, t4].forEach(clearTimeout);
    };
  }, [dataLoaded]); // eslint-disable-line react-hooks/exhaustive-deps -- intentional: fires once on mount after data loads; weeklyVolume is read at trigger time

  const nextSession = DAYS[nextIdx];

  function handleChange() {
    setShowSessionPicker((v) => !v);
  }

  function handleStart() {
    if (onStartSession) onStartSession(nextSession);
  }

  // Bodyweight
  function handleWeightBlur() {
    const val = parseFloat(weightInput);
    if (!isNaN(val)) {
      saveDailyEntry(todayStr, { weight: val });
      setTodayEntry((prev) => ({ ...prev, weight: val }));
    }
  }

  // Habits
  function toggleHabit(key) {
    const current = todayEntry.habits || { sauna: false, protein: false, private: false };
    const updated = { ...current, [key]: !current[key] };
    saveDailyEntry(todayStr, { habits: updated });
    setTodayEntry((prev) => ({ ...prev, habits: updated }));
  }

  // Rolling 7-day window: index 0 = 6 days ago, index 6 = today (rightmost)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  const DAY_LETTER = ['S', 'M', 'T', 'W', 'T', 'F', 'S']; // indexed by getDay()

  // Build a map: dateStr → session entry
  const sessionByDate = {};
  sessionLog.forEach((entry) => {
    const dateKey = (entry.date || '').slice(0, 10);
    if (dateKey) sessionByDate[dateKey] = entry;
  });

  // Full split: all 6 session types completed in the rolling 7-day window
  const sessionTypesThisWeek = new Set(
    weekDays.map((d) => sessionByDate[toDateStr(d)]?.sessionName).filter(Boolean)
  );
  const fullSplitComplete = DAYS.every((d) => sessionTypesThisWeek.has(d.name));

  const monthTitle = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  return (
    <div
      style={{
        padding: '20px 16px 8px',
        fontFamily: 'var(--font-sans)',
        color: T.fg,
        maxWidth: 480,
        margin: '0 auto',
      }}
    >
      {/* ── Header ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ paddingRight: 52, marginBottom: 12 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.2, color: T.fg, marginBottom: 4 }}>
            {monthTitle}
          </h1>
          <div style={{ fontSize: 13, color: T.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: T.fg, fontWeight: 500 }}>{phase}</span>
            <span style={{ color: T.faint }}>·</span>
            <span>Week {week}</span>
            <span style={{ color: T.faint }}>·</span>
            <span className="num">{pct}%</span>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 6, background: T.mutedBg, borderRadius: 999, boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.5)' }}>
          <div
            style={{
              height: '100%',
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${phaseColour}b3, ${phaseColour})`,
              borderRadius: 999,
              boxShadow: `0 0 12px ${phaseColour}66`,
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      </div>

      {/* ── Week strip ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {weekDays.map((day) => {
          const dStr = toDateStr(day);
          const isToday = dStr === todayStr;
          const logEntry = sessionByDate[dStr];
          const dailyEntry = dailyLog[dStr];
          const sessionName = logEntry?.sessionName;
          const abbr = sessionName ? SESSION_ABBR[sessionName] : null;
          const colour = sessionName ? (DAYS.find((d) => d.name === sessionName)?.colour || FREESTYLE_SESSION.colour) : null;
          const bw = dailyEntry?.weight;

          return (
            <div
              key={dStr}
              className={logEntry ? 'tap' : undefined}
              onClick={() => logEntry && onViewSession && onViewSession(logEntry)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                cursor: logEntry ? 'pointer' : 'default',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: isToday ? 600 : 500, color: isToday ? T.fg : T.subtle }}>
                {DAY_LETTER[day.getDay()]}
              </div>
              <div
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  borderRadius: 'var(--radius-md)',
                  background: abbr ? `${colour}1f` : T.card,
                  border: abbr
                    ? `1px solid ${colour}66`
                    : `1px solid ${isToday ? 'var(--border-strong)' : T.border}`,
                  boxShadow: isToday && !abbr ? 'inset 0 0 0 1px var(--border-strong)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 600,
                  color: colour || T.faint,
                  transition: 'background-color 0.15s ease',
                }}
              >
                {abbr || (isToday ? <Dot colour="var(--fg-muted)" size={4} /> : '')}
              </div>
              <div className="num" style={{ fontSize: 10, color: T.subtle, minHeight: 12 }}>
                {bw != null ? bw.toFixed(1) : ''}
              </div>
            </div>
          );
        })}
      </div>

      {/* Full split completion */}
      {fullSplitComplete && (
        <div
          className="card"
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            marginBottom: 16, padding: '10px 14px',
            borderColor: '#0F8F6040',
          }}
        >
          <Dot colour="#0F8F60" size={7} glow />
          <span style={{ fontSize: 13, fontWeight: 500, color: T.fg }}>Full split complete</span>
          <span style={{ marginLeft: 'auto', color: '#0F8F60', display: 'flex' }}><IconCheck /></span>
        </div>
      )}

      {/* ── Current Session card (in-progress) or Next Session card ── */}
      {savedSession ? (
        <InProgressCard
          savedSession={savedSession}
          onContinue={onContinueSession}
          onStartNew={() => { setShowSessionPicker((v) => !v); }}
          showSessionPicker={showSessionPicker}
          setNextIdx={setNextIdx}
          setShowSessionPicker={setShowSessionPicker}
          onStartSession={onStartSession}
        />
      ) : (
        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 14, position: 'relative' }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: T.fg, letterSpacing: '-0.01em' }}>
              {nextSession.name}
            </div>
            <div style={{ fontSize: 13, color: T.muted }}>
              {nextSession.subtitle}
            </div>
          </div>

          <ExerciseChips exercises={nextSession.exercises} />

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn btn-primary" onClick={handleStart} style={{ backgroundColor: nextSession.colour, flex: 1 }}>
              <IconPlay />
              Start session
            </button>
            <button className="btn btn-ghost" onClick={handleChange} aria-expanded={showSessionPicker}>
              Change
              <IconChevron open={showSessionPicker} />
            </button>
          </div>

          {showSessionPicker && (
            <SessionPicker
              onPick={(s, i) => {
                setNextIdx(i);
                setNextSessionIndex(i);
                setShowSessionPicker(false);
              }}
              onFreestyle={() => {
                setShowSessionPicker(false);
                if (onStartSession) onStartSession(FREESTYLE_SESSION);
              }}
            />
          )}
        </div>
      )}

      {/* ── Muscle Volume ── */}
      <div className="card" style={{ padding: 16, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: T.fg, letterSpacing: '-0.01em' }}>Muscle volume</div>
            <div style={{ fontSize: 12, color: T.subtle, marginTop: 2 }}>Sets per muscle · last 7 days</div>
          </div>
          <div className="seg" role="tablist" aria-label="Illustration view">
            {['front', 'back'].map((v) => (
              <button
                key={v}
                role="tab"
                className="seg-item"
                data-active={muscleView === v}
                aria-selected={muscleView === v}
                onClick={() => setMuscleView(v)}
              >
                {v === 'front' ? 'Front' : 'Back'}
              </button>
            ))}
          </div>
        </div>
        <div
          ref={illustrationRef}
          className="card-spot"
          style={{ display: 'flex', justifyContent: 'center', padding: '4px 0', visibility: momentPhase !== 'idle' ? 'hidden' : 'visible' }}
        >
          {muscleView === 'front'
            ? <MuscleIllustration size={140} weeklyVolume={weeklyVolume} volumeTargets={volumeTargets} />
            : <MuscleIllustrationBack size={140} weeklyVolume={weeklyVolume} volumeTargets={volumeTargets} />
          }
        </div>
        <MuscleBreakdown weeklyVolume={weeklyVolume} volumeTargets={volumeTargets} />
      </div>

      {/* ── TODAY + Habits ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
        {/* Bodyweight */}
        <div className="card" style={{ flex: 1, padding: 14, minWidth: 0 }}>
          <SectionLabel style={{ marginBottom: 10 }}>Bodyweight</SectionLabel>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="40"
                  max="150"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  onBlur={handleWeightBlur}
                  placeholder="—"
                  aria-label="Bodyweight in kilograms"
                  className="input"
                  style={{ fontSize: 20, fontWeight: 600, width: 76, height: 40, padding: '0 10px' }}
                />
                <span style={{ fontSize: 13, color: T.muted }}>kg</span>
              </div>
              {weightDelta != null && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 11, marginTop: 6,
                  color: weightDelta <= 0 ? '#4361EE' : '#C41E2E',
                }}>
                  <IconTrend up={weightDelta > 0} />
                  <span className="num">{Math.abs(weightDelta).toFixed(1)}</span>
                  <span style={{ color: T.subtle }}>vs last week</span>
                </div>
              )}
            </div>
            <Sparkline data={sparklineData} />
          </div>
        </div>

        {/* Habits */}
        <div className="card" style={{ padding: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <SectionLabel style={{ alignSelf: 'flex-start' }}>Habits</SectionLabel>
          <div style={{ display: 'flex', gap: 6 }}>
            {HABIT_CONFIG.map(({ key, label, colour }) => {
              const done = todayEntry?.habits?.[key] || false;
              return (
                <button
                  key={key}
                  className="tap"
                  onClick={() => toggleHabit(key)}
                  aria-pressed={done}
                  aria-label={label || 'Private habit'}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    width: 40,
                    fontFamily: 'var(--font-sans)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                  }}
                >
                  <span
                    style={{
                      width: 28, height: 28, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: done ? colour : 'transparent',
                      border: `1.5px solid ${done ? colour : 'var(--border-strong)'}`,
                      color: '#fff',
                      transition: 'background-color 0.15s ease, border-color 0.15s ease',
                    }}
                  >
                    {done && <IconCheck size={13} />}
                  </span>
                  <span style={{ fontSize: 10, color: done ? T.muted : T.subtle, height: 12 }}>
                    {label || ''}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <MuscleAnimationOverlay
        weeklyVolume={weeklyVolume}
        volumeTargets={volumeTargets}
        phase={momentPhase}
        illustrationRect={illustrationRect}
      />
    </div>
  );
}
