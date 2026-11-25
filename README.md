# Interview prep tracker

A single-page tracker for a 14-week interview prep plan (5 December to 12 March): DSA, system design, LLD and machine coding, behavioural, applications and AI rounds.

Open `index.html`, or deploy the folder to any static host. There is no build step and nothing to install. Progress is saved in the browser on each device, and can be exported and restored as a JSON backup from Settings.

## Files

- `index.html`: the page shell.
- `app.css`: styles, including light and dark themes.
- `plan.js`: the plan itself (tracks, items, dates and links). Edit this file to change the plan.
- `app.js`: the app: the Today dashboard, track pages, applications board, weekly tests, search and commands, focus timer, backups.
- `scripts/daily-email.mjs` and `scripts/send_mail.py`: build and send the morning plan and evening reminder emails from `plan.js`, run by the GitHub Actions workflow in `.github/workflows/daily-email.yml`.

## Using it

- Today: the week and day you are on, a fourteen-week activity calendar, daily rings for problems, hours and items, progress against pace, the plan for any day, badges and levels.
- Tracks: every item with its date, learning links, notes, saved links and a revise flag. Filter by today, this week, not done or to revise, or search.
- Applications: a board you can drag cards across, or a list. Status, next step and weekly target.
- Weekly tests: timed parts with questions drawn from that week, scored 0 to 5, with a score trend.
- Press Ctrl K or Cmd K anywhere to jump to a section, search items or run an action such as logging a problem or starting a focus session.
