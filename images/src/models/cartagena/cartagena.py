# A cartoon Cartagena for the country maps, built in the set's shared look (../toon.py): the walled
# city's yellow Clock Tower Gate with its three arches, the thick stone walls and their sentry boxes
# on the Caribbean, and the colonial houses in bright colours behind with wooden balconies and
# bougainvillea. Turned a little towards the camera.
# Run: blender -b --factory-startup -P cartagena.py -- cartagena-1024.png 1024 cartagena.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#2fa8c8', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'paving': toon('paving', '#d8cbb0', lift=0.2),
    'wall': toon('wall', '#c8b48a', shadow_mul=(0.86, 0.8, 0.76)),
    'tower': toon('tower', '#f0c850', shadow_mul=(0.86, 0.78, 0.7), lift=0.15),
    'white': toon('white', '#f8f6f0', lift=0.2),
    'h0': toon('h0', '#e8603a'), 'h1': toon('h1', '#3fa8b0'), 'h2': toon('h2', '#f0c030'), 'h3': toon('h3', '#e86a9a'), 'h4': toon('h4', '#8ac44a'),
    'roof': toon('roof', '#c4573a'),
    'balcony': toon('balcony', '#7a4a2e'),
    'flower': toon('flower', '#e83a8a'),
    'window': flat('window', '#3a3640'),
    'clock': toon('clock', '#f8f6f0', lift=0.2),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)
rng = random.Random(1429)


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


# ---------- the sea in front, the walls along it ----------
flat_face('sea', M['sea'], [(1.42 * math.cos(math.radians(a)), 1.42 * math.sin(math.radians(a))) for a in range(200, 341, 4)], G + 0.004, outline=0.01)
for s in (-1, 1):
    box(f'wall{s}', M['wall'], s * 0.65, -0.38, G - 0.005, 0.8, 0.16, 0.14, outline=0.012, bevel=0)
    for j in range(8):
        box(f'merlon{s}{j}', M['wall'], s * 0.65 - 0.35 + j * 0.1, -0.45, G + 0.135, 0.05, 0.03, 0.03, outline=0.003, bevel=0)
    x = s * 0.98
    lathe(f'garita{s}', M['wall'], ((0.04, 0), (0.04, 0.08), (0.045, 0.085)), G + 0.135, x, -0.45, segs=10, outline=0.005)
    lathe(f'garitaroof{s}', M['wall'], ((0.045, 0), (0.025, 0.03), (0.004, 0.06)), G + 0.22, x, -0.45, segs=10, outline=0.004)

# ---------- the Clock Tower Gate ----------
GX, GY = 0.0, -0.38
box('gate', M['tower'], GX, GY, G - 0.005, 0.5, 0.2, 0.18, outline=0.014, bevel=0)
for j, x in enumerate((-0.15, 0.0, 0.15)):
    box(f'arch{j}', M['window'], GX + x, GY - 0.104, G - 0.005, 0.08 if j != 1 else 0.1, 0.008, 0.12, outline=0, bevel=0)
box('tower', M['tower'], GX, GY + 0.02, G + 0.17, 0.16, 0.14, 0.18, outline=0.012, bevel=0)
cyl('clock', M['clock'], 0.04, 0.008, segs=16, outline=0.004, matrix=Matrix.Translation((GX, GY - 0.054, G + 0.28)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
box('belfry', M['white'], GX, GY + 0.02, G + 0.35, 0.12, 0.1, 0.08, outline=0.008, bevel=0)
box('belfryopen', M['window'], GX, GY - 0.032, G + 0.365, 0.05, 0.006, 0.05, outline=0, bevel=0)
lathe('cupola', M['tower'], ((0.07, 0), (0.05, 0.04), (0.02, 0.08), (0.004, 0.12)), G + 0.43, GX, GY + 0.02, segs=8, outline=0.006)


# ---------- the colonial houses, balconies and bougainvillea ----------
def house(name, x, y, w, h, mat, a=0.0):
    box(name, M[mat], x, y, G - 0.005, w, 0.16, h, rot_z=a, outline=0.009, bevel=0)
    box(f'{name}roof', M['roof'], x, y, G + h - 0.01, w + 0.02, 0.18, 0.03, rot_z=a, outline=0.004, bevel=0)
    c, s = math.cos(a), math.sin(a)
    box(f'{name}balcony', M['balcony'], x + 0.09 * s, y - 0.09 * c, G + h * 0.55, w * 0.8, 0.04, 0.035, rot_z=a, outline=0.004, bevel=0)
    box(f'{name}door', M['window'], x + 0.082 * s, y - 0.082 * c, G, 0.04, 0.006, 0.07, rot_z=a, outline=0, bevel=0)
    ball(f'{name}flower', M['flower'], x + w * 0.35 * c + 0.09 * s, y + w * 0.35 * s - 0.09 * c, G + h * 0.7, 0.03, outline=0.004)


for k, (x, y, w, h) in enumerate(((-0.85, 0.05, 0.2, 0.18), (-0.62, 0.1, 0.2, 0.2), (-0.38, 0.12, 0.2, 0.17), (0.38, 0.12, 0.2, 0.19), (0.62, 0.1, 0.2, 0.17),
                                  (0.85, 0.05, 0.2, 0.2), (-0.5, 0.55, 0.22, 0.18), (-0.25, 0.65, 0.2, 0.2), (0.25, 0.62, 0.22, 0.17), (0.52, 0.52, 0.2, 0.19),
                                  (0.0, 0.25, 0.22, 0.16))):
    house(f'house{k}', x, y, w, h, f'h{k % 5}')
for k, (x, y) in enumerate(((-0.15, 0.95), (0.8, 0.75), (-0.85, 0.65))):
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + 0.3), 0.013, r2=0.01, segs=8, outline=0.004)
    for f in range(6):
        b = 2 * math.pi * f / 6 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.02, y, G + 0.3), (x + 0.02 + 0.1 * math.cos(b), y + 0.1 * math.sin(b), G + 0.25), 0.019, outline=0.005)

turn(before, -20)
render(G)
