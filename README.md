# Interview prep tracker

A single-page tracker for a 14-week interview prep plan (5 December to 12 March): DSA, system design, LLD and machine coding, behavioural, applications and AI rounds.

Open `index.html`, or deploy the folder to any static host. There is no build step and nothing to install. Progress is saved in the browser on each device, and can be exported and restored as a JSON backup from Settings.

## Files

- `index.html`: the page shell.
- `app.css`: styles, including light and dark themes.
- `plan.js`: the plan itself: tracks, items, dates and links, including every problem of Striver’s A2Z sheet (455 problems with a practice link and, where one exists, a video), the Hello Interview design breakdowns and key technologies, and the awesome-low-level-design problem list. Edit this file to change the plan.
- `questions.js`: question banks keyed by item: weekly test prompts, high-level and low-level design prompts, and Outcome School’s AI engineering question bank (Apache 2.0) with answer links.
- `app.js`: the app: the Today dashboard, track pages, applications board, weekly tests, search and commands, focus timer, backups.
- `scripts/daily-email.mjs` and `scripts/send_mail.py`: build and send the morning plan and evening reminder emails from `plan.js`, run by the GitHub Actions workflow in `.github/workflows/daily-email.yml`.

## Using it

- Today: the week and day you are on, a fourteen-week activity calendar, daily rings for problems, hours and items, progress against pace, the plan for any day, badges and levels.
- DSA: every sheet problem under its step and section, with difficulty, a solve link and a video. Ticking a problem counts toward the day’s DSA ring; the stepper on Today is for practice outside the sheet.
- Tracks: every item with its date, learning links, notes, saved links, a revise flag and, where there is one, a question list to expand. Filter by today, this week, not done or to revise, or search.
- Applications: a board you can drag cards across, or a list. Status, next step and weekly target.
- Weekly tests: timed parts with questions drawn from that week, scored 0 to 5, with a score trend.
- Rest days: if a day is not possible, press Rest day on it (or "Can’t practise today" in the hero). Nothing is planned for that day, everything after it moves one day later, and the plan ends a day later. Undo it the same way. The daily email does not know about rest days taken on the site, so on the days after one it runs a day ahead; the site is the source of truth.
- Press Ctrl K or Cmd K anywhere to jump to a section, search items or run an action such as logging a problem or starting a focus session.

## Sources

- Striver’s A2Z DSA sheet by takeUforward, problem list via the Codolio sheet export.
- Hello Interview, System Design in a Hurry: problem breakdowns and key technologies.
- ashishps1/awesome-low-level-design: LLD and concurrency problems.
- Outcome School, AI engineering interview questions company-wise (Apache 2.0).
