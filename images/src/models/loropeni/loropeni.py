# Cartoon Ruins of Loropéni for the country maps, built in the set's shared look (../toon.py):
# Burkina Faso's high laterite-stone enclosure in the savanna, its reddish walls crumbled to
# different heights, gaps and fallen stones, inner walls dividing it, shea trees round about, and a
# thatched round hut by the path to the entrance. Turned a little towards the camera.
# Run: blender -b --factory-startup -P loropeni.py -- loropeni-1024.png 1024 loropeni.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'savanna': toon('savanna', '#b8b45e', shadow_mul=(0.8, 0.76, 0.66), lift=0.25),
    'laterite': toon('laterite', '#a8583a', shadow_mul=(0.84, 0.72, 0.72)),
    'lateriteDark': toon('lateriteDark', '#8a4630', shadow_mul=(0.84, 0.72, 0.72)),
    'earth': toon('earth', '#c48a5a', lift=0.2),
    'shea': toon('shea', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6b5040'),
    'thatch': toon('thatch', '#c9a85a', shadow_mul=(0.84, 0.76, 0.62)),
    'mud': toon('mud', '#b87a50'),
    'window': flat('window', '#3a3640'),
    'tuft': toon('tuft', '#a09a48', shadow_mul=(0.8, 0.76, 0.66)),
})

G = tile(M['savanna'])
before = set(bpy.data.objects)
rng = random.Random(619)


def wall(name, p0, p1, hmin, hmax, gaps=()):
    """A crumbled wall from p0 to p1, in pieces of different heights; `gaps` are pieces left out."""
    (x0, y0), (x1, y1) = p0, p1
    length = math.hypot(x1 - x0, y1 - y0)
    a = math.atan2(y1 - y0, x1 - x0)
    n = max(2, int(length / 0.09))
    for k in range(n):
        if k in gaps:
            continue
        t = (k + 0.5) / n
        h = rng.uniform(hmin, hmax)
        x, y = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
        box(f'{name}{k}', M['laterite' if k % 3 else 'lateriteDark'], x, y, G - 0.005, length / n + 0.004, 0.065, h, rot_z=a, outline=0.01, bevel=0)
        if rng.random() < 0.5:
            box(f'{name}top{k}', M['lateriteDark'], x + rng.uniform(-0.01, 0.01), y, G + h - 0.006, length / n * 0.6, 0.05, 0.03, rot_z=a + rng.uniform(-0.1, 0.1), outline=0.005,
                bevel=0)


# ---------- the enclosure ----------
C = [(-0.72, -0.42), (0.62, -0.5), (0.72, 0.52), (-0.62, 0.6)]
wall('wallfront', C[0], C[1], 0.16, 0.3, gaps=(6,))
wall('wallright', C[1], C[2], 0.2, 0.34)
wall('wallback', C[2], C[3], 0.24, 0.36)
wall('wallleft', C[3], C[0], 0.2, 0.32, gaps=(3, 4))
wall('wallinner', (-0.05, -0.46), (0.02, 0.56), 0.1, 0.2, gaps=(5,))
wall('wallinner2', (0.02, 0.1), (0.66, 0.02), 0.08, 0.16)
box('floorinside', M['earth'], 0.0, 0.05, G - 0.004, 1.2, 0.92, 0.008, rot_z=-0.02, outline=0, bevel=0)
for k in range(12):
    x, y = rng.uniform(-0.6, 0.6), rng.uniform(-0.6, 0.65)
    box(f'stone{k}', M['laterite'], x, y, G - 0.004, rng.uniform(0.03, 0.06), rng.uniform(0.03, 0.05), rng.uniform(0.02, 0.04), rot_z=rng.uniform(0, 3), outline=0.004,
        bevel=0)

# ---------- shea trees and grass round about ----------
for k, (x, y) in enumerate(((-1.0, 0.1), (-0.85, 0.75), (0.95, 0.75), (1.05, -0.2), (0.6, -0.95), (-0.55, -0.95), (0.1, 1.05))):
    h = rng.uniform(0.14, 0.2)
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + h), 0.02, segs=8, outline=0.008)
    ball(f'shea{k}', M['shea'], x, y, G + h + 0.07, rng.uniform(0.11, 0.14), outline=0.016)
for k in range(26):
    x, y = rng.uniform(-1.2, 1.2), rng.uniform(-1.2, 1.2)
    if math.hypot(x, y) > 1.28 or (-0.8 < x < 0.8 and -0.6 < y < 0.7):
        continue
    lathe(f'tuft{k}', M['tuft'], ((0.03, 0), (0.004, 0.05)), G, x, y, segs=6, outline=0.004, smooth=False)

# ---------- the path to the entrance and a thatched hut beside it ----------
box('path', M['earth'], 0.38, -0.85, G - 0.004, 0.14, 0.75, 0.008, rot_z=0.25, outline=0.004, bevel=0)
HX, HY = 0.0, -0.85
lathe('hutwall', M['mud'], ((0.11, 0), (0.11, 0.1)), G - 0.005, HX, HY, segs=16, outline=0.01)
lathe('hutroof', M['thatch'], ((0.15, 0), (0.08, 0.06), (0.004, 0.15)), G + 0.09, HX, HY, segs=16, outline=0.01)
box('hutdoor', M['window'], HX, HY - 0.108, G, 0.04, 0.01, 0.07, outline=0, bevel=0)

turn(before, -20)
render(G)
