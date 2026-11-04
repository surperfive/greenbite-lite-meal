/** 由 summary.json 生成 hover 局部动效清单。 */
import fs from 'node:fs';

const s = JSON.parse(fs.readFileSync('outputs/motion-hover/summary.json', 'utf8'));
const rows = s.clips
  .map((c, i) => {
    const crop = c.crop ? `${c.crop.w}×${c.crop.h}` : '—';
    return `| ${String(i + 1).padStart(2, '0')} | ${c.title} | ${c.duration}s | ${crop} | ${c.sizeKB} KB | \`${c.file.replace(/\\/g, '/').split('/').pop()}\` | ${c.note} |`;
  })
  .join('\n');

const md = `# GreenBite 局部交互 / 悬停动效

> 2026-10-31 录制。共 **${s.count} 段**，合计 **${s.totalSeconds}s**。
> 和 \`outputs/motion/\` 那套的区别：**这里只出「有动画的那一块」**，不是整屏。
> 每段统一居中放在 720×720 画布上，便于逐段对照。

## 清单

| # | 动效 | 时长 | 裁切区域 | 体积 | 文件 | 说明 |
|---|---|---|---|---|---|---|
${rows}

## 录制口径

| 项 | 值 |
|---|---|
| 抓帧 | CDP \`Page.startScreencast\`，55~60fps，视口尺寸 390×844 |
| 裁切 | 录制时记 \`getBoundingClientRect()\`，转码时按 box + pad 裁 |
| 放大 | 最多 4 倍，且不超过画布 720（lanczos） |
| 画布 | 720×720，底色 \`#F4F6F8\`（页面底色） |
| 输出 | H.264 / 30fps / yuv420p |

## 为什么是这个方案

清晰度和帧率在这里是互斥的，试过三条路：

| 方案 | 结果 |
|---|---|
| \`recordVideo\` + 后期 crop | 只能出视口尺寸（390×844），24px 按钮放大 6 倍糊成色块 |
| \`screencast\` 的 \`maxWidth\` | 被 Chrome 忽略，帧永远是 390×844 |
| \`deviceScaleFactor:3\` + 逐帧 \`screenshot({clip})\` | 分辨率真的是 3 倍（144×144），但截图与鼠标操作在同一条 CDP 连接上互相排队，**8 段跑 27 分钟没跑完，强杀** |
| ✅ \`screencast\` + 后期 crop（4 倍上限） | 60fps 连续、构图准确；局部放大后略软，是当前最优折中 |

## 复跑

\`\`\`bash
node scripts/record-hover.mjs          # 全部 8 段，约 2.5 分钟
node scripts/record-hover.mjs h2 h4    # 只录指定
node scripts/motion-hover-to-mp4.mjs   # 转码 + 拼总览
\`\`\`

\`00-hover总览.mp4\` 是按清单顺序拼的合集。
`;

fs.writeFileSync('outputs/motion-hover/README.md', md, 'utf8');
