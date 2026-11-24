# A cartoon Iron Bridge for the country maps, built in the set's shared look (../toon.py): the
# world's first cast-iron bridge leaping over the River Severn in a single arch, its five ribs of
# dark iron with their circles in the spandrels, the stone abutments and the deck with its railings,
# the steep wooded sides of the gorge and the brick houses of the town climbing the hill. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P ironbridge.py -- ironbridge-1024.png 1024 ironbridge.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'river': toon('river', '#6a8a6a', shadow_mul=(0.8, 0.86, 0.84), lift=0.25),
    'iron': toon('iron', '#4a3e3a', shadow_mul=(0.86, 0.84, 0.86), lift=0.1),
    'stone': toon('stone', '#c8b894', lift=0.12),
    'brick': toon('brick', '#b86a4a', lift=0.08),
    'roof': toon('roof', '#5a5e66'),
    'dark': flat('dark', '#2e2a26'),
    'forest': toon('forest', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['grass'])
before = set(bpy.data.objects)
rng = random.Random(1779)


def vstrip(x0, x1, r, z, n=8):
    """The band of the tile's disc between x0 and x1 (counter-clockwise from above)."""
    ya0, ya1 = math.sqrt(r * r - x0 * x0), math.sqrt(r * r - x1 * x1)
    b0, b1 = math.acos(x0 / r), math.acos(x1 / r)
    pts = [(x0, -ya0)]
    pts += [(r * math.cos(-b0 + (b0 - b1) * k / n), r * math.sin(-b0 + (b0 - b1) * k / n)) for k in range(1, n)]
    pts += [(x1, -ya1), (x1, ya1)]
    pts += [(r * math.cos(b1 + (b0 - b1) * k / n), r * math.sin(b1 + (b0 - b1) * k / n)) for k in range(1, n)]
    pts += [(x0, ya0)]
    return [(x, y, z) for x, y in pts]


RW = 0.32   # half the river's width; it runs front to back
loft('severn', M['river'], [vstrip(-RW, RW, 1.42, G - 0.004), vstrip(-RW, RW, 1.42, G + 0.004)], outline=0)
# the gorge's banks rising either side
for s in (-1, 1):
    x0, x1 = sorted((s * (RW + 0.02), s * 1.38))
    bank = loft(f'bank{s}', M['grass'], [vstrip(x0, x1, 1.42, G - 0.01), vstrip(x0, x1, 1.42, G + 0.06)], outline=0.004)
    bank.visible_shadow = False

# ---------- the bridge ----------
SPAN = RW + 0.04
DZ = G + 0.3
for s in (-1, 1):
    box(f'abutment{s}', M['stone'], s * (SPAN + 0.08), 0, G - 0.005, 0.16, 0.26, DZ - G, outline=0.006, bevel=0)
box('deck', M['iron'], 0, 0, DZ - 0.015, 2 * SPAN + 0.32, 0.2, 0.025, outline=0.004, bevel=0)
for fy in (-1, 1):
    bar(f'railing{fy}', M['iron'], (-SPAN - 0.16, fy * 0.1, DZ + 0.05), (SPAN + 0.16, fy * 0.1, DZ + 0.05), 0.008, outline=0)
    for j in range(21):
        x = -SPAN - 0.16 + j * (2 * SPAN + 0.32) / 20
        rod(f'baluster{fy}{j}', M['iron'], (x, fy * 0.1, DZ), (x, fy * 0.1, DZ + 0.05), 0.003, segs=4, outline=0)
# the five ribs, each a semicircular arch
N = 16
for r in range(5):
    y = -0.08 + r * 0.04
    pts = [(-SPAN * math.cos(math.pi * k / N), y, G + 0.02 + (DZ - G - 0.05) * math.sin(math.pi * k / N)) for k in range(N + 1)]
    for k, (p, q) in enumerate(zip(pts, pts[1:])):
        bar(f'rib{r}{k}', M['iron'], p, q, 0.018, outline=0.002)
    # the spandrel circles and uprights on the outer ribs
    if r in (0, 4):
        for s in (-1, 1):
            cx = s * SPAN * 0.62
            ring = [(cx + 0.045 * math.cos(2 * math.pi * k / 12), y, DZ - 0.07 + 0.045 * math.sin(2 * math.pi * k / 12)) for k in range(13)]
            for k, (p, q) in enumerate(zip(ring, ring[1:])):
                bar(f'circle{r}{s}{k}', M['iron'], p, q, 0.008, outline=0)
            for x in (s * SPAN * 0.85, s * SPAN * 0.35):
                bar(f'upright{r}{s}{x:.2f}', M['iron'], (x, y, G + 0.02 + (DZ - G - 0.05) * math.sqrt(max(0.0, 1 - (x / SPAN) ** 2))), (x, y, DZ - 0.02), 0.01, outline=0)

# ---------- the town and the wooded gorge ----------
for k, (x, y) in enumerate(((-0.65, 0.55), (-0.85, 0.2), (-0.6, -0.2), (0.62, 0.5), (0.85, 0.05), (0.6, -0.4))):
    h = rng.uniform(0.12, 0.18)
    box(f'house{k}', M['brick'], x, y, G + 0.055, 0.2, 0.16, h, outline=0.005, bevel=0)
    box(f'housewin{k}', M['dark'], x - (0.103 if x > 0 else -0.103), y, G + 0.055 + h * 0.5, 0.006, 0.04, 0.04, outline=0, bevel=0)
    loft(f'houseroof{k}', M['roof'], [[(x - 0.105, y - 0.085, G + 0.05 + h), (x + 0.105, y - 0.085, G + 0.05 + h), (x + 0.105, y + 0.085, G + 0.05 + h), (x - 0.105, y + 0.085, G + 0.05 + h)],
                                      [(x - 0.105, y - 0.004, G + 0.1 + h), (x + 0.105, y - 0.004, G + 0.1 + h), (x + 0.105, y + 0.004, G + 0.1 + h), (x - 0.105, y + 0.004, G + 0.1 + h)]], outline=0.003)
for k in range(14):
    s = rng.choice((-1, 1))
    x = s * rng.uniform(0.42, 1.05)
    y = rng.choice((rng.uniform(-1.0, -0.55), rng.uniform(0.7, 1.05)))
    if math.hypot(x, y) > 1.2:
        continue
    ball(f'tree{k}', M['forest'], x, y, G + 0.14, rng.uniform(0.09, 0.13), outline=0.012)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
