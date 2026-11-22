# A cartoon Lake Bled for the country maps, built in the set's shared look (../toon.py) on a tile of
# emerald lake water: the little island with its white pilgrimage church, the tall bell tower under
# a steep red-brown spire and the stairs up from the water, a pletna boat with its awning rowed
# out to it, Bled Castle on its cliff, and the wooded shore with the Julian Alps behind.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P lake-bled.py -- lake-bled-1024.png 1024 lake-bled.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lake': toon('lake', '#37a99c', shadow_mul=(0.72, 0.84, 0.86), lift=0.35),
    'island': toon('island', '#6faa55', shadow_mul=(0.7, 0.78, 0.8)),
    'forest': toon('forest', '#3f8a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'white': toon('white', '#f3efe6', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'roof': toon('roof', '#a4493a'),
    'spire': toon('spire', '#7e3f33'),
    'stone': toon('stone', '#c9c2b4', shadow_mul=(0.78, 0.78, 0.86)),
    'rock': toon('rock', '#a39d93', shadow_mul=(0.76, 0.76, 0.86)),
    'window': flat('window', '#3f3a44'),
    'gold': toon('goldClock', '#e8b84a', shadow_mul=(0.8, 0.68, 0.55)),
    'wood': toon('wood', '#8a5a3c'),
    'awning': toon('awning', '#f6f3ec', shadow_mul=(0.82, 0.82, 0.92), lift=0.2),
    'fringe': flat('fringe', '#d8443a'),
    'mountain': toon('mountain', '#7f8a96', shadow_mul=(0.75, 0.76, 0.86)),
    'snow': toon('snow', '#f7f8fb', shadow_mul=(0.80, 0.84, 0.95), lift=0.15),
    'shirt': toon('shirt', '#3c6fc4', shadow_mul=(0.72, 0.72, 0.82)),
    'skin': toon('skin', '#e8b48f'),
})

G = tile(M['lake'])
before = set(bpy.data.objects)
rng = random.Random(83)


def ring(cx, cy, rx, ry, z, jitter, sides=12):
    return [(cx + rx * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / sides),
             cy + ry * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / sides), G + z) for k in range(sides)]


def place(made_before, degrees, x, y):
    """Turns what was made since `made_before` (built at the origin) and moves it to (x, y)."""
    m = Matrix.Translation((x, y, 0)) @ Matrix.Rotation(math.radians(degrees), 4, 'Z')
    for ob in set(bpy.data.objects) - made_before:
        ob.matrix_world = m @ ob.matrix_world


def ridge_roof(name, mat, x, y, z, w, d, h):
    loft(name, mat, [[(x - w / 2, y - d / 2, z), (x + w / 2, y - d / 2, z), (x + w / 2, y + d / 2, z), (x - w / 2, y + d / 2, z)],
                     [(x - w / 2 + 0.01, y - 0.004, z + h), (x + w / 2 - 0.01, y - 0.004, z + h), (x + w / 2 - 0.01, y + 0.004, z + h),
                      (x - w / 2 + 0.01, y + 0.004, z + h)]], outline=0.018)


# ---------- the wooded shore and the Julian Alps behind ----------
EDGE = 0.62
a0 = math.asin(EDGE / 1.42)
shore = [(1.42 * math.cos(a), 1.42 * math.sin(a)) for a in (a0 + (math.pi - 2 * a0) * k / 30 for k in range(31))]
loft('shore', M['island'], [[(x, y, G - 0.01) for x, y in shore], [(x, y, G + 0.07) for x, y in shore]], outline=0.03)
for k, (cx, cy, r, h) in enumerate(((-0.45, 1.05, 0.4, 0.95), (0.25, 1.12, 0.36, 1.15))):
    body = loft(f'alp{k}', M['mountain'], [ring(cx, cy, r, r * 0.6, 0.05, 0.0), ring(cx, cy, r * 0.62, r * 0.4, h * 0.5, 0.12),
                                           ring(cx, cy, r * 0.3, r * 0.2, h * 0.8, 0.12), ring(cx, cy, 0.02, 0.02, h, 0.0)], outline=0.035)
    cap = loft(f'alpsnow{k}', M['snow'], [ring(cx, cy, r * 0.34, r * 0.22, h * 0.76, 0.14), ring(cx, cy, 0.02, 0.02, h + 0.01, 0.0)], outline=0.02)
    body.visible_shadow = cap.visible_shadow = False
for k in range(9):
    x = -1.0 + k * 0.22 + rng.uniform(-0.04, 0.04)
    y = math.sqrt(max(0.0, 1.3 ** 2 - x * x)) - 0.42 + rng.uniform(-0.04, 0.04)
    if y > EDGE + 0.05:
        h = rng.uniform(0.22, 0.32)
        rod(f'shoretree{k}', M['forest'], (x, y, G + 0.07), (x, y, G + 0.07 + h), 0.09, r2=0.0, segs=8, outline=0.018)

# ---------- Bled Castle on its cliff ----------
KX, KY = 0.88, 0.2
cliff = loft('cliff', M['rock'], [ring(KX, KY, 0.34, 0.3, -0.01, 0.05), ring(KX, KY, 0.3, 0.26, 0.3, 0.06), ring(KX, KY, 0.26, 0.22, 0.56, 0.05)],
             outline=0.035)
cliff.visible_shadow = False
C = G + 0.56
box('castlewall', M['white'], KX + 0.02, KY + 0.02, C - 0.01, 0.38, 0.3, 0.13, outline=0.022, bevel=0.004)
ridge_roof('castleroof', M['roof'], KX + 0.02, KY + 0.02, C + 0.12, 0.4, 0.32, 0.08)
box('castlekeep', M['white'], KX - 0.1, KY - 0.04, C + 0.1, 0.12, 0.12, 0.16, outline=0.018, bevel=0.003)
pyramid('castlekeeproof', M['roof'], KX - 0.1, KY - 0.04, C + 0.26, 0.15, 0.12, outline=0.014)
for k, (x, y, z, r) in enumerate(((KX + 0.2, KY + 0.2, 0.5, 0.08), (KX - 0.18, KY + 0.18, 0.5, 0.07), (KX + 0.26, KY - 0.08, 0.36, 0.07),
                                  (KX - 0.3, KY - 0.1, 0.1, 0.08))):
    ball(f'clifftree{k}', M['forest'], x, y, G + z, r, outline=0.016)
for k in range(4):
    box(f'castlewin{k}', M['window'], KX - 0.12 + k * 0.08, KY + 0.02 - 0.154, C + 0.04, 0.025, 0.01, 0.04, outline=0, bevel=0)

# ---------- the island and its church ----------
IX, IY = -0.32, -0.12
mound = loft('island', M['island'], [ring(IX, IY, 0.44, 0.32, -0.01, 0.04), ring(IX, IY, 0.38, 0.27, 0.07, 0.05), ring(IX, IY, 0.3, 0.2, 0.13, 0.03)],
             outline=0.03)
mound.visible_shadow = False
T = G + 0.13
box('nave', M['white'], IX + 0.05, IY + 0.04, T - 0.01, 0.32, 0.15, 0.17, outline=0.022, bevel=0.003)
ridge_roof('naveroof', M['roof'], IX + 0.05, IY + 0.04, T + 0.16, 0.34, 0.17, 0.09)
lathe('apse', M['white'], ((0.07, 0), (0.07, 0.15)), T - 0.01, IX + 0.21, IY + 0.04, segs=16, outline=0.018)
lathe('apseroof', M['roof'], ((0.08, 0), (0.004, 0.08)), T + 0.14, IX + 0.21, IY + 0.04, segs=16, outline=0.014)
for k in range(3):
    box(f'navewin{k}', M['window'], IX - 0.03 + k * 0.08, IY + 0.04 - 0.078, T + 0.07, 0.022, 0.01, 0.05, outline=0, bevel=0)
# the bell tower at the west end, under its steep spire
BX, BY = IX - 0.17, IY + 0.01
box('tower', M['white'], BX, BY, T - 0.01, 0.12, 0.12, 0.5, outline=0.022, bevel=0.003)
for k, z in enumerate((0.36,)):
    box(f'belfry{k}', M['window'], BX, BY - 0.062, T + z, 0.04, 0.01, 0.07, outline=0, bevel=0)
cyl('clock', M['gold'], 0.028, 0.01, segs=16, outline=0, matrix=Matrix.Translation((BX, BY - 0.063, T + 0.27)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
pyramid('spire', M['spire'], BX, BY, T + 0.49, 0.15, 0.34, outline=0.016)
ball('spireball', M['gold'], BX, BY, T + 0.84, 0.015, outline=0.004)
# the stairs up from the water
for k in range(7):
    t = k / 7
    box(f'stair{k}', M['stone'], IX - 0.02, IY - 0.33 + t * 0.1, G - 0.01, 0.12, 0.04, 0.02 + 0.13 * t, outline=0.008, bevel=0)
box('quay', M['stone'], IX - 0.02, IY - 0.38, G - 0.01, 0.2, 0.08, 0.03, outline=0.012, bevel=0)
for k, (x, y) in enumerate(((IX + 0.26, IY + 0.14), (IX - 0.32, IY + 0.12), (IX + 0.05, IY + 0.22), (IX + 0.3, IY - 0.12))):
    ball(f'islandtree{k}', M['forest'], x, y, T + 0.06, 0.08, outline=0.016)

# ---------- a pletna rowed out to the island ----------
made = set(bpy.data.objects)
L, W = 0.42, 0.11


def hull_ring(length, width, z):
    return [(-length / 2, 0, z), (-length / 4, -width / 2, z), (length / 4, -width / 2, z), (length / 2, 0, z), (length / 4, width / 2, z),
            (-length / 4, width / 2, z)]


loft('hull', M['wood'], [hull_ring(L * 0.85, W * 0.6, G - 0.01), hull_ring(L, W, G + 0.04)], outline=0.014)
for sx in (-1, 1):
    for sy in (-1, 1):
        rod(f'awningpole{sx}{sy}', M['wood'], (sx * 0.09, sy * 0.04, G + 0.04), (sx * 0.09, sy * 0.04, G + 0.13), 0.005, segs=6, outline=0)
box('awning', M['awning'], 0, 0, G + 0.13, 0.22, 0.11, 0.02, outline=0.01, bevel=0)
box('fringe', M['fringe'], 0, 0, G + 0.115, 0.226, 0.116, 0.015, outline=0, bevel=0)
rod('oarsman', M['shirt'], (0.17, 0, G + 0.04), (0.17, 0, G + 0.13), 0.02, segs=8, outline=0.008)
ball('oarsmanhead', M['skin'], 0.17, 0, G + 0.15, 0.022, outline=0.006)
bar('oar', M['wood'], (0.15, -0.02, G + 0.11), (0.25, -0.1, G), 0.008, outline=0)
place(made, 25, 0.25, -0.72)

turn(before, -20)
render(G)
