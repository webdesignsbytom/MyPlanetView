# A cartoon Pontcysyllte Aqueduct for the country maps, built in the set's shared look (../toon.py):
# Telford's "stream in the sky" carrying the Llangollen Canal high over the River Dee, its row of tall
# slender stone piers tapering up to the cast-iron arches and the iron trough on top, the towpath with
# its railing, a painted narrowboat crossing, and the green valley with the river far below. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P pontcysyllte.py -- pontcysyllte-1024.png 1024 pontcysyllte.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'river': toon('river', '#4a8aa0', lift=0.3),
    'stone': toon('stone', '#bcae94', shadow_mul=(0.84, 0.84, 0.88), lift=0.12),
    'iron': toon('iron', '#3a3a40', lift=0.08),
    'canal': toon('canal', '#4a7a8a', lift=0.25),
    'boatRed': toon('boatRed', '#b83a30', lift=0.1),
    'boatGreen': toon('boatGreen', '#2a6a4a', lift=0.1),
    'cream': toon('cream', '#f0e2c4'),
    'forest': toon('forest', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['grass'])
before = set(bpy.data.objects)
rng = random.Random(1805)

# ---------- the valley: its sides rise to the aqueduct's ends, the Dee in the bottom ----------


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


def side_height(x):
    return G + 0.42 * min(1.0, max(0.0, (abs(x) - 0.75) / 0.6))


for s in (-1, 1):
    x0, x1 = sorted((s * 0.75, s * 1.4))
    foot = vstrip(x0, x1, 1.42, G - 0.01)
    sl = loft(f'valleyside{s}', M['grass'], [foot, [(x, y, side_height(x)) for x, y, _ in foot]], outline=0.005, smooth=True)
    sl.visible_shadow = False
for k in range(10):
    y0, y1 = -0.95 + k * 0.2, -0.95 + (k + 1) * 0.2
    x = 0.12 * math.sin(k * 0.6)
    loft(f'dee{k}', M['river'], [[(x - 0.1, y0, G - 0.003), (x + 0.1, y0, G - 0.003), (x + 0.1, y1, G - 0.003), (x - 0.1, y1, G - 0.003)],
                                 [(x - 0.1, y0, G + 0.006), (x + 0.1, y0, G + 0.006), (x + 0.1, y1, G + 0.006), (x - 0.1, y1, G + 0.006)]], outline=0)

# ---------- the aqueduct ----------
TZ = G + 0.5
L = 0.92
N = 9
for k in range(N):
    x = -L + k * 2 * L / (N - 1)
    base = G + max(0.0, (abs(x) - 0.75)) / 0.65 * 0.42
    loft(f'pier{k}', M['stone'], [[(x - 0.035, -0.04, base - 0.01), (x + 0.035, -0.04, base - 0.01), (x + 0.035, 0.04, base - 0.01), (x - 0.035, 0.04, base - 0.01)],
                                  [(x - 0.022, -0.03, TZ - 0.06), (x + 0.022, -0.03, TZ - 0.06), (x + 0.022, 0.03, TZ - 0.06), (x - 0.022, 0.03, TZ - 0.06)]], outline=0.004)
for k in range(N - 1):
    x0, x1 = -L + k * 2 * L / (N - 1), -L + (k + 1) * 2 * L / (N - 1)
    pts = [(x0 + (x1 - x0) * t / 6, 0, TZ - 0.06 + 0.04 * math.sin(math.pi * t / 6)) for t in range(7)]
    for fy in (-0.03, 0.03):
        for j, (p, q) in enumerate(zip(pts, pts[1:])):
            bar(f'ironarch{k}{fy}{j}', M['iron'], (p[0], fy, p[2]), (q[0], fy, q[2]), 0.012, outline=0)
box('trough', M['iron'], 0, 0, TZ - 0.02, 2 * L + 0.1, 0.09, 0.05, outline=0.005, bevel=0)
box('water', M['canal'], 0, 0.0, TZ + 0.025, 2 * L + 0.08, 0.06, 0.006, outline=0, bevel=0)
box('towpath', M['iron'], 0, -0.065, TZ + 0.02, 2 * L + 0.1, 0.04, 0.01, outline=0.002, bevel=0)
bar('towrail', M['iron'], (-L - 0.05, -0.085, TZ + 0.07), (L + 0.05, -0.085, TZ + 0.07), 0.005, outline=0)
for j in range(31):
    x = -L - 0.05 + j * (2 * L + 0.1) / 30
    rod(f'towpost{j}', M['iron'], (x, -0.085, TZ + 0.025), (x, -0.085, TZ + 0.07), 0.003, segs=4, outline=0)

# ---------- a narrowboat crossing ----------
BX = 0.15
box('boathull', M['boatGreen'], BX, 0.0, TZ + 0.02, 0.3, 0.05, 0.03, outline=0.003, bevel=0)
box('boatcabin', M['boatRed'], BX + 0.02, 0.0, TZ + 0.05, 0.22, 0.045, 0.035, outline=0.003, bevel=0)
box('boatstripe', M['cream'], BX + 0.02, -0.024, TZ + 0.065, 0.2, 0.004, 0.008, outline=0, bevel=0)

for k in range(12):
    x, y = rng.uniform(-1.05, 1.05), rng.choice((rng.uniform(-1.0, -0.35), rng.uniform(0.35, 1.0)))
    if math.hypot(x, y) > 1.2 or abs(x) < 0.25:
        continue
    z = G + max(0.0, (abs(x) - 0.75)) / 0.65 * 0.42
    ball(f'tree{k}', M['forest'], x, y, z + 0.1, rng.uniform(0.08, 0.12), outline=0.011)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
