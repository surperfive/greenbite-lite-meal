/**
 * 通用执行器：把任意命令的 stdout/stderr 写到文件。
 * 本机 PowerShell 工具不回传 stdout（ConPTY 问题），所以统一走这个壳。
 *
 * 用法：node scripts/_spawn-log.mjs <输出txt相对路径> <可执行文件> [args...]
 * 例：  node scripts/_spawn-log.mjs outputs/q.txt python.exe script.py "query" --domain ux
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outFile = process.argv[2];
const bin = process.argv[3];
const args = process.argv.slice(4);

const r = spawnSync(bin, args, {
  cwd: root,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
  env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1', FORCE_COLOR: '0', NO_COLOR: '1' },
});

const body = [
  `CMD=${path.basename(bin)} ${args.join(' ')}`,
  `EXIT=${r.status} SIGNAL=${r.signal || '-'}${r.error ? ' ERR=' + r.error.message : ''}`,
  '--- STDOUT ---',
  r.stdout || '(empty)',
  '--- STDERR ---',
  r.stderr || '(empty)',
].join('\n');

const dest = path.join(root, outFile);
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, body, 'utf8');
