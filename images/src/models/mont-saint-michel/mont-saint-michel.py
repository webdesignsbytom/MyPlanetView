# A cartoon Mont-Saint-Michel for the country maps, built in the set's shared look (../toon.py): the
# rocky tidal island crowned by its abbey, the church's spire with Saint Michael in gold at the top,
# La Merveille's tall walls, the village's houses climbing inside the ramparts, the sands and the
# sea round it, and the causeway bridge to the shore. Turned a little towards the camera.
# Run: blender -b --factory-startup -P mont-saint-michel.py -- mont-saint-michel-1024.png 1024 mont-saint-michel.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#6a9ab0', shadow_mul=(0.76, 0.84, 0.88), lift=0.3),
    'sand': toon('sand', '#d8ccb0', shadow_mul=(0.84, 0.82, 0.86), lift=0.2),
    'rock': toon('rock', '#8a8278', shadow_mul=(0.84, 0.84, 0.9)),
    'granite': toon('granite', '#b8b0a2', shadow_mul=(0.82, 0.82, 0.9)),
    'roof': toon('roof', '#5a5a62', shadow_mul=(0.8, 0.8, 0.88)),
    'house': toon('house', '#d8ccb4'),
    'gold': toon('gold', '#f0c030', lift=0.35),
    'window': flat('window', '#2e3a54'),
    'bridge': toon('bridge', '#9a9ea6'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['sea'])
before = set(bpy.data.objects)
rng = random.Random(1499)


def ring(cx, cy, rx, ry, z, k, sides=24):
    return [(cx + rx * math.cos(t) * (1 + 0.05 * math.sin(3 * t + k)), cy + ry * math.sin(t) * (1 + 0.05 * math.cos(2 * t + k)), G + z) for t in (2 * math.pi * j / sides for j in range(sides))]


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


# ---------- the sands round the island ----------
flat_face('sands', M['sand'], [(p[0], p[1]) for p in ring(0.0, 0.15, 1.05, 0.8, 0, 2)], G + 0.004, outline=0.006)

# ---------- the rock, the ramparts round its foot ----------
MX, MY = 0.0, 0.25
rock = loft('rock', M['rock'], [ring(MX, MY, 0.42, 0.34, -0.01, 1), ring(MX, MY + 0.02, 0.36, 0.28, 0.14, 1), ring(MX, MY + 0.04, 0.24, 0.18, 0.3, 1),
                                ring(MX, MY + 0.05, 0.14, 0.11, 0.38, 1)], outline=0.016, smooth=True)
rock.visible_shadow = False
for k in range(14):
    a = math.radians(190 + k * 12.5)
    x, y = MX + 0.44 * math.cos(a), MY + 0.36 * math.sin(a)
    box(f'rampart{k}', M['granite'], x, y, G - 0.005, 0.1, 0.04, 0.08, rot_z=a + math.pi / 2, outline=0.005, bevel=0)
for k, a in enumerate((205, 270, 335)):
    a = math.radians(a)
    lathe(f'ramparttower{k}', M['granite'], ((0.04, 0), (0.04, 0.11)), G - 0.005, MX + 0.44 * math.cos(a), MY + 0.36 * math.sin(a), segs=12, outline=0.006)

# ---------- the village's houses climbing the rock ----------
for k in range(10):
    a = math.radians(200 + k * 14)
    r = 0.33 - 0.04 * (k % 2)
    x, y = MX + r * math.cos(a), MY + r * 0.82 * math.sin(a)
    z = G + 0.08 + 0.05 * (k % 3)
    box(f'house{k}', M['house'], x, y, z, 0.07, 0.06, 0.07, rot_z=a, outline=0.005, bevel=0)
    pyramid(f'houseroof{k}', M['roof'], x, y, z + 0.068, 0.08, 0.045, outline=0.004)

# ---------- the abbey: La Merveille, the church and its spire ----------
AZ = G + 0.3
box('merveille', M['granite'], MX + 0.06, MY + 0.12, G + 0.12, 0.3, 0.12, 0.26, outline=0.012, bevel=0)
for j in range(5):
    box(f'merveillewin{j}', M['window'], MX - 0.06 + j * 0.06, MY + 0.058, G + 0.26, 0.02, 0.006, 0.06, outline=0, bevel=0)
box('church', M['granite'], MX, MY + 0.03, AZ, 0.28, 0.12, 0.12, outline=0.01, bevel=0)
loft('churchroof', M['roof'], [[(MX - 0.14, MY - 0.03, AZ + 0.115), (MX + 0.14, MY - 0.03, AZ + 0.115), (MX + 0.14, MY + 0.09, AZ + 0.115), (MX - 0.14, MY + 0.09, AZ + 0.115)],
                               [(MX - 0.14, MY + 0.028, AZ + 0.18), (MX + 0.14, MY + 0.028, AZ + 0.18), (MX + 0.14, MY + 0.032, AZ + 0.18), (MX - 0.14, MY + 0.032, AZ + 0.18)]],
     outline=0.008)
box('crossing', M['granite'], MX + 0.02, MY + 0.03, AZ + 0.11, 0.08, 0.08, 0.1, outline=0.008, bevel=0)
lathe('spire', M['roof'], ((0.05, 0), (0.004, 0.3)), AZ + 0.21, MX + 0.02, MY + 0.03, segs=8, outline=0.008, smooth=False)
rod('michael', M['gold'], (MX + 0.02, MY + 0.03, AZ + 0.5), (MX + 0.02, MY + 0.03, AZ + 0.56), 0.008, segs=6, outline=0.002)
for s in (-1, 1):
    bar(f'michaelwing{s}', M['gold'], (MX + 0.02, MY + 0.03, AZ + 0.55), (MX + 0.02 + s * 0.025, MY + 0.03, AZ + 0.57), 0.01, outline=0.001)
ball('tree0', M['tree'], MX + 0.28, MY + 0.15, G + 0.12, 0.05, outline=0.008)

# ---------- the causeway bridge to the shore ----------
box('causeway', M['bridge'], MX + 0.05, -0.55, G + 0.02, 0.1, 0.75, 0.025, outline=0.006, bevel=0)
for k in range(5):
    rod(f'causewaypier{k}', M['bridge'], (MX + 0.05, -0.85 + k * 0.15, G - 0.01), (MX + 0.05, -0.85 + k * 0.15, G + 0.02), 0.015, segs=6, outline=0.003)

turn(before, -20)
render(G)
