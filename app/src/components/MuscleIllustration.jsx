import { useState, useEffect } from 'react';
import { MUSCLE_SHAPES, STATIC_SHAPES, MUSCLE_VIEWBOX } from './muscleShapes';

let muscleKFInjected = false;
function ensureMuscleKF() {
  if (muscleKFInjected) return;
  const s = document.createElement('style');
  s.setAttribute('data-muscle-kf', '1');
  s.textContent = `@keyframes musclePulse { 0%{filter:brightness(1)} 40%{filter:brightness(2.8)} 100%{filter:brightness(1)} }`;
  document.head.appendChild(s);
  muscleKFInjected = true;
}

export default function MuscleIllustration({
  weeklyVolume = {},
  volumeTargets = {},
  sessionVolume = {},
  sessionTargets = {},
  mode = 'weekly',
  size = 160,
  pulsingMuscles = [],
}) {
  useEffect(() => { ensureMuscleKF(); }, []);

  function getMuscleColor(muscleKey) {
    const vol = mode === 'session' ? sessionVolume : weeklyVolume;
    const targets = mode === 'session' ? sessionTargets : volumeTargets;
    const sets = vol[muscleKey] || 0;
    const target = targets[muscleKey] || 10;
    if (sets === 0) return '#2a2a2e';
    const ratio = sets / target;
    if (ratio < 0.5) return '#4a5a3a';
    if (ratio < 1.0) return '#c8b400';
    if (ratio < 1.2) return '#0F8F60';
    return '#F0A500';
  }

  function renderElement(el, fill, key, isPulsing) {
    const animStyle = isPulsing ? { style: { animation: 'musclePulse 0.65s ease-out forwards' } } : {};
    const commonProps = { key, fill, stroke: '#18181b', strokeWidth: '1', ...animStyle };
    if (el.tag === 'path') return <path {...commonProps} d={el.d} />;
    if (el.tag === 'rect') return <rect {...commonProps} x={el.x} y={el.y} width={el.width} height={el.height} rx={el.rx} />;
    if (el.tag === 'ellipse') return <ellipse {...commonProps} cx={el.cx} cy={el.cy} rx={el.rx} ry={el.ry} />;
    return null;
  }

  return (
    <svg width={size} height={size * 1.6} viewBox={MUSCLE_VIEWBOX} style={{ display: 'block' }}>
      {/* Static shapes (head, neck) */}
      {STATIC_SHAPES.map((el, i) => {
        const { tag, ...attrs } = el;
        if (tag === 'ellipse') return <ellipse key={`static-${i}`} {...attrs} />;
        if (tag === 'path') return <path key={`static-${i}`} {...attrs} />;
        return null;
      })}

      {/* Muscle shapes */}
      {MUSCLE_SHAPES.map((entry) =>
        entry.elements.map((el, i) =>
          renderElement(el, getMuscleColor(entry.key), `${entry.key}-${i}`, pulsingMuscles.includes(entry.key))
        )
      )}

      {/* ── Sternal line (centre groove) ── */}
      <line x1="100" y1="68" x2="100" y2="124" stroke="#18181b" strokeWidth="1" />
      {/* Clavicular head texture lines — left */}
      <path d="M80 76 Q89 74 97 75" fill="none" stroke="#11111199" strokeWidth="0.8" />
      <path d="M80 82 Q89 80 97 81" fill="none" stroke="#11111188" strokeWidth="0.7" />
      {/* Clavicular head texture lines — right */}
      <path d="M120 76 Q111 74 103 75" fill="none" stroke="#11111199" strokeWidth="0.8" />
      <path d="M120 82 Q111 80 103 81" fill="none" stroke="#11111188" strokeWidth="0.7" />
      {/* Under-pec crease — left */}
      <path d="M78 128 Q88 134 100 130" fill="none" stroke="#18181b" strokeWidth="1" />
      {/* Under-pec crease — right */}
      <path d="M122 128 Q112 134 100 130" fill="none" stroke="#18181b" strokeWidth="1" />

      {/* ── SERRATUS ANTERIOR ── */}
      {/* Left serratus — 3 finger projections */}
      <path d="M76 104 Q68 110 70 118" fill="none" stroke={getMuscleColor('Chest')} strokeWidth="4.5" strokeLinecap="round" />
      <path d="M76 114 Q67 121 69 130" fill="none" stroke={getMuscleColor('Chest')} strokeWidth="4" strokeLinecap="round" />
      <path d="M76 124 Q68 132 70 142" fill="none" stroke={getMuscleColor('Abs')} strokeWidth="3.5" strokeLinecap="round" />
      {/* Right serratus */}
      <path d="M124 104 Q132 110 130 118" fill="none" stroke={getMuscleColor('Chest')} strokeWidth="4.5" strokeLinecap="round" />
      <path d="M124 114 Q133 121 131 130" fill="none" stroke={getMuscleColor('Chest')} strokeWidth="4" strokeLinecap="round" />
      <path d="M124 124 Q132 132 130 142" fill="none" stroke={getMuscleColor('Abs')} strokeWidth="3.5" strokeLinecap="round" />

      {/* ── Abs tendon inscription lines ── */}
      <line x1="83" y1="147" x2="117" y2="147" stroke="#18181b" strokeWidth="0.9" />
      <line x1="83" y1="163" x2="117" y2="163" stroke="#18181b" strokeWidth="0.9" />
      <line x1="85" y1="179" x2="115" y2="179" stroke="#18181b" strokeWidth="0.9" />
      {/* Lower abs centre line */}
      <line x1="100" y1="178" x2="100" y2="196" stroke="#18181b" strokeWidth="0.9" />

      {/* ── FOREARMS ── */}
      <path d="M46 194 Q42 212 44 226 Q48 234 56 230 Q60 214 58 200Z"
        fill="#27272a" stroke="#3f3f46" strokeWidth="0.8" />
      <path d="M154 194 Q158 212 156 226 Q152 234 144 230 Q140 214 142 200Z"
        fill="#27272a" stroke="#3f3f46" strokeWidth="0.8" />

      {/* ── KNEES ── */}
      <ellipse cx="83" cy="290" rx="11" ry="7" fill="#27272a" stroke="#3f3f46" strokeWidth="0.8" />
      <ellipse cx="117" cy="290" rx="11" ry="7" fill="#27272a" stroke="#3f3f46" strokeWidth="0.8" />
    </svg>
  );
}
