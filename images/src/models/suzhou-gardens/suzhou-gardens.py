# A cartoon Suzhou garden for the country maps, built in the set's shared look (../toon.py): a
# classical garden's pond with its zigzag bridge, the pavilion standing out over the water on its
# posts with its upturned eaves, the whitewashed walls with their round moon gate and dark tiled
# coping, holed Taihu rocks, lotus, a willow and a little stone boat. Turned a little towards the
# camera.
# Run: blender -b --factory-startup -P suzhou-gardens.py -- suzhou-gardens-1024.png 1024 suzhou-gardens.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#c8c4b8', shadow_mul=(0.84, 0.82, 0.88), lift=0.2),
    'pond': toon('pond', '#5a9a8a', lift=0.3),
    'white': toon('white', '#f6f4ee', shadow_mul=(0.82, 0.84, 0.9), lift=0.15),
    'tile': toon('tile', '#3a3a42'),
    'wood': toon('wood', '#8a3a2a'),
    'rail': toon('rail', '#c4402c'),
    'stone': toon('stone', '#b8b4ac'),
    'taihu': toon('taihu', '#9a9894', shadow_mul=(0.84, 0.84, 0.88)),
    'hole': flat('hole', '#5a5854'),
    'pad': toon('pad', '#4f9a4a'),
    'lotus': toon('lotus', '#f07ab0', lift=0.25),
    'willow': toon('willow', '#7ab850', shadow_mul=(0.72, 0.8, 0.74)),
    'trunk': toon('trunk', '#5a4a40'),
    'window': flat('window', '#2e2a28'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)
rng = random.Random(2347)


def ring(cx, cy, rx, ry, z, k, sides=26):
    return [(cx + rx * math.cos(t) * (1 + 0.07 * math.sin(3 * t + k)), cy + ry * math.sin(t) * (1 + 0.07 * math.cos(2 * t + k)), G + z) for t in (2 * math.pi * j / sides for j in range(sides))]


loft('pond', M['pond'], [ring(0.05, -0.05, 0.72, 0.42, -0.004, 1), ring(0.05, -0.05, 0.72, 0.42, 0.006, 1)], outline=0.005, smooth=True)

# ---------- the walls and the moon gate ----------
WY = 0.6
for s in (-1, 1):
    box(f'wall{s}', M['white'], s * 0.5, WY, G - 0.005, 0.7, 0.05, 0.24, outline=0.007, bevel=0)
    loft(f'coping{s}', M['tile'], [[(s * 0.5 - 0.36, WY - 0.045, G + 0.235), (s * 0.5 + 0.36, WY - 0.045, G + 0.235), (s * 0.5 + 0.36, WY + 0.045, G + 0.235), (s * 0.5 - 0.36, WY + 0.045, G + 0.235)],
                                   [(s * 0.5 - 0.36, WY - 0.004, G + 0.27), (s * 0.5 + 0.36, WY - 0.004, G + 0.27), (s * 0.5 + 0.36, WY + 0.004, G + 0.27), (s * 0.5 - 0.36, WY + 0.004, G + 0.27)]], outline=0.004)
cyl('moongate', M['window'], 0.1, 0.006, segs=24, outline=0.002, matrix=Matrix.Translation((-0.45, WY - 0.028, G + 0.11)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for j in range(2):
    box(f'lattice{j}', M['window'], 0.35 + j * 0.18, WY - 0.028, G + 0.1, 0.08, 0.004, 0.08, outline=0, bevel=0)

# ---------- the pavilion over the water ----------
PX, PY = 0.35, 0.15
box('pavilionfloor', M['stone'], PX, PY, G + 0.03, 0.26, 0.22, 0.02, outline=0.004, bevel=0)
for sx in (-1, 1):
    for sy in (-1, 1):
        rod(f'pavpost{sx}{sy}', M['wood'], (PX + sx * 0.1, PY + sy * 0.08, G - 0.005), (PX + sx * 0.1, PY + sy * 0.08, G + 0.2), 0.012, segs=6, outline=0.002)
loft('pavilionroof', M['tile'], [[(PX - 0.19, PY - 0.16, G + 0.2), (PX + 0.19, PY - 0.16, G + 0.2), (PX + 0.19, PY + 0.16, G + 0.2), (PX - 0.19, PY + 0.16, G + 0.2)],
                                 [(PX - 0.1, PY - 0.07, G + 0.26), (PX + 0.1, PY - 0.07, G + 0.26), (PX + 0.1, PY + 0.07, G + 0.26), (PX - 0.1, PY + 0.07, G + 0.26)],
                                 [(PX - 0.01, PY - 0.01, G + 0.33), (PX + 0.01, PY - 0.01, G + 0.33), (PX + 0.01, PY + 0.01, G + 0.33), (PX - 0.01, PY + 0.01, G + 0.33)]], outline=0.006)
for sx in (-1, 1):
    for sy in (-1, 1):
        bar(f'eavetip{sx}{sy}', M['tile'], (PX + sx * 0.17, PY + sy * 0.14, G + 0.205), (PX + sx * 0.22, PY + sy * 0.19, G + 0.25), 0.014, outline=0.002)

# ---------- the zigzag bridge ----------
ZIG = [(-0.75, -0.35), (-0.5, -0.2), (-0.25, -0.35), (0.0, -0.2), (0.25, -0.35), (0.35, 0.0)]
for j in range(len(ZIG) - 1):
    (x0, y0), (x1, y1) = ZIG[j], ZIG[j + 1]
    bar(f'deck{j}', M['stone'], (x0, y0, G + 0.03), (x1, y1, G + 0.03), 0.06, outline=0.003)
    for s in (-1, 1):
        a = math.atan2(y1 - y0, x1 - x0) + math.pi / 2
        bar(f'rail{j}{s}', M['rail'], (x0 + s * 0.03 * math.cos(a), y0 + s * 0.03 * math.sin(a), G + 0.07), (x1 + s * 0.03 * math.cos(a), y1 + s * 0.03 * math.sin(a), G + 0.07), 0.008, outline=0)

# ---------- Taihu rocks, lotus, a willow ----------
for k, (x, y, h) in enumerate(((-0.75, 0.3, 0.28), (-0.6, 0.38, 0.2), (0.85, -0.2, 0.22))):
    lathe(f'taihu{k}', M['taihu'], ((0.06, 0), (0.08, h * 0.3), (0.05, h * 0.6), (0.07, h * 0.85), (0.03, h)), G - 0.005, x, y, segs=7, outline=0.005, smooth=False)
    for j in range(2):
        ball(f'taihuhole{k}{j}', M['hole'], x, y - 0.06, G + h * (0.35 + j * 0.3), 0.02, outline=0)
for k in range(8):
    x, y = rng.uniform(-0.45, 0.6), rng.uniform(-0.35, 0.05)
    lathe(f'pad{k}', M['pad'], ((0.035, 0), (0.035, 0.005)), G + 0.006, x, y, segs=10, outline=0.001)
    if k % 2:
        lathe(f'lotus{k}', M['lotus'], ((0.01, 0), (0.024, 0.02), (0.004, 0.04)), G + 0.01, x, y, segs=6, outline=0.002, smooth=False)
WX, WYY = -0.95, -0.15
rod('willowtrunk', M['trunk'], (WX, WYY, G), (WX + 0.03, WYY, G + 0.22), 0.016, segs=6, outline=0.003)
for j in range(7):
    a = 2 * math.pi * j / 7
    bar(f'willowfrond{j}', M['willow'], (WX + 0.03, WYY, G + 0.22), (WX + 0.03 + 0.1 * math.cos(a), WYY + 0.1 * math.sin(a), G + 0.08), 0.02, outline=0.002)

turn(before, -20)
render(G)
