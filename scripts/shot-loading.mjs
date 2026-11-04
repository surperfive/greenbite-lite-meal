/** Deterministic CSS animation frames. Hold only the opening timer in this test context. */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { BASE } from './_base.mjs';

const OUT = fileURLToPath(new URL('../outputs/loading/', import.meta.url));
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
try {
  for (const [name, width, height, reduced] of [
    ['mobile', 390, 844, false], ['compact', 320, 568, false],
    ['desktop', 1280, 900, false], ['landscape', 568, 320, false],
    ['reduced-motion', 390, 844, true]
  ]) {
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2,
      reducedMotion: reduced ? 'reduce' : 'no-preference' });
    await context.addInitScript(() => {
      const real = window.setTimeout.bind(window);
      window.setTimeout = (callback, delay, ...args) => delay === 1800 ? 0 : real(callback, delay, ...args);
    });
    const page = await context.newPage();
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.locator('#app-loading-screen').waitFor();
    const root = page.locator('#app-loading-screen');
    for (const t of name === 'mobile' ? [250, 650, 1050, 1450] : [650]) {
      await root.evaluate((el, time) => {
        for (const animation of el.getAnimations({ subtree: true })) {
          animation.pause();
          animation.currentTime = time;
        }
      }, t);
      await page.screenshot({ path: `${OUT}/${name}-${t}.png` });
      console.log('captured', name, t);
    }
    await context.close();
  }
} finally { await browser.close(); }
