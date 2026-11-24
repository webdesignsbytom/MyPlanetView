# A cartoon Derbent for the country maps, built in the set's shared look (../toon.py): the Naryn-Kala
# citadel on its ridge above the old town, its massive walls of yellow stone with their square towers
# running down the slope towards the Caspian in two long parallel lines, the old town's flat-roofed
# houses packed between them, the citadel's gate, and the sea at the bottom. Turned a little towards
# the camera.
# Run: blender -b --factory-startup -P derbent.py -- derbent-1024.png 1024 derbent.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'hill': toon('hill', '#b8b070', shadow_mul=(0.8, 0.8, 0.8)),
    'sea': toon('sea', '#3a8ab0', lift=0.3),
    'stone': toon('stone', '#d8c08a', shadow_mul=(0.86, 0.8, 0.74), lift=0.1),
    'stoneDark': toon('stoneDark', '#b89e68'),
    'house': toon('house', '#e0d0b0', lift=0.12),
    'dark': flat('dark', '#3a2e24'),
    'tree': toon('tree', '#5a9a4a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['hill'])
before = set(bpy.data.objects)
rng = random.Random(552)


def strip(y0, y1, r, z, n=6):
    """The band of the tile's disc between y0 and y1 (counter-clockwise from above)."""
    xa0, xa1 = math.sqrt(r * r - y0 * y0), math.sqrt(r * r - y1 * y1)
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    pts = [(-xa0, y0), (xa0, y0)]
    pts += [(r * math.cos(a0 + (a1 - a0) * k / n), r * math.sin(a0 + (a1 - a0) * k / n)) for k in range(1, n)]
    pts += [(xa1, y1), (-xa1, y1)]
    pts += [(r * math.cos(math.pi - a1 + (a1 - a0) * k / n), r * math.sin(math.pi - a1 + (a1 - a0) * k / n)) for k in range(1, n)]
    return [(x, y, G + z) for x, y in pts]


# the Caspian at the front, the ground rising to the citadel's ridge at the back
loft('caspian', M['sea'], [strip(-1.41, -0.95, 1.42, -0.004), strip(-1.41, -0.95, 1.42, 0.004)], outline=0)
HZ = 0.3


def ground(y):
    return G + HZ * min(1.0, max(0.0, (y + 0.9) / 1.3))


for j in range(8):
    y0, y1 = -0.95 + j * 0.3, min(-0.95 + (j + 1) * 0.3, 1.3)
    if y0 >= 1.3:
        break
    x0, x1 = math.sqrt(max(0.0, 1.36 ** 2 - y0 * y0)), math.sqrt(max(0.0, 1.36 ** 2 - y1 * y1))
    quad = [(-x0, y0), (x0, y0), (x1, y1), (-x1, y1)]
    top = [(quad[0][0], y0, ground(y0)), (quad[1][0], y0, ground(y0)), (quad[2][0], y1, ground(y1)), (quad[3][0], y1, ground(y1))]
    sl = loft(f'slope{j}', M['hill'], [[(x, y, G - 0.01) for x, y in quad], top], outline=0.005)
    sl.visible_shadow = False

# ---------- the citadel on the ridge ----------
CY = 0.62
CZ = ground(CY)
box('citadelwallfront', M['stone'], 0, CY - 0.18, CZ - 0.02, 0.9, 0.08, 0.2, outline=0.007, bevel=0)
box('citadelwallback', M['stone'], 0, CY + 0.2, CZ - 0.02, 0.9, 0.08, 0.16, outline=0.006, bevel=0)
for s in (-1, 1):
    box(f'citadelwallside{s}', M['stone'], s * 0.45, CY, CZ - 0.02, 0.08, 0.46, 0.18, outline=0.006, bevel=0)
for k, x in enumerate((-0.45, -0.15, 0.15, 0.45)):
    box(f'citadeltower{k}', M['stone'], x, CY - 0.18, CZ - 0.02, 0.12, 0.12, 0.28, outline=0.005, bevel=0)
    for j in range(3):
        box(f'citadelmerlon{k}{j}', M['stoneDark'], x - 0.04 + j * 0.04, CY - 0.24, CZ + 0.26, 0.025, 0.02, 0.03, outline=0.001, bevel=0)
box('citadelgate', M['dark'], 0, CY - 0.223, CZ - 0.02, 0.07, 0.006, 0.12, outline=0, bevel=0)
cyl('citadelgatetop', M['dark'], 0.035, 0.006, segs=12, outline=0, matrix=Matrix.Translation((0, CY - 0.223, CZ + 0.1)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
box('citadelinside', M['stoneDark'], 0, CY + 0.02, CZ - 0.02, 0.82, 0.32, 0.04, outline=0, bevel=0)
box('khansbath', M['house'], 0.15, CY + 0.05, CZ + 0.02, 0.16, 0.12, 0.06, outline=0.003, bevel=0)
lathe('khansbathdome', M['stone'], ((0.05, 0), (0.04, 0.03), (0.004, 0.05)), CZ + 0.075, 0.15, CY + 0.05, segs=12, outline=0.002)

# ---------- the two long walls running down to the sea ----------
for s in (-1, 1):
    x = s * 0.45
    y0, y1 = CY - 0.22, -0.9
    n = 10
    for k in range(n):
        ya, yb = y0 + (y1 - y0) * k / n, y0 + (y1 - y0) * (k + 1) / n
        za, zb = ground(ya), ground(yb)
        loft(f'longwall{s}{k}', M['stone'], [[(x - 0.04, ya, za - 0.02), (x + 0.04, ya, za - 0.02), (x + 0.04, yb, zb - 0.02), (x - 0.04, yb, zb - 0.02)],
                                              [(x - 0.04, ya, za + 0.12), (x + 0.04, ya, za + 0.12), (x + 0.04, yb, zb + 0.12), (x - 0.04, yb, zb + 0.12)]], outline=0.003)
        if k % 3 == 1:
            box(f'longtower{s}{k}', M['stone'], x, (ya + yb) / 2, (za + zb) / 2 - 0.02, 0.1, 0.1, 0.18, outline=0.004, bevel=0)

# ---------- the old town between the walls ----------
k = 0
for row in range(7):
    y = -0.8 + row * 0.15
    for j in range(5):
        x = -0.32 + j * 0.16 + rng.uniform(-0.02, 0.02)
        z = ground(y)
        h = rng.uniform(0.05, 0.09)
        box(f'house{k}', M['house'], x, y, z - 0.01, 0.13, 0.11, h, outline=0.003, bevel=0)
        box(f'housewin{k}', M['dark'], x, y - 0.056, z + h * 0.4, 0.025, 0.006, 0.025, outline=0, bevel=0)
        k += 1
for k, (x, y) in enumerate(((-0.8, -0.4), (0.8, -0.35), (-0.85, 0.3), (0.85, 0.35))):
    ball(f'tree{k}', M['tree'], x, y, ground(y) + 0.1, 0.09, outline=0.01)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
