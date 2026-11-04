/**
 * 验证脚本共用的开发服务器地址。
 *
 * 端口以 `vite.config.ts` 的 `server.port` 为准（当前 5173）。
 * 之前各脚本把 `http://localhost:3000/` 写死在文件里，改一次端口就要逐个改，
 * 所以统一收口到这里；需要临时指向别的地址时用 `BASE_URL` 环境变量覆盖：
 *   BASE_URL=http://localhost:6000 node scripts/verify-flow.mjs
 */
export const BASE = process.env.BASE_URL ?? 'http://localhost:5173';
