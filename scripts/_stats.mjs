import fs from 'fs';
import path from 'path';

const fw = {};
const fam = {};
const walk = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(tsx|ts|css)$/.test(e.name)) {
      const s = fs.readFileSync(p, 'utf8');
      for (const m of s.matchAll(/font-(black|extrabold|bold|semibold|medium|normal|light|thin)\b/g)) {
        fw[m[1]] = (fw[m[1]] || 0) + 1;
      }
      for (const m of s.matchAll(/fontWeight[:=]\s*['"`]?(\d+)/g)) {
        fw['w' + m[1]] = (fw['w' + m[1]] || 0) + 1;
      }
      for (const m of s.matchAll(/(Plus Jakarta Sans|Noto Sans SC)/g)) {
        fam[m[1]] = (fam[m[1]] || 0) + 1;
      }
    }
  }
};
walk('src');

// lucide 图标用量 + 是否存在动态 import
let lucide = 0;
let dyn = 0;
const walk2 = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk2(p);
    else if (/\.(tsx|ts)$/.test(e.name)) {
      const s = fs.readFileSync(p, 'utf8');
      const m = s.match(/import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/);
      if (m) lucide += m[1].split(',').filter((x) => x.trim()).length;
      if (/import\s*\(\s*['"]/.test(s)) dyn += 1;
      if (/from\s*['"]lucide-react['"]/.test(s) && /import\s*\*/.test(s)) lucide += 999;
    }
  }
};
walk2('src');

fs.writeFileSync('outputs/_fw.txt', JSON.stringify({ fw, fam, lucideIcons: lucide, dynamicImports: dyn }, null, 1), 'utf8');
