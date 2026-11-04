/**
 * 运行时 404 巡检：把每个 tab 都走一遍，记录所有失败请求与 console 错误。
 *
 * 清理死素材之后必跑 —— 静态扫描只能发现「源码里写死的路径」，
 * 发现不了 CSS background-image、动态拼接路径、以及组件内联的旧引用。
 *
 * 用法：node scripts/_runtime-404-check.mjs
 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({
  viewport: { width: 430, height: 900 },
  deviceScaleFactor: 2,
});

const failed = [];
const consoleErrors = [];

page.on('response', (res) => {
  const s = res.status();
  if (s >= 400) failed.push(`${s}  ${res.url().replace(BASE, '')}`);
});
page.on('requestfailed', (req) => {
  failed.push(`ERR ${req.url().replace(BASE, '')}  ${req.failure()?.errorText ?? ''}`);
});
page.on('console', (msg) => {
  if (msg.type() === 'error') {
    const loc = msg.location?.();
    const where = loc?.url ? ` @ ${loc.url.replace(BASE, '')}:${loc.lineNumber ?? 0}` : '';
    consoleErrors.push(msg.text().slice(0, 160) + where);
  }
});
page.on('pageerror', (err) => consoleErrors.push('PAGEERROR ' + err.message.slice(0, 200)));

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 30000 });
await page.waitForFunction(
  () => {
    const el = document.querySelector('#app-page-stage');
    return el && getComputedStyle(el).opacity === '1';
  },
  { timeout: 30000 }
);

const tabs = await page.$$eval('[id^="nav-tab-"]', (els) => els.map((e) => e.id));
for (const id of tabs) {
  await page.click(`#${id}`);
  await page.waitForTimeout(900);
  // 滚一遍触发懒加载
  await page.evaluate(async () => {
    for (let y = 0; y < 4000; y += 500) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(400);
  console.log(`  已访问 ${id}`);
}

// 详情页
try {
  await page.click('#nav-tab-menu');
  await page.waitForTimeout(800);
  await page.locator('img[src*="/dishes/cutout/"]').first().evaluate((n) => n.click());
  await page.waitForTimeout(1200);
  console.log('  已访问 菜品详情');
} catch (e) {
  console.log('  详情页跳过：' + e.message.slice(0, 50));
}

await page.waitForTimeout(800);
await browser.close();

console.log('\n=== 结果 ===');
if (failed.length === 0) {
  console.log('✓ 无失败请求（无 404）');
} else {
  console.log(`✗ ${failed.length} 个失败请求：`);
  for (const f of [...new Set(failed)]) console.log('  ' + f);
  process.exitCode = 1;
}
if (consoleErrors.length === 0) {
  console.log('✓ 无 console 错误');
} else {
  console.log(`✗ ${consoleErrors.length} 条 console 错误：`);
  for (const c of [...new Set(consoleErrors)].slice(0, 10)) console.log('  ' + c);
}
