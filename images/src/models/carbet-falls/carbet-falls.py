# A cartoon Carbet Falls for the country maps, built in the set's shared look (../toon.py): the
# Chutes du Carbet on Guadeloupe, the falls pouring down a dark rock face in La Soufrière's forested
# flank into a pool, the river running on through the rainforest, tree ferns, a footbridge, and the
# volcano's steaming top behind. Turned a little towards the camera.
# Run: blender -b --factory-startup -P carbet-falls.py -- carbet-falls-1024.png 1024 carbet-falls.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'forest': toon('forest', '#3f8a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'forestDark': toon('forestDark', '#2f7240', shadow_mul=(0.7, 0.78, 0.8)),
    'forestLight': toon('forestLight', '#5aa04a', shadow_mul=(0.7, 0.78, 0.8)),
    'rock': toon('rock', '#4e4a48', shadow_mul=(0.84, 0.84, 0.9)),
    'volcano': toon('volcano', '#7a7066', shadow_mul=(0.84, 0.82, 0.88)),
    'water': toon('water', '#e4f2fa', shadow_mul=(0.82, 0.88, 0.96), lift=0.2),
    'pool': toon('pool', '#3f9ac0', lift=0.3),
    'foam': toon('foam', '#f4f8fb', shadow_mul=(0.82, 0.86, 0.95), lift=0.1),
    'steam': toon('steam', '#f2f2f0', shadow_mul=(0.86, 0.88, 0.94), lift=0.1),
    'wood': toon('wood', '#8a6448'),
    'fern': toon('fern', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(1123)


def segment(c, r, z, n=24):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


def ring(cx, cy, rx, ry, z, k, sides=20):
    return [(cx + rx * math.cos(t) * (1 + 0.06 * math.sin(3 * t + k)), cy + ry * math.sin(t) * (1 + 0.06 * math.cos(2 * t + k)), G + z) for t in (2 * math.pi * j / sides for j in range(sides))]


def squashed(name, mat, x, y, z, r, sx, sy, sz, outline=0.02):
    b = ball(name, mat, 0, 0, 0, r, outline=outline)
    b.scale = (sx, sy, sz)
    b.location = (x, y, z)
    return b


# ---------- the volcano behind, steaming ----------
v = loft('volcano', M['volcano'], [ring(0.1, 0.92, 0.6, 0.32, 0.5, 2), ring(0.1, 0.94, 0.36, 0.2, 0.88, 2), ring(0.1, 0.95, 0.2, 0.12, 0.95, 2)], outline=0.016, smooth=True)
v.visible_shadow = False
for k, (dx, dz, r) in enumerate(((0.0, 0.0, 0.07), (0.07, 0.05, 0.055), (-0.05, 0.08, 0.05))):
    squashed(f'steam{k}', M['steam'], 0.12 + dx, 0.95, G + 1.0 + dz, r, 1.3, 1.0, 0.9, outline=0.01)

# ---------- the forested flank, a rock face in it, and the falls ----------
flank = loft('flank', M['forest'], [segment(0.05, 1.38, -0.01), segment(0.18, 1.34, 0.3), segment(0.38, 1.24, 0.52), segment(0.55, 1.1, 0.6)], outline=0.018, smooth=True)
flank.visible_shadow = False
FX = -0.05
loft('rockface', M['rock'], [[(FX - 0.2, 0.0, G - 0.01), (FX + 0.2, 0.0, G - 0.01), (FX + 0.18, 0.3, G - 0.01), (FX - 0.18, 0.3, G - 0.01)],
                             [(FX - 0.17, 0.16, G + 0.6), (FX + 0.17, 0.16, G + 0.6), (FX + 0.15, 0.36, G + 0.6), (FX - 0.15, 0.36, G + 0.6)]], outline=0.016)
loft('falls', M['water'], [[(FX - 0.05, -0.012, G), (FX + 0.05, -0.012, G), (FX + 0.05, 0.02, G), (FX - 0.05, 0.02, G)],
                           [(FX - 0.035, 0.148, G + 0.6), (FX + 0.035, 0.148, G + 0.6), (FX + 0.035, 0.18, G + 0.6), (FX - 0.035, 0.18, G + 0.6)]], outline=0.008)
for k in range(30):
    a = rng.uniform(math.radians(10), math.radians(170))
    f = rng.uniform(0.15, 0.95)
    r = 1.34 - f * 0.24
    x = r * math.cos(a)
    y = 0.05 + f * 0.5 + rng.uniform(0, 0.15)
    if abs(x - FX) < 0.26 or math.hypot(x, y) > 1.3:
        continue
    z = 0.3 * min(1, f * 2) + 0.3 * max(0, f - 0.5) * 2
    ball(f'flanktree{k}', M['forestDark' if k % 2 else 'forestLight'], x, y, G + z + 0.04, rng.uniform(0.07, 0.1), outline=0.012)

# ---------- the pool, the river and the footbridge ----------
cyl('pool', M['pool'], 0.2, 0.012, segs=20, outline=0.006, matrix=Matrix.Translation((FX, -0.12, G - 0.006)) @ Matrix.Scale(0.6, 4, Vector((0, 1, 0))))
for k in range(8):
    a = 2 * math.pi * k / 8
    ball(f'poolfoam{k}', M['foam'], FX + 0.07 * math.cos(a), -0.05 + 0.03 * math.sin(a), G + 0.006, 0.03, outline=0.004)
riv = [(FX, -0.2), (FX + 0.1, -0.45), (FX + 0.05, -0.7), (FX + 0.2, -0.95), (FX + 0.3, -1.25)]
for k in range(len(riv) - 1):
    bar(f'river{k}', M['pool'], (riv[k][0], riv[k][1], G + 0.0), (riv[k + 1][0], riv[k + 1][1], G + 0.0), 0.11, outline=0.003)
box('bridge', M['wood'], FX + 0.1, -0.58, G + 0.03, 0.28, 0.06, 0.015, rot_z=0.25, outline=0.004, bevel=0)
for s in (-1, 1):
    rod(f'bridgerail{s}', M['wood'], (FX - 0.03, -0.62 + s * 0.03, G + 0.07), (FX + 0.23, -0.55 + s * 0.03, G + 0.07), 0.005, segs=5, outline=0.002)

# ---------- rainforest and tree ferns at the front ----------
for k in range(22):
    a = rng.uniform(math.radians(190), math.radians(350))
    r = rng.uniform(0.5, 1.25)
    x, y = r * math.cos(a), r * math.sin(a)
    if abs(x - (FX + 0.12)) < 0.22:
        continue
    ball(f'tree{k}', M['forestDark' if k % 3 else 'forestLight'], x, y, G + 0.06, rng.uniform(0.08, 0.11), outline=0.012)
for k, (x, y) in enumerate(((-0.45, -0.15), (0.35, -0.2), (0.55, -0.55), (-0.6, -0.55))):
    rod(f'fernstem{k}', M['wood'], (x, y, G), (x, y, G + 0.18), 0.011, segs=6, outline=0.004)
    for f in range(7):
        b = 2 * math.pi * f / 7 + k
        bar(f'fern{k}{f}', M['fern'], (x, y, G + 0.18), (x + 0.1 * math.cos(b), y + 0.1 * math.sin(b), G + 0.15), 0.025, outline=0.005)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
