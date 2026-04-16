import { useState } from "react";

const DAYS = [
  {
    name: "Push A",
    subtitle: "Upper Chest & Delts Focus",
    colour: "#E8634A",
    exercises: [
      {
        name: "30° DB Incline Bench",
        priority: true,
        sets: "4",
        reps: "8–10",
        rest: "2–3 min",
        note: "Primary press. Start at 26kg DBs. Add 2kg when you hit 4×10. Control the eccentric for 2–3s.",
      },
      {
        name: "Seated DB OHP",
        priority: false,
        sets: "3",
        reps: "8–10",
        rest: "2 min",
        note: "Start at 20kg DBs. You've hit 22s×8 before — build back to that for 3×10, then move up.",
      },
      {
        name: "Cable Lateral Raises",
        priority: true,
        sets: "4",
        reps: "12–15",
        rest: "60s",
        note: "Behind-the-body cable, slight lean. Slow eccentric, pause at top. This is your #1 aesthetics exercise. Light weight, perfect form.",
      },
      {
        name: "Standing Cable Crossover",
        priority: false,
        sets: "3",
        reps: "12–15",
        rest: "60s",
        note: "High cables, chest angled down, split stance. Focus on the full chest contraction at the bottom. Your friend grew his pecs with this — commit to it on both push days and build proficiency.",
      },
      {
        name: "Tricep Superset: OH Ext → Pushdown",
        priority: false,
        sets: "3",
        reps: "10–12 + to failure",
        rest: "90s",
        note: "Overhead cable extension, then immediately adjust to pushdown position with the same weight and rep to failure. Hits both tricep heads without taxing chest or shoulders when they're already spent.",
      },
      {
        name: "Weighted Cable Crunch",
        priority: false,
        sets: "3",
        reps: "12–15",
        rest: "60s",
        note: "Kneeling cable crunches. Focus on curling ribs toward pelvis. Add weight weekly — you want thick abs, not just lean ones.",
      },
    ],
  },
  {
    name: "Pull A",
    subtitle: "Horizontal Pull & Biceps",
    colour: "#4A90D9",
    exercises: [
      {
        name: "Weighted Pull-ups",
        priority: true,
        sets: "4",
        reps: "5–6",
        rest: "2–3 min",
        note: "Your best lift. You hit 20kg×4-5 back in Dec '25 — start at 12.5kg×6 and rebuild. Aim for 17.5kg×5 by week 12. Full dead hang to chest-to-bar.",
      },
      {
        name: "Chest-Supported BB Row",
        priority: true,
        sets: "4",
        reps: "8–10",
        rest: "2 min",
        note: "Your favourite pull. You've been doing this since session 1. Hit 60×8 recently — build to 70×10. 1s pause at contraction, focus on mid-back squeeze.",
      },
      {
        name: "Rear Delt Cable Fly",
        priority: true,
        sets: "4",
        reps: "12–15",
        rest: "60s",
        note: "Every pull day, no exceptions. You cracked the technique in Dec — 2.5kg, slow sweep away from body, hitting rear delts way better. Stick with that. Build to 3.75kg×14.",
      },
      {
        name: "Paused Kettlebell Shrugs",
        priority: false,
        sets: "3",
        reps: "12–15",
        rest: "60s",
        note: "20kg KBs with a full 2s squeeze at the top. Your traps need this consistency — do it every pull day.",
      },
      {
        name: "Seated Stretched Cable Curl",
        priority: false,
        sets: "3",
        reps: "10–12",
        rest: "60s",
        note: "Cable behind your back, elbows pinned back for max stretch under load. You've been doing these since Sep '25 and clearly rate them. Start at 7.5kg, build to 10kg×12.",
      },
      {
        name: "Hanging Leg Raises",
        priority: false,
        sets: "3",
        reps: "10–12",
        rest: "60s",
        note: "Straight legs if possible. Slower is better. Builds lower ab thickness and complements the cable crunches on push days.",
      },
      {
        name: "DB Pullover (Posture)",
        priority: false,
        sets: "2",
        reps: "12–14",
        rest: "60s",
        note: "Nick's recommendation from Dec. 6–8kg, focus on the stretch. You noted tightness improving — keep these in. Quick 2 sets at the end.",
      },
    ],
  },
  {
    name: "Legs A",
    subtitle: "Quad Focus",
    colour: "#5BBD72",
    exercises: [
      {
        name: "Zercher Squat",
        priority: true,
        sets: "4",
        reps: "8–10",
        rest: "3 min",
        note: "You've been Zerchering consistently since Oct '25 and hit 90×8. You even repped 70×16 and 63×18 in Dec. Build to 100×8 by week 12. If your gym gets a rack, back squats are an option — but Zerchers are working.",
      },
      {
        name: "Leg Press",
        priority: true,
        sets: "3",
        reps: "10–12",
        rest: "2 min",
        note: "Feet mid-height, shoulder width. Chase volume here. Full range — don't load it up and do quarter reps.",
      },
      {
        name: "Leg Extensions",
        priority: false,
        sets: "3",
        reps: "12–15",
        rest: "60s",
        note: "You've hit 90×8 in Dec '25. Slow eccentric, squeeze at the top for 1s. Start at 75×12 and build. Teardrop builder.",
      },
      {
        name: "Lying Leg Curl",
        priority: false,
        sets: "3",
        reps: "10–12",
        rest: "60s",
        note: "Hamstrings on both leg days now. Start at 30kg, slow eccentric. Having this here means your hamstrings get frequency they've been missing.",
      },
      {
        name: "Standing Calf Raises",
        priority: false,
        sets: "4",
        reps: "15–20",
        rest: "60s",
        note: "Full stretch at bottom, full squeeze at top. Calves need volume and frequency.",
      },
      {
        name: "Decline Weighted Crunch + KB Obliques",
        priority: false,
        sets: "3+3",
        reps: "10–12 / 12 each side",
        rest: "60s",
        note: "Decline crunch with plate on chest (start at 5kg, build to 10kg), then kettlebell oblique crunches. Movements you've been doing and will actually do.",
      },
    ],
  },
  {
    name: "Push B",
    subtitle: "Flat Press & Shoulders",
    colour: "#E8634A",
    exercises: [
      {
        name: "Flat Barbell Bench Press",
        priority: true,
        sets: "4",
        reps: "6–8",
        rest: "3 min",
        note: "Secondary press day. You've stalled at 80–82.5kg. Stay at 75kg×8 and build to 4×8, then add 2.5kg. Get a spotter.",
      },
      {
        name: "DB Lateral Raises (Paused)",
        priority: true,
        sets: "4",
        reps: "12–15",
        rest: "60s",
        note: "1s pause at the top of every rep. Start at 7.5kg. Your logs show you jumping to 10–12kg and failing — stay lighter, own the movement.",
      },
      {
        name: "Standing BB OHP",
        priority: false,
        sets: "3",
        reps: "8–10",
        rest: "2 min",
        note: "You've hit 40×8. Build to 40×10 then 42.5. Standing for core engagement.",
      },
      {
        name: "Standing Cable Crossover",
        priority: false,
        sets: "3",
        reps: "12–15",
        rest: "60s",
        note: "Same variation as Push A. High cables, chest down, split stance. Doing this twice a week builds the movement pattern fast. Progress the weight slowly — contraction quality matters more.",
      },
      {
        name: "Tricep Superset: OH Ext → Pushdown",
        priority: false,
        sets: "3",
        reps: "10–12 + to failure",
        rest: "90s",
        note: "Same superset as Push A. Overhead extension then pushdown with same weight to failure. Consistent tricep stimulus across both push days.",
      },
      {
        name: "Decline Weighted Crunch",
        priority: false,
        sets: "3",
        reps: "10–12",
        rest: "60s",
        note: "You've been doing these with 5kg. Progress to 10kg by end of programme. Hold the plate on your chest.",
      },
    ],
  },
  {
    name: "Pull B",
    subtitle: "Vertical Pull & Arms",
    colour: "#4A90D9",
    exercises: [
      {
        name: "Pull-ups (Bodyweight Volume)",
        priority: false,
        sets: "3",
        reps: "Max (aim 8–12)",
        rest: "2 min",
        note: "Unweighted today. Focus on perfect reps and total volume. Full range, no kipping.",
      },
      {
        name: "Close-Grip Cable Row",
        priority: true,
        sets: "4",
        reps: "10–12",
        rest: "2 min",
        note: "You hit 50×10 on these. Build to 55–60kg. V-handle, pull to navel, squeeze.",
      },
      {
        name: "Rear Delt Machine Fly",
        priority: true,
        sets: "4",
        reps: "12–15",
        rest: "60s",
        note: "Different stimulus from cables on Pull A. Same priority — rear delts every pull session.",
      },
      {
        name: "Paused Kettlebell Shrugs",
        priority: false,
        sets: "3",
        reps: "12–15",
        rest: "60s",
        note: "Same as Pull A. Frequency is what makes traps grow.",
      },
      {
        name: "Seated Stretched Cable Curl",
        priority: false,
        sets: "3",
        reps: "10–12",
        rest: "60s",
        note: "Same as Pull A. Consistency on your best bicep exercise. If you fancy variety, try a different grip width or single-arm.",
      },
      {
        name: "Reverse Dragon Flag Progression",
        priority: false,
        sets: "3",
        reps: "8–10",
        rest: "60s",
        note: "You clearly enjoy these. Keep them — they're great for lower abs and core control.",
      },
    ],
  },
  {
    name: "Legs B",
    subtitle: "Hamstring & Glute Focus",
    colour: "#5BBD72",
    exercises: [
      {
        name: "Romanian Deadlift",
        priority: true,
        sets: "4",
        reps: "8–10",
        rest: "2–3 min",
        note: "You hit 70×10 in Jan and 55×12 with grip failing first in Dec '25. Use chalk or straps — don't let grip limit hamstring development. Progress to 80×10.",
      },
      {
        name: "Lying Leg Curl",
        priority: true,
        sets: "4",
        reps: "10–12",
        rest: "90s",
        note: "You did these once at 40×8. They need to be a staple. Build to 45kg×12.",
      },
      {
        name: "Hip Thrust",
        priority: false,
        sets: "3",
        reps: "10–12",
        rest: "90s",
        note: "You were doing these Oct–Dec '25 up to 25kg×10. Pick up where you left off. Great glute builder and pairs well with RDLs.",
      },
      {
        name: "Bulgarian Split Squat",
        priority: false,
        sets: "3",
        reps: "10 each leg",
        rest: "90s",
        note: "You tried these in Nov '25 with 10kg DBs. Build from there. Fixes left/right imbalances and hits glutes hard.",
      },
      {
        name: "Leg Extensions",
        priority: false,
        sets: "3",
        reps: "15–20",
        rest: "60s",
        note: "Higher reps on Legs B as a finisher. Light weight, full squeeze.",
      },
      {
        name: "Standing Calf Raises",
        priority: false,
        sets: "4",
        reps: "15–20",
        rest: "60s",
        note: "Standing on both leg days. Hits the gastrocnemius — the visible calf muscle that matters for aesthetics. Full stretch, full squeeze.",
      },
      {
        name: "Oblique Cable Crunch",
        priority: false,
        sets: "3",
        reps: "12 each side",
        rest: "60s",
        note: "You've done the kettlebell version. Cable version lets you progress the load more precisely.",
      },
    ],
  },
];

const PROGRESSION = [
  {
    weeks: "Weeks 1–4",
    title: "Foundation",
    detail:
      "Hit all sessions. Learn the leg movements. Keep 1–2 reps in reserve on everything. Get your eating dialled — 2,400–2,600 kcal, 140g+ protein. Weigh yourself 3× per week and average it.",
  },
  {
    weeks: "Weeks 5–8",
    title: "Push",
    detail:
      "Add weight to your main lifts when you hit the top of the rep range for all sets. Push lateral raises to 4× per week. Introduce intensity techniques: drop sets on the last set of isolation work.",
  },
  {
    weeks: "Weeks 9–12",
    title: "Peak",
    detail:
      "You should be 73–74kg. Top sets on compounds can go closer to failure. Add a 5th set to pull-ups and rows if recovering well. Final 2 weeks: slight calorie drop to tighten up for summer if desired.",
  },
];

const WEEKLY_STRUCTURE = [
  { day: "1", session: "Push A" },
  { day: "2", session: "Pull A" },
  { day: "3", session: "Legs A" },
  { day: "4", session: "Push B" },
  { day: "5", session: "Pull B" },
  { day: "6", session: "Legs B" },
  { day: "7", session: "Rest" },
];

export default function SummerPPL() {
  const [activeDay, setActiveDay] = useState(0);
  const [activePhase, setActivePhase] = useState(null);
  const [showWeek, setShowWeek] = useState(false);

  const day = DAYS[activeDay];

  return (
    <div
      style={{
        fontFamily: "'IBM Plex Mono', 'SF Mono', 'Menlo', monospace",
        maxWidth: 720,
        margin: "0 auto",
        padding: "24px 16px",
        color: "var(--text-color, #1a1a1a)",
        background: "transparent",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            margin: 0,
            letterSpacing: "-0.5px",
            lineHeight: 1.2,
          }}
        >
          SUMMER 2026
        </h1>
        <p
          style={{
            fontSize: 13,
            margin: "4px 0 0",
            opacity: 0.5,
            letterSpacing: "2px",
            textTransform: "uppercase",
          }}
        >
          12-Week PPL Programme
        </p>
        <div
          style={{
            marginTop: 16,
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          {["Lateral Delts", "Upper Chest", "Quads", "Traps", "Core Depth"].map(
            (tag) => (
              <span
                key={tag}
                style={{
                  fontSize: 11,
                  padding: "3px 10px",
                  borderRadius: 20,
                  border: "1px solid var(--border-color, #ddd)",
                  letterSpacing: "0.5px",
                  opacity: 0.7,
                }}
              >
                {tag}
              </span>
            )
          )}
        </div>
      </div>

      {/* Weekly overview toggle */}
      <button
        onClick={() => setShowWeek(!showWeek)}
        style={{
          width: "100%",
          padding: "12px 16px",
          marginBottom: 16,
          background: showWeek
            ? "var(--text-color, #1a1a1a)"
            : "transparent",
          color: showWeek
            ? "var(--bg-color, #fff)"
            : "var(--text-color, #1a1a1a)",
          border: "1.5px solid var(--text-color, #1a1a1a)",
          borderRadius: 8,
          fontFamily: "inherit",
          fontSize: 12,
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        {showWeek ? "▾" : "▸"} Session Rotation
      </button>
      {showWeek && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 4,
            marginBottom: 24,
          }}
        >
          {WEEKLY_STRUCTURE.map((d) => (
            <div
              key={d.day}
              style={{
                textAlign: "center",
                padding: "10px 4px",
                borderRadius: 6,
                background:
                  d.session === "Rest"
                    ? "transparent"
                    : d.session.includes("Push")
                    ? "#E8634A15"
                    : d.session.includes("Pull")
                    ? "#4A90D915"
                    : "#5BBD7215",
                border:
                  d.session === "Rest"
                    ? "1px dashed var(--border-color, #ddd)"
                    : "1px solid transparent",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  opacity: 0.5,
                  marginBottom: 4,
                }}
              >
                {d.day}
              </div>
              <div style={{ fontSize: 10, fontWeight: 600 }}>
                {d.session}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Day selector tabs */}
      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 24,
          overflowX: "auto",
          paddingBottom: 4,
        }}
      >
        {DAYS.map((d, i) => (
          <button
            key={d.name}
            onClick={() => setActiveDay(i)}
            style={{
              flex: "none",
              padding: "10px 14px",
              border:
                activeDay === i
                  ? `2px solid ${d.colour}`
                  : "1.5px solid var(--border-color, #ddd)",
              borderRadius: 8,
              background:
                activeDay === i ? `${d.colour}12` : "transparent",
              color:
                activeDay === i ? d.colour : "var(--text-color, #1a1a1a)",
              fontFamily: "inherit",
              fontSize: 11,
              fontWeight: activeDay === i ? 700 : 500,
              cursor: "pointer",
              whiteSpace: "nowrap",
              letterSpacing: "0.3px",
            }}
          >
            {d.name}
          </button>
        ))}
      </div>

      {/* Active day content */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
            {day.name}
          </h2>
          <p
            style={{
              fontSize: 13,
              margin: "2px 0 0",
              color: day.colour,
              fontWeight: 600,
            }}
          >
            {day.subtitle}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {day.exercises.map((ex, i) => (
            <ExerciseCard key={i} exercise={ex} colour={day.colour} index={i} />
          ))}
        </div>
      </div>

      {/* Progression phases */}
      <div style={{ marginBottom: 24 }}>
        <h3
          style={{
            fontSize: 12,
            letterSpacing: "2px",
            textTransform: "uppercase",
            opacity: 0.5,
            marginBottom: 12,
            fontWeight: 600,
          }}
        >
          12-Week Progression
        </h3>
        {PROGRESSION.map((phase, i) => (
          <button
            key={i}
            onClick={() => setActivePhase(activePhase === i ? null : i)}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "14px 16px",
              marginBottom: 6,
              border: "1.5px solid var(--border-color, #ddd)",
              borderRadius: 8,
              background:
                activePhase === i
                  ? "var(--text-color, #1a1a1a)"
                  : "transparent",
              color:
                activePhase === i
                  ? "var(--bg-color, #fff)"
                  : "var(--text-color, #1a1a1a)",
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700 }}>
                {phase.title}
              </span>
              <span style={{ fontSize: 11, opacity: 0.6 }}>
                {phase.weeks}
              </span>
            </div>
            {activePhase === i && (
              <p
                style={{
                  fontSize: 12,
                  lineHeight: 1.6,
                  margin: "10px 0 0",
                  opacity: 0.85,
                }}
              >
                {phase.detail}
              </p>
            )}
          </button>
        ))}
      </div>

      {/* Key rules */}
      <div
        style={{
          padding: "16px",
          border: "1.5px solid var(--border-color, #ddd)",
          borderRadius: 8,
          fontSize: 12,
          lineHeight: 1.7,
        }}
      >
        <h3
          style={{
            fontSize: 12,
            letterSpacing: "2px",
            textTransform: "uppercase",
            opacity: 0.5,
            margin: "0 0 10px",
            fontWeight: 600,
          }}
        >
          Non-Negotiables
        </h3>
        <p style={{ margin: 0 }}>
          <strong>Eat.</strong> You've trained multiple times on sub-900
          calories. That's over now. 2,400–2,600 kcal daily. 140g+ protein.
          Don't train fasted.
        </p>
        <p style={{ margin: "8px 0 0" }}>
          <strong>Lateral raises happen 4× per week.</strong> Push A, Push B,
          and add a quick 3×15 at the end of both Pull days if you have time.
          This is the fastest route to looking wider.
        </p>
        <p style={{ margin: "8px 0 0" }}>
          <strong>Don't skip legs.</strong> Two leg days per week, every week,
          no exceptions. You've been Zerchering and doing leg extensions since
          Oct '25 — the base is there. Now commit to full sessions.
        </p>
        <p style={{ margin: "8px 0 0" }}>
          <strong>Log your PRs.</strong> You started a tracker and fell off.
          The updated spreadsheet has all your current bests carried over.
          After every session, if you hit a new best at any rep count, log it.
          This is what makes progression visible and keeps you accountable.
        </p>
        <p style={{ margin: "8px 0 0" }}>
          <strong>Respect the lower back.</strong> Your 2025 logs show a facet
          irritation in Nov and multiple sessions cut short by erector
          tightness. Warm up with light rows before heavy pulls. If your back
          feels off, swap RDLs for leg curls — don't push through it.
        </p>
        <p style={{ margin: "8px 0 0" }}>
          <strong>Progression rule:</strong> When you hit the top of the rep
          range for all prescribed sets, add 2.5kg (barbell) or 2kg (DB) next
          session. If you miss reps, stay at the same weight. Log it in the
          spreadsheet.
        </p>
        <p style={{ margin: "8px 0 0" }}>
          <strong>Rest days matter.</strong> One full rest day per week
          minimum. The sauna and e-bike commute help recovery — use them.
        </p>
      </div>
    </div>
  );
}

function ExerciseCard({ exercise, colour, index }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "14px 16px",
        border: exercise.priority
          ? `1.5px solid ${colour}50`
          : "1.5px solid var(--border-color, #ddd)",
        borderRadius: 8,
        background: exercise.priority ? `${colour}08` : "transparent",
        fontFamily: "'IBM Plex Mono', 'SF Mono', monospace",
        cursor: "pointer",
        color: "var(--text-color, #1a1a1a)",
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              {exercise.name}
            </span>
            {exercise.priority && (
              <span
                style={{
                  fontSize: 9,
                  padding: "2px 6px",
                  borderRadius: 10,
                  background: colour,
                  color: "#fff",
                  fontWeight: 700,
                  letterSpacing: "0.5px",
                }}
              >
                KEY
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: 11,
              opacity: 0.5,
              marginTop: 4,
            }}
          >
            {exercise.sets} sets × {exercise.reps} · {exercise.rest} rest
          </div>
        </div>
        <span style={{ fontSize: 14, opacity: 0.3, lineHeight: 1 }}>
          {expanded ? "−" : "+"}
        </span>
      </div>
      {expanded && (
        <p
          style={{
            fontSize: 12,
            lineHeight: 1.6,
            margin: "10px 0 0",
            opacity: 0.75,
            borderTop: "1px solid var(--border-color, #ddd)",
            paddingTop: 10,
          }}
        >
          {exercise.note}
        </p>
      )}
    </button>
  );
}
