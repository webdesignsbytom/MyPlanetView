# A cartoon Odzala National Park for the country maps, built in the set's shared look (../toon.py):
# the Congo's rainforest round a bai, the marshy clearing where western lowland gorillas and forest
# elephants come to the pools, tall forest trees all round, and a wooden viewing platform at the
# clearing's edge. Turned a little towards the camera.
# Run: blender -b --factory-startup -P odzala.py -- odzala-1024.png 1024 odzala.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'forestFloor': toon('forestFloor', '#3f8a4a', shadow_mul=(0.7, 0.78, 0.8), lift=0.25),
    'bai': toon('bai', '#a8d070', shadow_mul=(0.72, 0.78, 0.78), lift=0.25),
    'pool': toon('pool', '#5a9ab0', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'mud': toon('mud', '#8a6a48'),
    'forest': toon('forest', '#2f6e40', shadow_mul=(0.7, 0.78, 0.8)),
    'forestLight': toon('forestLight', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a7a6a'),
    'wood': toon('wood', '#8a6448'),
    'roof': toon('roof', '#c9a85a', shadow_mul=(0.84, 0.76, 0.62)),
    'gorilla': toon('gorilla', '#2e2a2c', shadow_mul=(0.85, 0.85, 0.9)),
    'silver': toon('silver', '#8a8a90'),
    'elephant': toon('elephant', '#7a7470', shadow_mul=(0.78, 0.78, 0.86)),
    'tusk': toon('tusk', '#f4efe2', lift=0.2),
})

G = tile(M['forestFloor'])
before = set(bpy.data.objects)
rng = random.Random(683)


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


# ---------- the bai: a marshy clearing with pools and mud ----------
BX, BY = 0.0, -0.05
flat_face('bai', M['bai'], [(BX + 0.82 * math.cos(t), BY + 0.6 * math.sin(t)) for t in (2 * math.pi * j / 24 for j in range(24))], G + 0.003, outline=0.008)
for k, (x, y, rx, ry, mat) in enumerate(((-0.2, -0.1, 0.25, 0.14, 'pool'), (0.3, 0.15, 0.2, 0.1, 'pool'), (0.25, -0.35, 0.16, 0.08, 'mud'))):
    flat_face(f'pool{k}', M[mat], [(x + rx * math.cos(t), y + ry * math.sin(t)) for t in (2 * math.pi * j / 18 for j in range(18))], G + 0.006, outline=0.006)

# ---------- tall rainforest all round ----------
for k in range(30):
    a = 2 * math.pi * k / 30 + rng.uniform(-0.06, 0.06)
    r = rng.uniform(0.98, 1.22)
    x, y = r * math.cos(a), r * 0.95 * math.sin(a)
    h = rng.uniform(0.25, 0.42)
    if 3.9 < a < 5.6:       # the camera's side: low bushes, so the clearing shows
        ball(f'bush{k}', M['forest' if k % 2 else 'forestLight'], x, y, G + 0.03, rng.uniform(0.06, 0.08), outline=0.01)
        continue
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + h), 0.02, segs=6, outline=0.007)
    squashed(f'crown{k}', M['forest' if k % 2 else 'forestLight'], x, y, G + h + 0.04, rng.uniform(0.11, 0.14), 1.2, 1.2, 0.7, outline=0.016)


# ---------- western lowland gorillas ----------
def gorilla(name, x, y, deg, s, silver=False):
    made = set(bpy.data.objects)
    squashed(f'{name}body', M['gorilla'], 0, 0, G + 0.13 * s, 0.11 * s, 1.0, 0.9, 1.0, outline=0.012)
    if silver:
        squashed(f'{name}back', M['silver'], -0.02 * s, 0.0, G + 0.17 * s, 0.08 * s, 0.9, 0.95, 0.5, outline=0.006)
    ball(f'{name}head', M['gorilla'], 0.07 * s, 0, G + 0.24 * s, 0.055 * s, outline=0.008)
    for sy in (-1, 1):
        rod(f'{name}arm{sy}', M['gorilla'], (0.04 * s, sy * 0.08 * s, G + 0.18 * s), (0.12 * s, sy * 0.1 * s, G), 0.03 * s, r2=0.024 * s, segs=8, outline=0.006)
        rod(f'{name}leg{sy}', M['gorilla'], (-0.06 * s, sy * 0.06 * s, G + 0.08 * s), (-0.06 * s, sy * 0.06 * s, G), 0.03 * s, segs=8, outline=0.006)
    place(made, deg, x, y)


gorilla('silverback', -0.45, -0.3, -120, 1.0, silver=True)
gorilla('female', -0.6, -0.05, -80, 0.75)
gorilla('young', -0.35, -0.5, -140, 0.5)

# ---------- a forest elephant at the far pool ----------
made = set(bpy.data.objects)
s = 0.8
for dx in (-0.1, 0.1):
    for sy in (-1, 1):
        cyl(f'eleg{dx}{sy}', M['elephant'], 0.045 * s, 0.22 * s, segs=12, outline=0.012, matrix=Matrix.Translation((dx * s, sy * 0.07 * s, G + 0.11 * s)))
squashed('ebody', M['elephant'], 0, 0, G + 0.3 * s, 0.19 * s, 1.25, 0.85, 0.85, outline=0.02)
ball('ehead', M['elephant'], 0.23 * s, 0, G + 0.36 * s, 0.1 * s, outline=0.016)
for sy in (-1, 1):
    squashed(f'eear{sy}', M['elephant'], 0.2 * s, sy * 0.09 * s, G + 0.37 * s, 0.07 * s, 0.35, 0.55, 0.9, outline=0.012)
    bar(f'etusk{sy}', M['tusk'], (0.29 * s, sy * 0.035 * s, G + 0.3 * s), (0.35 * s, sy * 0.03 * s, G + 0.26 * s), 0.01 * s, outline=0.004)
rod('etrunk1', M['elephant'], (0.3 * s, 0, G + 0.34 * s), (0.36 * s, 0, G + 0.2 * s), 0.03 * s, r2=0.024 * s, segs=10, outline=0.01)
rod('etrunk2', M['elephant'], (0.36 * s, 0, G + 0.2 * s), (0.38 * s, 0, G + 0.07 * s), 0.024 * s, r2=0.018 * s, segs=10, outline=0.01)
place(made, -160, 0.42, 0.22)

# ---------- the viewing platform at the clearing's edge ----------
PX, PY = 0.72, -0.55
for sx in (-1, 1):
    for sy in (-1, 1):
        rod(f'post{sx}{sy}', M['wood'], (PX + sx * 0.07, PY + sy * 0.07, G), (PX + sx * 0.07, PY + sy * 0.07, G + 0.3), 0.01, segs=6, outline=0.003)
box('deck', M['wood'], PX, PY, G + 0.2, 0.2, 0.2, 0.02, outline=0.006, bevel=0)
for k, (dx, dy, w, d) in enumerate(((0, -0.1, 0.2, 0.01), (-0.1, 0, 0.01, 0.2), (0.1, 0, 0.01, 0.2))):
    box(f'rail{k}', M['wood'], PX + dx, PY + dy, G + 0.22, w, d, 0.04, outline=0.003, bevel=0)
pyramid('platformroof', M['roof'], PX, PY, G + 0.3, 0.26, 0.1, outline=0.008)
bar('ladder', M['wood'], (PX - 0.05, PY - 0.2, G), (PX - 0.05, PY - 0.1, G + 0.2), 0.03, outline=0.003)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
