/**
 * 由 summary.json 生成动效清单 README。一次跑完，不留中间态。
 */
import fs from 'node:fs';

const s = JSON.parse(fs.readFileSync('outputs/motion/summary.json', 'utf8'));
/* 按 key 的数字前缀排序，而不是按 manifest 顺序 ——
   15-search-dish 是后补的场景，声明位置在 14-tab 之前，直接用数组顺序会排出
   「14 菜品搜索 / 15 底部导航」这种和文件名对不上的编号。 */
const sorted = [...s.clips].sort((a, b) => Number(a.key.slice(0, 2)) - Number(b.key.slice(0, 2)));

const rows = sorted
  .map((c, i) => `| ${String(i + 1).padStart(2, '0')} | ${c.title} | ${c.duration}s | ${c.sizeKB} KB | \`${c.file.replace(/\\/g, '/').split('/').pop()}\` | ${c.note} |`)
  .join('\n');

const overviewFile = 'outputs/motion/00-全部动效.mp4';
const overviewMB = fs.existsSync(overviewFile)
  ? (fs.statSync(overviewFile).size / 1024 / 1024).toFixed(1)
  : '?';

const md = `# GreenBite 动效录制清单

> 2026-10-31 录制。共 **${s.count} 段**，合计 **${s.totalSeconds}s**，780×1688 @30fps H.264。
> 总览片：\`00-全部动效.mp4\`（按下方顺序拼接，${s.totalSeconds}s / ${overviewMB} MB）

## 怎么用

- 只想看整体 → 打开 \`00-全部动效.mp4\`
- 要给某一处做说明 → 取对应的单段 mp4，文件名带序号和中文名
- 要换参数重录 → \`node scripts/record-motion.mjs [场景关键字]\` 后跑 \`node scripts/motion-to-mp4.mjs\`

## 清单

| # | 动效 | 时长 | 体积 | 文件 | 说明 |
|---|---|---|---|---|---|
${rows}

## 录制口径

| 项 | 值 | 备注 |
|---|---|---|
| 视口 | 390×844（iPhone 14 逻辑尺寸） | 与小程序壳一致，不是 375 |
| 输出 | 780×1688 @30fps | 播放在 2 倍放大后做，源录制是 CSS 像素 1:1 |
| 裁头 | 每段起点 = 动作前 0.35s | 开屏那 2.4s 只在第 1 段保留，其余剪掉 |
| 慢放 | 仅「加购飞球」2× | 飞行只有 540ms，原速一闪而过 |
| 含音频 | 否 | 都是静音片；项目本身无音效（audioContext 只用于抽卡，未入镜） |

## 未覆盖的部分

- **收藏页**（从「我的」进，无独立 Tab）：页面本身是静态列表，没有专属动效，未单录。
- **支付 / 结算流程**：原型里是 toast 占位，没有真实动效。
- **抽卡爆闪的逐帧细节**：\`GachaBurstReveal\` 的光效约 300ms，30fps 下约 9 帧，
  在 06/07 两段里可见但不算分解镜头。要逐帧看建议直接对组件做 0.25× 慢放单录。

## 复跑注意

- 需要 Playwright 自家的 ffmpeg：\`node node_modules/playwright/cli.js install ffmpeg\`
  （系统 ffmpeg 不够 —— recordVideo 走的是 Playwright 内置那份）。
- \`recordVideo.size\` 必须等于视口 CSS 尺寸。写成物理像素（780×1688）会让画面缩到左上角 1/4。
- 默认落地页是「点餐」，任何要点盲盒页元素的场景都必须先切 \`#nav-tab-gacha\`。
`;

fs.writeFileSync('outputs/motion/README.md', md, 'utf8');
