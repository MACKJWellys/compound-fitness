import { useState, useEffect, useRef } from 'react';
import { DAYS, PROGRAMME_START } from '../data/programme';
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
};

const PHASE_COLOURS = {
  Foundation: '#4A90D9',
  Push: '#E8634A',
  Peak: '#F0A500',
};

const HABIT_CONFIG = [
  { key: 'sauna', label: 'sauna', colour: '#4A90D9' },
  { key: 'protein', label: 'prot', colour: '#E8634A' },
  { key: 'private', label: null, colour: '#E53935' },
];


const MUSCLE_ORDER = [
  'Chest', 'Front Delts', 'Side Delts', 'Rear Delts',
  'Triceps', 'Biceps', 'Traps', 'Upper Back / Lats',
  'Abs', 'Obliques',
  'Quads', 'Hamstrings', 'Glutes', 'Calves',
];

function MuscleBreakdown({ weeklyVolume, volumeTargets }) {
  const entries = MUSCLE_ORDER
    .map((m) => ({ muscle: m, sets: Math.round((weeklyVolume[m] || 0) * 10) / 10, target: volumeTargets[m] || 10 }))
    .filter((e) => e.sets > 0 || e.target > 0);

  if (entries.length === 0) return null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 16px', marginTop: 14 }}>
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

function tintedBg(colour) {
  return `color-mix(in srgb, ${colour} 8%, #111111)`;
}

function InProgressCard({ savedSession, onContinue, onStartNew, showSessionPicker, nextIdx, setNextIdx, setShowSessionPicker, onStartSession }) {
  const sessionDef = DAYS[savedSession.sessionIndex];
  const colour = sessionDef?.colour || '#e8e8e8';

  const exercisesLogged = (savedSession.setsPerExercise || []).filter((sets) =>
    Array.isArray(sets) && sets.some((s) => String(s.reps).length > 0 && s.reps !== '')
  ).length;
  const totalExercises = (savedSession.exercises || []).length;

  return (
    <div
      style={{
        background: tintedBg(colour),
        border: `1px solid ${colour}55`,
        borderRadius: 12,
        padding: '16px 16px 14px',
        marginBottom: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ fontSize: 10, color: colour, letterSpacing: '0.12em', fontWeight: 700 }}>
          IN PROGRESS
        </div>
        <div
          style={{
            width: 6, height: 6, borderRadius: '50%',
            background: colour,
            boxShadow: `0 0 6px ${colour}`,
          }}
        />
      </div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: colour,
          letterSpacing: '0.03em',
          marginBottom: 4,
        }}
      >
        {savedSession.sessionName}
      </div>
      <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
        {exercisesLogged} of {totalExercises} exercises started
      </div>

      {/* Exercise progress chips */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {(savedSession.exercises || []).slice(0, 3).map((ex) => (
          <span key={ex.name} style={{
            background: `${colour}12`, border: `1px solid ${colour}28`,
            borderRadius: 4, color: '#888', fontSize: 9, padding: '2px 7px',
          }}>
            {(ex.name || '').split(' ').slice(0, 3).join(' ')}
          </span>
        ))}
        {(savedSession.exercises || []).length > 3 && (
          <span style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 4, color: '#444', fontSize: 9, padding: '2px 7px' }}>
            +{savedSession.exercises.length - 3} more
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button
          onClick={onContinue}
          style={{
            background: colour,
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '10px 24px',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.08em',
            cursor: 'pointer',
          }}
        >
          ▶ CONTINUE
        </button>
        <button
          onClick={onStartNew}
          style={{
            background: 'none',
            border: 'none',
            color: '#555',
            fontSize: 12,
            letterSpacing: '0.08em',
            cursor: 'pointer',
            padding: '10px 4px',
          }}
        >
          START NEW {showSessionPicker ? '▾' : '▸'}
        </button>
      </div>

      {showSessionPicker && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
          {DAYS.map((s, i) => (
            <button key={s.name} onClick={() => {
              setNextIdx(i);
              setNextSessionIndex(i);
              setShowSessionPicker(false);
              if (onStartSession) onStartSession(s);
            }} style={{
              background: `${s.colour}18`,
              border: `1px solid ${s.colour}44`,
              borderRadius: 8, padding: '10px 12px',
              color: s.colour, fontSize: 12,
              fontFamily: 'var(--font)', fontWeight: 700,
              letterSpacing: '0.06em', cursor: 'pointer',
              textAlign: 'left',
            }}>
              {s.name}
              <div style={{ fontSize: 10, color: '#666', fontWeight: 400, marginTop: 2 }}>
                {s.exercises.length} exercises
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Sparkline({ data, width = 72, height = 36, colour = '#4A90D9' }) {
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
      <circle cx={lx} cy={ly} r="2.5" fill={colour} />
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

  return (
    <div
      style={{
        padding: '20px 16px',
        fontFamily: 'var(--font)',
        color: '#e8e8e8',
        maxWidth: 480,
        margin: '0 auto',
      }}
    >
      {/* ── Header ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '0.04em', marginBottom: 4 }}>
          SUMMER 2026
        </div>
        <div
          style={{
            fontSize: 11,
            color: '#666',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          WEEK {week} · {phase.toUpperCase()}
        </div>
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

        {/* Progress bar */}
        <div
          style={{
            height: 3,
            background: '#2a2a2a',
            borderRadius: 2,
            marginBottom: 6,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${pct}%`,
              background: phaseColour,
              borderRadius: 2,
              transition: 'width 0.4s ease',
            }}
          />
        </div>

        <div style={{ fontSize: 10, color: '#444' }}>
          {week} of 12 weeks · {pct}% complete
        </div>
      </div>

      {/* ── Current Session card (in-progress) or Next Session card ── */}
      {savedSession ? (
        <InProgressCard
          savedSession={savedSession}
          onContinue={onContinueSession}
          onStartNew={() => { setShowSessionPicker((v) => !v); }}
          showSessionPicker={showSessionPicker}
          nextIdx={nextIdx}
          setNextIdx={setNextIdx}
          setShowSessionPicker={setShowSessionPicker}
          onStartSession={onStartSession}
        />
      ) : (
        <div
          style={{
            background: tintedBg(nextSession.colour),
            border: `1px solid ${nextSession.colour}33`,
            borderRadius: 12,
            padding: '16px 16px 14px',
            marginBottom: 20,
          }}
        >
          {/* accent bar */}
          <div style={{ height: 3, background: nextSession.colour, opacity: 0.6, margin: '-16px -16px 14px', borderRadius: '12px 12px 0 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
            <div style={{ fontSize: 10, color: '#666', letterSpacing: '0.12em' }}>NEXT SESSION</div>
            <span style={{
              background: `${nextSession.colour}18`, border: `1px solid ${nextSession.colour}33`,
              borderRadius: 10, color: nextSession.colour, fontSize: 9, padding: '2px 8px', letterSpacing: '.06em',
            }}>
              {nextSession.exercises.length} exercises
            </span>
          </div>

          <div style={{ fontSize: 20, fontWeight: 700, color: nextSession.colour, letterSpacing: '0.03em', marginBottom: 4, marginTop: 6 }}>
            {nextSession.name}
          </div>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
            {nextSession.subtitle}
          </div>

          {/* Exercise preview chips */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            {nextSession.exercises.slice(0, 3).map((ex) => (
              <span key={ex.name} style={{
                background: `${nextSession.colour}12`, border: `1px solid ${nextSession.colour}28`,
                borderRadius: 4, color: '#888', fontSize: 9, padding: '2px 7px',
              }}>
                {ex.name.split(' ').slice(0, 3).join(' ')}
              </span>
            ))}
            {nextSession.exercises.length > 3 && (
              <span style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 4, color: '#444', fontSize: 9, padding: '2px 7px' }}>
                +{nextSession.exercises.length - 3} more
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button onClick={handleStart} style={{
              background: nextSession.colour, color: '#fff', border: 'none', borderRadius: 8,
              padding: '10px 24px', fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', cursor: 'pointer',
            }}>
              ▶ START
            </button>
            <button onClick={handleChange} style={{
              background: 'none', border: 'none', color: '#666',
              fontSize: 12, letterSpacing: '0.08em', cursor: 'pointer', padding: '10px 4px',
            }}>
              CHANGE {showSessionPicker ? '▾' : '▸'}
            </button>
          </div>

          {showSessionPicker && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
              {DAYS.map((s, i) => (
                <button key={s.name} onClick={() => {
                  setNextIdx(i);
                  setNextSessionIndex(i);
                  setShowSessionPicker(false);
                }} style={{
                  background: `${s.colour}18`, border: `1px solid ${s.colour}44`,
                  borderRadius: 8, padding: '10px 12px', color: s.colour, fontSize: 12,
                  fontFamily: 'var(--font)', fontWeight: 700, letterSpacing: '0.06em',
                  cursor: 'pointer', textAlign: 'left',
                }}>
                  {s.name}
                  <div style={{ fontSize: 10, color: '#666', fontWeight: 400, marginTop: 2 }}>
                    {s.exercises.length} exercises
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── This Week strip ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: '#555', letterSpacing: '0.1em', marginBottom: 10 }}>
          THIS WEEK
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {weekDays.map((day, i) => {
            const dStr = toDateStr(day);
            const isToday = dStr === todayStr;
            const logEntry = sessionByDate[dStr];
            const dailyEntry = dailyLog[dStr];
            const sessionName = logEntry?.sessionName;
            const abbr = sessionName ? SESSION_ABBR[sessionName] : null;
            const colour = sessionName ? DAYS.find((d) => d.name === sessionName)?.colour : null;
            const bw = dailyEntry?.weight;

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
                <div
                  style={{
                    fontSize: 10,
                    color: isToday ? '#e8e8e8' : '#444',
                    letterSpacing: '0.05em',
                  }}
                >
                  {DAY_LETTER[day.getDay()]}
                </div>
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    borderRadius: 6,
                    background: abbr ? colour + '22' : 'transparent',
                    border: abbr
                      ? `1px solid ${colour}66`
                      : isToday
                      ? '1px solid #3a3a3a'
                      : '1px dashed #2a2a2a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 9,
                    fontWeight: 700,
                    color: colour || '#333',
                    letterSpacing: '0.02em',
                  }}
                >
                  {abbr || ''}
                </div>
                <div style={{ fontSize: 9, color: '#444' }}>
                  {bw != null ? bw.toFixed(1) : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full split completion */}
      {fullSplitComplete && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          marginTop: -10, marginBottom: 20,
          padding: '8px 12px',
          background: '#5BBD7211',
          border: '1px solid #5BBD7233',
          borderRadius: 8,
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#5BBD72',
            boxShadow: '0 0 6px #5BBD72',
            flexShrink: 0,
          }} />
          <span style={{ fontSize: 10, color: '#5BBD72', fontWeight: 700, letterSpacing: '0.14em' }}>
            FULL SPLIT COMPLETE
          </span>
          <div style={{ flex: 1, height: 1, background: '#5BBD7222' }} />
          <span style={{ fontSize: 10, color: '#5BBD7288' }}>✓</span>
        </div>
      )}

      {/* ── TODAY + Habits ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {/* Bodyweight */}
        <div
          style={{
            flex: 1,
            background: '#1a1a1a',
            border: '1px solid #2a2a2a',
            borderRadius: 12,
            padding: '14px 14px',
          }}
        >
          <div style={{ fontSize: 10, color: '#555', letterSpacing: '0.1em', marginBottom: 10 }}>
            TODAY
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <input
                  type="number"
                  step="0.1"
                  min="40"
                  max="150"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  onBlur={handleWeightBlur}
                  placeholder="—"
                  style={{
                    background: '#222',
                    border: '1px solid #2a2a2a',
                    borderRadius: 6,
                    color: '#e8e8e8',
                    fontSize: 20,
                    fontFamily: 'var(--font)',
                    fontWeight: 700,
                    width: 80,
                    padding: '4px 8px',
                    outline: 'none',
                  }}
                />
                <span style={{ fontSize: 12, color: '#666' }}>kg</span>
              </div>
              {weightDelta != null && (
                <div style={{
                  fontSize: 9, marginTop: 4, letterSpacing: '.06em',
                  color: weightDelta <= 0 ? '#4A90D9' : '#E8634Acc',
                }}>
                  {weightDelta > 0 ? '↑' : '↓'} {Math.abs(weightDelta).toFixed(1)} vs last week
                </div>
              )}
            </div>
            <Sparkline data={sparklineData} />
          </div>
        </div>

        {/* Habits */}
        <div
          style={{
            background: '#1a1a1a',
            border: '1px solid #2a2a2a',
            borderRadius: 12,
            padding: '14px 14px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div style={{ fontSize: 10, color: '#555', letterSpacing: '0.1em' }}>HABITS</div>
          <div style={{ display: 'flex', gap: 12 }}>
            {HABIT_CONFIG.map(({ key, colour }) => {
              const done = todayEntry?.habits?.[key] || false;
              return (
                <button
                  key={key}
                  onClick={() => toggleHabit(key)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 4,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 36,
                    minHeight: 36,
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 22 22">
                    <circle
                      cx="11"
                      cy="11"
                      r="9"
                      fill={done ? colour : 'none'}
                      stroke={done ? colour : '#333'}
                      strokeWidth="1.5"
                    />
                  </svg>
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {HABIT_CONFIG.map(({ key, label }) => (
              <span key={key} style={{ fontSize: 9, color: '#444', width: 22, textAlign: 'center' }}>
                {label || ''}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Muscle Volume ── */}
      <div style={{ padding: '16px', background: '#1a1a1a', borderRadius: 12, border: '1px solid #2a2a2a' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 11, letterSpacing: '2px', color: '#666' }}>7-DAY MUSCLE VOLUME</div>
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
        <div
          ref={illustrationRef}
          style={{ display: 'flex', justifyContent: 'center', visibility: momentPhase !== 'idle' ? 'hidden' : 'visible' }}
        >
          {muscleView === 'front'
            ? <MuscleIllustration size={140} weeklyVolume={weeklyVolume} volumeTargets={volumeTargets} />
            : <MuscleIllustrationBack size={140} weeklyVolume={weeklyVolume} volumeTargets={volumeTargets} />
          }
        </div>
        <div style={{ textAlign: 'center', fontSize: 10, color: '#444', marginTop: 8 }}>
          {muscleView === 'front' ? 'front view · last 7 days' : 'back view · last 7 days'}
        </div>
        <MuscleBreakdown weeklyVolume={weeklyVolume} volumeTargets={volumeTargets} />
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

