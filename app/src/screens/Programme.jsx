import { useState } from 'react';
import { DAYS, PROGRESSION, NON_NEGOTIABLES, WEEKLY_STRUCTURE, TOTAL_WEEKS } from '../data/programme';

function ExerciseCard({ exercise }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        background: '#1a1a1a',
        border: '1px solid #2a2a2a',
        borderRadius: 8,
        marginBottom: 10,
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: '#e8e8e8', letterSpacing: '0.03em', fontWeight: 600 }}>
                {exercise.name}
              </span>
              {exercise.priority && (
                <span
                  style={{
                    fontSize: 9,
                    color: '#C41E2E',
                    border: '1px solid #C41E2E44',
                    borderRadius: 3,
                    padding: '1px 5px',
                    letterSpacing: '0.08em',
                  }}
                >
                  KEY
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: '#666', marginTop: 4, letterSpacing: '0.03em' }}>
              {exercise.sets} sets × {exercise.reps} · {exercise.rest} rest
            </div>
          </div>
          {exercise.note && (
            <button
              onClick={() => setExpanded((e) => !e)}
              style={{
                background: 'none',
                border: 'none',
                color: '#444',
                fontSize: 10,
                padding: '2px 0',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                letterSpacing: '0.04em',
                flexShrink: 0,
              }}
            >
              {expanded ? '▾ less' : '▸ more'}
            </button>
          )}
        </div>
      </div>
      {expanded && exercise.note && (
        <div
          style={{
            borderTop: '1px solid #222',
            padding: '10px 14px',
            fontSize: 11,
            color: '#888',
            lineHeight: 1.6,
            letterSpacing: '0.02em',
          }}
        >
          {exercise.note}
        </div>
      )}
    </div>
  );
}

function CollapsibleBlock({ label, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 16 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'none',
          border: 'none',
          padding: '10px 0',
          cursor: 'pointer',
          width: '100%',
          textAlign: 'left',
          borderTop: '1px solid #2a2a2a',
        }}
      >
        <span style={{ fontSize: 10, color: '#555' }}>{open ? '▾' : '▸'}</span>
        <span
          style={{
            fontSize: 11,
            color: '#aaa',
            letterSpacing: '0.08em',
            fontFamily: 'var(--font)',
            fontWeight: 600,
          }}
        >
          {label}
        </span>
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

function SessionRotation() {
  return (
    <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 4,
          minWidth: 320,
        }}
      >
        {WEEKLY_STRUCTURE.map((item) => {
          const dayObj = DAYS.find((d) => d.name === item.session);
          const colour = dayObj ? dayObj.colour : '#444';
          const isRest = item.session === 'Rest';
          return (
            <div key={item.day} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: '#555', letterSpacing: '0.06em', marginBottom: 4 }}>
                {item.day.toUpperCase()}
              </div>
              <div
                style={{
                  fontSize: 9,
                  color: isRest ? '#333' : colour,
                  background: isRest ? '#161616' : `${colour}18`,
                  border: `1px solid ${isRest ? '#222' : colour + '44'}`,
                  borderRadius: 4,
                  padding: '4px 2px',
                  letterSpacing: '0.04em',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.session}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProgressionBlock() {
  const [activePhase, setActivePhase] = useState(null);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {PROGRESSION.map((phase, i) => {
          const isActive = activePhase === i;
          return (
            <button
              key={i}
              onClick={() => setActivePhase(isActive ? null : i)}
              style={{
                background: isActive ? '#222' : 'none',
                border: `1px solid ${isActive ? '#3a3a3a' : '#2a2a2a'}`,
                borderRadius: 4,
                color: isActive ? '#e8e8e8' : '#666',
                fontSize: 10,
                padding: '5px 12px',
                cursor: 'pointer',
                letterSpacing: '0.06em',
                fontFamily: 'var(--font)',
              }}
            >
              {phase.title.toUpperCase()}
            </button>
          );
        })}
      </div>
      {activePhase !== null && (
        <div
          style={{
            background: '#1a1a1a',
            border: '1px solid #2a2a2a',
            borderRadius: 6,
            padding: '12px 14px',
          }}
        >
          <div style={{ fontSize: 9, color: '#555', letterSpacing: '0.08em', marginBottom: 6 }}>
            {PROGRESSION[activePhase].weeks.toUpperCase()}
          </div>
          <div style={{ fontSize: 11, color: '#aaa', lineHeight: 1.65, letterSpacing: '0.02em' }}>
            {PROGRESSION[activePhase].detail}
          </div>
        </div>
      )}
    </div>
  );
}

function NonNegotiablesList() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {NON_NEGOTIABLES.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: 10 }}>
          <div style={{ fontSize: 10, color: '#444', paddingTop: 1, flexShrink: 0 }}>{i + 1}.</div>
          <div>
            <span style={{ fontSize: 11, color: '#e8e8e8', fontWeight: 600 }}>{item.title} </span>
            <span style={{ fontSize: 11, color: '#888', lineHeight: 1.6 }}>{item.body}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Programme() {
  const [activeDay, setActiveDay] = useState(0);
  const session = DAYS[activeDay];

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
      <div style={{ padding: '20px 20px 14px', borderBottom: '1px solid #2a2a2a' }}>
        <div style={{ fontSize: 11, color: '#555', letterSpacing: '0.12em', marginBottom: 2 }}>
          SEPTEMBER – DECEMBER 2026
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '0.08em', color: '#e8e8e8' }}>
          {TOTAL_WEEKS}-Week PPL Programme
        </div>
      </div>

      {/* Day tabs */}
      <div
        style={{
          display: 'flex',
          overflowX: 'auto',
          gap: 6,
          padding: '12px 20px',
          borderBottom: '1px solid #2a2a2a',
        }}
      >
        {DAYS.map((day, i) => {
          const isActive = i === activeDay;
          return (
            <button
              key={day.name}
              onClick={() => setActiveDay(i)}
              style={{
                background: isActive ? `${day.colour}18` : 'none',
                border: `1px solid ${isActive ? day.colour : '#2a2a2a'}`,
                borderRadius: 6,
                color: isActive ? day.colour : '#555',
                fontSize: 10,
                padding: '6px 12px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                letterSpacing: '0.06em',
                fontFamily: 'var(--font)',
                flexShrink: 0,
              }}
            >
              {day.name.toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* Session content */}
      <div style={{ padding: '20px 20px', maxWidth: 600 }}>
        {/* Session title */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: session.colour,
              letterSpacing: '0.08em',
              marginBottom: 4,
            }}
          >
            {session.name}
          </div>
          <div style={{ fontSize: 11, color: '#666', letterSpacing: '0.04em' }}>{session.subtitle}</div>
        </div>

        {/* Exercise cards */}
        <div style={{ marginBottom: 8 }}>
          {session.exercises.map((ex) => (
            <ExerciseCard key={ex.name} exercise={ex} />
          ))}
        </div>

        {/* Collapsible sections */}
        <CollapsibleBlock label="SESSION ROTATION">
          <SessionRotation />
        </CollapsibleBlock>

        <CollapsibleBlock label="12-WEEK PROGRESSION">
          <ProgressionBlock />
        </CollapsibleBlock>

        <CollapsibleBlock label="NON-NEGOTIABLES">
          <NonNegotiablesList />
        </CollapsibleBlock>
      </div>
    </div>
  );
}
