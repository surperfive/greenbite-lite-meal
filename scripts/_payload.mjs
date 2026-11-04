/** 起一个静态服务器指向 dist/，用浏览器加载并统计每个请求的真实传输字节。 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

const ROOT = 'dist';
const PORT = 5199;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
};

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) {
    res.writeHead(404).end('nf');
    return;
  }
  res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(PORT, r));

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

const recs = [];
page.on('response', async (resp) => {
  try {
    const sizes = await resp.request().sizes();
    recs.push({
      url: resp.url(),
      status: resp.status(),
      type: (resp.headers()['content-type'] || '').split(';')[0],
      body: sizes.responseBodySize,
      total: sizes.responseBodySize + sizes.responseHeadersSize,
    });
  } catch {
    /* ignore */
  }
});

await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(4000);

// 再逛一遍其它 tab，看懒加载之外的资源
for (const t of ['#nav-tab-home', '#nav-tab-gacha', '#nav-tab-orders', '#nav-tab-me']) {
  try {
    await page.click(t, { force: true });
    await page.waitForTimeout(1500);
  } catch {
    /* ignore */
  }
}
await page.waitForTimeout(1500);

await browser.close();
server.close();

// 聚合
const byHost = new Map();
const byType = new Map();
let total = 0;
for (const r of recs) {
  if (!r.body) continue;
  total += r.body;
  const host = new URL(r.url).host;
  const t = r.type || 'other';
  byHost.set(host, (byHost.get(host) || 0) + r.body);
  byType.set(t, (byType.get(t) || 0) + r.body);
}
const kb = (n) => (n / 1024).toFixed(1).padStart(8);
const lines = [];
lines.push(`首屏 + 五个 tab 全部走完，合计传输 ${(total / 1024).toFixed(0)} KB（未压缩口径见下，本地服务器无 gzip）`);
lines.push('');
lines.push('按来源主机：');
for (const [h, v] of [...byHost.entries()].sort((a, b) => b[1] - a[1])) lines.push(`  ${h.padEnd(30)} ${kb(v)} KB`);
lines.push('');
lines.push('按类型：');
for (const [t, v] of [...byType.entries()].sort((a, b) => b[1] - a[1])) lines.push(`  ${t.padEnd(30)} ${kb(v)} KB`);
lines.push('');
lines.push('最大的 20 个请求：');
for (const r of recs.sort((a, b) => b.body - a.body).slice(0, 20)) {
  const name = r.url.replace(/^https?:\/\/[^/]+/, '').slice(-58);
  lines.push(`  ${kb(r.body)} KB  ${name}`);
}
fs.writeFileSync('outputs/img-scan/payload.txt', lines.join('\n'), 'utf8');
console.log(lines.join('\n'));
