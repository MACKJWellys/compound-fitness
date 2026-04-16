export const PROGRAMME_START = new Date('2026-04-01');
export const PROGRAMME_END = new Date('2026-06-24');
export const TOTAL_WEEKS = 12;

export const DAYS = [
  {
    name: 'Push A',
    subtitle: 'Upper Chest & Delts Focus',
    colour: '#E8634A',
    exercises: [
      { name: '30° DB Incline Bench', priority: true, sets: '4', reps: '8–10', rest: '2–3 min', note: "Primary press. Start at 26kg DBs. Add 2kg when you hit 4×10. Control the eccentric for 2–3s." },
      { name: 'Seated DB OHP', priority: false, sets: '3', reps: '8–10', rest: '2 min', note: "Start at 20kg DBs. You've hit 22s×8 before — build back to that for 3×10, then move up." },
      { name: 'Cable Lateral Raises', priority: true, sets: '4', reps: '12–15', rest: '60s', note: "Behind-the-body cable, slight lean. Slow eccentric, pause at top. This is your #1 aesthetics exercise. Light weight, perfect form." },
      { name: 'Face Pulls', priority: false, sets: '3', reps: '15–20', rest: '60s', note: "High cable with rope attachment. Pull to your face with elbows flared high. Rear delts and external rotators — keeps shoulders healthy for the long run. Start at 10–12kg, slow and controlled." },
      { name: 'Standing Cable Crossover', priority: false, sets: '3', reps: '12–15', rest: '60s', note: "High cables, chest angled down, split stance. Focus on the full chest contraction at the bottom. Your friend grew his pecs with this — commit to it on both push days and build proficiency." },
      { name: 'Tricep Superset: OH Ext → Pushdown', priority: false, sets: '3', reps: '10–12 + to failure', rest: '90s', note: "Overhead cable extension, then immediately adjust to pushdown position with the same weight and rep to failure. Hits both tricep heads without taxing chest or shoulders when they're already spent." },
      { name: 'Weighted Cable Crunch', priority: false, sets: '3', reps: '12–15', rest: '60s', note: "Kneeling cable crunches. Focus on curling ribs toward pelvis. Add weight weekly — you want thick abs, not just lean ones." },
    ],
  },
  {
    name: 'Pull A',
    subtitle: 'Horizontal Pull & Biceps',
    colour: '#4A90D9',
    exercises: [
      { name: 'Weighted Pull-ups', priority: true, sets: '4', reps: '5–6', rest: '2–3 min', note: "Your best lift. You hit 20kg×4-5 back in Dec '25 — start at 12.5kg×6 and rebuild. Aim for 17.5kg×5 by week 12. Full dead hang to chest-to-bar." },
      { name: 'Chest-Supported BB Row', priority: true, sets: '4', reps: '8–10', rest: '2 min', note: "Your favourite pull. You've been doing this since session 1. Hit 60×8 recently — build to 70×10. 1s pause at contraction, focus on mid-back squeeze." },
      { name: 'Rear Delt Cable Fly', priority: true, sets: '4', reps: '12–15', rest: '60s', note: "Every pull day, no exceptions. You cracked the technique in Dec — 2.5kg, slow sweep away from body, hitting rear delts way better. Stick with that. Build to 3.75kg×14." },
      { name: 'Paused Kettlebell Shrugs', priority: false, sets: '3', reps: '12–15', rest: '60s', note: "20kg KBs with a full 2s squeeze at the top. Your traps need this consistency — do it every pull day." },
      { name: 'DB Lateral Raises', priority: false, sets: '3', reps: '12–15', rest: '60s', note: "Second dose of lateral raises in the week. Keep the weight the same as Push A — this is volume accumulation, not ego work. 3 sets of 12–15 with a 1s pause." },
      { name: 'Standing BB Curl', priority: false, sets: '3', reps: '8–10', rest: '90s', note: "Elbows pinned at your sides, barbell curl with a slow eccentric. Start at 30kg. Primary bicep builder on this day — quality over everything." },
      { name: 'Incline DB Curl', priority: false, sets: '2', reps: '10–12', rest: '60s', note: "Lie back on an incline bench, arms hanging to stretch the bicep long head. 10–12kg. Pairs with the BB curl to hit the bicep through full range. Good finisher." },
      { name: 'Hanging Oblique Knee/Leg Raise', priority: false, sets: '4', reps: '10–16', rest: '60s', note: "Hang from the bar and raise your knees with a twist — aim to bring each knee toward the opposite elbow alternately. Build toward straight legs over the programme. Hits abs and obliques together." },
    ],
  },
  {
    name: 'Legs A',
    subtitle: 'Quad Focus',
    colour: '#5BBD72',
    exercises: [
      { name: 'Lying Leg Curl', priority: true, sets: '4', reps: '10–12', rest: '60s', note: "First on Legs A to hit hamstrings fresh. 4 sets — slow eccentric, full range. Start at 30kg, build to 40kg×12. Hamstrings on both leg days now means real frequency." },
      { name: 'Zercher Squat', priority: true, sets: '4', reps: '8–10', rest: '3 min', note: "You've been Zerchering consistently since Oct '25 and hit 90×8. You even repped 70×16 and 63×18 in Dec. Build to 100×8 by week 12. If your gym gets a rack, back squats are an option — but Zerchers are working." },
      { name: 'Leg Press', priority: false, sets: '3', reps: '10–12', rest: '2 min', note: "Feet mid-height, shoulder width. Chase volume here. Full range — don't load it up and do quarter reps." },
      { name: 'Leg Extensions', priority: false, sets: '3', reps: '12–15', rest: '60s', note: "You've hit 90×8 in Dec '25. Slow eccentric, squeeze at the top for 1s. Start at 75×12 and build. Teardrop builder." },
      { name: 'Standing Calf Raises', priority: false, sets: '4', reps: '15–20', rest: '60s', note: "Full stretch at bottom, full squeeze at top. Calves need volume and frequency." },
      { name: 'Paused Kettlebell Shrugs', priority: false, sets: '3', reps: '12–15', rest: '60s', note: "Traps on leg day for extra frequency. Same as always — 20kg KBs, 2s squeeze. Quick 3 sets while you catch your breath between compound sets." },
      { name: 'Decline Weighted Crunch', priority: false, sets: '3', reps: '10–12', rest: '60s', note: "Decline crunch with plate on chest (start at 5kg, build to 10kg). Focus on curling ribs toward pelvis." },
      { name: 'KB Oblique Crunches', priority: false, sets: '3', reps: '12 each side', rest: '60s', note: "Side-lying or standing KB oblique crunch. Isolated oblique work to complement the hanging raises on pull days. 3×12 each side." },
    ],
  },
  {
    name: 'Push B',
    subtitle: 'Flat Press & Shoulders',
    colour: '#E8634A',
    exercises: [
      { name: 'Flat Barbell Bench Press', priority: true, sets: '4', reps: '6–8', rest: '3 min', note: "Secondary press day. You've stalled at 80–82.5kg. Stay at 75kg×8 and build to 4×8, then add 2.5kg. Get a spotter." },
      { name: 'DB Lateral Raises (Paused)', priority: true, sets: '4', reps: '12–15', rest: '60s', note: "1s pause at the top of every rep. Start at 7.5kg. Your logs show you jumping to 10–12kg and failing — stay lighter, own the movement." },
      { name: 'Standing BB OHP', priority: false, sets: '3', reps: '8–10', rest: '2 min', note: "You've hit 40×8. Build to 40×10 then 42.5. Standing for core engagement." },
      { name: 'Standing Calf Raises', priority: false, sets: '4', reps: '12–18', rest: '60s', note: "Added on Push B for calf frequency — calves respond to volume and frequency more than most muscles. Full stretch at bottom, squeeze at top." },
      { name: 'Standing Cable Crossover', priority: false, sets: '3', reps: '12–15', rest: '60s', note: "Same variation as Push A. High cables, chest down, split stance. Doing this twice a week builds the movement pattern fast. Progress the weight slowly — contraction quality matters more." },
      { name: 'Tricep Superset: OH Ext → Pushdown', priority: false, sets: '3', reps: '10–12 + to failure', rest: '90s', note: "Same superset as Push A. Overhead extension then pushdown with same weight to failure. Consistent tricep stimulus across both push days." },
      { name: 'Decline Weighted Crunch', priority: false, sets: '3', reps: '10–12', rest: '60s', note: "You've been doing these with 5kg. Progress to 10kg by end of programme. Hold the plate on your chest." },
    ],
  },
  {
    name: 'Pull B',
    subtitle: 'Vertical Pull & Arms',
    colour: '#4A90D9',
    exercises: [
      { name: 'Pull-ups (Bodyweight Volume)', priority: false, sets: '3', reps: 'Max (aim 8–12)', rest: '2 min', note: "Unweighted today. Focus on perfect reps and total volume. Full range, no kipping." },
      { name: 'Close-Grip Cable Row', priority: true, sets: '4', reps: '10–12', rest: '2 min', note: "You hit 50×10 on these. Build to 55–60kg. V-handle, pull to navel, squeeze." },
      { name: 'Rear Delt Machine Fly', priority: true, sets: '4', reps: '12–15', rest: '60s', note: "Different stimulus from cables on Pull A. Same priority — rear delts every pull session." },
      { name: 'Paused Kettlebell Shrugs', priority: false, sets: '3', reps: '12–15', rest: '60s', note: "Same as Pull A. Frequency is what makes traps grow." },
      { name: 'DB Lateral Raises', priority: false, sets: '4', reps: '12–15', rest: '60s', note: "Third dose of lateral raises in the week. 4 sets to push weekly side delt volume. Light and controlled — no swinging." },
      { name: 'Seated Stretched Cable Curl', priority: false, sets: '3', reps: '10–12', rest: '60s', note: "Cable behind your back, elbows pinned back for max stretch under load. You've been doing these since Sep '25 and clearly rate them. Start at 7.5kg, build to 10kg×12." },
      { name: 'Hammer Curl', priority: false, sets: '2', reps: '10–12', rest: '60s', note: "Neutral grip dumbbell curl. Hits the brachialis — fills in the outer arm between the bicep and tricep. Good finisher. 2 sets of 10–12." },
      { name: 'Hanging Oblique Knee/Leg Raise', priority: false, sets: '4', reps: '10–16', rest: '60s', note: "Same as Pull A. Hang from the bar and raise knees with a twist toward each elbow. Build toward straight-leg version. Abs and obliques every pull day." },
    ],
  },
  {
    name: 'Legs B',
    subtitle: 'Hamstring & Glute Focus',
    colour: '#5BBD72',
    exercises: [
      { name: 'Romanian Deadlift', priority: true, sets: '4', reps: '8–10', rest: '2–3 min', note: "You hit 70×10 in Jan and 55×12 with grip failing first in Dec '25. Use chalk or straps — don't let grip limit hamstring development. Progress to 80×10." },
      { name: 'Lying Leg Curl', priority: true, sets: '4', reps: '10–12', rest: '90s', note: "You did these once at 40×8. They need to be a staple. Build to 45kg×12." },
      { name: 'Hip Thrust', priority: false, sets: '3', reps: '10–12', rest: '90s', note: "You were doing these Oct–Dec '25 up to 25kg×10. Pick up where you left off. Great glute builder and pairs well with RDLs." },
      { name: 'Bulgarian Split Squat', priority: false, sets: '3', reps: '10 each leg', rest: '90s', note: "You tried these in Nov '25 with 10kg DBs. Build from there. Fixes left/right imbalances and hits glutes hard." },
      { name: 'Leg Extensions', priority: false, sets: '3', reps: '15–20', rest: '60s', note: "Higher reps on Legs B as a finisher. Light weight, full squeeze." },
      { name: 'Standing Calf Raises', priority: false, sets: '4', reps: '15–20', rest: '60s', note: "Standing on both leg days. Hits the gastrocnemius — the visible calf muscle that matters for aesthetics. Full stretch, full squeeze." },
      { name: 'Weighted Cable Crunch', priority: false, sets: '3', reps: '12–15', rest: '60s', note: "Kneeling cable crunches. Focus on curling ribs toward pelvis. Add weight weekly — you want thick abs, not just lean ones." },
    ],
  },
];

export const PROGRESSION = [
  { weeks: 'Weeks 1–4', title: 'Foundation', detail: 'Hit all sessions. Learn the leg movements. Keep 1–2 reps in reserve on everything. Get your eating dialled — 2,400–2,600 kcal, 140g+ protein. Weigh yourself 3× per week and average it.' },
  { weeks: 'Weeks 5–8', title: 'Push', detail: 'Add weight to your main lifts when you hit the top of the rep range for all sets. Push lateral raises to 4× per week. Introduce intensity techniques: drop sets on the last set of isolation work.' },
  { weeks: 'Weeks 9–12', title: 'Peak', detail: 'You should be 73–74kg. Top sets on compounds can go closer to failure. Add a 5th set to pull-ups and rows if recovering well. Final 2 weeks: slight calorie drop to tighten up for summer if desired.' },
];

export const WEEKLY_STRUCTURE = [
  { day: 'Mon', session: 'Push A' },
  { day: 'Tue', session: 'Pull A' },
  { day: 'Wed', session: 'Legs A' },
  { day: 'Thu', session: 'Push B' },
  { day: 'Fri', session: 'Pull B' },
  { day: 'Sat', session: 'Legs B' },
  { day: 'Sun', session: 'Rest' },
];

export const NON_NEGOTIABLES = [
  { title: 'Eat.', body: "2,400–2,600 kcal daily. 140g+ protein. Don't train fasted." },
  { title: 'Lateral raises 4× per week.', body: 'Push A (cable), Pull A, Push B (paused DB), Pull B — lateral raises every session. This is the fastest route to looking wider.' },
  { title: "Don't skip legs.", body: 'Two leg days per week, every week, no exceptions. You\'ve been Zerchering and doing leg extensions since Oct \'25 — the base is there. Now commit to full sessions.' },
  { title: 'Log your PRs.', body: 'After every session, if you hit a new best at any rep count, log it. This is what makes progression visible and keeps you accountable.' },
  { title: 'Respect the lower back.', body: "Warm up with light rows before heavy pulls. If your back feels off, swap RDLs for leg curls — don't push through it." },
  { title: 'Progression rule:', body: 'When you hit the top of the rep range for all prescribed sets, add 2.5kg (barbell) or 2kg (DB) next session. If you miss reps, stay at the same weight.' },
  { title: 'Rest days matter.', body: 'One full rest day per week minimum. The sauna and e-bike commute help recovery — use them.' },
];
