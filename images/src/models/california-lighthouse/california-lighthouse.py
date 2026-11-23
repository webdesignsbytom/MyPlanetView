# A cartoon California Lighthouse for the country maps, built in the set's shared look
# (../toon.py): Aruba's stone lighthouse on the sand dunes of the island's north-west tip, its
# tapering tower, gallery and lantern, the keeper's house, divi-divi trees bent flat by the trade
# wind, columnar cacti, and the sea. Turned a little towards the camera.
# Run: blender -b --factory-startup -P california-lighthouse.py -- california-lighthouse-1024.png 1024 california-lighthouse.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sand': toon('sand', '#e8d4a4', shadow_mul=(0.84, 0.78, 0.74), lift=0.25),
    'dune': toon('dune', '#dcc490', shadow_mul=(0.84, 0.78, 0.74), lift=0.2),
    'sea': toon('sea', '#2fa8c8', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'stone': toon('stone', '#c8c0b0', shadow_mul=(0.8, 0.8, 0.88)),
    'stoneDark': toon('stoneDark', '#a8a092', shadow_mul=(0.8, 0.8, 0.88)),
    'lantern': toon('lantern', '#5a6068', shadow_mul=(0.78, 0.8, 0.88)),
    'glass': flat('glass', '#f4e8a0'),
    'white': toon('white', '#f8f6f0', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'roof': toon('roof', '#c4573a'),
    'window': flat('window', '#3a3640'),
    'divi': toon('divi', '#5a8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a6048'),
    'cactus': toon('cactus', '#5a9a5a', shadow_mul=(0.7, 0.78, 0.8)),
    'rock': toon('rock', '#8a7a6a', shadow_mul=(0.8, 0.78, 0.84)),
})

G = tile(M['sand'])
before = set(bpy.data.objects)
rng = random.Random(1061)


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


def squashed(name, mat, x, y, z, r, sx, sy, sz, outline=0.02):
    b = ball(name, mat, 0, 0, 0, r, outline=outline)
    b.scale = (sx, sy, sz)
    b.location = (x, y, z)
    return b


# ---------- the sea along the front left ----------
R = 1.42
flat_face('sea', M['sea'], [(R * math.cos(math.radians(a)), R * math.sin(math.radians(a))) for a in range(170, 271, 6)], G + 0.005, outline=0.01)
for k in range(5):
    a = math.radians(185 + k * 18)
    ball(f'shorerock{k}', M['rock'], 1.0 * math.cos(a) + 0.12, 1.0 * math.sin(a) + 0.12, G + 0.01, rng.uniform(0.04, 0.06), outline=0.008)

# ---------- the dune the lighthouse stands on ----------
LX, LY = 0.1, 0.2
d = loft('dune', M['dune'], [[(LX + 0.6 * math.cos(t), LY + 0.45 * math.sin(t), G - 0.01) for t in (2 * math.pi * j / 20 for j in range(20))],
                            [(LX + 0.35 * math.cos(t), LY + 0.26 * math.sin(t), G + 0.08) for t in (2 * math.pi * j / 20 for j in range(20))],
                            [(LX + 0.2 * math.cos(t), LY + 0.15 * math.sin(t), G + 0.1) for t in (2 * math.pi * j / 20 for j in range(20))]], outline=0.016, smooth=True)
d.visible_shadow = False
LZ = G + 0.1

# ---------- the lighthouse ----------
lathe('tower', M['stone'], ((0.11, 0), (0.1, 0.1), (0.075, 0.5)), LZ - 0.005, LX, LY, segs=16, outline=0.014)
for k in range(5):
    lathe(f'course{k}', M['stoneDark'], ((0.108 - k * 0.0065, 0), (0.106 - k * 0.0065, 0.012)), LZ + 0.06 + k * 0.09, LX, LY, segs=16, outline=0.002)
for k, z in enumerate((0.15, 0.3)):
    box(f'towerwin{k}', M['window'], LX, LY - 0.098 + k * 0.012, LZ + z, 0.025, 0.01, 0.045, outline=0, bevel=0)
cyl('gallery', M['stoneDark'], 0.1, 0.02, segs=16, outline=0.006, matrix=Matrix.Translation((LX, LY, LZ + 0.505)))
lathe('lanternbase', M['lantern'], ((0.05, 0), (0.05, 0.03)), LZ + 0.515, LX, LY, segs=12, outline=0.005)
lathe('lanternglass', M['glass'], ((0.045, 0), (0.045, 0.06)), LZ + 0.545, LX, LY, segs=12, outline=0.004)
lathe('lanterntop', M['lantern'], ((0.055, 0), (0.03, 0.03), (0.004, 0.06)), LZ + 0.605, LX, LY, segs=12, outline=0.005)
KX, KY = LX + 0.25, LY + 0.05
box('keepers', M['white'], KX, KY, LZ - 0.01, 0.18, 0.14, 0.1, outline=0.01, bevel=0)
pyramid('keepersroof', M['roof'], KX, KY, LZ + 0.09, 0.2, 0.07, outline=0.008)

# ---------- divi-divi trees, bent by the wind, and cacti ----------
for k, (x, y, s) in enumerate(((-0.55, 0.45, 1.0), (0.75, -0.35, 0.85), (0.55, 0.75, 0.9), (-0.2, -0.55, 0.8))):
    rod(f'divitrunk{k}', M['trunk'], (x, y, G), (x + 0.12 * s, y - 0.02, G + 0.14 * s), 0.016 * s, r2=0.012 * s, segs=6, outline=0.005)
    squashed(f'divi{k}', M['divi'], x + 0.2 * s, y - 0.03, G + 0.16 * s, 0.1 * s, 1.8, 0.9, 0.45, outline=0.012)
for k, (x, y) in enumerate(((0.95, 0.15), (0.85, 0.35), (-0.3, 0.85), (0.3, -0.8), (-0.75, 0.05))):
    h = rng.uniform(0.12, 0.18)
    rod(f'cactus{k}', M['cactus'], (x, y, G), (x, y, G + h), 0.018, segs=8, outline=0.005)
    rod(f'cactusarm{k}', M['cactus'], (x, y, G + h * 0.5), (x + 0.04, y, G + h * 0.55), 0.012, segs=6, outline=0.004)
    rod(f'cactusarmup{k}', M['cactus'], (x + 0.04, y, G + h * 0.55), (x + 0.04, y, G + h * 0.85), 0.012, segs=6, outline=0.004)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
