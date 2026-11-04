import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const dir = 'C:/Users/OOW/AppData/Local/ms-playwright';
const lines = [];
lines.push('ms-playwright dir exists: ' + fs.existsSync(dir));
if (fs.existsSync(dir)) {
  for (const e of fs.readdirSync(dir)) lines.push('  ' + e);
}

const target = path.join(dir, 'ffmpeg-1013', 'ffmpeg-win64.exe');
lines.push('ffmpeg binary: ' + (fs.existsSync(target) ? 'EXISTS' : 'MISSING'));

if (!fs.existsSync(target)) {
  const r = spawnSync(
    process.execPath,
    ['node_modules/playwright/cli.js', 'install', 'ffmpeg'],
    { encoding: 'utf8', timeout: 240000, env: { ...process.env, PLAYWRIGHT_DOWNLOAD_HOST: '' } }
  );
  lines.push('--- install exit=' + r.status + ' sig=' + r.signal + ' err=' + (r.error?.message || '-'));
  lines.push('stdout: ' + (r.stdout || '').slice(0, 3000));
  lines.push('stderr: ' + (r.stderr || '').slice(0, 3000));
  lines.push('after: ' + (fs.existsSync(target) ? 'EXISTS' : 'STILL MISSING'));
}

fs.writeFileSync('outputs/_pwffmpeg.txt', lines.join('\n'), 'utf8');
