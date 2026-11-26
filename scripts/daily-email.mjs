// Builds and sends the morning plan and the evening reminder.
//
// Account mode (FIREBASE_SERVICE_ACCOUNT set, or FIRESTORE_EMULATOR_HOST for local runs): every signed-in person who
// turned emails on in Settings gets their own email, from their own start date, rest days and ticks, at 7 in the
// morning and 21 in the evening in their own timezone. The job runs hourly; a marker in mail/{uid}.sent keeps it to
// one email of each kind a day.
//
// Single-inbox mode (no service account): one email to MAIL_TO from the plan's default dates, at 7 and 21 in PLAN_TZ.
//
// Env: MODE=morning|evening forces the kind. FORCE_DATE=YYYY-MM-DD builds for that day. PREVIEW=1 writes outbox/
// without sending. DRY_RUN=1 lists who would get what without sending. MAIL_TRANSPORT=json prints instead of sending.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SITE = process.env.SITE_URL || 'https://vgirkar.github.io/interview-prep-tracker/';
const DEFAULT_TZ = process.env.PLAN_TZ || 'Asia/Kolkata';
const MORNING = [7, 10];
const EVENING = [21, 23];
const FORCE_MODE = process.env.MODE === 'morning' || process.env.MODE === 'evening' ? process.env.MODE : null;
const FORCE_DATE = /^\d{4}-\d{2}-\d{2}$/.test(process.env.FORCE_DATE || '') ? process.env.FORCE_DATE : '';
const PREVIEW = process.env.PREVIEW === '1';
const DRY = process.env.DRY_RUN === '1';

/* ---------- the plan, read from plan.js so the site stays the single source of truth ---------- */
const planSrc = fs.readFileSync(path.join(ROOT, 'plan.js'), 'utf8');
const a = planSrc.indexOf('/* ---------- plan ---------- */');
const b = planSrc.indexOf('/* ---------- dates ---------- */');
if (a < 0 || b < 0) throw new Error('Plan section not found in plan.js');
const ctx = {};
vm.runInNewContext(planSrc.slice(a, b) + '\nthis.out={TRACKS,LINKS,START,DAYS,SPLIT,HOURS_DAY};', ctx);
const { TRACKS, LINKS, DAYS, SPLIT } = ctx.out;
const DEFAULT_HOURS = ctx.out.HOURS_DAY;
const DEFAULT_START = isoOf(ctx.out.START.getFullYear(), ctx.out.START.getMonth() + 1, ctx.out.START.getDate());

/* ---------- dates: calendar days since the start, plan days into the 98-day plan, rest days in between ---------- */
function isoOf(y, m, d) { return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`; }
function utc(iso) { const [y, m, d] = iso.split('-').map(Number); return Date.UTC(y, m - 1, d); }
function dayIndex(iso, startIso) { return Math.round((utc(iso) - utc(startIso)) / 864e5); }
function isoShift(startIso, c) { return new Date(utc(startIso) + c * 864e5).toISOString().slice(0, 10); }
function label(iso) { return new Date(utc(iso)).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }); }
function restBefore(c, pauses) { return pauses.filter((p) => p < c).length; }
// Hours a day set the pace: the plan is written for DEFAULT_HOURS a day, so at half the hours a plan day takes two calendar days.
function span(c, pauses, hours) { const f = DEFAULT_HOURS / hours, cc = c - restBefore(c, pauses); return [cc / f, (cc + 1) / f]; }
function planDay(c, pauses, hours) { return Math.max(0, Math.min(DAYS - 1, Math.floor(span(c, pauses, hours)[0] + 1e-9))); }
function onDay(it, sp) { return it.d0 < sp[1] - 1e-9 && it.d + 1 > sp[0] + 1e-9; }
function validTz(tz) { try { if (tz) { new Intl.DateTimeFormat('en', { timeZone: tz }); return tz; } } catch (e) {} return null; }
function localNow(tz) {
  if (FORCE_DATE) return { iso: FORCE_DATE, hour: FORCE_MODE === 'evening' ? EVENING[0] : MORNING[0] };
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: 'numeric', hour12: false }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t).value;
  return { iso: `${get('year')}-${get('month')}-${get('day')}`, hour: Number(get('hour')) % 24 };
}

/* ---------- one email for one person ---------- */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const link = (text, url) => `<a href="${esc(url)}" style="color:#4F46E5">${esc(text)}</a>`;
const wrap = (inner) => `<div style="font-family:Segoe UI,Arial,sans-serif;font-size:15px;line-height:1.5;color:#131B2E;max-width:600px">${inner}<p style="margin:24px 0 8px">${link('Open the tracker', SITE)}</p><p style="margin:0;font-size:12px;color:#8A94AC">These emails can be turned off in Settings on the tracker.</p></div>`;
const DIFF = { E: 'easy', M: 'medium', H: 'hard' };

// person: { name, email, start (iso), hours, pauses (calendar day indices), done ({id: iso}), days ({iso: {dsa, hours}}) }
function buildFor(person, mode, todayIso) {
  const pauses = person.pauses;
  const hours = person.hours >= 1 && person.hours <= 16 ? person.hours : DEFAULT_HOURS;
  const c = dayIndex(todayIso, person.start);
  const total = Math.ceil(DAYS * DEFAULT_HOURS / hours) + pauses.length;
  if (c < 0 || c >= total) return null;
  if (pauses.includes(c)) return null;
  const sp = span(c, pauses, hours);
  const day = planDay(c, pauses, hours);
  const groups = [];
  let count = 0;
  for (const t of TRACKS) {
    const items = [];
    for (const g of t.groups) for (const it of g.items) if (onDay(it, sp) && !person.done[it.id]) items.push(it);
    if (items.length) { groups.push([t, items]); count += items.length; }
  }
  const dayLabel = label(todayIso);
  const first = person.name ? person.name.split(' ')[0] : '';
  if (mode === 'evening') {
    const logged = person.days[todayIso] || {};
    const tickedToday = Object.values(person.done).some((d) => d === todayIso);
    const anyLog = (Number(logged.hours) || 0) > 0 || (Number(logged.dsa) || 0) > 0 || tickedToday;
    if (!count && anyLog) return null;
    const subject = count ? `Reminder: ${count} ${count === 1 ? 'item' : 'items'} still open on day ${day + 1} of ${DAYS}` : `Log day ${day + 1} of ${DAYS} before you stop`;
    const lead = count ? `<p>${count === 1 ? 'One item is' : count + ' items are'} still open for ${esc(dayLabel)}. Tick what you finished, then log your hours${person.hours ? ` (the goal is ${person.hours} a day)` : ''}.</p>` : `<p>Everything planned for ${esc(dayLabel)} is ticked. Log your hours so the day counts.</p>`;
    const list = groups.map(([t, items]) => items.map((it) => `<li>${esc(t.name)}: ${esc(it.full || it.t)}</li>`).join('')).join('');
    return { subject, html: wrap(`<h2 style="margin:0 0 8px">${first ? esc(first) + ', log' : 'Log'} ${esc(dayLabel)} before you stop</h2>${lead}${list ? `<ul>${list}</ul>` : ''}`) };
  }
  const subject = `Day ${day + 1} of ${DAYS}: today’s prep plan, ${dayLabel}`;
  const lists = groups.map(([t, items]) => `<h3 style="margin:20px 0 4px">${esc(t.name)}</h3><ul style="margin:0">${items.map((it) => {
    const extra = [];
    if (it.u) extra.push(link(it.u.includes('leetcode.com') ? 'Solve on LeetCode' : it.u.includes('takeuforward') ? 'Solve on TUF+' : 'Solve', it.u));
    if (LINKS[it.id]) extra.push(link(LINKS[it.id][0], LINKS[it.id][1]));
    if (it.v) extra.push(link('Video', it.v));
    else if (it.q) extra.push(link('Videos', 'https://www.youtube.com/results?search_query=' + encodeURIComponent(it.q)));
    const diff = it.p && it.diff ? ` <span style="font-size:12px;color:#5E6A84">${DIFF[it.diff] || ''}</span>` : '';
    const multi = it.d0 < it.d ? ` (day ${Math.min(it.d - it.d0 + 1, Math.max(1, day - it.d0 + 1))} of ${it.d - it.d0 + 1})` : '';
    return `<li>${esc(it.full || it.t)}${diff}${multi}${extra.length ? '<br><span style="font-size:13px">' + extra.join(', ') + '</span>' : ''}</li>`;
  }).join('')}</ul>`).join('');
  const split = SPLIT.map((s) => `<li>${esc(s[0])}: ${esc(s[1])}</li>`).join('');
  const rest = pauses.length || hours !== DEFAULT_HOURS ? ` (${hours} hours a day${pauses.length ? `, ${pauses.length} rest ${pauses.length === 1 ? 'day' : 'days'}` : ''}, the plan ends ${esc(label(isoShift(person.start, total - 1)))})` : '';
  return { subject, html: wrap(`<h2 style="margin:0 0 4px">${first ? esc(first) + ', here is your plan' : 'Plan'} for ${esc(dayLabel)}</h2>
<p style="margin:0;color:#5E6A84">Week ${Math.floor(day / 7) + 1}, day ${day + 1} of ${DAYS}${rest}. ${count} ${count === 1 ? 'item' : 'items'} today.</p>
${count ? lists : '<p>Nothing is left for today. A free day, or a chance to catch up.</p>'}
<h3 style="margin:20px 0 4px">Your ${esc(person.hours)}-hour day</h3><ul style="margin:0">${split}</ul>`) };
}

/* ---------- who gets what ---------- */
function modeFor(hour, prefs) {
  const mode = FORCE_MODE || (hour >= MORNING[0] && hour < MORNING[1] ? 'morning' : hour >= EVENING[0] && hour < EVENING[1] ? 'evening' : null);
  return mode && prefs[mode] ? mode : null;
}
async function accountMode() {
  const admin = (await import('firebase-admin')).default;
  if (process.env.FIRESTORE_EMULATOR_HOST) admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || 'demo-prep' });
  else admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  const db = admin.firestore();
  const snap = await db.collection('mail').get();
  const out = [];
  let skipped = 0;
  for (const d of snap.docs) {
    const m = d.data() || {};
    const uid = d.id;
    if (!m.email || !(m.morning || m.evening)) continue;
    const tz = validTz(m.tz) || DEFAULT_TZ;
    const { iso, hour } = localNow(tz);
    const mode = modeFor(hour, m);
    if (!mode) continue;
    if (m.sent && m.sent[mode] === iso) { skipped++; continue; }
    const [p, l, ch] = await Promise.all(['profile', 'log', 'checks'].map((n) => db.doc(`users/${uid}/docs/${n}`).get()));
    const prof = p.data() || {}, log = l.data() || {}, checks = ch.data() || {};
    const person = {
      name: typeof prof.name === 'string' ? prof.name : '',
      email: m.email,
      start: /^\d{4}-\d{2}-\d{2}$/.test(prof.start || '') ? prof.start : DEFAULT_START,
      hours: Number(prof.hours) || DEFAULT_HOURS,
      pauses: Array.isArray(log.pauses) ? log.pauses.filter(Number.isInteger) : [],
      done: checks.done && typeof checks.done === 'object' ? checks.done : {},
      days: log.days && typeof log.days === 'object' ? log.days : {}
    };
    const mail = buildFor(person, mode, iso);
    if (!mail) continue;
    out.push({ uid, mode, iso, to: m.email, tz, ...mail });
  }
  console.log(`Account mode: ${snap.size} mail ${snap.size === 1 ? 'record' : 'records'}, ${out.length} to send, ${skipped} already sent today.`);
  return { db, out };
}
async function singleMode() {
  const tz = DEFAULT_TZ;
  const { iso, hour } = localNow(tz);
  const mode = FORCE_MODE || (hour === MORNING[0] ? 'morning' : hour === EVENING[0] ? 'evening' : null);
  if (!mode) { console.log(`Single-inbox mode: nothing scheduled at local hour ${hour}.`); return { out: [] }; }
  const person = { name: '', email: process.env.MAIL_TO || 'preview@example.com', start: DEFAULT_START, hours: DEFAULT_HOURS, pauses: [], done: {}, days: {} };
  let mail = buildFor(person, mode, iso);
  if (!mail && PREVIEW) { mail = buildFor(person, mode, DEFAULT_START); if (mail) mail.subject = '[Test] ' + mail.subject; }
  if (!mail) { console.log('Single-inbox mode: outside the plan dates, or nothing to send today.'); return { out: [] }; }
  return { out: [{ mode, iso, to: person.email, tz, ...mail }] };
}

/* ---------- sending ---------- */
async function send(list) {
  if (!list.length) return [];
  if (DRY) { list.forEach((x) => console.log(`[dry run] ${x.mode} to ${x.to} (${x.tz}): ${x.subject}`)); return []; }
  const nodemailer = (await import('nodemailer')).default;
  const transport = process.env.MAIL_TRANSPORT === 'json'
    ? nodemailer.createTransport({ jsonTransport: true })
    : nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.MAIL_USERNAME, pass: process.env.MAIL_APP_PASSWORD } });
  const from = `"Interview prep" <${process.env.MAIL_USERNAME || 'prep@example.com'}>`;
  const sent = [];
  for (const x of list) {
    try { await transport.sendMail({ from, to: x.to, subject: x.subject, html: x.html }); sent.push(x); console.log(`Sent the ${x.mode} email to ${x.to}.`); }
    catch (e) { console.error(`Could not send to ${x.to}: ${e.message}`); }
  }
  return sent;
}

const account = !!(process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIRESTORE_EMULATOR_HOST);
const { db, out } = account ? await accountMode() : await singleMode();
const outbox = path.join(ROOT, 'outbox');
fs.rmSync(outbox, { recursive: true, force: true });
if (out.length) { fs.mkdirSync(outbox, { recursive: true }); out.forEach((x, i) => fs.writeFileSync(path.join(outbox, `${i}-${x.mode}.json`), JSON.stringify(x, null, 2))); }
console.log(`Built ${out.length} ${out.length === 1 ? 'email' : 'emails'}${out.length ? ', see outbox/' : ''}.`);
if (PREVIEW) process.exit(0);
const sent = await send(out);
if (account && sent.length) {
  for (const x of sent) await db.doc(`mail/${x.uid}`).set({ sent: { [x.mode]: x.iso } }, { merge: true });
  console.log(`Marked ${sent.length} as sent for today.`);
}
if (account && db) await db.terminate();
