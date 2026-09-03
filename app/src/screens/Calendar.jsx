import { useState } from 'react';
import { DAYS } from '../data/programme';
import { getSessionLog, getDailyLog, saveDailyEntry, updateSessionRating, updateSessionDate } from '../data/storage';
import { toDateStr } from '../utils/dateUtils';

function getCalendarMonths() {
  // History begins with the first logged block (April 2026) and runs to the current month,
  // newest first, so the calendar always opens on this month.
  const historyStart = new Date(2026, 3, 1);
  const today = new Date();
  const months = [];
  const start = new Date(historyStart.getFullYear(), historyStart.getMonth(), 1);
  const endMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  let current = new Date(start);

  while (current <= endMonth) {
    months.push({ year: current.getFullYear(), month: current.getMonth() });
    current.setMonth(current.getMonth() + 1);
  }

  while (months.length < 3) {
    const last = months[months.length - 1];
    const next = new Date(last.year, last.month + 1, 1);
    months.push({ year: next.getFullYear(), month: next.getMonth() });
  }

  return months.reverse();
}

const MONTHS = getCalendarMonths();

const SESSION_COLOURS = {
  'Push A': '#C41E2E',
  'Push B': '#C41E2E',
  'Pull A': '#4361EE',
  'Pull B': '#4361EE',
  'Legs A': '#0F8F60',
  'Legs B': '#0F8F60',
  Freestyle: '#fafafa',
};

const HABIT_COLOURS = ['#4361EE', '#C41E2E', '#E53935'];
const HABIT_KEYS = ['sauna', 'protein', 'private'];
const DAY_HEADERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const HABIT_CONFIG_MODAL = [
  { key: 'sauna', label: 'sauna', colour: '#4361EE' },
  { key: 'protein', label: 'protein', colour: '#C41E2E' },
  { key: 'private', label: null, colour: '#E53935' },
];

const WORKOUT_GROUPS = ['Push', 'Pull', 'Legs'].map((group) => ({
  group,
  sessions: DAYS.filter((day) => day.name.startsWith(`${group} `)),
}));

function MonthGrid({ year, month, todayStr, sessionByDate, dailyLog, onDayTap }) {
  const monthName = new Date(year, month, 1).toLocaleString('en-GB', { month: 'long', year: 'numeric' });
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let index = 0; index < startOffset; index += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);

  return (
    <div style={{ marginBottom: 32 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.1em',
          color: '#888',
          marginBottom: 10,
          textTransform: 'uppercase',
        }}
      >
        {monthName}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
        {DAY_HEADERS.map((header, index) => (
          <div
            key={`${header}-${index}`}
            style={{ fontSize: 9, color: '#444', textAlign: 'center', padding: '2px 0', fontFamily: 'var(--font)' }}
          >
            {header}
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} />;
          }

          const dateStr = toDateStr(new Date(year, month, day));
          const isFuture = dateStr > todayStr;
          const isToday = dateStr === todayStr;
          const session = sessionByDate[dateStr];
          const daily = dailyLog[dateStr] || {};
          const habits = daily.habits || {};
          const sessionColour = session ? SESSION_COLOURS[session.sessionName] : null;
          const hasAnyHabit = HABIT_KEYS.some((key) => habits[key]);

          return (
            <div
              key={day}
              onClick={() => !isFuture && onDayTap(dateStr)}
              style={{
                background: sessionColour ? `${sessionColour}18` : '#141414',
                border: isToday
                  ? '1px solid #e8e8e8'
                  : `1px solid ${sessionColour ? `${sessionColour}30` : '#1e1e1e'}`,
                borderRadius: 6,
                padding: '4px 4px 3px',
                cursor: isFuture ? 'default' : 'pointer',
                opacity: isFuture ? 0.3 : 1,
                minHeight: 52,
                fontFamily: 'var(--font)',
              }}
            >
              <div style={{ fontSize: 10, color: isToday ? '#e8e8e8' : '#666', marginBottom: 2 }}>{day}</div>
              {session?.rating && (
                <div style={{ fontSize: 9, color: sessionColour || '#888' }}>{session.rating}/10</div>
              )}
              {hasAnyHabit && (
                <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
                  {HABIT_KEYS.map((key, habitIndex) =>
                    habits[key] ? (
                      <div
                        key={key}
                        style={{ width: 5, height: 5, borderRadius: '50%', background: HABIT_COLOURS[habitIndex] }}
                      />
                    ) : null
                  )}
                </div>
              )}
              {daily.weight != null && (
                <div style={{ fontSize: 8, color: '#444', marginTop: 2 }}>{daily.weight}</div>
              )}
              {daily.reflection && (
                <div
                  style={{
                    fontSize: 8,
                    color: '#555',
                    fontStyle: 'italic',
                    marginTop: 1,
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                  }}
                >
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

function DayEditModal({ dateStr, sessionEntry, dailyEntry, onSave, onClose, onViewSession, onAddWorkout }) {
  const [habits, setHabits] = useState(() => dailyEntry.habits || { sauna: false, protein: false, private: false });
  const [bodyweight, setBodyweight] = useState(() => (dailyEntry.weight != null ? String(dailyEntry.weight) : ''));
  const [reflection, setReflection] = useState(() => dailyEntry.reflection || '');
  const [rating, setRating] = useState(() => sessionEntry?.rating ?? null);
  const [sessionDateStr, setSessionDateStr] = useState(() => sessionEntry?.date?.slice(0, 10) || '');

  const date = new Date(`${dateStr}T12:00:00`);
  const dateLabel = date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  const sessionColour = sessionEntry ? SESSION_COLOURS[sessionEntry.sessionName] : null;

  function handleSave() {
    const data = { habits, reflection: reflection.trim() };
    const bodyweightValue = parseFloat(bodyweight);
    if (!Number.isNaN(bodyweightValue)) {
      data.weight = bodyweightValue;
    }
    if (sessionEntry && sessionDateStr && sessionDateStr !== sessionEntry.date?.slice(0, 10)) {
      updateSessionDate(sessionEntry.id, sessionDateStr);
    }
    onSave(data, rating);
  }

  const inputStyle = {
    background: '#222',
    border: '1px solid #2a2a2a',
    borderRadius: 6,
    color: '#e8e8e8',
    fontSize: 14,
    fontFamily: 'var(--font)',
    padding: '8px 10px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200 }} />
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#1a1a1a',
          borderTop: '1px solid #2a2a2a',
          borderRadius: '16px 16px 0 0',
          zIndex: 210,
          maxHeight: '85vh',
          overflowY: 'auto',
          padding: '0 20px 40px',
          fontFamily: 'var(--font)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
          <div style={{ width: 36, height: 4, background: '#333', borderRadius: 2 }} />
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#e8e8e8', marginBottom: 4 }}>{dateLabel}</div>

        {sessionEntry ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: sessionColour || '#888', letterSpacing: '0.06em' }}>
                {sessionEntry.sessionName}
              </div>
              {onViewSession && (
                <button
                  onClick={() => {
                    onClose();
                    onViewSession(sessionEntry);
                  }}
                  style={{
                    background: 'none',
                    border: `1px solid ${(sessionColour || '#555')}55`,
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
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: '#555', letterSpacing: '0.08em', marginBottom: 6 }}>SESSION DATE</div>
              <input
                type="date"
                value={sessionDateStr}
                onChange={(e) => setSessionDateStr(e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
                style={{
                  background: '#222',
                  border: '1px solid #2a2a2a',
                  borderRadius: 6,
                  color: '#e8e8e8',
                  fontSize: 14,
                  fontFamily: 'var(--font)',
                  padding: '8px 10px',
                  outline: 'none',
                  colorScheme: 'dark',
                }}
              />
            </div>
          </>
        ) : (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: '#444', marginBottom: 12 }}>Rest day / No session</div>
            {onAddWorkout && (
              <button
                onClick={onAddWorkout}
                style={{
                  width: '100%',
                  background: 'none',
                  border: '1px solid #C41E2E55',
                  borderRadius: 8,
                  color: '#C41E2E',
                  fontSize: 11,
                  fontFamily: 'var(--font)',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  padding: '11px 0',
                  cursor: 'pointer',
                }}
              >
                ADD WORKOUT
              </button>
            )}
          </div>
        )}

        {sessionEntry && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: '#555', letterSpacing: '0.08em', marginBottom: 8 }}>RATING</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
                <button
                  key={value}
                  onClick={() => setRating(value)}
                  style={{
                    width: 34,
                    height: 34,
                    background: rating === value ? sessionColour || '#555' : '#111',
                    border: `1px solid ${rating === value ? sessionColour || '#555' : '#333'}`,
                    borderRadius: 5,
                    color: rating === value ? '#fff' : '#555',
                    fontSize: 13,
                    fontFamily: 'var(--font)',
                    cursor: 'pointer',
                  }}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: '#555', letterSpacing: '0.08em', marginBottom: 6 }}>REFLECTION</div>
          <input
            type="text"
            placeholder="felt great, tired, sore..."
            value={reflection}
            onChange={(event) => setReflection(event.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: '#555', letterSpacing: '0.08em', marginBottom: 8 }}>HABITS</div>
          <div style={{ display: 'flex', gap: 16 }}>
            {HABIT_CONFIG_MODAL.map(({ key, label, colour }) => {
              const done = habits[key] || false;
              return (
                <button
                  key={key}
                  onClick={() => setHabits((current) => ({ ...current, [key]: !current[key] }))}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24">
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      fill={done ? colour : 'none'}
                      stroke={done ? colour : '#333'}
                      strokeWidth="1.5"
                    />
                  </svg>
                  {label && <span style={{ fontSize: 9, color: '#444', fontFamily: 'var(--font)' }}>{label}</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 10, color: '#555', letterSpacing: '0.08em', marginBottom: 6 }}>BODYWEIGHT (KG)</div>
          <input
            type="number"
            step="0.1"
            min="40"
            max="150"
            placeholder="69.2"
            value={bodyweight}
            onChange={(event) => setBodyweight(event.target.value)}
            style={{ ...inputStyle, width: 120 }}
          />
        </div>

        <button
          onClick={handleSave}
          style={{
            width: '100%',
            background: '#C41E2E',
            border: 'none',
            borderRadius: 8,
            color: '#fff',
            fontSize: 13,
            fontFamily: 'var(--font)',
            fontWeight: 700,
            letterSpacing: '0.08em',
            padding: '13px 0',
            cursor: 'pointer',
          }}
        >
          SAVE
        </button>
      </div>
    </>
  );
}

function WorkoutPickerModal({ dateStr, onSelect, onClose }) {
  const dateLabel = new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 220 }} />
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#1a1a1a',
          borderTop: '1px solid #2a2a2a',
          borderRadius: '16px 16px 0 0',
          zIndex: 230,
          padding: '0 20px 40px',
          fontFamily: 'var(--font)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
          <div style={{ width: 36, height: 4, background: '#333', borderRadius: 2 }} />
        </div>
        <div style={{ fontSize: 11, color: '#888', letterSpacing: '0.1em', marginBottom: 4 }}>ADD WORKOUT</div>
        <div style={{ fontSize: 14, color: '#e8e8e8', fontWeight: 700, marginBottom: 6 }}>{dateLabel}</div>
        <div style={{ fontSize: 11, color: '#555', marginBottom: 18 }}>
          Choose the workout split and whether you want the A or B version.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {WORKOUT_GROUPS.map(({ group, sessions }) => (
            <div key={group}>
              <div style={{ fontSize: 10, color: '#555', letterSpacing: '0.08em', marginBottom: 8 }}>
                {group.toUpperCase()}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {sessions.map((session) => (
                  <button
                    key={session.name}
                    onClick={() => onSelect(session.name)}
                    style={{
                      background: `${session.colour}18`,
                      border: `1px solid ${session.colour}44`,
                      borderRadius: 8,
                      color: session.colour,
                      fontSize: 13,
                      fontFamily: 'var(--font)',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      padding: '14px 0',
                      cursor: 'pointer',
                    }}
                  >
                    {session.name.split(' ')[1]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default function Calendar({ onViewSession, onCreateSession }) {
  const [sessionLog, setSessionLog] = useState(() => getSessionLog());
  const [dailyLog, setDailyLog] = useState(() => getDailyLog());
  const [editDay, setEditDay] = useState(null);
  const [workoutPickerDate, setWorkoutPickerDate] = useState(null);

  const todayStr = toDateStr(new Date());

  const sessionByDate = {};
  sessionLog.forEach((session) => {
    const dateStr = (session.date || '').slice(0, 10);
    if (dateStr) {
      sessionByDate[dateStr] = session;
    }
  });

  function handleSaveDay(dateStr, data, rating) {
    saveDailyEntry(dateStr, data);
    setDailyLog((previous) => ({
      ...previous,
      [dateStr]: { ...(previous[dateStr] || {}), ...data },
    }));

    if (rating !== null && rating !== undefined && sessionByDate[dateStr]) {
      updateSessionRating(dateStr, rating);
    }

    setSessionLog(getSessionLog()); // re-read to pick up any date change
    setEditDay(null);
  }

  function handleSelectWorkout(sessionName) {
    if (onCreateSession && workoutPickerDate) {
      onCreateSession(workoutPickerDate, sessionName);
    }
    setWorkoutPickerDate(null);
  }

  return (
    <div style={{ padding: '20px 16px', fontFamily: 'var(--font)', color: '#e8e8e8', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '0.04em', marginBottom: 20 }}>CALENDAR</div>

      {MONTHS.map((month) => (
        <MonthGrid
          key={`${month.year}-${month.month}`}
          year={month.year}
          month={month.month}
          todayStr={todayStr}
          sessionByDate={sessionByDate}
          dailyLog={dailyLog}
          onDayTap={setEditDay}
        />
      ))}

      {editDay && (
        <DayEditModal
          dateStr={editDay}
          sessionEntry={sessionByDate[editDay]}
          dailyEntry={dailyLog[editDay] || {}}
          onSave={(data, rating) => handleSaveDay(editDay, data, rating)}
          onClose={() => setEditDay(null)}
          onViewSession={onViewSession}
          onAddWorkout={
            sessionByDate[editDay]
              ? undefined
              : () => {
                  setEditDay(null);
                  setWorkoutPickerDate(editDay);
                }
          }
        />
      )}

      {workoutPickerDate && (
        <WorkoutPickerModal
          dateStr={workoutPickerDate}
          onSelect={handleSelectWorkout}
          onClose={() => setWorkoutPickerDate(null)}
        />
      )}
    </div>
  );
}
