# Cartoon Sigatoka Sand Dunes for the country maps, built in the set's shared look (../toon.py):
# Fiji's great golden dunes by the Coral Coast, rising from the surf where the Sigatoka river meets
# the Pacific, tufts of beach grass and ironwood trees on their backs, palms, and a bure with its
# steep thatched roof. Turned a little towards the camera.
# Run: blender -b --factory-startup -P sigatoka-dunes.py -- sigatoka-dunes-1024.png 1024 sigatoka-dunes.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#2fa8c8', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'surf': toon('surf', '#f4f8fb', shadow_mul=(0.82, 0.86, 0.95), lift=0.1),
    'dune': toon('dune', '#e8c88a', shadow_mul=(0.84, 0.76, 0.72), lift=0.2),
    'duneDark': toon('duneDark', '#d4b070', shadow_mul=(0.84, 0.76, 0.72)),
    'river': toon('river', '#4a9ec8', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'grassTuft': toon('grassTuft', '#8cb85a', shadow_mul=(0.72, 0.78, 0.78)),
    'ironwood': toon('ironwood', '#4f7a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
    'thatch': toon('thatch', '#b89a5a', shadow_mul=(0.84, 0.76, 0.62)),
    'reed': toon('reed', '#d8c49a'),
    'window': flat('window', '#3a3640'),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(739)


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


# ---------- sand everywhere but the sea at the front ----------
R = 1.42
flat_face('beach', M['dune'], [(R * math.cos(math.radians(a)), R * math.sin(math.radians(a))) for a in range(0, 360, 6)], G + 0.002, outline=0.008)
flat_face('sea', M['sea'], [(R * math.cos(math.radians(a)), R * math.sin(math.radians(a))) for a in range(206, 335, 6)], G + 0.005, outline=0.01)
for k in range(3):
    y = -0.66 - k * 0.15
    half = math.sqrt(max(0.0, 1.32 ** 2 - y * y))
    bar(f'surf{k}', M['surf'], (-half + 0.05, y, G + 0.012), (half - 0.05, y, G + 0.012), 0.025, outline=0.003)

# ---------- the river coming out at the right ----------
PATH = [(1.2, 0.55), (0.95, 0.35), (0.85, 0.05), (0.9, -0.3), (0.85, -0.62)]
bm = bmesh.new()
verts = []
for i, (x, y) in enumerate(PATH):
    (x0, y0), (x1, y1) = PATH[max(0, i - 1)], PATH[min(len(PATH) - 1, i + 1)]
    dx, dy = x1 - x0, y1 - y0
    n = math.hypot(dx, dy)
    w = 0.07 + 0.04 * i / len(PATH)
    verts.append((bm.verts.new((x - dy / n * w, y + dx / n * w, G + 0.006)), bm.verts.new((x + dy / n * w, y - dx / n * w, G + 0.006))))
for (a0, a1), (b0, b1) in zip(verts, verts[1:]):
    bm.faces.new((a0, a1, b1, b0))
finish('river', bm, M['river'], outline=0.006)

# ---------- the dunes: long smooth ridges, their sea side steep ----------
for k, (cx, cy, rx, ry, h) in enumerate(((-0.35, -0.2, 0.55, 0.25, 0.3), (0.25, 0.05, 0.45, 0.22, 0.38), (-0.4, 0.45, 0.5, 0.25, 0.42), (0.3, 0.6, 0.38, 0.2, 0.3))):
    rings = []
    for s, z, dy in ((1.0, -0.01, 0.0), (0.7, h * 0.55, 0.04), (0.35, h * 0.9, 0.06), (0.1, h, 0.07)):
        rings.append([(cx + s * rx * math.cos(t), cy + dy + s * ry * math.sin(t), G + z) for t in (2 * math.pi * j / 20 for j in range(20))])
    d = loft(f'dune{k}', M['dune' if k % 2 == 0 else 'duneDark'], rings, outline=0.02, smooth=True)
    d.visible_shadow = False
for k in range(30):
    x, y = rng.uniform(-1.0, 0.7), rng.uniform(-0.3, 0.95)
    if math.hypot(x, y) > 1.15:
        continue
    lathe(f'tuft{k}', M['grassTuft'], ((0.025, 0), (0.004, 0.05)), G + 0.0, x, y, segs=6, outline=0.004, smooth=False)

# ---------- ironwood trees and palms, and a bure ----------
for k, (x, y) in enumerate(((-0.95, 0.15), (-0.85, 0.75), (0.65, 0.95))):
    h = rng.uniform(0.18, 0.24)
    rod(f'ironwoodtrunk{k}', M['trunk'], (x, y, G), (x, y, G + h), 0.014, segs=6, outline=0.004)
    lathe(f'ironwood{k}', M['ironwood'], ((0.08, 0), (0.06, 0.08), (0.004, 0.2)), G + h * 0.5, x, y, segs=10, outline=0.01, smooth=False)
for k, (x, y) in enumerate(((1.05, 0.0), (0.6, -0.35), (1.1, 0.4))):
    h = rng.uniform(0.24, 0.3)
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x - 0.04, y, G + h), 0.014, r2=0.011, segs=8, outline=0.006)
    for f in range(7):
        b = 2 * math.pi * f / 7 + k
        bar(f'frond{k}{f}', M['palm'], (x - 0.04, y, G + h), (x - 0.04 + 0.1 * math.cos(b), y + 0.1 * math.sin(b), G + h - 0.05), 0.02, outline=0.005)
BX, BY = 0.55, 0.3
box('bure', M['reed'], BX, BY, G - 0.005, 0.18, 0.13, 0.09, outline=0.01, bevel=0)
loft('bureroof', M['thatch'], [[(BX - 0.11, BY - 0.085, G + 0.085), (BX + 0.11, BY - 0.085, G + 0.085), (BX + 0.11, BY + 0.085, G + 0.085), (BX - 0.11, BY + 0.085, G + 0.085)],
                               [(BX - 0.08, BY - 0.004, G + 0.3), (BX + 0.08, BY - 0.004, G + 0.3), (BX + 0.08, BY + 0.004, G + 0.3), (BX - 0.08, BY + 0.004, G + 0.3)]],
     outline=0.01)
bar('bureridge', M['trunk'], (BX - 0.11, BY, G + 0.3), (BX + 0.11, BY, G + 0.3), 0.02, outline=0.004)
box('buredoor', M['window'], BX, BY - 0.067, G, 0.04, 0.01, 0.07, outline=0, bevel=0)

turn(before, -20)
render(G)
