# A cartoon Tiger's Nest for the country maps, built in the set's shared look (../toon.py): Paro
# Taktsang, the monastery clinging to its cliff above the Paro valley, its white walls under maroon
# bands and golden roofs on rock ledges, the pine forest below, a wisp of cloud, and strings of
# prayer flags. Turned a little towards the camera.
# Run: blender -b --factory-startup -P tigers-nest.py -- tigers-nest-1024.png 1024 tigers-nest.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'rock': toon('rock', '#8a7a68', shadow_mul=(0.82, 0.8, 0.86)),
    'rockDark': toon('rockDark', '#6c6052', shadow_mul=(0.82, 0.8, 0.86)),
    'forest': toon('forest', '#3f7a46', shadow_mul=(0.7, 0.78, 0.8)),
    'pine': toon('pine', '#2f6a3e', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a4a36'),
    'white': toon('white', '#f8f6f0', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'maroon': toon('maroon', '#7a2a24'),
    'gold': toon('gold', '#e8b030', shadow_mul=(0.78, 0.62, 0.55), lift=0.4),
    'window': flat('window', '#3a3640'),
    'cloud': toon('cloud', '#ffffff', shadow_mul=(0.86, 0.9, 0.97), lift=0.1),
    'string': flat('string', '#6a5a4a'),
    'f0': toon('f0', '#2f6fc0'), 'f1': toon('f1', '#f8f6f0'), 'f2': toon('f2', '#d83a2c'), 'f3': toon('f3', '#3f9a4a'), 'f4': toon('f4', '#f0c030'),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(1093)


def squashed(name, mat, x, y, z, r, sx, sy, sz, outline=0.02):
    b = ball(name, mat, 0, 0, 0, r, outline=outline)
    b.scale = (sx, sy, sz)
    b.location = (x, y, z)
    return b


# ---------- the cliff: a convex block at the back left, its face towards the camera ----------
FOOT = [(-0.9, 0.05), (-0.3, -0.06), (0.45, -0.02), (0.82, 0.3), (0.76, 0.9), (0.0, 1.26), (-0.8, 1.0), (-1.16, 0.6)]
CEN = (-0.1, 0.55)


def shrink(pts, f, back, z):
    return [(CEN[0] + (x - CEN[0]) * f, CEN[1] + (y - CEN[1]) * f + back, G + z) for x, y in pts]


cliff = loft('cliff', M['rock'], [shrink(FOOT, 1.0, 0, -0.01), shrink(FOOT, 0.97, 0.0, 0.5), shrink(FOOT, 0.92, 0.04, 0.82), shrink(FOOT, 0.82, 0.1, 0.9)], outline=0.02)
cliff.visible_shadow = False
cap = loft('cliffforest', M['forest'], [shrink(FOOT, 0.82, 0.1, 0.89), shrink(FOOT, 0.7, 0.14, 0.96)], outline=0.014, smooth=True)
cap.visible_shadow = False
for k in range(9):
    x = -0.75 + k * 0.17
    ball(f'cliftopptree{k}', M['pine'], x, 0.55 + 0.25 * math.sin(k * 1.7), G + 0.97, rng.uniform(0.06, 0.08), outline=0.01)


# ---------- the monastery on its ledges ----------
def temple(name, x, z, w, h, y=-0.05, d=0.2):
    box(f'{name}ledge', M['rockDark'], x, y + 0.02, G + z - 0.06, w + 0.05, d + 0.02, 0.06, outline=0.008, bevel=0)
    box(name, M['white'], x, y, G + z - 0.005, w, d, h, outline=0.01, bevel=0)
    box(f'{name}band', M['maroon'], x, y, G + z + h - 0.01, w + 0.01, d + 0.01, 0.035, outline=0.005, bevel=0)
    pyramid(f'{name}roof', M['gold'], x, y, G + z + h + 0.02, w + 0.06, 0.06, outline=0.007)
    n = max(2, int(w / 0.07))
    for j in range(n):
        wx = x - w / 2 + (j + 0.5) * w / n
        box(f'{name}win{j}', M['window'], wx, y - d / 2 - 0.004, G + z + h * 0.4, 0.025, 0.008, 0.035, outline=0, bevel=0)


temple('main', -0.1, 0.4, 0.36, 0.18, y=-0.08, d=0.24)
temple('east', 0.27, 0.5, 0.22, 0.14, y=-0.07, d=0.22)
temple('west', -0.44, 0.3, 0.22, 0.13, y=-0.08, d=0.22)
temple('upper', 0.07, 0.68, 0.18, 0.12, y=-0.03, d=0.2)
lathe('pinnacle', M['gold'], ((0.03, 0), (0.022, 0.035), (0.004, 0.085)), G + 0.655, -0.1, -0.08, segs=10, outline=0.004)

# ---------- prayer flags strung out from the cliff ----------
for s, (p0, p1) in enumerate((((0.38, -0.08, G + 0.42), (0.85, -0.55, G + 0.08)), ((-0.6, -0.06, G + 0.3), (-0.95, -0.5, G + 0.05)))):
    bar(f'flagstring{s}', M['string'], p0, p1, 0.004, outline=0)
    for j in range(9):
        f = (j + 0.5) / 9
        x, y, z = (p0[i] + (p1[i] - p0[i]) * f for i in range(3))
        box(f'flag{s}{j}', M[f'f{j % 5}'], x, y, z - 0.04, 0.035, 0.006, 0.035, rot_z=math.atan2(p1[1] - p0[1], p1[0] - p0[0]), outline=0.002, bevel=0)
    rod(f'flagpole{s}', M['trunk'], (p1[0], p1[1], G), (p1[0], p1[1], p1[2] + 0.02), 0.006, segs=6, outline=0.002)

# ---------- the pine forest in the valley, and a wisp of cloud ----------
for k in range(16):
    a = rng.uniform(math.radians(195), math.radians(345))
    r = rng.uniform(0.55, 1.2)
    x, y = r * math.cos(a), r * math.sin(a) - 0.05
    if x > 0.6 and y > -0.2:
        continue
    s = rng.uniform(0.8, 1.15)
    rod(f'pinetrunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.05 * s), 0.01, segs=6, outline=0.003)
    lathe(f'pine{k}', M['pine'], ((0.07 * s, 0), (0.004, 0.13 * s)), G + 0.04 * s, x, y, segs=10, outline=0.006)
    lathe(f'pinetop{k}', M['pine'], ((0.05 * s, 0), (0.004, 0.1 * s)), G + 0.11 * s, x, y, segs=10, outline=0.005)
for k in range(5):
    if k == 3:
        continue
    x, y = 0.95 + 0.07 * (k % 2), -0.1 + k * 0.18
    lathe(f'pineright{k}', M['pine'], ((0.07, 0), (0.004, 0.15)), G + 0.04, x, y, segs=10, outline=0.006)
for k, (dx, dz, r) in enumerate(((0.0, 0.0, 0.07), (0.08, 0.02, 0.06), (-0.07, 0.01, 0.055))):
    squashed(f'cloud{k}', M['cloud'], -0.98 + dx, -0.12, G + 0.62 + dz, r, 1.5, 1.0, 0.7, outline=0.01)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
