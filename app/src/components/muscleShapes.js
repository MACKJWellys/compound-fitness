// Shared SVG shape data for MuscleIllustration and MuscleAnimationOverlay
// viewBox: "0 0 200 320"

// Each entry: { key, wave, elements[] }
// element: { side: 'left'|'right'|'center', tag: 'path'|'rect'|'ellipse', ...attrs }
// side 'left'  → animates from the left
// side 'right' → animates from the right
// side 'center'→ animates from the left (centre muscles)
// wave 1-2: 0.85s duration; wave 3-4: 0.50s (1.7× faster)

export const MUSCLE_VIEWBOX = "0 0 200 320";

export const MUSCLE_SHAPES = [
  {
    key: 'Traps',
    wave: 1,
    elements: [
      { side: 'center', tag: 'path', d: 'M76 64 Q88 58 100 56 Q112 58 124 64 L126 76 Q113 70 100 68 Q87 70 74 76Z' },
    ],
  },
  {
    key: 'Side Delts',
    wave: 1,
    elements: [
      { side: 'left',  tag: 'path', d: 'M74 66 Q58 70 50 88 Q46 104 50 118 Q56 128 66 126 Q74 120 76 106 Q78 90 76 76 Q76 70 74 66Z' },
      { side: 'right', tag: 'path', d: 'M126 66 Q142 70 150 88 Q154 104 150 118 Q144 128 134 126 Q126 120 124 106 Q122 90 124 76 Q124 70 126 66Z' },
    ],
  },
  {
    key: 'Front Delts',
    wave: 1,
    elements: [
      { side: 'left',  tag: 'path', d: 'M74 66 Q68 72 66 84 Q64 96 68 108 Q72 116 76 112 Q78 100 78 86 Q78 74 76 68Z' },
      { side: 'right', tag: 'path', d: 'M126 66 Q132 72 134 84 Q136 96 132 108 Q128 116 124 112 Q122 100 122 86 Q122 74 124 68Z' },
    ],
  },
  {
    key: 'Upper Chest',
    wave: 2,
    elements: [
      { side: 'left',  tag: 'path', d: 'M76 72 Q88 68 100 68 L100 94 Q90 98 78 96 Q76 88 76 78Z' },
      { side: 'right', tag: 'path', d: 'M100 68 Q112 68 124 72 L124 78 Q124 88 122 96 Q110 98 100 94Z' },
    ],
  },
  {
    key: 'Chest',
    wave: 2,
    elements: [
      { side: 'left',  tag: 'path', d: 'M78 96 Q90 98 100 94 L100 124 Q92 130 82 128 Q76 122 76 110 Q76 102 78 96Z' },
      { side: 'right', tag: 'path', d: 'M100 94 Q110 98 122 96 L124 110 Q124 122 118 128 Q108 130 100 124Z' },
    ],
  },
  {
    key: 'Upper Back / Lats',
    wave: 2,
    elements: [
      { side: 'left',  tag: 'path', d: 'M68 104 Q58 120 60 148 Q64 160 74 156 Q78 142 78 126 Q78 112 74 104Z' },
      { side: 'right', tag: 'path', d: 'M132 104 Q142 120 140 148 Q136 160 126 156 Q122 142 122 126 Q122 112 126 104Z' },
    ],
  },
  {
    key: 'Biceps',
    wave: 2,
    elements: [
      { side: 'left',  tag: 'path', d: 'M54 116 Q46 136 48 160 Q52 172 62 170 Q68 156 66 134 Q63 122 58 114Z' },
      { side: 'right', tag: 'path', d: 'M146 116 Q154 136 152 160 Q148 172 138 170 Q132 156 134 134 Q137 122 142 114Z' },
    ],
  },
  {
    key: 'Triceps',
    wave: 3,
    elements: [
      { side: 'left',  tag: 'path', d: 'M48 160 Q44 178 46 194 Q50 204 58 200 Q62 184 60 170Z' },
      { side: 'right', tag: 'path', d: 'M152 160 Q156 178 154 194 Q150 204 142 200 Q138 184 140 170Z' },
    ],
  },
  {
    key: 'Abs',
    wave: 3,
    elements: [
      { side: 'center', tag: 'rect', x: 83,  y: 130, width: 15, height: 50, rx: 3 },
      { side: 'center', tag: 'rect', x: 102, y: 130, width: 15, height: 50, rx: 3 },
      { side: 'center', tag: 'path', d: 'M83 180 L100 178 L117 180 L114 196 Q100 202 86 196Z' },
    ],
  },
  {
    key: 'Obliques',
    wave: 3,
    elements: [
      { side: 'left',  tag: 'path', d: 'M80 134 Q72 150 72 168 Q74 180 83 182 L83 180 L83 130Z' },
      { side: 'right', tag: 'path', d: 'M120 134 Q128 150 128 168 Q126 180 117 182 L117 180 L117 130Z' },
    ],
  },
  {
    key: 'Quads',
    wave: 4,
    elements: [
      { side: 'left',  tag: 'path', d: 'M74 198 Q64 222 66 260 Q68 276 78 282 Q82 272 82 254 Q84 230 80 202Z' },
      { side: 'left',  tag: 'path', d: 'M84 200 Q82 228 82 254 Q82 268 88 276 Q96 278 100 268 Q102 248 100 220 Q98 206 90 200Z' },
      { side: 'right', tag: 'path', d: 'M126 198 Q136 222 134 260 Q132 276 122 282 Q118 272 118 254 Q116 230 120 202Z' },
      { side: 'right', tag: 'path', d: 'M116 200 Q118 228 118 254 Q118 268 112 276 Q104 278 100 268 Q98 248 100 220 Q102 206 110 200Z' },
      { side: 'left',  tag: 'ellipse', cx: 84,  cy: 282, rx: 9, ry: 6 },
      { side: 'right', tag: 'ellipse', cx: 116, cy: 282, rx: 9, ry: 6 },
    ],
  },
  {
    key: 'Calves',
    wave: 4,
    elements: [
      { side: 'left',  tag: 'path', d: 'M72 298 Q66 316 68 330 Q72 336 80 332 Q84 316 82 298Z' },
      { side: 'right', tag: 'path', d: 'M128 298 Q134 316 132 330 Q128 336 120 332 Q116 316 118 298Z' },
    ],
  },
];

// Static body parts (head, neck) — rendered in overlay but never animated
export const STATIC_SHAPES = [
  { tag: 'ellipse', cx: 100, cy: 26, rx: 19, ry: 23, fill: '#252525', stroke: '#444', strokeWidth: '1.5' },
  { tag: 'path', d: 'M93 47 L93 62 Q100 65 107 62 L107 47 Q100 50 93 47Z', fill: '#252525', stroke: '#333', strokeWidth: '1' },
];
