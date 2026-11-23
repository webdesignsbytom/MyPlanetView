# A cartoon Volunteer Point for the country maps, built in the set's shared look (../toon.py): the
# king penguin colony on the green headland of East Falkland, its white beach and the dark South
# Atlantic, the penguins standing in their colony with their brown fluffy chicks, one coming out of
# the surf, and a little marker cairn. Turned a little towards the camera.
# Run: blender -b --factory-startup -P volunteer-point.py -- volunteer-point-1024.png 1024 volunteer-point.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#2a6aa0', shadow_mul=(0.74, 0.82, 0.9), lift=0.3),
    'surf': toon('surf', '#f4f8fb', shadow_mul=(0.82, 0.86, 0.95), lift=0.1),
    'sand': toon('sand', '#f2ecdc', shadow_mul=(0.82, 0.8, 0.88), lift=0.2),
    'black': toon('penguinBlack', '#2e3036', shadow_mul=(0.8, 0.8, 0.9), lift=0.15),
    'belly': toon('belly', '#fbfaf6', shadow_mul=(0.8, 0.84, 0.94), lift=0.2),
    'orange': toon('orange', '#f39a2a', lift=0.35),
    'chick': toon('chick', '#8a6a4e', shadow_mul=(0.84, 0.78, 0.76)),
    'stone': toon('stone', '#a8a49a', shadow_mul=(0.8, 0.8, 0.88)),
    'tussock': toon('tussock', '#9aa860', shadow_mul=(0.78, 0.8, 0.74)),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(1103)


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


def squashed(name, mat, x, y, z, r, sx, sy, sz, outline=0.02):
    b = ball(name, mat, 0, 0, 0, r, outline=outline)
    b.scale = (sx, sy, sz)
    b.location = (x, y, z)
    return b


# ---------- the white beach and the South Atlantic at the front ----------
flat_face('beach', M['sand'], [(1.41 * math.cos(math.radians(a)), 1.41 * math.sin(math.radians(a))) for a in range(186, 355, 4)], G + 0.003, outline=0.008)
flat_face('sea', M['sea'], [(1.42 * math.cos(math.radians(a)), 1.42 * math.sin(math.radians(a))) for a in range(200, 341, 4)], G + 0.006, outline=0.01)
for k in range(14):
    x = -1.25 + k * 0.19
    ball(f'surf{k}', M['surf'], x, -0.5 + 0.02 * math.sin(k * 2.3), G + 0.006, rng.uniform(0.025, 0.035), outline=0.004)


# ---------- the king penguins ----------
def king(name, x, y, z=G, s=1.0, a=-math.pi / 2):
    c, sn = math.cos(a), math.sin(a)
    lathe(f'{name}body', M['black'], ((0.045 * s, 0), (0.058 * s, 0.04 * s), (0.054 * s, 0.1 * s), (0.038 * s, 0.14 * s), (0.004, 0.15 * s)), z, x, y, segs=14,
          outline=0.008 * s)
    squashed(f'{name}belly', M['belly'], x + 0.026 * s * c, y + 0.026 * s * sn, z + 0.065 * s, 0.045 * s, 1.0, 1.0, 1.45, outline=0.004)
    squashed(f'{name}chest', M['orange'], x + 0.035 * s * c, y + 0.035 * s * sn, z + 0.118 * s, 0.024 * s, 1.0, 1.0, 0.8, outline=0.003)
    ball(f'{name}head', M['black'], x, y, z + 0.165 * s, 0.033 * s, outline=0.006 * s)
    for side in (-1, 1):
        ball(f'{name}ear{side}', M['orange'], x - side * 0.027 * s * sn, y + side * 0.027 * s * c, z + 0.162 * s, 0.012 * s, outline=0)
        fx, fy = x - side * 0.055 * s * sn, y + side * 0.055 * s * c
        bar(f'{name}flipper{side}', M['black'], (fx, fy, z + 0.11 * s), (fx - side * 0.012 * s * sn, fy + side * 0.012 * s * c, z + 0.045 * s), 0.018 * s, outline=0.003)
    hx, hy = x + 0.03 * s * c, y + 0.03 * s * sn
    bar(f'{name}beak', M['black'], (hx, hy, z + 0.168 * s), (hx + 0.04 * s * c, hy + 0.04 * s * sn, z + 0.155 * s), 0.012 * s, outline=0.002)
    for side in (-1, 1):
        ball(f'{name}foot{side}', M['orange'], x + 0.02 * s * c - side * 0.02 * s * sn, y + 0.02 * s * sn + side * 0.02 * s * c, z + 0.004, 0.012 * s, outline=0)


SPOTS = [(-0.5, 0.05, -1.75), (-0.28, -0.05, -1.45), (-0.05, 0.08, -1.6), (0.2, -0.02, -1.35), (0.42, 0.1, -1.9), (-0.38, 0.3, -1.5), (-0.12, 0.32, -1.7),
         (0.12, 0.26, -1.3), (0.35, 0.36, -1.6), (-0.6, 0.42, -1.4), (0.6, 0.3, -1.8), (0.0, 0.52, -1.55)]
for k, (x, y, a) in enumerate(SPOTS):
    king(f'king{k}', x + rng.uniform(-0.02, 0.02), y, s=rng.uniform(1.15, 1.3), a=a)
for k, (x, y) in enumerate(((-0.22, 0.16), (0.3, 0.15), (-0.45, 0.52))):
    squashed(f'chick{k}', M['chick'], x, y, G + 0.07, 0.065, 1.0, 1.0, 1.15, outline=0.012)
    ball(f'chickhead{k}', M['chick'], x, y - 0.01, G + 0.16, 0.035, outline=0.008)
    bar(f'chickbeak{k}', M['black'], (x, y - 0.04, G + 0.16), (x, y - 0.07, G + 0.15), 0.01, outline=0.002)
king('surfer', 0.75, -0.42, s=1.15, a=-2.3)

# ---------- tussock grass and a marker cairn ----------
for k in range(10):
    a = math.radians(20 + k * 15)
    x, y = 1.1 * math.cos(a), 0.15 + 0.85 * math.sin(a)
    if math.hypot(x, y) > 1.3:
        continue
    for j in range(5):
        b = 2 * math.pi * j / 5
        bar(f'tussock{k}{j}', M['tussock'], (x, y, G), (x + 0.05 * math.cos(b), y + 0.05 * math.sin(b), G + 0.08), 0.014, outline=0.003)
for k, (dz, r) in enumerate(((0.0, 0.055), (0.07, 0.045), (0.13, 0.035))):
    ball(f'cairn{k}', M['stone'], 0.85, 0.15, G + 0.03 + dz, r, outline=0.008)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
