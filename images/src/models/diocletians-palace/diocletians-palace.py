# A cartoon Diocletian's Palace for the country maps, built in the set's shared look (../toon.py):
# the Peristyle at the heart of Split, its Corinthian columns and arches in white stone, the
# cathedral's tall Romanesque bell tower, the palace's walls on the waterfront Riva with its palms,
# and the harbour. Turned a little towards the camera.
# Run: blender -b --factory-startup -P diocletians-palace.py -- diocletians-palace-1024.png 1024 diocletians-palace.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#2a8ac0', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'paving': toon('paving', '#e8e2d4', shadow_mul=(0.82, 0.82, 0.9), lift=0.2),
    'stone': toon('stone', '#f0ebe0', shadow_mul=(0.8, 0.82, 0.92), lift=0.15),
    'stoneDark': toon('stoneDark', '#d8d0c0', shadow_mul=(0.8, 0.82, 0.92)),
    'roof': toon('roof', '#c4573a'),
    'window': flat('window', '#3a3640'),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


flat_face('sea', M['sea'], [(1.42 * math.cos(math.radians(a)), 1.42 * math.sin(math.radians(a))) for a in range(206, 335, 4)], G + 0.004, outline=0.01)

# ---------- the palace's sea wall along the Riva ----------
box('seawall', M['stoneDark'], 0.0, -0.4, G - 0.005, 1.8, 0.1, 0.2, outline=0.012, bevel=0)
for j in range(14):
    box(f'gallery{j}', M['window'], -0.78 + j * 0.12, -0.452, G + 0.11, 0.05, 0.006, 0.06, outline=0, bevel=0)
for s in (-1, 1):
    box(f'cornertower{s}', M['stoneDark'], s * 0.92, -0.4, G - 0.005, 0.16, 0.16, 0.26, outline=0.01, bevel=0)
for k, x in enumerate((-0.6, -0.2, 0.2, 0.6)):
    rod(f'palmtrunk{k}', M['trunk'], (x, -0.6, G), (x + 0.02, -0.6, G + 0.25), 0.012, r2=0.009, segs=8, outline=0.004)
    for f in range(6):
        b = 2 * math.pi * f / 6 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.02, -0.6, G + 0.25), (x + 0.02 + 0.09 * math.cos(b), -0.6 + 0.09 * math.sin(b), G + 0.205), 0.017, outline=0.004)

# ---------- the Peristyle ----------
PX, PY = -0.15, 0.1
box('peristylefloor', M['stoneDark'], PX, PY, G - 0.005, 0.5, 0.36, 0.02, outline=0.006, bevel=0)
for s in (-1, 1):
    y = PY + s * 0.15
    for j in range(6):
        x = PX - 0.2 + j * 0.08
        rod(f'column{s}{j}', M['stone'], (x, y, G + 0.015), (x, y, G + 0.21), 0.016, segs=10, outline=0.004)
        box(f'capital{s}{j}', M['stone'], x, y, G + 0.21, 0.04, 0.04, 0.02, outline=0.003, bevel=0)
    for j in range(5):
        x0 = PX - 0.2 + j * 0.08
        for k in range(4):
            um = (k + 0.5) / 4
            z = G + 0.23 + 0.03 * math.sqrt(max(0.0, 1 - (2 * um - 1) ** 2))
            box(f'arch{s}{j}{k}', M['stone'], x0 + 0.08 * um, y, z, 0.022, 0.035, G + 0.29 - z, outline=0.002, bevel=0)
    box(f'archtop{s}', M['stone'], PX, y, G + 0.285, 0.44, 0.04, 0.03, outline=0.005, bevel=0)
box('vestibule', M['stoneDark'], PX - 0.3, PY, G - 0.005, 0.14, 0.24, 0.3, outline=0.01, bevel=0)
lathe('vestibuledome', M['stoneDark'], ((0.09, 0), (0.07, 0.05), (0.004, 0.08)), G + 0.295, PX - 0.3, PY, segs=16, outline=0.006)

# ---------- the cathedral and its bell tower ----------
CX, CY = 0.35, 0.35
lathe('mausoleum', M['stoneDark'], ((0.16, 0), (0.16, 0.18)), G - 0.005, CX + 0.1, CY + 0.15, segs=8, outline=0.01)
lathe('mausoleumroof', M['roof'], ((0.17, 0), (0.004, 0.1)), G + 0.175, CX + 0.1, CY + 0.15, segs=8, outline=0.008)
BX, BY = CX - 0.1, CY - 0.1
for i, (w, h) in enumerate(((0.16, 0.14), (0.15, 0.12), (0.14, 0.11), (0.13, 0.1), (0.12, 0.09))):
    z = G - 0.005 + sum(hh for _, hh in ((0.16, 0.14), (0.15, 0.12), (0.14, 0.11), (0.13, 0.1), (0.12, 0.09))[:i])
    box(f'belltower{i}', M['stone'], BX, BY, z, w, w, h, outline=0.008, bevel=0)
    for j in range(2 if i < 2 else 3):
        n = 2 if i < 2 else 3
        box(f'belltowerarch{i}{j}', M['window'], BX - w / 4 * (n - 1) / 1 + j * w / 2 if n == 2 else BX - w / 3 + j * w / 3, BY - w / 2 - 0.004, z + h * 0.25, 0.022,
            0.006, h * 0.5, outline=0, bevel=0)
pyramid('belltowerspire', M['stone'], BX, BY, G + 0.555, 0.12, 0.16, outline=0.008)

turn(before, -20)
render(G)
