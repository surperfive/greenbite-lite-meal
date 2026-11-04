/**
 * 搜索弹窗两种状态截图（默认态「热门搜索」+ 结果态），用来检查红色体系是否统一。
 * 入口在**点餐页**顶部搜索框（SearchModal 只在 MenuPage 挂载）。
 * 用法：node scripts/shot-search.mjs [输出前缀，默认 rose]
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const TAG = process.argv[2] || 'rose';
const OUT = 'outputs/search';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-menu', { state: 'visible', timeout: 30000 });
await page.waitForSelector('#app-loading-screen', { state: 'detached', timeout: 30000 }).catch(() => {});
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(900);

/** 点餐页挂载（扛品牌过场 / HMR） */
for (let i = 0; i < 6; i++) {
  await page.evaluate(() => document.querySelector('#nav-tab-menu')?.click());
  await page.waitForTimeout(700);
  if (await page.evaluate(() => !!document.querySelector('#menu-header-banner'))) break;
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(1500);
}

// 打开搜索：点餐页搜索框（placeholder 文案是「搜索轻食名称、热量数值...」）
await page.getByText('搜索轻食名称').first().click();
await page.waitForTimeout(900);
await page.screenshot({ path: `${OUT}/${TAG}-default.png` });

// 结果态：输入关键词
const input = page.locator('input').first();
await input.fill('沙拉');
await page.waitForTimeout(1000);
await page.screenshot({ path: `${OUT}/${TAG}-result.png` });

await browser.close();
console.log('ok ' + OUT);
