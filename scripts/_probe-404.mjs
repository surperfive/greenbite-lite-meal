import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: 1600, height: 1200 } });
p.on('response', (r) => { if (r.status() >= 400) console.log('HTTP', r.status(), r.url()); });
p.on('requestfailed', (r) => console.log('FAILED', r.url(), r.failure()?.errorText));
await p.goto(`${BASE}/scripts/export-icons.html`, { waitUntil: 'networkidle' });
await p.waitForTimeout(1200);
await b.close();
