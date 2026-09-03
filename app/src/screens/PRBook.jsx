import React, { useState } from 'react';
import { getPRBook, addPREntry } from '../data/storage';

const SECTIONS = [
  {
    key: 'PUSH',
    label: 'PUSH',
    colour: '#C41E2E',
    exercises: [
      '30° DB Incline Bench',
      'Flat Barbell Bench Press',
      'Seated DB OHP',
      'Standing BB OHP',
      'DB Lateral Raises (Paused)',
      'DB Lateral Raises',
      'Cable Lateral Raises',
      'Face Pulls',
      'Standing Cable Crossover',
      'Tricep Superset: OH Ext → Pushdown',
      'Decline Weighted Crunch',
      'Weighted Cable Crunch',
    ],
  },
  {
    key: 'PULL',
    label: 'PULL',
    colour: '#4361EE',
    exercises: [
      'Weighted Pull-ups',
      'Pull-ups (Bodyweight Volume)',
      'Chest-Supported BB Row',
      'Close-Grip Cable Row',
      'Rear Delt Cable Fly',
      'Rear Delt Machine Fly',
      'Paused Kettlebell Shrugs',
      'Standing BB Curl',
      'Seated Stretched Cable Curl',
      'Incline DB Curl',
      'Hammer Curl',
      'Hanging Oblique Knee/Leg Raise',
      'Romanian Deadlift',
    ],
  },
  {
    key: 'LEGS',
    label: 'LEGS',
    colour: '#0F8F60',
    exercises: [
      'Zercher Squat',
      'Leg Press',
      'Leg Extensions',
      'Lying Leg Curl',
      'Hip Thrust',
      'Bulgarian Split Squat',
      'Standing Calf Raises',
      'Decline Weighted Crunch',
      'KB Oblique Crunches',
    ],
  },
];

const MAX_PR_COLS = 6;

function getBestPR(exerciseData) {
  let best = null;
  Object.entries(exerciseData || {}).forEach(([reps, entries]) => {
    (entries || []).forEach((entry) => {
      const w = parseFloat(entry.weight);
      if (!isNaN(w) && (best === null || w > best.weight || (w === best.weight && parseInt(reps) < best.reps))) {
        best = { weight: w, reps: parseInt(reps) };
      }
    });
  });
  return best;
}

function formatEntry(entry) {
  if (!entry) return '—';
  const w = entry.weight ?? '';
  const d = entry.date ?? '';
  if (w && d) return `${w}  ${d}`;
  if (w) return `${w}`;
  return '—';
}

function ExerciseTable({ exerciseName, exerciseData, sectionColour, onAdded }) {
  const [showForm, setShowForm] = useState(false);
  const [repInput, setRepInput] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [saving, setSaving] = useState(false);

  const repKeys = Object.keys(exerciseData || {})
    .map(Number)
    .sort((a, b) => a - b);

  const hasAnyData = repKeys.some((r) => (exerciseData[r] || []).length > 0);

  // Determine how many columns we need (cap at MAX_PR_COLS)
  const maxEntries = repKeys.reduce((m, r) => Math.max(m, (exerciseData[r] || []).length), 0);
  const numCols = Math.min(maxEntries, MAX_PR_COLS);

  function handleSave() {
    if (!repInput || !weightInput) return;
    setSaving(true);
    addPREntry(exerciseName, repInput, weightInput, dateInput || null);
    setRepInput('');
    setWeightInput('');
    setDateInput('');
    setSaving(false);
    setShowForm(false);
    onAdded();
  }

  const colWidth = numCols > 0 ? `${Math.floor(220 / numCols)}px` : '80px';

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
        <div style={{ fontSize: 12, color: '#e8e8e8', letterSpacing: '0.05em' }}>
          {exerciseName}
        </div>
        {(() => {
          const best = getBestPR(exerciseData);
          if (best) {
            return (
              <span style={{ flexShrink: 0 }}>
                <span style={{ fontSize: 10, color: sectionColour || '#e8e8e8', fontWeight: 700 }}>{best.weight}kg</span>
                <span style={{ fontSize: 10, color: '#555' }}> × {best.reps}</span>
              </span>
            );
          }
          return <span style={{ fontSize: 10, color: '#444', fontStyle: 'italic', flexShrink: 0 }}>no PR yet</span>;
        })()}
      </div>

      {!hasAnyData && repKeys.length === 0 ? (
        <div style={{ fontSize: 11, color: '#444', fontStyle: 'italic', marginBottom: 8 }}>
          No PRs yet — be the first to log one
        </div>
      ) : (
        <div
          style={{
            overflowX: 'auto',
            marginBottom: 6,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `36px repeat(${Math.max(numCols, 1)}, minmax(${colWidth}, 1fr))`,
              minWidth: 260,
            }}
          >
            {/* Header row */}
            <div style={cellStyle(true, true)}>Reps</div>
            {Array.from({ length: Math.max(numCols, 1) }).map((_, ci) => (
              <div key={ci} style={cellStyle(true, false)}>
                PR #{ci + 1}
              </div>
            ))}

            {/* Data rows */}
            {repKeys.map((rep, ri) => {
              const entries = exerciseData[rep] || [];
              const isLast = ri === repKeys.length - 1;
              let bestIdx = -1;
              let bestWeight = -Infinity;
              entries.forEach((e, i) => {
                const w = parseFloat(e.weight) || 0;
                if (w > bestWeight) { bestWeight = w; bestIdx = i; }
              });
              return (
                <React.Fragment key={rep}>
                  <div style={cellStyle(false, true, isLast)}>
                    {rep}
                  </div>
                  {Array.from({ length: Math.max(numCols, 1) }).map((_, ci) => (
                    <div key={`${rep}-${ci}`} style={cellStyle(false, false, isLast, ci === bestIdx && bestIdx >= 0)}>
                      {formatEntry(entries[ci])}
                    </div>
                  ))}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Add PR button / form */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          style={{
            background: 'none',
            border: '1px solid #2a2a2a',
            borderRadius: 4,
            color: '#555',
            fontSize: 10,
            padding: '4px 10px',
            letterSpacing: '0.08em',
            cursor: 'pointer',
          }}
        >
          + ADD PR
        </button>
      ) : (
        <div
          style={{
            background: '#1a1a1a',
            border: '1px solid #2a2a2a',
            borderRadius: 6,
            padding: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              type="number"
              placeholder="Reps"
              value={repInput}
              onChange={(e) => setRepInput(e.target.value)}
              style={inputStyle}
            />
            <input
              type="text"
              placeholder="Weight (e.g. 82.5)"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              style={{ ...inputStyle, flex: 2 }}
            />
            <input
              type="text"
              placeholder="Date dd.mm (opt)"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleSave}
              disabled={saving || !repInput || !weightInput}
              style={{
                background: '#222',
                border: '1px solid #3a3a3a',
                borderRadius: 4,
                color: '#e8e8e8',
                fontSize: 11,
                padding: '5px 14px',
                letterSpacing: '0.08em',
                cursor: 'pointer',
              }}
            >
              SAVE
            </button>
            <button
              onClick={() => setShowForm(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#555',
                fontSize: 11,
                padding: '5px 8px',
                cursor: 'pointer',
              }}
            >
              cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function cellStyle(isHeader, isFirstCol, isLastRow = false, isHighlight = false) {
  return {
    padding: '4px 6px',
    fontSize: isHeader ? 9 : 11,
    color: isHeader ? '#444' : isFirstCol ? '#666' : isHighlight ? '#F0A500' : '#c8c8c8',
    fontWeight: isHighlight ? 700 : 400,
    letterSpacing: '0.04em',
    borderBottom: isLastRow ? 'none' : '1px solid #1e1e1e',
    borderRight: isFirstCol ? '1px solid #1e1e1e' : 'none',
    whiteSpace: 'nowrap',
    textAlign: isFirstCol && !isHeader ? 'right' : 'left',
    fontFamily: 'var(--font)',
    background: isHeader ? '#161616' : 'transparent',
  };
}

const inputStyle = {
  background: '#111',
  border: '1px solid #2a2a2a',
  borderRadius: 4,
  color: '#e8e8e8',
  fontSize: 11,
  padding: '5px 8px',
  flex: 1,
  minWidth: 60,
  fontFamily: 'var(--font)',
};

function CollapsibleSection({ label, colour, defaultOpen, count, children }) {
  const [open, setOpen] = useState(defaultOpen ?? true);
  return (
    <div style={{ marginBottom: 24 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'none', border: 'none', padding: '8px 0',
          cursor: 'pointer', width: '100%', textAlign: 'left',
        }}
      >
        <div style={{ width: 3, height: 18, background: colour || '#555', borderRadius: 2, flexShrink: 0 }} />
        <span style={{
          fontSize: 11, fontWeight: 700, color: colour || '#e8e8e8',
          letterSpacing: '0.14em', fontFamily: 'var(--font)',
        }}>
          {label}
        </span>
        <div style={{ flex: 1, height: 1, background: colour || '#2a2a2a', opacity: 0.14 }} />
        {count != null && (
          <span style={{ fontSize: 9, color: colour || '#555', opacity: 0.4, letterSpacing: '.06em', flexShrink: 0 }}>
            {count} exercises
          </span>
        )}
        <span style={{ fontSize: 10, color: '#555', marginLeft: 4, flexShrink: 0 }}>{open ? '▾' : '▸'}</span>
      </button>
      {open && <div style={{ marginTop: 8 }}>{children}</div>}
    </div>
  );
}

export default function PRBook() {
  const [prBook, setPrBook] = useState(() => getPRBook());

  function refresh() {
    setPrBook(getPRBook());
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#111111',
        fontFamily: 'var(--font)',
        color: '#e8e8e8',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '20px 20px 12px',
          borderBottom: '1px solid #2a2a2a',
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '0.1em', color: '#e8e8e8' }}>
          PR BOOK
        </div>
      </div>

      <div style={{ padding: '20px 20px', maxWidth: 600 }}>
        {/* PUSH / PULL / LEGS sections */}
        {SECTIONS.map((section) => (
          <CollapsibleSection
            key={section.key}
            label={section.label}
            colour={section.colour}
            count={section.exercises.length}
            defaultOpen
          >
            {section.exercises.map((exName) => {
              const exData = prBook[exName] || {};
              return (
                <ExerciseTable
                  key={exName}
                  exerciseName={exName}
                  exerciseData={exData}
                  sectionColour={section.colour}
                  onAdded={refresh}
                />
              );
            })}
          </CollapsibleSection>
        ))}
      </div>
    </div>
  );
}

