/**
 * 一次性辅助脚本：把另一个 node 脚本的 stdout/stderr 落到文件里。
 * 本机 PowerShell 工具不回传 stdout，只能这样取结果。
 * 用法：node scripts/_run-and-log.mjs <目标脚本相对路径> <输出txt相对路径>
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = process.argv[2];
const outFile = process.argv[3] || 'outputs/_run-log.txt';

const r = spawnSync(process.execPath, [path.join(root, target)], {
  cwd: root,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
  env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
});

const body = [
  `EXIT=${r.status} SIGNAL=${r.signal || '-'}`,
  '--- STDOUT ---',
  r.stdout || '(empty)',
  '--- STDERR ---',
  r.stderr || '(empty)',
].join('\n');

const dest = path.join(root, outFile);
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, body, 'utf8');
