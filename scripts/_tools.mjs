import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

const probe = (bin, args) => {
  const r = spawnSync(bin, args, { encoding: 'utf8' });
  if (r.error) return `${bin}: NOT FOUND`;
  const first = (r.stdout || r.stderr || '').split('\n')[0];
  return `${bin}: OK → ${first.trim()}`;
};

const out = [
  probe('ffmpeg', ['-version']),
  probe('ffprobe', ['-version']),
  probe('magick', ['-version']),
  `node: ${process.version}`,
];
fs.writeFileSync(new URL('./_tools.json', import.meta.url), out.join('\n'), 'utf8');
