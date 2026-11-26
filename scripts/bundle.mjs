// Builds dist/index.html: one self-contained file with the styles, the plan, the question banks and the app inlined.
// Open it from disk, or drop it on any static host. Run with: node scripts/bundle.mjs [output path]
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
let html = read('index.html');
const css = read('app.css');
const js = ['plan.js', 'questions.js', 'app.js'].map((f) => `<script>\n/* ${f} */\n${read(f)}\n</script>`).join('\n');
for (const src of [css, js]) if (/<\/(style|script)/i.test(src.replace(/<\/script>/g, (m, i) => (js.includes(m) ? '' : m)))) throw new Error('A source file contains a closing tag that would break the bundle');
html = html.replace('<link rel="stylesheet" href="app.css">', `<style>\n${css}\n</style>`);
// The single file is device-only: sign-in needs an http(s) origin, so the Firebase module is left out.
html = html.replace('<script src="firebase-config.js"></script>\n', '').replace(/<script>if\(location\.protocol!=="file:"\)[^<]*<\/script>\n/, '');
html = html.replace(/<script src="plan\.js"><\/script>\s*<script src="questions\.js"><\/script>\s*<script src="app\.js"><\/script>/, js);
if (html.includes('href="app.css"') || html.includes('src="app.js"')) throw new Error('Inlining failed');
const out = process.argv[2] || path.join(root, 'dist', 'index.html');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log(`Wrote ${out} (${(html.length / 1024).toFixed(0)} KB)`);
