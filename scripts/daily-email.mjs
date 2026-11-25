// Builds the daily email from plan.js, the same plan the site renders, so it stays the single source of truth.
import fs from 'node:fs';
import vm from 'node:vm';

const SITE = process.env.SITE_URL || 'https://vgirkar.github.io/interview-prep-tracker/';
const TZ = process.env.PLAN_TZ || 'Asia/Kolkata';
const mode = process.env.MODE === 'evening' ? 'evening' : 'morning';

const html = fs.readFileSync('plan.js', 'utf8');
const a = html.indexOf('/* ---------- plan ---------- */');
const b = html.indexOf('/* ---------- dates ---------- */');
if (a < 0 || b < 0) throw new Error('Plan section not found in plan.js');
const ctx = {};
vm.runInNewContext(html.slice(a, b) + '\nthis.out={TRACKS,LINKS,START,DAYS,SPLIT,HOURS_DAY};', ctx);
const { TRACKS, LINKS, START, DAYS, SPLIT, HOURS_DAY } = ctx.out;

const iso = process.env.FORCE_DATE || new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
const [y, m, d] = iso.split('-').map(Number);
let idx = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(START.getFullYear(), START.getMonth(), START.getDate())) / 864e5);
let test = false;
if (idx < 0 || idx >= DAYS) {
  if (!process.env.PREVIEW) {
    console.log('Outside the plan dates, so no email today.');
    if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, 'send=false\n');
    process.exit(0);
  }
  idx = 0; test = true;
}
const day = new Date(Date.UTC(START.getFullYear(), START.getMonth(), START.getDate() + idx));
const label = day.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const link = (text, url) => `<a href="${esc(url)}" style="color:#2B4BD6">${esc(text)}</a>`;

const groups = [];
let count = 0;
for (const t of TRACKS) {
  const items = [];
  for (const g of t.groups) for (const it of g.items) if (it.d0 <= idx && idx <= it.d) items.push(it);
  if (items.length) { groups.push([t, items]); count += items.length; }
}

const open = `<p style="margin:24px 0">${link('Open the tracker', SITE)}</p>`;
const wrap = (inner) => `<div style="font-family:Segoe UI,Arial,sans-serif;font-size:15px;line-height:1.5;color:#14203A;max-width:600px">${inner}</div>`;
let subject, body;
if (mode === 'evening') {
  subject = `Reminder: log today’s prep, day ${idx + 1} of ${DAYS}`;
  body = wrap(`<h2 style="margin:0 0 8px">Log ${esc(label)} before you stop</h2>
<p>${count} ${count === 1 ? 'item was' : 'items were'} planned for today. Tick what you finished, then log your DSA problems solved and hours studied.</p>
<ul>${groups.map(([t, items]) => items.map((it) => `<li>${esc(t.name)}: ${esc(it.full || it.t)}</li>`).join('')).join('')}</ul>${open}`);
} else {
  subject = `Day ${idx + 1} of ${DAYS}: today’s prep plan, ${label}`;
  const lists = groups.map(([t, items]) => `<h3 style="margin:20px 0 4px">${esc(t.name)}</h3><ul style="margin:0">${items.map((it) => {
    const extra = [];
    if (LINKS[it.id]) extra.push(link(LINKS[it.id][0], LINKS[it.id][1]));
    if (it.q) extra.push(link('Videos', 'https://www.youtube.com/results?search_query=' + encodeURIComponent(it.q)));
    const span = it.d0 < it.d ? ` (day ${idx - it.d0 + 1} of ${it.d - it.d0 + 1})` : '';
    return `<li>${esc(it.full || it.t)}${span}${extra.length ? '<br><span style="font-size:13px">' + extra.join(', ') + '</span>' : ''}</li>`;
  }).join('')}</ul>`).join('');
  const split = SPLIT.map((s) => `<li>${esc(s[0])}: ${esc(s[1])}</li>`).join('');
  body = wrap(`<h2 style="margin:0 0 4px">Plan for ${esc(label)}</h2>
<p style="margin:0;color:#56627C">Week ${Math.floor(idx / 7) + 1}, day ${idx + 1} of ${DAYS}. ${count} ${count === 1 ? 'item' : 'items'} today.</p>
${lists}
<h3 style="margin:20px 0 4px">Your ${HOURS_DAY}-hour day</h3><ul style="margin:0">${split}</ul>${open}`);
}
if (test) subject = '[Test] ' + subject;
fs.writeFileSync('subject.txt', subject);
fs.writeFileSync('body.html', body);
if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, 'send=true\n');
console.log(`Built the ${mode} email for plan day ${idx + 1} with ${count} items.`);
