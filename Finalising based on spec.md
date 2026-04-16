 Here's what AI found missing based on spec and current app state:

 Missing / Misimplemented Features Found in Spec
                                                                                      
  1. Calendar Tab (Screen 4) — Entirely absent
                         
  Spec (p. Cal section): Full 3-month scrollable calendar (April, May, June 2026) with
   a 4th bottom tab "Cal (▦)". Each day cell shows session colour tint, rating, habit
  dots, bodyweight, and reflection word. Tapping opens a day-edit modal. Currently:
  only 3 tabs exist (Home, PR Book, Programme). No calendar component at all.

  2. Third Habit — Wrong identity, label, and colour

  Spec (Habit Tracking section): The third habit is [Private] — #E53935 red — no label
   anywhere in the UI, just a red dot. The key line: "The third habit has no
  description exposed in the app — it is always rendered as an unlabelled red dot."
  Also, the dailyLog schema uses key private, not stretch. Currently: rendered as
  green #5BBD72 labelled "str" (stretch).

  3. Per-Set Logging in Session Mode — Entirely absent

  Spec (Screen 2, Exercise cards expanded state): Each set gets its own row with KG
  input + REPS input + NOTE freetext input. Logging a set auto-starts the rest timer.
  PR detection fires per set. Currently: only a simple +/− counter tracking total sets
   completed — no weight, reps, or note per set.

  4. In-Session Muscle Illustration — Entirely absent

  Spec (Screen 2, "Collapsible session illustration"): A "MUSCLES" tab/chip in the
  top-right of the session header. Tap to expand a compact front+back SVG showing
  volume for this session only (sets logged vs prescribed). Scoped to the session's
  exercises, not weekly volume. Tap to collapse. Currently: no muscle illustration in
  SessionScreen at all — the MuscleIllustration component only appears on the
  Dashboard.

  ---
  Other Spec Details Worth Flagging

  - dailyLog schema: Spec uses private as the key (not stretch), and includes a
  reflection field — neither currently implemented.
  - Session set data model: The spec's sessionLog stores per-set {weight, reps, note}
  arrays — currently only set counts are tracked, so all historical per-session data
  is structurally incomplete.
  - PR detection mid-set: Should fire after each set is logged — can't work without
  per-set weight/reps inputs.
  - Session completion rating+note modal: Spec requires a 1–10 numbered tap selector +
   optional freetext note before saving — worth verifying this is fully implemented.


Other specifics I remember discussing were: 
a. during a session in session tracking view, i want to be able to tap the PR button next to any exercise, and have a window slide up from the bottom (swipe down to dismiss) which has the PR excel-style sheet viewable. This would enable me during a workout to very easily glance at my current PR numbers across a range of rep ranges and choose what weight to train next.

b. I also remember clarifying that the 12-week weight goals for different exercises can be removed - trying to predict these ahead of time defeats the purpose of my PR system and I may progress much further than these goals - let's remove that 'weight goals' stuff from the app - e.g., in the PR book, the big block of 12-week target text.

c. The program is also not tied to a weekly schedule and is instead rolling - the app should always suggest the next workout in the rotation (and let me change the workout manually if needed). Similarly, the app needs to let me easily rearrange the order of exercises from session view, as well as click a substitue button next to an exercise to change it if the gym is packed, and additionally I should be able to add a custom exercise anywhere from session view incase I do an extra exercise that's not programmed - this won't need to be PR tracked etc. but just needs to be frictionless so it doesn't interrupt my workout flow. 

d. I also notice a lack of refinement of the body muscle illustration and functionality: 1. it should look even more like the reference image Muscle Illustration.png. From the dashboard, you should be able to easily see how close each muscle group is to weekly volume based on it's colour (transparent - 0, yellow - on the way there, green volume hit) and then have a more detailed text based summary beneath - tapping this body should flip it from front-view to back-view helping me to see push/pull muscles in the upper and lower body separately. There should also be another illustration of the same body visible from the session tracking view, except it only needs to show the muscles being trained that day and its colours will not be based on weekly volume, but on session volume - e.g., if chest is getting 8 sets based on the program for a push day, then the chest will be fully green when it reaches that many working sets - this means the body will become coloured as I complete the full workout, and at a glance I'll be able to see how close to hitting my session volume I am. This should be a collapsible chip on the top right so I can expand it to cover the session view, or collapse it to be out of the way.

Finally I'd like a planned round of polish to go into the app - it should still look minimal and I like the current colour scheme, but a round of QoL and small aesthetic or usability changes would be appreciated. The app needs to be frictionless and very usable. 

