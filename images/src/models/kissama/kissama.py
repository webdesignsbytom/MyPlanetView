# A cartoon Kissama National Park for the country maps, built in the set's shared look (../toon.py):
# Angola's savanna by the Atlantic, where the Kwanza river reaches the sea, a great baobab, flat-
# topped acacias, an elephant and a giraffe among the grass tufts. Turned a little towards the
# camera.
# Run: blender -b --factory-startup -P kissama.py -- kissama-1024.png 1024 kissama.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'savanna': toon('savanna', '#c9bd68', shadow_mul=(0.8, 0.76, 0.66), lift=0.25),
    'ocean': toon('ocean', '#2f8fc8', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'river': toon('river', '#4a9ec8', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'sand': toon('sand', '#f0e2be', shadow_mul=(0.82, 0.8, 0.86), lift=0.2),
    'baobab': toon('baobab', '#9a8270', shadow_mul=(0.8, 0.76, 0.8)),
    'leaf': toon('leaf', '#5f9e45', shadow_mul=(0.7, 0.78, 0.8)),
    'acacia': toon('acacia', '#6aa54a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6b5040'),
    'tuft': toon('tuft', '#b0a24e', shadow_mul=(0.8, 0.76, 0.66)),
    'elephant': toon('elephant', '#8a8680', shadow_mul=(0.78, 0.78, 0.86)),
    'tusk': toon('tusk', '#f4efe2', lift=0.2),
    'giraffe': toon('giraffe', '#e2b25a', shadow_mul=(0.84, 0.72, 0.6)),
    'spots': toon('spots', '#8a5a30'),
})

G = tile(M['savanna'])
before = set(bpy.data.objects)
rng = random.Random(613)


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


def place(made_before, degrees, x, y):
    m = Matrix.Translation((x, y, 0)) @ Matrix.Rotation(math.radians(degrees), 4, 'Z')
    bpy.context.view_layer.update()
    for ob in set(bpy.data.objects) - made_before:
        ob.matrix_world = m @ ob.matrix_world


def squashed(name, mat, x, y, z, r, sx, sy, sz, outline=0.02):
    b = ball(name, mat, 0, 0, 0, r, outline=outline)
    b.scale = (sx, sy, sz)
    b.location = (x, y, z)
    return b


# ---------- the Atlantic at the front left, its beach, and the Kwanza flowing into it ----------
R = 1.42
flat_face('beach', M['sand'], [(R * math.cos(math.radians(a)), R * math.sin(math.radians(a))) for a in range(150, 271, 6)], G + 0.002, outline=0.008)
flat_face('ocean', M['ocean'], [(R * math.cos(math.radians(a)), R * math.sin(math.radians(a))) for a in range(165, 256, 6)], G + 0.005, outline=0.01)
PATH = [(1.05, 0.85), (0.75, 0.75), (0.45, 0.8), (0.15, 0.68), (-0.1, 0.5), (-0.35, 0.42), (-0.6, 0.25), (-0.85, 0.05), (-1.12, -0.15)]
bm = bmesh.new()
verts = []
for i, (x, y) in enumerate(PATH):
    (x0, y0), (x1, y1) = PATH[max(0, i - 1)], PATH[min(len(PATH) - 1, i + 1)]
    dx, dy = x1 - x0, y1 - y0
    n = math.hypot(dx, dy)
    w = 0.05 + 0.04 * i / len(PATH)
    verts.append((bm.verts.new((x - dy / n * w, y + dx / n * w, G + 0.006)), bm.verts.new((x + dy / n * w, y - dx / n * w, G + 0.006))))
for (a0, a1), (b0, b1) in zip(verts, verts[1:]):
    bm.faces.new((a0, a1, b1, b0))
finish('river', bm, M['river'], outline=0.006)

# ---------- the great baobab ----------
BX, BY = 0.12, 0.42
lathe('baobabtrunk', M['baobab'], ((0.16, 0), (0.19, 0.08), (0.18, 0.2), (0.13, 0.32), (0.09, 0.38)), G - 0.005, BX, BY, segs=14, outline=0.016)
for k in range(7):
    a = 2 * math.pi * k / 7 + 0.3
    end = (BX + 0.24 * math.cos(a), BY + 0.2 * math.sin(a), G + 0.5 + 0.05 * (k % 2))
    rod(f'branch{k}', M['baobab'], (BX + 0.03 * math.cos(a), BY + 0.03 * math.sin(a), G + 0.36), end, 0.035, r2=0.018, segs=8, outline=0.008)
    squashed(f'leaves{k}', M['leaf'], end[0], end[1], end[2] + 0.02, 0.07, 1.3, 1.3, 0.6, outline=0.01)

# ---------- flat-topped acacias and grass tufts ----------
for k, (x, y) in enumerate(((-0.45, -0.1), (0.95, 0.2), (-0.35, 0.95), (0.62, 0.62))):
    h = rng.uniform(0.2, 0.26)
    rod(f'acaciatrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + h), 0.014, segs=6, outline=0.005)
    squashed(f'acacia{k}', M['acacia'], x + 0.02, y, G + h + 0.02, 0.11, 1.5, 1.2, 0.35, outline=0.012)
for k in range(24):
    x, y = rng.uniform(-1.1, 1.1), rng.uniform(-1.0, 1.1)
    if math.hypot(x, y) > 1.25 or x + y < -0.9 or (abs(x - BX) < 0.25 and abs(y - BY) < 0.25):
        continue
    lathe(f'tuft{k}', M['tuft'], ((0.03, 0), (0.004, 0.05)), G, x, y, segs=6, outline=0.004, smooth=False)

# ---------- an elephant ----------
made = set(bpy.data.objects)
s = 1.0
for dx in (-0.1, 0.1):
    for sy in (-1, 1):
        cyl(f'eleg{dx}{sy}', M['elephant'], 0.045 * s, 0.22 * s, segs=12, outline=0.012, matrix=Matrix.Translation((dx * s, sy * 0.07 * s, G + 0.11 * s)))
squashed('ebody', M['elephant'], 0, 0, G + 0.3 * s, 0.19 * s, 1.25, 0.85, 0.85, outline=0.02)
ball('ehead', M['elephant'], 0.23 * s, 0, G + 0.36 * s, 0.1 * s, outline=0.016)
for sy in (-1, 1):
    squashed(f'eear{sy}', M['elephant'], 0.2 * s, sy * 0.09 * s, G + 0.37 * s, 0.08 * s, 0.35, 0.6, 1.0, outline=0.012)
    bar(f'etusk{sy}', M['tusk'], (0.29 * s, sy * 0.035 * s, G + 0.3 * s), (0.34 * s, sy * 0.035 * s, G + 0.24 * s), 0.012 * s, outline=0.004)
rod('etrunk1', M['elephant'], (0.3 * s, 0, G + 0.34 * s), (0.36 * s, 0, G + 0.2 * s), 0.03 * s, r2=0.024 * s, segs=10, outline=0.01)
rod('etrunk2', M['elephant'], (0.36 * s, 0, G + 0.2 * s), (0.38 * s, 0, G + 0.07 * s), 0.024 * s, r2=0.018 * s, segs=10, outline=0.01)
place(made, -150, -0.22, -0.45)

# ---------- a giraffe ----------
made = set(bpy.data.objects)
for dx in (-0.05, 0.05):
    for sy in (-1, 1):
        rod(f'gleg{dx}{sy}', M['giraffe'], (dx, sy * 0.025, G), (dx * 0.8, sy * 0.022, G + 0.22), 0.01, segs=6, outline=0.003)
squashed('gbody', M['giraffe'], 0, 0, G + 0.25, 0.07, 1.4, 0.8, 0.8, outline=0.01)
rod('gneck', M['giraffe'], (0.07, 0, G + 0.27), (0.13, 0, G + 0.5), 0.022, r2=0.014, segs=8, outline=0.005)
squashed('ghead', M['giraffe'], 0.16, 0, G + 0.51, 0.03, 1.5, 0.8, 0.8, outline=0.004)
for k, (dx, dz) in enumerate(((-0.03, 0.27), (0.02, 0.28), (0.0, 0.23), (-0.05, 0.24))):
    for sy in (-1, 1):
        ball(f'gspot{k}{sy}', M['spots'], dx, sy * 0.05, G + dz, 0.014, outline=0)
place(made, -140, 0.72, -0.3)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
