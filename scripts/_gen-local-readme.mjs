/** 生成局部动效（motion-local）清单。 */
import fs from 'node:fs';

const s = JSON.parse(fs.readFileSync('outputs/motion-local/summary.json', 'utf8'));
const rows = s.clips
  .map((c, i) => {
    const r = c.region === 'full' ? '全屏' : `${c.region.w}×${c.region.h}`;
    return `| ${String(i + 1).padStart(2, '0')} | ${c.title} | ${c.duration}s | ${r} | ${c.sizeKB} KB | \`${c.file.replace(/\\/g, '/').split('/').pop()}\` | ${c.why} |`;
  })
  .join('\n');

const full = s.clips.filter((c) => c.region === 'full').length;

const md = `# GreenBite 局部动效（从整屏版重裁）

> 2026-10-31。共 **${s.count} 段**，合计 **${s.totalSeconds}s**，统一 720×720 画布。
> 素材来源是 \`outputs/motion/\` 那套整屏片的 raw 帧，**没有重录**，只重裁 + 缩放。

## 清单

| # | 动效 | 时长 | 保留区域 | 体积 | 文件 | 裁切理由 |
|---|---|---|---|---|---|---|
${rows}

## 关键取舍

**${s.count - full} 段裁成动效区域，${full} 段保留全屏。**

保留全屏的两段是 \`02 切页过场\` 和 \`05 详情开合\`——它们的动效主体是「整页在动」
（过场是整屏淡入揭幕，详情是下层缩到 0.93 + 上层从 0.86 弹出）。
裁掉任何一块，动作的因果关系就断了，看不出「谁在缩放、谁在退后」。
其余片段都有明确的动效落点，裁掉周边反而更聚焦。

## 口径

| 项 | 值 |
|---|---|
| 画布 | 720×720，底色 \`#F4F6F8\` |
| 缩放 | 最多放大 4 倍，长边不超过 720（lanczos） |
| 输出 | H.264 / 30fps / yuv420p / 无音轨 |
| 源 | \`outputs/motion-raw/*.webm\`（整屏录制原片） |

## 改区域

区域配置在 \`scripts/motion-local.mjs\` 顶部的 \`REGION\` 表里，改完重跑：

\`\`\`bash
node scripts/motion-local.mjs
\`\`\`

只重裁不重录，一次约 20 秒。区域坐标是 CSS px（基于 390×844 视口）。

⚠️ 全屏分支不要写 \`scale='min(720,iw)':-2\`——spawnSync 不会去掉引号，
ffmpeg 会把整串当字面量，报 \`Error reinitializing filters\`。数字在 JS 里算好再传。
`;

fs.writeFileSync('outputs/motion-local/README.md', md, 'utf8');
