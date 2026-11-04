"""扫描 src 里所有含 emoji 的行，用于清理 toast 文案。
用法：python scripts/_scan-emoji.py
"""
import re
import pathlib

# emoji 主要区段（够覆盖本项目用到的表情）
EMOJI = re.compile(
    "[\U0001F000-\U0001FAFF\U00002600-\U000027BF\U00002B00-\U00002BFF\U0001F1E6-\U0001F1FF\U0000FE0F]"
)

root = pathlib.Path(__file__).resolve().parent.parent / "src"
for p in sorted(root.rglob("*")):
    if p.suffix not in {".tsx", ".ts"}:
        continue
    for i, line in enumerate(p.read_text(encoding="utf-8").splitlines(), 1):
        if EMOJI.search(line):
            print(f"{p.relative_to(root)}:{i}: {line.strip()[:160]}")
