export default function MuscleIllustrationBack({
  weeklyVolume = {},
  volumeTargets = {},
  sessionVolume = {},
  sessionTargets = {},
  mode = 'weekly',
  size = 160,
}) {
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

  const S = { stroke: '#18181b', strokeWidth: '1', strokeLinejoin: 'round' };

  return (
    <svg width={size} height={size * 1.6} viewBox="0 0 200 320" style={{ display: 'block' }}>
      {/* Head (back) */}
      <ellipse cx="100" cy="28" rx="20" ry="24" fill="#27272a" stroke="#3f3f46" strokeWidth="1.5" />
      {/* Neck */}
      <path d="M92 50 L92 64 Q100 66 108 64 L108 50 Q100 52 92 50Z" fill="#27272a" stroke="#3f3f46" strokeWidth="1" />

      {/* Traps */}
      <path d="M74 66 Q87 60 100 58 Q113 60 126 66 L130 82 Q114 76 100 74 Q86 76 70 82Z"
        fill={getMuscleColor('Traps')} {...S} />

      {/* Rear Delts */}
      <path d="M72 76 Q56 80 50 98 Q48 112 56 120 Q64 126 72 118 Q76 108 76 94 Q76 82 74 76Z"
        fill={getMuscleColor('Rear Delts')} {...S} />
      <path d="M128 76 Q144 80 150 98 Q152 112 144 120 Q136 126 128 118 Q124 108 124 94 Q124 82 126 76Z"
        fill={getMuscleColor('Rear Delts')} {...S} />

      {/* Upper Back / Lats */}
      {/* Left lat */}
      <path d="M70 90 Q60 110 62 148 Q66 160 76 156 Q80 142 80 126 Q80 108 76 92Z"
        fill={getMuscleColor('Upper Back / Lats')} {...S} />
      {/* Right lat */}
      <path d="M130 90 Q140 110 138 148 Q134 160 124 156 Q120 142 120 126 Q120 108 124 92Z"
        fill={getMuscleColor('Upper Back / Lats')} {...S} />
      {/* Mid back between lats */}
      <path d="M76 90 Q100 86 124 90 L122 152 Q100 158 78 152Z"
        fill={getMuscleColor('Upper Back / Lats')} {...S} />

      {/* Triceps (visible from back) */}
      <path d="M46 110 Q40 132 42 156 Q46 166 54 163 Q58 148 56 128 Q53 118 49 108Z"
        fill={getMuscleColor('Triceps')} {...S} />
      <path d="M154 110 Q160 132 158 156 Q154 166 146 163 Q142 148 144 128 Q147 118 151 108Z"
        fill={getMuscleColor('Triceps')} {...S} />

      {/* Forearms */}
      <path d="M42 163 Q38 180 40 196 Q44 204 52 200 Q55 184 54 163Z"
        fill="#27272a" stroke="#3f3f46" strokeWidth="0.8" />
      <path d="M158 163 Q162 180 160 196 Q156 204 148 200 Q145 184 146 163Z"
        fill="#27272a" stroke="#3f3f46" strokeWidth="0.8" />

      {/* Lower Back / Erectors */}
      <path d="M82 154 Q100 150 118 154 L116 188 Q100 192 84 188Z"
        fill="#2a2a2e" stroke="#18181b" strokeWidth="0.5" />

      {/* Glutes */}
      <path d="M74 190 Q68 208 70 230 Q74 244 84 246 Q90 238 88 218 Q87 200 82 190Z"
        fill={getMuscleColor('Glutes')} {...S} />
      <path d="M126 190 Q132 208 130 230 Q126 244 116 246 Q110 238 112 218 Q113 200 118 190Z"
        fill={getMuscleColor('Glutes')} {...S} />
      {/* Glute split line */}
      <line x1="100" y1="190" x2="100" y2="246" stroke="#18181b" strokeWidth="0.5" />

      {/* Hamstrings */}
      <path d="M72 248 Q68 270 70 294 Q74 306 82 302 Q86 286 84 264 Q83 250 78 248Z"
        fill={getMuscleColor('Hamstrings')} {...S} />
      <path d="M128 248 Q132 270 130 294 Q126 306 118 302 Q114 286 116 264 Q117 250 122 248Z"
        fill={getMuscleColor('Hamstrings')} {...S} />

      {/* Knees (back) */}
      <ellipse cx="80" cy="306" rx="10" ry="7" fill="#27272a" stroke="#3f3f46" strokeWidth="0.8" />
      <ellipse cx="120" cy="306" rx="10" ry="7" fill="#27272a" stroke="#3f3f46" strokeWidth="0.8" />

      {/* Calves */}
      <path d="M72 314 Q68 328 70 340 Q74 346 82 342 Q84 328 82 314Z"
        fill={getMuscleColor('Calves')} {...S} />
      <path d="M128 314 Q132 328 130 340 Q126 346 118 342 Q116 328 118 314Z"
        fill={getMuscleColor('Calves')} {...S} />
    </svg>
  );
}
