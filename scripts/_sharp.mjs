/**
 * sharp 装在 `.tools/` 独立目录里 —— 项目 node_modules 会被 npm 的 prune 清掉未声明的包，
 * 而图片压缩只是本地一次性工具，不值得写进 package.json。
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
export const sharp = require(path.resolve(here, '../.tools/node_modules/sharp'));
export const ROOT = path.resolve(here, '..');
