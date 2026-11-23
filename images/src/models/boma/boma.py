# A cartoon Boma National Park for the country maps, built in the set's shared look (../toon.py):
# South Sudan's grasslands, a long herd of white-eared kob on their migration across the plain, the
# Boma plateau's hills behind, a winding river, and flat-topped acacias. Turned a little towards the
# camera.
# Run: blender -b --factory-startup -P boma.py -- boma-1024.png 1024 boma.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grassland', '#b8b860', shadow_mul=(0.8, 0.78, 0.68), lift=0.25),
    'hill': toon('hill', '#7a9a55', shadow_mul=(0.72, 0.78, 0.78)),
    'river': toon('river', '#5a9ec0', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'kob': toon('kob', '#4a3830', shadow_mul=(0.85, 0.84, 0.88)),
    'kobWhite': toon('kobWhite', '#f4efe2', lift=0.2),
    'acacia': toon('acacia', '#6aa54a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6b5040'),
    'tuft': toon('tuft', '#a8a24e', shadow_mul=(0.8, 0.76, 0.66)),
})

G = tile(M['grass'])
before = set(bpy.data.objects)
rng = random.Random(953)


def squashed(name, mat, x, y, z, r, sx, sy, sz, outline=0.02):
    b = ball(name, mat, 0, 0, 0, r, outline=outline)
    b.scale = (sx, sy, sz)
    b.location = (x, y, z)
    return b


# ---------- the Boma plateau's hills behind ----------
for k, (cx, cy, rx, ry, h) in enumerate(((-0.5, 0.9, 0.55, 0.3, 0.32), (0.3, 1.0, 0.6, 0.28, 0.38), (0.9, 0.6, 0.3, 0.3, 0.22))):
    rings = [[(cx + s * rx * math.cos(t), cy + s * ry * math.sin(t), G + z) for t in (2 * math.pi * j / 20 for j in range(20))] for s, z in ((1.0, -0.01), (0.6, h * 0.75), (0.3, h))]
    hl = loft(f'hill{k}', M['hill'], rings, outline=0.022, smooth=True)
    hl.visible_shadow = False

# ---------- the river ----------
PATH = [(-1.2, 0.35), (-0.8, 0.45), (-0.4, 0.38), (0.0, 0.5), (0.4, 0.42), (0.75, 0.3), (1.15, 0.22)]
bm = bmesh.new()
verts = []
for i, (x, y) in enumerate(PATH):
    (x0, y0), (x1, y1) = PATH[max(0, i - 1)], PATH[min(len(PATH) - 1, i + 1)]
    dx, dy = x1 - x0, y1 - y0
    n = math.hypot(dx, dy)
    verts.append((bm.verts.new((x - dy / n * 0.05, y + dx / n * 0.05, G + 0.005)), bm.verts.new((x + dy / n * 0.05, y - dx / n * 0.05, G + 0.005))))
for (a0, a1), (b0, b1) in zip(verts, verts[1:]):
    bm.faces.new((a0, a1, b1, b0))
finish('river', bm, M['river'], outline=0.006)


# ---------- the kob migration: a long herd crossing the plain ----------
def kob(name, x, y, a, s):
    c, sn = math.cos(a), math.sin(a)
    at = lambda dx, dy, z: (x + (dx * c - dy * sn) * s, y + (dx * sn + dy * c) * s, G + z * s)
    for j, (dx, dy) in enumerate(((-0.03, -0.01), (-0.03, 0.01), (0.03, -0.01), (0.03, 0.01))):
        rod(f'{name}leg{j}', M['kob'], at(dx, dy, 0), at(dx, dy, 0.06), 0.005 * s, segs=5, outline=0.002)
    bx, by, _ = at(0, 0, 0)
    box(f'{name}body', M['kob'], bx, by, G + 0.055 * s, 0.085 * s, 0.03 * s, 0.035 * s, rot_z=a, outline=0.004, bevel=0.01 * s)
    rod(f'{name}neck', M['kob'], at(0.035, 0, 0.08), at(0.05, 0, 0.11), 0.008 * s, segs=5, outline=0.002)
    hx, hy, _ = at(0.06, 0, 0)
    box(f'{name}head', M['kob'], hx, hy, G + 0.105 * s, 0.03 * s, 0.018 * s, 0.018 * s, rot_z=a, outline=0.003, bevel=0.004)
    hx, hy, _ = at(0.055, 0, 0)
    box(f'{name}face', M['kobWhite'], hx, hy, G + 0.108 * s, 0.012 * s, 0.022 * s, 0.012 * s, rot_z=a, outline=0, bevel=0)
    for side in (-1, 1):
        rod(f'{name}horn{side}', M['kob'], at(0.055, side * 0.006, 0.12), at(0.045, side * 0.012, 0.16), 0.003 * s, segs=4, outline=0.001)


for k in range(16):
    t = k / 15
    x = -1.0 + 2.0 * t + rng.uniform(-0.05, 0.05)
    y = -0.25 + 0.25 * math.sin(t * 3.0) + rng.uniform(-0.12, 0.12)
    if math.hypot(x, y) > 1.2:
        continue
    kob(f'kob{k}', x, y, 0.15 + rng.uniform(-0.2, 0.2), rng.uniform(1.1, 1.4))

# ---------- acacias and tufts ----------
for k, (x, y) in enumerate(((-0.85, -0.6), (0.75, -0.65), (-0.6, 0.15), (0.65, 0.05))):
    h = rng.uniform(0.2, 0.26)
    rod(f'acaciatrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + h), 0.014, segs=6, outline=0.005)
    squashed(f'acacia{k}', M['acacia'], x + 0.02, y, G + h + 0.02, 0.11, 1.5, 1.2, 0.35, outline=0.012)
for k in range(26):
    x, y = rng.uniform(-1.2, 1.2), rng.uniform(-1.2, 0.3)
    if math.hypot(x, y) > 1.25:
        continue
    lathe(f'tuft{k}', M['tuft'], ((0.025, 0), (0.004, 0.05)), G, x, y, segs=6, outline=0.004, smooth=False)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
