import fs from 'node:fs';
import path from 'node:path';
const roots = ['C:/Users/OOW/Desktop', 'C:/Users/OOW/Downloads', 'C:/Users/OOW/Documents'];
const hits = [];
for (const root of roots) {
  if (!fs.existsSync(root)) continue;
  const walk = (dir, depth) => {
    if (depth > 2) return;
    let ents = [];
    try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      const full = path.join(dir, e.name);
      if (/网页|web ?page|page\s*\d/i.test(e.name)) hits.push(full);
      if (e.isDirectory() && !/node_modules|\.git/.test(e.name)) walk(full, depth + 1);
    }
  };
  walk(root, 0);
}
fs.writeFileSync(new URL('./_probe-port.json', import.meta.url), hits.length ? hits.join('\n') : 'NO_MATCH', 'utf8');
