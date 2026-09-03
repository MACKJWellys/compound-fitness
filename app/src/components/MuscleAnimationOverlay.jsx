import { useEffect } from 'react';
import { MUSCLE_SHAPES, STATIC_SHAPES, MUSCLE_VIEWBOX } from './muscleShapes';

const WAVE_TIMING = {
  1: { duration: 0.85, delay: 0.05 },
  2: { duration: 0.85, delay: 0.20 },
  3: { duration: 0.50, delay: 0.30 },
  4: { duration: 0.50, delay: 0.38 },
};

const EASING = 'cubic-bezier(.2,.8,.35,1)';

function getMuscleColour(muscleKey, weeklyVolume, volumeTargets) {
  const sets = weeklyVolume[muscleKey] || 0;
  if (sets === 0) return null;
  const target = volumeTargets[muscleKey] || 10;
  const ratio = sets / target;
  if (ratio < 0.5) return '#4a5a3a';
  if (ratio < 1.0) return '#c8b400';
  if (ratio < 1.2) return '#0F8F60';
  return '#F0A500';
}

const KEYFRAMES = `
  @keyframes __mao_fromLeft {
    0%   { opacity:0; transform: translateX(-140vw) scale(0.8); }
    65%  { opacity:1; transform: translateX(3%)     scale(1.04); }
    82%  { transform: translateX(-1%) scale(0.99); }
    100% { opacity:1; transform: translateX(0)      scale(1); }
  }
  @keyframes __mao_fromRight {
    0%   { opacity:0; transform: translateX(140vw)  scale(0.8); }
    65%  { opacity:1; transform: translateX(-3%)    scale(1.04); }
    82%  { transform: translateX(1%)  scale(0.99); }
    100% { opacity:1; transform: translateX(0)      scale(1); }
  }
  @keyframes __mao_flash {
    0%   { filter: brightness(1); }
    25%  { filter: brightness(4.5); }
    100% { filter: brightness(1); }
  }
`;

let keyframesInjected = false;
function ensureKeyframes() {
  if (keyframesInjected) return;
  const style = document.createElement('style');
  style.setAttribute('data-mao', '1');
  style.textContent = KEYFRAMES;
  document.head.appendChild(style);
  keyframesInjected = true;
}

export default function MuscleAnimationOverlay({
  weeklyVolume,
  volumeTargets,
  phase,
  illustrationRect, // BoundingClientRect of the illustration wrapper, captured at animation start
}) {
  useEffect(() => { ensureKeyframes(); }, []);

  // Haptic feedback per wave when animating
  useEffect(() => {
    if (phase !== 'animating' || !navigator.vibrate) return;
    const timers = Object.values(WAVE_TIMING).map(({ delay, duration }) => {
      const ms = (delay + duration * 0.65) * 1000;
      return setTimeout(() => navigator.vibrate(25), ms);
    });
    return () => timers.forEach(clearTimeout);
  }, [phase]);

  if (phase === 'idle') return null;
  if (!illustrationRect) return null;

  // Illustration aspect ratio is 200:320 = 5:8
  // expanded: fill ~72vw, maintain 5:8 ratio
  const expandedW = Math.min(0.72 * window.innerWidth, 340);
  const expandedH = expandedW * 1.6;

  // FLIP coordinates — all in pixels, center-anchored (transform: translate(-50%,-50%))
  const contracted = {
    left: illustrationRect.left + illustrationRect.width / 2,
    top:  illustrationRect.top  + illustrationRect.height / 2,
    width:  illustrationRect.width,
    height: illustrationRect.height,
  };
  const expanded = {
    left: window.innerWidth  / 2,
    top:  window.innerHeight / 2,
    width:  expandedW,
    height: expandedH,
  };

  const isExpanded = phase === 'expanding' || phase === 'animating' || phase === 'settling';
  const pos = isExpanded ? expanded : contracted;
  const overlayAlpha = isExpanded ? 0.95 : 0;
  const stageDuration = phase === 'contracting' ? '0.55s' : '0.45s';

  function renderSVGElement(el, fill, key, animStyle) {
    const baseStyle = animStyle ? { style: animStyle } : {};
    if (el.tag === 'path') {
      return <path key={key} d={el.d} fill={fill} stroke="#111" strokeWidth="1" {...baseStyle} />;
    }
    if (el.tag === 'rect') {
      return <rect key={key} x={el.x} y={el.y} width={el.width} height={el.height} rx={el.rx}
        fill={fill} stroke="#111" strokeWidth="1" {...baseStyle} />;
    }
    if (el.tag === 'ellipse') {
      return <ellipse key={key} cx={el.cx} cy={el.cy} rx={el.rx} ry={el.ry}
        fill={fill} stroke="#111" strokeWidth="1" {...baseStyle} />;
    }
    return null;
  }

  return (
    <>
      {/* Dark overlay */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: `rgba(0,0,0,${overlayAlpha})`,
        transition: 'background 0.35s ease',
        pointerEvents: isExpanded ? 'all' : 'none',
      }} />

      {/* Muscle stage — FLIP positioned */}
      <div style={{
        position: 'fixed',
        zIndex: 210,
        left: pos.left,
        top: pos.top,
        width: pos.width,
        height: pos.height,
        transform: 'translate(-50%, -50%)',
        transition: `left ${stageDuration} cubic-bezier(.4,0,.2,1),
                     top ${stageDuration} cubic-bezier(.4,0,.2,1),
                     width ${stageDuration} cubic-bezier(.4,0,.2,1),
                     height ${stageDuration} cubic-bezier(.4,0,.2,1)`,
        overflow: 'hidden',
      }}>
        <svg viewBox={MUSCLE_VIEWBOX} width="100%" height="100%" style={{ overflow: 'visible', display: 'block' }}>
          {/* Static head + neck */}
          {STATIC_SHAPES.map((el, i) => {
            const { tag, ...attrs } = el;
            if (tag === 'ellipse') return <ellipse key={`st-${i}`} {...attrs} />;
            if (tag === 'path')    return <path    key={`st-${i}`} {...attrs} />;
            return null;
          })}

          {/* Muscle shapes */}
          {MUSCLE_SHAPES.map((entry) => {
            const colour = getMuscleColour(entry.key, weeklyVolume, volumeTargets);
            if (!colour) return null;

            const timing = WAVE_TIMING[entry.wave];
            const flashDelay = timing.delay + timing.duration * 0.65;

            return entry.elements.map((el, i) => {
              const fromRight = el.side === 'right';
              const keyName = `${entry.key}-${i}`;

              if (phase === 'expanding') return null;

              if (phase === 'animating') {
                const dir = fromRight ? '__mao_fromRight' : '__mao_fromLeft';
                const animStyle = {
                  animation: `${dir} ${timing.duration}s ${timing.delay}s ${EASING} both, __mao_flash 0.22s ${flashDelay}s ease-out both`,
                };
                return renderSVGElement(el, colour, keyName, animStyle);
              }

              // settling or contracting — static
              return renderSVGElement(el, colour, keyName, null);
            });
          })}
        </svg>
      </div>
    </>
  );
}
