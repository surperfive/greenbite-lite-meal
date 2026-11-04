// 扫描 src 下所有 lucide-react 引入，输出唯一图标名清单
import fs from 'node:fs';
import path from 'node:path';

const SRC = path.resolve(process.cwd(), 'src');

const walk = (dir, out = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) out.push(full);
  }
  return out;
};

const files = walk(SRC);
const names = new Map(); // name -> Set(files)

for (const file of files) {
  const code = fs.readFileSync(file, 'utf8');
  const re = /import\s*(?:type\s*)?\{([^}]*?)\}\s*from\s*['"]lucide-react['"]/g;
  let m;
  while ((m = re.exec(code))) {
    const body = m[1];
    for (const raw of body.split(',')) {
      let token = raw.trim();
      if (!token) continue;
      token = token.replace(/^type\s+/, '');
      // handle `Foo as Bar`
      const parts = token.split(/\s+as\s+/);
      const original = parts[0].trim();
      if (!original) continue;
      if (!names.has(original)) names.set(original, new Set());
      names.get(original).add(path.relative(process.cwd(), file));
    }
  }
}

const lucide = [...names.keys()].sort((a, b) => a.localeCompare(b));
const outDir = path.resolve(SRC, 'icon-sheet');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, 'lucide-icons.json'),
  JSON.stringify(
    lucide.map((name) => ({ name, files: [...names.get(name)].sort() })),
    null,
    2
  )
);

console.log(`scanned ${files.length} files, found ${lucide.length} lucide icons`);
console.log(lucide.join(', '));
