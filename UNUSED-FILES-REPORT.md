# 项目文件清理报告（已完成）

> 完成时间：2026-10-14 · 扫描脚本 `scripts/scan-unused.mjs`（只读，可随时重跑复核）

## 体积变化

| | 清理前 | 清理后 |
|---|---|---|
| 项目总计（含 node_modules） | 457 M | **约 290 M** |
| 不含 node_modules / .git | 179 M | **31 M** |
| `.git` | 89 M | **8.7 M** |
| `node_modules` | 278 M | 约 254 M |

---

## 第一轮（2026-10-14 下午，约 33 M）

| 档 | 内容 | 结果 |
|---|---|---|
| 1 | `dist/`（构建产物） | ✅ 进回收站 |
| 2 | 3 个零引用组件 `MenuCouponBar.tsx` / `NutritionModal.tsx` / `GachaIngredientIcons.tsx` | ✅ |
| 3 | 8 个根目录重复文件（`public/` 有逐字节相同副本） | ✅ |
| 4 | 16 个 `public/` 零引用素材 | ✅ |
| 5 | `.backup-src/`、`.backup-src2/`、`assets/`、`bun.lock`、`build_svg_part*.py` | ✅ |

## 第二轮（2026-10-14 晚，约 168 M）

| 档 | 内容 | 结果 |
|---|---|---|
| A | `probe-out/` 整个（59.1 M） | ✅ |
| A | `outputs/` 旧任务 10 项（保留 `home-ref` / `red-unify` / `reveal-pill` / `detail-ui` / `card-price`） | ✅ 20.5 M → 16 M |
| C | `.git` 去掉产出目录的 blob（`git rm --cached` + `--amend` + `reflog expire` + `gc --prune=now`） | ✅ **89 M → 8.7 M**，追踪文件 492 → 136 |
| D | 未使用依赖 `@google/genai` / `express` / `dotenv` / `@types/express` / `autoprefixer` / `esbuild` | ✅ 移除 141 个包 |
| E | `metadata.json`、`.env.example`（Google AI Studio 脚手架，代码 0 引用） | ✅ |
| — | `.cleanup-log.txt`（我自己的临时日志） | ✅ |

**跳过**：`.vite/`（仅 2 K，且被运行中的 dev server 占用，删了立刻重建）、`scripts/`（128 K，多数是现役调参工具）。

**保留的 `outputs/` 5 组**：`home-ref`(7.2M 首页版面) / `red-unify`(2.8M 正红) /
`reveal-pill`(2.6M 揭示修复) / `detail-ui`(2.6M 详情页) / `card-price`(176K 卡片价格)。

---

## 回滚方式

1. **回收站**：所有删除都走了回收站，没走 `rm`。
2. **git 快照**：commit `d90fd31`。
   ⚠️ 历史被 `--amend` 重写过，所以**只能恢复到"清理后"的状态**；
   第一、二轮删掉的文件**不能**再靠 `git checkout` 找回，只能从回收站还原。

---

## ⚠️ 遗留问题：npm 会把平台原生包裁掉

改完 `package.json` 跑 `npm install` 之后，`npm run build` 会依次崩在：

```
Cannot find module @rollup/rollup-win32-x64-msvc
Cannot find module lightningcss-win32-x64-msvc
Cannot find module @tailwindcss/oxide-win32-x64-msvc
```

这是 npm 的已知 bug（[npm/cli#4828](https://github.com/npm/cli/issues/4828)）：
**平台专属的 optional 依赖在 `npm install` 时被裁掉**，而 lockfile 里其实有记录。

已用「删掉 node_modules + package-lock.json 后全新 `npm install`」修复
（旧的那份挪到了 `node_modules.old` / `package-lock.json.old`，确认构建通过后再删）。

**如果你以后自己跑 `npm install` 又遇到这个报错**，两条路：
1. 补装对应包（版本从 `node_modules/<包>/package.json` 的 `version` 读）：
   ```bash
   npm install @rollup/rollup-win32-x64-msvc@<版本> lightningcss-win32-x64-msvc@<版本> @tailwindcss/oxide-win32-x64-msvc@<版本> --no-save
   ```
   ⚠️ 必须**一条命令同时装**，分两次装会互相裁掉。
2. 或者干脆：删 `node_modules` + `package-lock.json`，重新 `npm install`。

---

## 建议保留的东西（别删）

| 路径 | 原因 |
|---|---|
| `.workbuddy-ai/` | 项目记忆与工作日志 |
| `node_modules/` | 运行依赖 |
| `scripts/` | 现役验证/调参脚本，`MEMORY.md` 里有引用 |
| `public/ingredients/` | 抽卡食材插画，经 `utils/ingredientArt.ts` 引用 |
| `gacha-ingredients.md`、`README.md` | 文档 |
| `UNUSED-FILES-REPORT.md`（本文件） | 清理记录，不需要可删 |
