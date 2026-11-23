# A cartoon Salzburg for the country maps, built in the set's shared look (../toon.py): the
# Hohensalzburg fortress white on its green hill above the old town, the cathedral's twin towers and
# great dome in green copper, the Collegiate Church's dome, the old town's tall pastel houses, the
# Salzach in front with a footbridge, and the riverside trees. Turned a little towards the camera.
# Run: blender -b --factory-startup -P salzburg.py -- salzburg-1024.png 1024 salzburg.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'river': toon('river', '#4a9ab0', shadow_mul=(0.74, 0.82, 0.9), lift=0.3),
    'hill': toon('hill', '#5a9a48', shadow_mul=(0.7, 0.78, 0.8)),
    'cliff': toon('cliff', '#9a8e7e', shadow_mul=(0.84, 0.84, 0.9)),
    'fortress': toon('fortress', '#f4f0e6', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'roof': toon('roof', '#8a4a3a'),
    'copper': toon('copper', '#5aa08a', shadow_mul=(0.78, 0.86, 0.84), lift=0.2),
    'marble': toon('marble', '#ece4d4', shadow_mul=(0.8, 0.82, 0.9), lift=0.2),
    'h0': toon('h0', '#f0d8a0'), 'h1': toon('h1', '#e8b8a0'), 'h2': toon('h2', '#f8f2e4', lift=0.2), 'h3': toon('h3', '#c8dcc0'),
    'slate': toon('slate', '#6a6464', shadow_mul=(0.8, 0.8, 0.88)),
    'window': flat('window', '#3a3640'),
    'bridge': toon('bridge', '#8a8e96', shadow_mul=(0.8, 0.8, 0.88)),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'quay': toon('quay', '#cfc4ae', shadow_mul=(0.8, 0.8, 0.88)),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(1259)


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


def ring(cx, cy, rx, ry, z, k, sides=22):
    return [(cx + rx * math.cos(t) * (1 + 0.05 * math.sin(3 * t + k)), cy + ry * math.sin(t) * (1 + 0.05 * math.cos(2 * t + k)), G + z) for t in (2 * math.pi * j / sides for j in range(sides))]


# ---------- the Salzach across the front ----------
flat_face('river', M['river'], [(1.42 * math.cos(math.radians(a)), 1.42 * math.sin(math.radians(a))) for a in range(196, 345, 4)], G + 0.004, outline=0.008)
box('quay', M['quay'], 0.0, -0.36, G - 0.004, 2.6, 0.06, 0.03, outline=0.006, bevel=0)
box('footbridge', M['bridge'], -0.35, -0.75, G + 0.03, 0.08, 0.8, 0.02, outline=0.005, bevel=0)
for s in (-1, 1):
    rod(f'bridgerail{s}', M['bridge'], (-0.35 + s * 0.04, -1.13, G + 0.08), (-0.35 + s * 0.04, -0.37, G + 0.08), 0.005, segs=5, outline=0.002)

# ---------- the Festungsberg and Hohensalzburg on top ----------
FX, FY = 0.35, 0.68
hill = loft('hill', M['hill'], [ring(FX, FY, 0.72, 0.5, -0.01, 1), ring(FX, FY + 0.02, 0.5, 0.34, 0.2, 1), ring(FX, FY + 0.03, 0.4, 0.27, 0.32, 1)], outline=0.016, smooth=True)
hill.visible_shadow = False
crag = loft('crag', M['cliff'], [[(FX - 0.3, FY - 0.32, G + 0.02), (FX + 0.25, FY - 0.36, G + 0.02), (FX + 0.25, FY - 0.24, G + 0.33), (FX - 0.3, FY - 0.2, G + 0.33)],
                                 [(FX - 0.3, FY - 0.24, G + 0.02), (FX + 0.25, FY - 0.28, G + 0.02), (FX + 0.25, FY - 0.16, G + 0.33), (FX - 0.3, FY - 0.12, G + 0.33)]],
            outline=0.012)
crag.visible_shadow = False
T = G + 0.32
box('fortwall', M['fortress'], FX, FY + 0.02, T - 0.02, 0.62, 0.34, 0.08, outline=0.012, bevel=0)
box('keep', M['fortress'], FX + 0.05, FY + 0.06, T + 0.05, 0.3, 0.2, 0.16, outline=0.012, bevel=0)
loft('keeproof', M['roof'], [[(FX - 0.11, FY - 0.05, T + 0.205), (FX + 0.21, FY - 0.05, T + 0.205), (FX + 0.21, FY + 0.17, T + 0.205), (FX - 0.11, FY + 0.17, T + 0.205)],
                             [(FX - 0.11, FY + 0.056, T + 0.27), (FX + 0.21, FY + 0.056, T + 0.27), (FX + 0.21, FY + 0.064, T + 0.27), (FX - 0.11, FY + 0.064, T + 0.27)]],
     outline=0.01)
for k, (dx, h) in enumerate(((-0.26, 0.14), (0.27, 0.13), (-0.08, 0.2))):
    tx, ty = FX + dx, FY - 0.12 + (0.08 if k == 2 else 0)
    lathe(f'tower{k}', M['fortress'], ((0.04, 0), (0.04, h)), T - 0.02, tx, ty, segs=12, outline=0.008)
    lathe(f'towerroof{k}', M['roof'], ((0.05, 0), (0.004, 0.07)), T - 0.02 + h, tx, ty, segs=12, outline=0.006)
for k in range(6):
    box(f'fortwin{k}', M['window'], FX - 0.07 + k * 0.045, FY - 0.045, T + 0.11, 0.018, 0.006, 0.03, outline=0, bevel=0)

# ---------- the old town: the cathedral, the Collegiate Church, tall houses ----------
CX, CY = -0.3, 0.12
box('nave', M['marble'], CX, CY + 0.14, G - 0.005, 0.22, 0.4, 0.2, outline=0.012, bevel=0)
loft('naveroof', M['slate'], [[(CX - 0.12, CY - 0.04, G + 0.195), (CX + 0.12, CY - 0.04, G + 0.195), (CX + 0.12, CY + 0.35, G + 0.195), (CX - 0.12, CY + 0.35, G + 0.195)],
                              [(CX - 0.004, CY - 0.04, G + 0.27), (CX + 0.004, CY - 0.04, G + 0.27), (CX + 0.004, CY + 0.35, G + 0.27), (CX - 0.004, CY + 0.35, G + 0.27)]],
     outline=0.01)
box('facade', M['marble'], CX, CY - 0.08, G - 0.005, 0.3, 0.06, 0.24, outline=0.012, bevel=0)
for s in (-1, 1):
    tx = CX + s * 0.115
    box(f'cathtower{s}', M['marble'], tx, CY - 0.08, G + 0.23, 0.07, 0.07, 0.1, outline=0.008, bevel=0)
    lathe(f'cathtowerdome{s}', M['copper'], ((0.045, 0), (0.042, 0.03), (0.025, 0.06), (0.008, 0.08), (0.008, 0.1), (0.003, 0.12)), G + 0.33, tx, CY - 0.08, segs=12,
          outline=0.006)
box('cathdoors', M['window'], CX, CY - 0.112, G, 0.12, 0.006, 0.09, outline=0, bevel=0)
lathe('cathdrum', M['marble'], ((0.08, 0), (0.08, 0.07)), G + 0.26, CX, CY + 0.22, segs=8, outline=0.008)
lathe('cathdome', M['copper'], ((0.09, 0), (0.085, 0.04), (0.06, 0.09), (0.02, 0.12), (0.012, 0.15), (0.003, 0.18)), G + 0.33, CX, CY + 0.22, segs=8, outline=0.008)
lathe('kollegiendome', M['copper'], ((0.06, 0), (0.055, 0.03), (0.03, 0.07), (0.003, 0.1)), G + 0.2, -0.78, 0.3, segs=8, outline=0.006)
box('kollegien', M['marble'], -0.78, 0.3, G - 0.005, 0.16, 0.16, 0.21, outline=0.009, bevel=0)
for k, (x, y, w, h) in enumerate(((-0.95, -0.08, 0.13, 0.17), (-0.78, -0.15, 0.12, 0.19), (-0.62, -0.12, 0.12, 0.16), (0.02, -0.15, 0.13, 0.17), (0.18, -0.12, 0.12, 0.19),
                                  (0.34, -0.15, 0.13, 0.16), (0.5, -0.12, 0.12, 0.18), (0.66, -0.15, 0.13, 0.16), (0.85, -0.05, 0.12, 0.15))):
    box(f'house{k}', M[f'h{k % 4}'], x, y, G - 0.005, w, 0.12, h, outline=0.008, bevel=0)
    box(f'houseroof{k}', M['slate'], x, y, G + h - 0.01, w + 0.01, 0.13, 0.025, outline=0.004, bevel=0)
    for row in range(2):
        for j in range(2):
            box(f'housewin{k}{row}{j}', M['window'], x - w / 4 + j * w / 2, y - 0.064, G + 0.04 + row * 0.06, 0.02, 0.006, 0.028, outline=0, bevel=0)
for k in range(7):
    ball(f'tree{k}', M['tree'], -1.0 + k * 0.33, -0.3, G + 0.07, rng.uniform(0.05, 0.065), outline=0.01)

turn(before, -20)
render(G)
