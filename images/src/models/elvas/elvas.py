# A cartoon Elvas for the country maps, built in the set's shared look (../toon.py): the great
# star-shaped bastioned walls of the garrison town on the Spanish border, their sloping ramparts and
# grassy dry moat, the white town with its red roofs and church tower inside, and the Amoreira
# Aqueduct striding in on its tall tiers of arches across the front of the tile. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P elvas.py -- elvas-1024.png 1024 elvas.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#8ac05a', shadow_mul=(0.72, 0.8, 0.74), lift=0.2),
    'stone': toon('stone', '#d8c8a4', shadow_mul=(0.86, 0.82, 0.8), lift=0.12),
    'stoneDark': toon('stoneDark', '#b8a684'),
    'white': toon('white', '#f6f4ee', shadow_mul=(0.82, 0.84, 0.9), lift=0.2),
    'roof': toon('roof', '#c4603e'),
    'dark': flat('dark', '#2e2a26'),
    'olive': toon('olive', '#8aa060', shadow_mul=(0.72, 0.8, 0.76)),
})

G = tile(M['grass'])
before = set(bpy.data.objects)
rng = random.Random(1642)

# ---------- the star fort ----------
CX, CY = 0.0, 0.3
N = 6
R0, R1 = 0.48, 0.66    # the curtain's corners and the bastions' points
star = []
for k in range(2 * N):
    a = math.pi * k / N + math.pi / 2
    r = R1 if k % 2 == 0 else R0
    star.append((CX + r * math.cos(a) * 1.15, CY + r * math.sin(a) * 0.85))
WZ = G + 0.14
# the star isn't convex, so the rampart is built as triangles round the middle, each one convex
for k in range(2 * N):
    (x0, y0), (x1, y1) = star[k], star[(k + 1) % (2 * N)]
    shrink = lambda x, y, f: (CX + (x - CX) * f, CY + (y - CY) * f)
    t0, t1 = shrink(x0, y0, 0.95), shrink(x1, y1, 0.95)
    loft(f'rampart{k}', M['stone'], [[(CX, CY, G - 0.005), (x0, y0, G - 0.005), (x1, y1, G - 0.005)], [(CX, CY, WZ), (t0[0], t0[1], WZ), (t1[0], t1[1], WZ)]], outline=0.007)
    bar(f'parapet{k}', M['stoneDark'], (t0[0], t0[1], WZ + 0.01), (t1[0], t1[1], WZ + 0.01), 0.025, outline=0.002)
    i0, i1 = shrink(x0, y0, 0.82), shrink(x1, y1, 0.82)
    loft(f'town{k}', M['grass'], [[(CX, CY, WZ - 0.004), (i0[0], i0[1], WZ - 0.004), (i1[0], i1[1], WZ - 0.004)], [(CX, CY, WZ + 0.004), (i0[0], i0[1], WZ + 0.004), (i1[0], i1[1], WZ + 0.004)]], outline=0)
# a sentry box on each bastion's point
for k in range(0, 2 * N, 2):
    x, y = star[k]
    lathe(f'guerite{k}', M['white'], ((0.018, 0), (0.018, 0.04), (0.003, 0.07)), WZ, CX + (x - CX) * 0.93, CY + (y - CY) * 0.93, segs=8, outline=0.002, smooth=False)

# ---------- the town inside the walls ----------
for k in range(16):
    x, y = CX + rng.uniform(-0.4, 0.4), CY + rng.uniform(-0.3, 0.3)
    if math.hypot((x - CX) / 0.45, (y - CY) / 0.34) > 1.0 or math.hypot(x - CX, y - CY - 0.05) < 0.1:
        continue
    h = rng.uniform(0.05, 0.09)
    box(f'house{k}', M['white'], x, y, WZ - 0.005, 0.1, 0.08, h, outline=0.003, bevel=0)
    loft(f'houseroof{k}', M['roof'], [[(x - 0.05, y - 0.04, WZ + h - 0.005), (x + 0.05, y - 0.04, WZ + h - 0.005), (x + 0.05, y + 0.04, WZ + h - 0.005), (x - 0.05, y + 0.04, WZ + h - 0.005)],
                                      [(x - 0.05, y - 0.003, WZ + h + 0.03), (x + 0.05, y - 0.003, WZ + h + 0.03), (x + 0.05, y + 0.003, WZ + h + 0.03), (x - 0.05, y + 0.003, WZ + h + 0.03)]], outline=0.002)
box('church', M['white'], CX, CY + 0.05, WZ - 0.005, 0.14, 0.18, 0.12, outline=0.004, bevel=0)
box('churchtower', M['white'], CX + 0.05, CY - 0.02, WZ - 0.005, 0.07, 0.07, 0.24, outline=0.003, bevel=0)
lathe('churchtowercap', M['stoneDark'], ((0.045, 0), (0.003, 0.07)), WZ + 0.235, CX + 0.05, CY - 0.02, segs=4, outline=0.002, smooth=False)

# ---------- the Amoreira Aqueduct across the front ----------
AY = -0.6
xs = [-1.05 + 2.1 * k / 14 for k in range(15)]
for k, x in enumerate(xs):
    if math.hypot(x, AY) > 1.2:
        continue
    h = 0.42 - 0.12 * (abs(x) / 1.05) ** 2
    box(f'pier{k}', M['stone'], x, AY, G - 0.005, 0.05, 0.06, h, outline=0.003, bevel=0)
for k in range(len(xs) - 1):
    xa, xb = xs[k], xs[k + 1]
    if math.hypot(xa, AY) > 1.2 or math.hypot(xb, AY) > 1.2:
        continue
    xm = (xa + xb) / 2
    h = 0.42 - 0.12 * (abs(xm) / 1.05) ** 2
    for t, z in enumerate((h * 0.5, h - 0.02)):
        box(f'arch{k}{t}', M['stone'], xm, AY, G + z, xb - xa, 0.06, 0.03, outline=0.002, bevel=0)
    box(f'channel{k}', M['stoneDark'], xm, AY, G + h, xb - xa + 0.01, 0.07, 0.03, outline=0.002, bevel=0)
for k, (x, y) in enumerate(((-0.85, -0.2), (0.85, -0.15), (-0.4, -0.95), (0.4, -0.95))):
    ball(f'olive{k}', M['olive'], x, y, G + 0.1, 0.08, outline=0.009)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
