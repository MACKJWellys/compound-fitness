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
    if (sets === 0) return '#1e1e1e';
    const ratio = sets / target;
    if (ratio < 0.5) return '#4a5a3a';
    if (ratio < 1.0) return '#c8b400';
    if (ratio < 1.2) return '#5BBD72';
    return '#F0A500';
  }

  function renderElement(el, fill, key, isPulsing) {
    const animStyle = isPulsing ? { style: { animation: 'musclePulse 0.65s ease-out forwards' } } : {};
    const commonProps = { key, fill, stroke: '#111', strokeWidth: '1', ...animStyle };
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
      <line x1="100" y1="68" x2="100" y2="124" stroke="#111" strokeWidth="1" />
      {/* Clavicular head texture lines — left */}
      <path d="M80 76 Q89 74 97 75" fill="none" stroke="#11111199" strokeWidth="0.8" />
      <path d="M80 82 Q89 80 97 81" fill="none" stroke="#11111188" strokeWidth="0.7" />
      {/* Clavicular head texture lines — right */}
      <path d="M120 76 Q111 74 103 75" fill="none" stroke="#11111199" strokeWidth="0.8" />
      <path d="M120 82 Q111 80 103 81" fill="none" stroke="#11111188" strokeWidth="0.7" />
      {/* Under-pec crease — left */}
      <path d="M78 128 Q88 134 100 130" fill="none" stroke="#111" strokeWidth="1" />
      {/* Under-pec crease — right */}
      <path d="M122 128 Q112 134 100 130" fill="none" stroke="#111" strokeWidth="1" />

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
      <line x1="83" y1="147" x2="117" y2="147" stroke="#111" strokeWidth="0.9" />
      <line x1="83" y1="163" x2="117" y2="163" stroke="#111" strokeWidth="0.9" />
      <line x1="85" y1="179" x2="115" y2="179" stroke="#111" strokeWidth="0.9" />
      {/* Lower abs centre line */}
      <line x1="100" y1="178" x2="100" y2="196" stroke="#111" strokeWidth="0.9" />

      {/* ── FOREARMS ── */}
      <path d="M46 194 Q42 212 44 226 Q48 234 56 230 Q60 214 58 200Z"
        fill="#252525" stroke="#3a3a3a" strokeWidth="0.8" />
      <path d="M154 194 Q158 212 156 226 Q152 234 144 230 Q140 214 142 200Z"
        fill="#252525" stroke="#3a3a3a" strokeWidth="0.8" />

      {/* ── KNEES ── */}
      <ellipse cx="83" cy="290" rx="11" ry="7" fill="#252525" stroke="#3a3a3a" strokeWidth="0.8" />
      <ellipse cx="117" cy="290" rx="11" ry="7" fill="#252525" stroke="#3a3a3a" strokeWidth="0.8" />

      {/* ── OUTER BODY CONTOUR (bold, rendered last / on top) ── */}
      <path
        d="M76 64 Q58 68 46 88 Q34 116 36 160 Q38 194 40 226 Q42 250 46 286 Q52 312 66 332 Q72 336 80 332 Q84 310 82 290 Q78 272 78 254 Q76 228 78 198 L88 196 L100 202 L112 196 L122 198 Q124 228 122 254 Q122 272 118 290 Q116 310 120 332 Q128 336 134 332 Q148 312 154 286 Q158 250 160 226 Q162 194 164 160 Q166 116 154 88 Q142 68 124 64 Q112 58 100 56 Q88 58 76 64Z"
        fill="none" stroke="#444" strokeWidth="2.5" strokeLinejoin="round"
      />
    </svg>
  );
}
