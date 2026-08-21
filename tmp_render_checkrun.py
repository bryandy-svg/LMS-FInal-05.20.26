from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parent
source = root / "supabase-app" / "app.js"
lines = source.read_text(encoding="utf-8", errors="replace").splitlines()
terms = ["printCheckRun", "openCheckRunModal", "check_runs", "For Printing", "For Check Run"]
hits = []
for idx, line in enumerate(lines):
    if any(term in line for term in terms):
        start = max(0, idx - 12)
        end = min(len(lines), idx + 35)
        hits.append((start, end))

merged = []
for start, end in hits:
    if merged and start <= merged[-1][1] + 3:
        merged[-1] = (merged[-1][0], max(merged[-1][1], end))
    else:
        merged.append((start, end))

selected = []
for start, end in merged:
    selected.append(f"===== LINES {start + 1}-{end} =====")
    for i in range(start, end):
        selected.append(f"{i + 1:6}  {lines[i]}")

font = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", 14)
line_h = 19
max_chars = 190
wrapped = []
for line in selected:
    while len(line) > max_chars:
        wrapped.append(line[:max_chars])
        line = "       " + line[max_chars:]
    wrapped.append(line)

height = max(300, min(30000, 20 + line_h * len(wrapped)))
img = Image.new("RGB", (2600, height), "white")
draw = ImageDraw.Draw(img)
for i, line in enumerate(wrapped[: (height - 20) // line_h]):
    draw.text((10, 10 + i * line_h), line, font=font, fill="black")
img.save(root / "tmp_checkrun_code.png")
