# A cartoon Butrint for the country maps, built in the set's shared look (../toon.py): the ancient
# city on its wooded hill by the Vivari channel, the Greek theatre's half-round of stone seats with
# water standing in its orchestra, the ring of granite columns in the baptistery, a gateway in the
# old walls, and the Venetian tower on the hilltop among the trees. Turned a little towards the
# camera.
# Run: blender -b --factory-startup -P butrint.py -- butrint-1024.png 1024 butrint.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#86c464', shadow_mul=(0.7, 0.78, 0.8), lift=0.25),
    'hill': toon('hill', '#5f9e55', shadow_mul=(0.7, 0.78, 0.8)),
    'forest': toon('forest', '#3f8a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'water': toon('water', '#4aa6b8', shadow_mul=(0.74, 0.84, 0.88), lift=0.35),
    'stone': toon('stone', '#d8ccb0', shadow_mul=(0.82, 0.78, 0.82)),
    'stoneDark': toon('stoneDark', '#b8aa8c', shadow_mul=(0.82, 0.78, 0.82)),
    'granite': toon('granite', '#9a948c', shadow_mul=(0.8, 0.8, 0.88)),
    'mosaic': flat('mosaic', '#c8703a'),
    'mosaic2': flat('mosaic2', '#e8d8b0'),
    'dark': flat('dark', '#3a3030'),
    'roof': toon('roof', '#8f4a3a'),
})

G = tile(M['grass'])
before = set(bpy.data.objects)
rng = random.Random(499)


def ring(cx, cy, rx, ry, z, jitter, sides=18):
    return [(cx + rx * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / sides),
             cy + ry * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / sides), G + z) for k in range(sides)]


# ---------- the Vivari channel along the right ----------
R = 1.42
CH = [(R * math.cos(math.radians(a)), R * math.sin(math.radians(a))) for a in range(-60, 61, 10)]
bm = bmesh.new()
bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, G + 0.004)) for x, y in CH])])
finish('channel', bm, M['water'], outline=0.01)

# ---------- the wooded hill behind, the Venetian tower on top ----------
hill = loft('hill', M['hill'], [ring(-0.15, 0.75, 0.85, 0.5, -0.01, 0.03), ring(-0.15, 0.8, 0.55, 0.32, 0.28, 0.05), ring(-0.15, 0.82, 0.3, 0.18, 0.42, 0.04)],
            outline=0.03)
hill.visible_shadow = False
TX, TY, TZ = -0.15, 0.82, G + 0.42
box('tower', M['stone'], TX, TY, TZ - 0.03, 0.16, 0.16, 0.3, outline=0.018, bevel=0)
for cx in (-1, 0, 1):
    for cy in (-1, 1):
        box(f'merlon{cx}{cy}', M['stone'], TX + cx * 0.06, TY + cy * 0.07, TZ + 0.27, 0.035, 0.025, 0.035, outline=0.005, bevel=0)
box('towerwin', M['dark'], TX, TY - 0.082, TZ + 0.15, 0.025, 0.01, 0.05, outline=0, bevel=0)
box('castlewall', M['stoneDark'], TX + 0.2, TY + 0.02, TZ - 0.04, 0.24, 0.05, 0.12, outline=0.012, bevel=0)
for k in range(12):
    a = math.radians(rng.uniform(0, 360))
    r = rng.uniform(0.4, 0.75)
    x, y = -0.15 + r * math.cos(a), 0.78 + r * 0.55 * math.sin(a)
    if abs(x - TX) < 0.2 and abs(y - TY) < 0.15:
        continue
    ball(f'hillforest{k}', M['forest'], x, y, G + 0.42 * (1 - r / 0.85) + 0.08, rng.uniform(0.08, 0.11), outline=0.016)

# ---------- the Greek theatre, its seats rising towards the hill, water in the orchestra ----------
TCX, TCY = -0.25, 0.05
for k in range(6):
    r_in, r_out = 0.14 + k * 0.06, 0.14 + (k + 1) * 0.06
    n = 16
    arc_out = [(TCX + r_out * math.cos(math.pi * j / n), TCY + r_out * 0.9 * math.sin(math.pi * j / n)) for j in range(n + 1)]
    arc_in = [(TCX + r_in * math.cos(math.pi * (n - j) / n), TCY + r_in * 0.9 * math.sin(math.pi * (n - j) / n)) for j in range(n + 1)]
    pts = arc_out + arc_in
    loft(f'seats{k}', M['stone' if k % 2 == 0 else 'stoneDark'], [[(x, y, G - 0.005) for x, y in pts], [(x, y, G + 0.035 * (k + 1)) for x, y in pts]], outline=0.01)
orchestra = [(TCX + 0.14 * math.cos(math.pi * j / 12), TCY + 0.126 * math.sin(math.pi * j / 12)) for j in range(13)]
bm = bmesh.new()
bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, G + 0.006)) for x, y in orchestra])])
finish('orchestrawater', bm, M['water'], outline=0)
box('stage', M['stoneDark'], TCX, TCY - 0.06, G - 0.005, 0.5, 0.1, 0.06, outline=0.012, bevel=0)
for k in range(5):
    box(f'stagedoor{k}', M['dark'], TCX - 0.16 + k * 0.08, TCY - 0.112, G, 0.03, 0.01, 0.045, outline=0, bevel=0)

# ---------- the baptistery: its ring of granite columns round the mosaic floor ----------
BX, BY = 0.3, -0.42
cyl('baptisteryfloor', M['mosaic2'], 0.24, 0.01, segs=28, outline=0.008, matrix=Matrix.Translation((BX, BY, G + 0.0)))
for k in range(3):
    cyl(f'mosaicring{k}', M['mosaic'], 0.2 - k * 0.06, 0.012, segs=24, outline=0, matrix=Matrix.Translation((BX, BY, G + 0.002 + k * 0.001)))
    cyl(f'mosaicgap{k}', M['mosaic2'], 0.17 - k * 0.06, 0.013, segs=24, outline=0, matrix=Matrix.Translation((BX, BY, G + 0.003 + k * 0.001)))
for k in range(8):
    a = 2 * math.pi * k / 8
    rod(f'baptcol{k}', M['granite'], (BX + 0.22 * math.cos(a), BY + 0.22 * math.sin(a), G), (BX + 0.22 * math.cos(a), BY + 0.22 * math.sin(a), G + 0.2), 0.016,
        segs=10, outline=0.006)
for k in range(4):
    a = 2 * math.pi * k / 8 + 0.3
    box(f'baptwall{k}', M['stone'], BX + 0.3 * math.cos(a * 2.0), BY + 0.3 * math.sin(a * 2.0), G - 0.005, 0.14, 0.04, 0.07, rot_z=a * 2.0 + math.pi / 2, outline=0.008, bevel=0)

# ---------- a gateway in the old walls ----------
WX, WY = -0.75, -0.45
for s in (-1, 1):
    box(f'gatepier{s}', M['stone'], WX + s * 0.08, WY, G - 0.005, 0.07, 0.1, 0.2, outline=0.012, bevel=0)
box('gatelintel', M['stone'], WX, WY, G + 0.19, 0.24, 0.1, 0.06, outline=0.012, bevel=0)
for s in (-1, 1):
    box(f'citywall{s}', M['stoneDark'], WX + s * 0.3, WY + s * 0.04, G - 0.005, 0.38, 0.06, 0.12 - 0.03 * (s > 0), rot_z=s * 0.15, outline=0.01, bevel=0)

# ---------- trees on the green ----------
for k, (x, y) in enumerate(((-1.05, 0.15), (0.0, -0.8), (-0.4, -0.95), (0.15, -0.75))):
    ball(f'tree{k}', M['forest'], x, y, G + 0.12, rng.uniform(0.09, 0.12), outline=0.016)

turn(before, -20)
render(G)
