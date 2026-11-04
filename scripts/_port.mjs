import http from 'http';
import fs from 'fs';
const ports = [5173, 5174, 4173, 3000];
const probe = (p) =>
  new Promise((res) => {
    const r = http.get({ host: '127.0.0.1', port: p, path: '/', timeout: 2500 }, (resp) => {
      let b = '';
      resp.on('data', (c) => (b += c));
      resp.on('end', () => {
        const m = b.match(/<title>([^<]*)<\/title>/i);
        res({ port: p, up: true, status: resp.statusCode, title: m ? m[1].trim() : '' });
      });
    });
    r.on('error', () => res({ port: p, up: false }));
    r.on('timeout', () => { r.destroy(); res({ port: p, up: false, timeout: true }); });
  });
const out = [];
for (const p of ports) out.push(await probe(p));
fs.writeFileSync('scripts/_port.json', JSON.stringify(out, null, 2), 'utf8');
