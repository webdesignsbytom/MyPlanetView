# A cartoon Spiš Castle for the country maps, built in the set's shared look (../toon.py): the
# great white ruin spread along its hill, the outer bailey's crenellated walls round the lower
# terrace, broken off here and there, and on the summit the upper castle: its walls, the roofless
# Romanesque palace with its windows open to the sky, and the round keep. Turned a little towards
# the camera.
# Run: blender -b --factory-startup -P spis-castle.py -- spis-castle-1024.png 1024 spis-castle.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'hill': toon('hill', '#9ab85a', shadow_mul=(0.74, 0.8, 0.76)),
    'grass': toon('grass2', '#8ab55a', shadow_mul=(0.72, 0.8, 0.76), lift=0.25),
    'outcrop': toon('outcrop', '#d8d2c2', shadow_mul=(0.8, 0.8, 0.88)),
    'stone': toon('stone', '#e2dccd', shadow_mul=(0.78, 0.78, 0.88), lift=0.2),
    'stoneDark': toon('stoneDark', '#bfb7a6', shadow_mul=(0.78, 0.78, 0.88)),
    'window': flat('window', '#3a3640'),
    'tree': toon('tree', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(233)
SIDES = 20


def ring(cx, cy, rx, ry, z, jitter):
    return [(cx + rx * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / SIDES),
             cy + ry * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / SIDES), G + z) for k in range(SIDES)]


# ---------- the hill: a broad lower terrace and the summit at the back ----------
LOW, HIGH = 0.18, 0.46
LX, LY, LRX, LRY = 0.0, 0.1, 1.12, 0.66
lower = loft('lowerhill', M['hill'], [ring(LX, LY, LRX + 0.12, LRY + 0.1, -0.01, 0.03), ring(LX, LY, LRX, LRY, LOW, 0.0)], outline=0.03)
UX, UY, URX, URY = 0.42, 0.35, 0.48, 0.34
upper = loft('summit', M['hill'], [ring(UX, UY, URX + 0.1, URY + 0.08, LOW - 0.01, 0.04), ring(UX, UY, URX, URY, HIGH, 0.0)], outline=0.028)
lower.visible_shadow = upper.visible_shadow = False
for k, (x, y, r) in enumerate(((0.75, -0.15, 0.1), (0.05, 0.62, 0.09), (0.85, 0.55, 0.08))):
    o = ball(f'outcrop{k}', M['outcrop'], x, y, G + LOW + 0.08, r, outline=0.016)


def crenellated_wall(name, pts, z0, h, broken=()):
    """Walls along a closed outline, merlons along the top; the segments in `broken` stand lower, ruined."""
    for k, ((x0, y0), (x1, y1)) in enumerate(zip(pts, pts[1:] + pts[:1])):
        length = math.hypot(x1 - x0, y1 - y0)
        a = math.atan2(y1 - y0, x1 - x0)
        hh = h * (0.45 if k in broken else 1.0)
        box(f'{name}{k}', M['stone'], (x0 + x1) / 2, (y0 + y1) / 2, z0 - 0.005, length + 0.04, 0.05, hh, rot_z=a, outline=0.014, bevel=0)
        if k not in broken:
            for m in range(int(length / 0.06)):
                t = (m + 0.5) / int(length / 0.06)
                box(f'{name}merlon{k}_{m}', M['stone'], x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, z0 + hh - 0.005, 0.03, 0.05, 0.03, rot_z=a, outline=0.006,
                    bevel=0)
        # a round tower at each corner
        lathe(f'{name}tower{k}', M['stoneDark'], ((0.055, 0), (0.05, h + 0.05)), z0 - 0.005, x0, y0, segs=14, outline=0.012)


def outline_points(cx, cy, rx, ry, n, start=0.0):
    return [(cx + rx * math.cos(start + 2 * math.pi * k / n), cy + ry * math.sin(start + 2 * math.pi * k / n)) for k in range(n)]


# ---------- the outer bailey round the lower terrace ----------
crenellated_wall('bailey', outline_points(LX - 0.05, LY - 0.02, LRX * 0.9, LRY * 0.85, 9, 0.3), G + LOW, 0.15, broken=(2, 6))
# ---------- the upper castle on the summit ----------
T = G + HIGH
crenellated_wall('upperwall', outline_points(UX, UY, URX * 0.88, URY * 0.85, 6, 0.4), T, 0.18, broken=(3,))
# the roofless palace, its windows open
PX, PY = UX - 0.12, UY + 0.05
for k, (x, y, w, d) in enumerate(((PX, PY - 0.1, 0.34, 0.04), (PX, PY + 0.1, 0.34, 0.04), (PX - 0.17, PY, 0.04, 0.24), (PX + 0.17, PY, 0.04, 0.24))):
    box(f'palace{k}', M['stone'], x, y, T - 0.005, w, d, 0.24 if k != 1 else 0.3, outline=0.014, bevel=0)
for k in range(4):
    box(f'palacewin{k}', M['window'], PX - 0.12 + k * 0.08, PY - 0.122, T + 0.12, 0.03, 0.01, 0.07, outline=0, bevel=0)
    box(f'palacewinlow{k}', M['window'], PX - 0.12 + k * 0.08, PY - 0.122, T + 0.03, 0.025, 0.01, 0.05, outline=0, bevel=0)
# the round keep, its top broken
KX, KY = UX + 0.2, UY + 0.05
lathe('keep', M['stone'], ((0.11, 0), (0.1, 0.5)), T - 0.005, KX, KY, segs=20, outline=0.02)
for k in range(10):
    a = 2 * math.pi * k / 10
    h = rng.uniform(0.02, 0.07) if k % 3 else 0.0
    if h:
        box(f'keeptop{k}', M['stone'], KX + 0.095 * math.cos(a), KY + 0.095 * math.sin(a), T + 0.49, 0.05, 0.035, h, rot_z=a + math.pi / 2, outline=0.006,
            bevel=0)
for k, z in enumerate((0.2, 0.34)):
    box(f'keepwin{k}', M['window'], KX - 0.02, KY - 0.108, T + z, 0.025, 0.01, 0.05, outline=0, bevel=0)

# ---------- trees on the lower slopes ----------
for k, (x, y) in enumerate(((-1.05, -0.45), (-0.6, -0.75), (0.55, -0.8), (1.1, -0.3), (-1.15, 0.45))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.12, 0.1, outline=0.018)

turn(before, -20)
render(G)
