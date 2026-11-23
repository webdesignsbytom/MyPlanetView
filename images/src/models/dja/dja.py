# A cartoon Dja Faunal Reserve for the country maps, built in the set's shared look (../toon.py):
# Cameroon's rainforest almost ringed by the Dja river, the dense canopy with taller emergent trees,
# a Baka family's dome hut of leaves in a clearing, a lowland gorilla, and a pirogue on the river.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P dja.py -- dja-1024.png 1024 dja.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'forestFloor': toon('forestFloor', '#3f8a4a', shadow_mul=(0.7, 0.78, 0.8), lift=0.25),
    'river': toon('river', '#4f8fb8', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'clearing': toon('clearing', '#9ac065', shadow_mul=(0.72, 0.78, 0.78), lift=0.25),
    'forest': toon('forest', '#2f6e40', shadow_mul=(0.7, 0.78, 0.8)),
    'forestLight': toon('forestLight', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'forestPale': toon('forestPale', '#7ab05a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#9a8a78'),
    'leafHut': toon('leafHut', '#5f8a3a', shadow_mul=(0.72, 0.78, 0.78)),
    'window': flat('window', '#2e2a28'),
    'gorilla': toon('gorilla', '#2e2a2c', shadow_mul=(0.85, 0.85, 0.9)),
    'pirogue': toon('pirogue', '#6b4a33'),
    'smoke': toon('smoke', '#e8e4ea', lift=0.15),
})

G = tile(M['forestFloor'])
before = set(bpy.data.objects)
rng = random.Random(701)


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


# ---------- the Dja looping round the forest ----------
PATH = [(-1.3, -0.35)] + [(1.02 * math.cos(math.radians(a)), 0.95 * math.sin(math.radians(a))) for a in range(200, 341, 14)] + [(1.3, -0.35)]
bm = bmesh.new()
verts = []
for i, (x, y) in enumerate(PATH):
    (x0, y0), (x1, y1) = PATH[max(0, i - 1)], PATH[min(len(PATH) - 1, i + 1)]
    dx, dy = x1 - x0, y1 - y0
    n = math.hypot(dx, dy)
    w = 0.12
    verts.append((bm.verts.new((x - dy / n * w, y + dx / n * w, G + 0.005)), bm.verts.new((x + dy / n * w, y - dx / n * w, G + 0.005))))
for (a0, a1), (b0, b1) in zip(verts, verts[1:]):
    bm.faces.new((a0, a1, b1, b0))
finish('river', bm, M['river'], outline=0.006)

# ---------- the clearing, the Baka hut and its smoke ----------
flat_face('clearing', M['clearing'], [(-0.15 + 0.32 * math.cos(t), -0.35 + 0.2 * math.sin(t)) for t in (2 * math.pi * j / 18 for j in range(18))], G + 0.003, outline=0.006)
HX, HY = -0.25, -0.3
lathe('hut', M['leafHut'], ((0.12, 0), (0.115, 0.04), (0.09, 0.09), (0.05, 0.12), (0.004, 0.13)), G - 0.005, HX, HY, segs=14, outline=0.012)
box('hutdoor', M['window'], HX, HY - 0.115, G, 0.04, 0.01, 0.06, outline=0, bevel=0)
for k, (dx, dz, r) in enumerate(((0.12, 0.05, 0.025), (0.14, 0.11, 0.03), (0.17, 0.18, 0.034))):
    ball(f'smoke{k}', M['smoke'], HX + dx, HY, G + dz, r, outline=0.004)

# ---------- the canopy, with emergent trees standing over it ----------
for k in range(46):
    x, y = rng.uniform(-0.95, 0.95), rng.uniform(-0.75, 0.95)
    if math.hypot(x / 0.95, (y + 0.05) / 0.88) > 1 or math.hypot((x + 0.15) / 0.36, (y + 0.35) / 0.24) < 1.1:
        continue
    emergent = k % 7 == 0
    h = rng.uniform(0.28, 0.36) if emergent else rng.uniform(0.08, 0.16)
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + h), 0.02 if emergent else 0.015, segs=6, outline=0.006)
    mat = 'forestPale' if emergent else ('forest' if k % 2 else 'forestLight')
    squashed(f'crown{k}', M[mat], x, y, G + h + 0.05, rng.uniform(0.11, 0.14), 1.2, 1.2, 0.75, outline=0.014)

# ---------- a lowland gorilla by the clearing ----------
made = set(bpy.data.objects)
squashed('gbody', M['gorilla'], 0, 0, G + 0.13, 0.11, 1.0, 0.9, 1.0, outline=0.012)
ball('ghead', M['gorilla'], 0.07, 0, G + 0.24, 0.055, outline=0.008)
for sy in (-1, 1):
    rod(f'garm{sy}', M['gorilla'], (0.04, sy * 0.08, G + 0.18), (0.12, sy * 0.1, G), 0.03, r2=0.024, segs=8, outline=0.006)
    rod(f'gleg{sy}', M['gorilla'], (-0.06, sy * 0.06, G + 0.08), (-0.06, sy * 0.06, G), 0.03, segs=8, outline=0.006)
place(made, -120, 0.12, -0.45)

# ---------- a pirogue on the river ----------
PX, PY, PA = 0.55, -0.88, 0.5
c, s = math.cos(PA), math.sin(PA)
at = lambda dx, dy, z: (PX + dx * c - dy * s, PY + dx * s + dy * c, z)
loft('pirogue', M['pirogue'], [[at(-0.15, 0, G + 0.002), at(0, -0.025, G + 0.002), at(0.15, 0, G + 0.002), at(0, 0.025, G + 0.002)],
                               [at(-0.17, 0, G + 0.03), at(0, -0.035, G + 0.03), at(0.17, 0, G + 0.03), at(0, 0.035, G + 0.03)]], outline=0.006)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
