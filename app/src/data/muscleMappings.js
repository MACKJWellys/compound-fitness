export const MUSCLE_MAPPINGS = {
  '30° DB Incline Bench': { primary: ['Chest'], secondary: ['Front Delts', 'Triceps'] },
  'Seated DB OHP': { primary: ['Front Delts'], secondary: ['Triceps'] },
  'Cable Lateral Raises': { primary: ['Side Delts'], secondary: [] },
  'Face Pulls': { primary: ['Rear Delts'], secondary: [] },
  'Standing Cable Crossover': { primary: ['Chest'], secondary: ['Front Delts'] },
  'Tricep Superset: OH Ext → Pushdown': { primary: ['Triceps'], secondary: [] },
  'Weighted Cable Crunch': { primary: ['Abs'], secondary: [] },
  'Weighted Pull-ups': { primary: ['Upper Back / Lats'], secondary: ['Biceps'] },
  'Chest-Supported BB Row': { primary: ['Upper Back / Lats'], secondary: ['Biceps', 'Rear Delts'] },
  'Rear Delt Cable Fly': { primary: ['Rear Delts'], secondary: [] },
  'Paused Kettlebell Shrugs': { primary: ['Traps'], secondary: [] },
  'DB Lateral Raises': { primary: ['Side Delts'], secondary: [] },
  'Standing BB Curl': { primary: ['Biceps'], secondary: [] },
  'Incline DB Curl': { primary: ['Biceps'], secondary: [] },
  'Hanging Oblique Knee/Leg Raise': { primary: ['Abs', 'Obliques'], secondary: [] },
  'Seated Stretched Cable Curl': { primary: ['Biceps'], secondary: [] },
  'Hanging Leg Raises': { primary: ['Abs'], secondary: [] },
  'DB Pullover (Posture)': { primary: ['Upper Back / Lats'], secondary: ['Chest'] },
  'Zercher Squat': { primary: ['Quads'], secondary: ['Glutes'] },
  'Leg Press': { primary: ['Quads'], secondary: ['Glutes'] },
  'Leg Extensions': { primary: ['Quads'], secondary: [] },
  'Lying Leg Curl': { primary: ['Hamstrings'], secondary: [] },
  'Standing Calf Raises': { primary: ['Calves'], secondary: [] },
  'Decline Weighted Crunch': { primary: ['Abs'], secondary: [] },
  'KB Oblique Crunches': { primary: ['Obliques'], secondary: [] },
  'Decline Weighted Crunch + KB Obliques': { primary: ['Abs', 'Obliques'], secondary: [] },
  'Flat Barbell Bench Press': { primary: ['Chest'], secondary: ['Front Delts', 'Triceps'] },
  'DB Lateral Raises (Paused)': { primary: ['Side Delts'], secondary: [] },
  'Standing BB OHP': { primary: ['Front Delts'], secondary: ['Triceps'] },
  'Pull-ups (Bodyweight Volume)': { primary: ['Upper Back / Lats'], secondary: ['Biceps'] },
  'Close-Grip Cable Row': { primary: ['Upper Back / Lats'], secondary: ['Biceps'] },
  'Rear Delt Machine Fly': { primary: ['Rear Delts'], secondary: [] },
  'Hammer Curl': { primary: ['Biceps'], secondary: [] },
  'Reverse Dragon Flag Progression': { primary: ['Abs'], secondary: [] },
  'Romanian Deadlift': { primary: ['Hamstrings', 'Glutes'], secondary: ['Lower Back'] },
  'Hip Thrust': { primary: ['Glutes'], secondary: ['Hamstrings'] },
  'Bulgarian Split Squat': { primary: ['Quads', 'Glutes'], secondary: [] },
  'Oblique Cable Crunch': { primary: ['Obliques'], secondary: [] },
  // Freestyle quick-adds
  'Pull Ups': { primary: ['Upper Back / Lats'], secondary: ['Biceps'] },
  'Overhead Press': { primary: ['Front Delts'], secondary: ['Triceps'] },
  'Bench': { primary: ['Chest'], secondary: ['Front Delts', 'Triceps'] },
  'Squats': { primary: ['Quads'], secondary: ['Glutes'] },
  'Delt Raises': { primary: ['Side Delts'], secondary: [] },
};

// Weekly set totals if all 6 sessions are completed, per muscle group:
// Chest: PA(4+3) + PB(4+3) = 14
// Front Delts: PA(2+3+1.5) + PB(2+3+1.5) = 13
// Side Delts: PA(4) + PLA(3) + PB(4) + PLB(4) = 15
// Rear Delts: PA(3) + PLA(2+4) + PLB(4) = 13
// Triceps: PA(2+1.5+3) + PB(2+1.5+3) = 13
// Biceps: PLA(2+2+3+2) + PLB(1.5+2+3+2) = 17.5 → 18
// Traps: PLA(3) + LA(3) + PLB(3) = 9
// Upper Back: PLA(4+4) + PLB(3+4) = 15
// Abs: PA(3) + PLA(4) + LA(3) + PB(3) + PLB(4) + LB(3) = 20
// Obliques: PLA(4) + LA(3) + PLB(4) = 11
// Quads: LA(4+3+3) + LB(3+3) = 16
// Hamstrings: LA(4) + LB(4+4+1.5) = 13.5 → 14
// Glutes: LA(2+1.5) + LB(4+3+3) = 13.5 → 14
// Calves: LA(4) + PB(4) + LB(4) = 12
export const VOLUME_TARGETS_DEFAULT = {
  Chest: 14,
  'Upper Back / Lats': 15,
  'Side Delts': 15,
  'Rear Delts': 13,
  'Front Delts': 13,
  Triceps: 13,
  Biceps: 18,
  Traps: 9,
  Quads: 16,
  Hamstrings: 14,
  Glutes: 14,
  Calves: 12,
  Abs: 20,
  Obliques: 11,
};
