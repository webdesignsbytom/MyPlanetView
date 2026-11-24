# A cartoon Mazagan for the country maps, built in the set's shared look (../toon.py): the Portuguese
# fortress town of El Jadida on Morocco's Atlantic coast, its thick ochre ramparts with the angled
# bastions at the corners and the sea gate, the Church of the Assumption's square tower and the
# five-sided minaret that was once the Portuguese lighthouse rising inside, the white houses, and
# the Atlantic washing round two sides. Turned a little towards the camera.
# Run: blender -b --factory-startup -P mazagan.py -- mazagan-1024.png 1024 mazagan.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sand': toon('sand', '#e8d8b0', shadow_mul=(0.84, 0.82, 0.86), lift=0.2),
    'water': toon('water', '#3a8ac0', lift=0.3),
    'ochre': toon('ochre', '#d8b07a', shadow_mul=(0.8, 0.76, 0.8), lift=0.15),
    'ochreDark': toon('ochreDark', '#b8905e'),
    'white': toon('white', '#f6f4ee', lift=0.22),
    'blue': toon('blue', '#4a7ab0', lift=0.15),
    'dark': flat('dark', '#2e2a2a'),
    'palm': toon('palm', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6a4a'),
})

G = tile(M['sand'])
before = set(bpy.data.objects)

# ---------- the sea round the front and the left ----------
def strip(y0, y1, r, z):
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    right = [(r * math.cos(a0 + (a1 - a0) * k / 12), r * math.sin(a0 + (a1 - a0) * k / 12), z) for k in range(13)]
    left = [(-r * math.cos(a1 + (a0 - a1) * k / 12), r * math.sin(a1 + (a0 - a1) * k / 12), z) for k in range(13)]
    return right + left


def vstrip(x0, x1, r, z):
    a0, a1 = math.acos(x1 / r), math.acos(x0 / r)
    bottom = [(r * math.cos(-a1 + (a1 - a0) * k / 12), r * math.sin(-a1 + (a1 - a0) * k / 12), z) for k in range(13)]
    top = [(r * math.cos(a0 + (a1 - a0) * k / 12), r * math.sin(a0 + (a1 - a0) * k / 12), z) for k in range(13)]
    return bottom + top


loft('seafront', M['water'], [strip(-1.31, -0.6, 1.32, G - 0.004), strip(-1.31, -0.6, 1.32, G + 0.008)], outline=0.002)
loft('seaside', M['water'], [vstrip(-1.31, -0.66, 1.32, G - 0.003), vstrip(-1.31, -0.66, 1.32, G + 0.0085)], outline=0.002)

# ---------- the ramparts and the bastions ----------
C = [(-0.45, -0.4), (0.5, -0.4), (0.5, 0.5), (-0.45, 0.5)]
WH = 0.13
for k in range(4):
    (x0, y0), (x1, y1) = C[k], C[(k + 1) % 4]
    d = math.hypot(x1 - x0, y1 - y0)
    box(f'rampart{k}', M['ochre'], (x0 + x1) / 2, (y0 + y1) / 2, G - 0.005, 0.07, d, WH, rot_z=math.atan2(-(x1 - x0), y1 - y0), outline=0.005, bevel=0)
    n = int(d / 0.06)
    for j in range(n):
        t = (j + 0.5) / n
        box(f'merlon{k}{j}', M['ochreDark'], x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, G + WH - 0.005, 0.03, 0.03, 0.025, rot_z=math.atan2(-(x1 - x0), y1 - y0), outline=0.001, bevel=0)
for k, (cx, cy) in enumerate(C):
    ox, oy = (1 if cx > 0 else -1), (1 if cy > 0 else -1)
    pts = [(cx - ox * 0.08, cy), (cx + ox * 0.08, cy + oy * 0.17), (cx + ox * 0.17, cy + oy * 0.08), (cx, cy - oy * 0.08)]
    loft(f'bastion{k}', M['ochre'], [[(x, y, G - 0.005) for x, y in pts], [(x, y, G + WH + 0.01) for x, y in pts]], outline=0.005)
box('seagate', M['ochre'], 0.0, -0.4, G - 0.005, 0.16, 0.1, WH + 0.05, outline=0.004, bevel=0)
box('seagatearch', M['dark'], 0.0, -0.452, G - 0.005, 0.06, 0.006, 0.09, outline=0, bevel=0)
cyl('seagatetop', M['dark'], 0.03, 0.006, segs=10, outline=0, matrix=Matrix.Translation((0.0, -0.452, G + 0.085)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))

# ---------- inside: the houses, the church and the minaret ----------
rng = random.Random(1502)
for k in range(9):
    x, y = -0.3 + (k % 3) * 0.28, -0.22 + (k // 3) * 0.25
    if (k % 3, k // 3) in ((1, 1), (2, 2)):
        continue
    box(f'house{k}', M['white'], x, y, G - 0.005, 0.2, 0.16, 0.08 + 0.03 * rng.random(), outline=0.004, bevel=0)
    box(f'housedoor{k}', M['blue'], x, y - 0.083, G - 0.005, 0.03, 0.006, 0.05, outline=0, bevel=0)
# the Church of the Assumption
box('church', M['white'], 0.0, 0.05, G - 0.005, 0.16, 0.26, 0.14, outline=0.004, bevel=0)
box('churchtower', M['white'], 0.0, -0.1, G - 0.005, 0.09, 0.09, 0.28, outline=0.004, bevel=0)
box('belfry', M['dark'], 0.0, -0.146, G + 0.21, 0.03, 0.006, 0.04, outline=0, bevel=0)
pyramid('churchtowercap', M['ochreDark'], 0.0, -0.1, G + 0.275, 0.1, 0.06)
# the five-sided minaret, the old lighthouse
MX, MY = 0.28, 0.32
lathe('minaret', M['ochre'], ((0.055, 0), (0.05, 0.38)), G - 0.005, MX, MY, segs=5, outline=0.004, smooth=False)
lathe('minaretgallery', M['ochreDark'], ((0.07, 0), (0.07, 0.025)), G + 0.37, MX, MY, segs=5, outline=0.002, smooth=False)
lathe('minarettop', M['white'], ((0.03, 0), (0.03, 0.06), (0.003, 0.1)), G + 0.39, MX, MY, segs=5, outline=0.002, smooth=False)

for k, (x, y) in enumerate(((0.8, 0.3), (0.75, 0.75), (0.1, 0.9), (0.9, -0.2))):
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + 0.28), 0.012, segs=6, outline=0.002)
    for j in range(6):
        a = 2 * math.pi * j / 6
        b = ball(f'frond{k}{j}', M['palm'], 0, 0, 0, 1.0, outline=0.003)
        b.scale = (0.08, 0.02, 0.012)
        b.rotation_euler = (0, 0.35, a)
        b.location = (x + 0.02 + 0.06 * math.cos(a), y + 0.06 * math.sin(a), G + 0.27)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
