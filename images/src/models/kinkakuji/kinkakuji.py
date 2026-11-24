# A cartoon Kinkaku-ji, the Golden Pavilion, for the country maps, built in the set's shared look
# (../toon.py): the three-storey pavilion on the edge of the Mirror Pond, its plain wooden ground floor
# and the two upper storeys covered in gold leaf, the dark shingled roofs and the golden phoenix on
# top, its reflection in the water, and the pond's little islands with their pines and rocks. Turned
# a little towards the camera.
# Run: blender -b --factory-startup -P kinkakuji.py -- kinkakuji-1024.png 1024 kinkakuji.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'pond': toon('pond', '#3a8a8a', shadow_mul=(0.78, 0.88, 0.88), lift=0.3),
    'gold': toon('gold', '#f0c040', shadow_mul=(0.86, 0.76, 0.6), lift=0.3),
    'goldDim': toon('goldDim', '#b8963a', lift=0.1),
    'wood': toon('wood', '#e8dcc0', lift=0.15),
    'woodDark': toon('woodDark', '#6a4a30'),
    'roof': toon('roof', '#4a3a30', shadow_mul=(0.86, 0.84, 0.86)),
    'window': flat('window', '#2a2420'),
    'rock': toon('rock', '#9a968e'),
    'moss': toon('moss', '#6aa54a', shadow_mul=(0.7, 0.78, 0.8)),
    'pine': toon('pine', '#3f7a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a4a36'),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(1397)

# ---------- the Mirror Pond ----------
pond = [(0.95 * math.cos(2 * math.pi * k / 24) * (1 + 0.08 * math.sin(3 * 2 * math.pi * k / 24)), -0.15 + 0.7 * math.sin(2 * math.pi * k / 24)) for k in range(24)]
loft('pond', M['pond'], [[(x, y, G - 0.004) for x, y in pond], [(x, y, G + 0.006) for x, y in pond]], outline=0.003)
for k, (x, y, r) in enumerate(((-0.45, -0.3, 0.14), (0.3, -0.45, 0.1), (0.6, -0.1, 0.08))):
    lathe(f'island{k}', M['moss'], ((r, 0), (r * 0.8, 0.03), (0.004, 0.045)), G, x, y, segs=14, outline=0.004)
    rod(f'pinetrunk{k}', M['trunk'], (x, y, G + 0.03), (x + 0.02, y, G + 0.12), 0.01, segs=6, outline=0.002)
    pn = ball(f'pine{k}', M['pine'], 0, 0, 0, 0.06, outline=0.008)
    pn.scale = (1.5, 1.2, 0.6)
    pn.location = (x + 0.03, y, G + 0.13)
    ball(f'rock{k}', M['rock'], x - r * 0.6, y - r * 0.3, G + 0.02, 0.025, outline=0.003)

# ---------- the pavilion (built small, then grown) ----------
pavilion = set(bpy.data.objects)
PX, PY = 0.05, 0.3
S1, S2, S3 = 0.36, 0.32, 0.22     # the three storeys' widths
Z = G - 0.005


def eaves(name, w, z, h=0.05, over=0.06):
    """A dark shingled roof with wide eaves, hipped to a short ridge."""
    x0 = w / 2 + over
    loft(name, M['roof'], [[(PX - x0, PY - x0, z), (PX + x0, PY - x0, z), (PX + x0, PY + x0, z), (PX - x0, PY + x0, z)],
                           [(PX - x0 + 0.01, PY - x0 + 0.01, z + 0.015), (PX + x0 - 0.01, PY - x0 + 0.01, z + 0.015), (PX + x0 - 0.01, PY + x0 - 0.01, z + 0.015), (PX - x0 + 0.01, PY + x0 - 0.01, z + 0.015)],
                           [(PX - w * 0.25, PY - w * 0.15, z + h), (PX + w * 0.25, PY - w * 0.15, z + h), (PX + w * 0.25, PY + w * 0.15, z + h), (PX - w * 0.25, PY + w * 0.15, z + h)]], outline=0.004)


# the ground floor: plain wood and white panels, on posts at the water's edge
box('floor1', M['wood'], PX, PY, Z, S1, S1, 0.12, outline=0.006, bevel=0)
for j in range(5):
    x = PX - S1 / 2 + 0.02 + j * (S1 - 0.04) / 4
    rod(f'post{j}', M['woodDark'], (x, PY - S1 / 2 - 0.003, Z), (x, PY - S1 / 2 - 0.003, Z + 0.12), 0.007, segs=6, outline=0.001)
box('veranda', M['woodDark'], PX, PY - S1 / 2 - 0.03, Z + 0.01, S1 + 0.04, 0.06, 0.012, outline=0.002, bevel=0)
eaves('roof1', S1, Z + 0.12, h=0.035, over=0.05)
# the second and third storeys in gold
Z2 = Z + 0.15
box('floor2', M['gold'], PX, PY, Z2, S2, S2, 0.11, outline=0.006, bevel=0)
for j in range(3):
    box(f'win2{j}', M['window'], PX - 0.1 + j * 0.1, PY - S2 / 2 - 0.003, Z2 + 0.025, 0.05, 0.006, 0.06, outline=0, bevel=0)
box('balcony2', M['goldDim'], PX, PY - S2 / 2 - 0.02, Z2 + 0.015, S2 + 0.02, 0.04, 0.03, outline=0.002, bevel=0)
eaves('roof2', S2, Z2 + 0.11, h=0.035, over=0.06)
Z3 = Z2 + 0.14
box('floor3', M['gold'], PX, PY, Z3, S3, S3, 0.1, outline=0.006, bevel=0)
for j in range(2):
    box(f'win3{j}', M['window'], PX - 0.05 + j * 0.1, PY - S3 / 2 - 0.003, Z3 + 0.02, 0.04, 0.006, 0.06, outline=0, bevel=0)
loft('roof3', M['roof'], [[(PX - S3 / 2 - 0.08, PY - S3 / 2 - 0.08, Z3 + 0.1), (PX + S3 / 2 + 0.08, PY - S3 / 2 - 0.08, Z3 + 0.1), (PX + S3 / 2 + 0.08, PY + S3 / 2 + 0.08, Z3 + 0.1), (PX - S3 / 2 - 0.08, PY + S3 / 2 + 0.08, Z3 + 0.1)],
                          [(PX - S3 / 2 - 0.06, PY - S3 / 2 - 0.06, Z3 + 0.115), (PX + S3 / 2 + 0.06, PY - S3 / 2 - 0.06, Z3 + 0.115), (PX + S3 / 2 + 0.06, PY + S3 / 2 + 0.06, Z3 + 0.115), (PX - S3 / 2 - 0.06, PY + S3 / 2 + 0.06, Z3 + 0.115)],
                          [(PX - 0.01, PY - 0.01, Z3 + 0.2), (PX + 0.01, PY - 0.01, Z3 + 0.2), (PX + 0.01, PY + 0.01, Z3 + 0.2), (PX - 0.01, PY + 0.01, Z3 + 0.2)]], outline=0.005)
# the golden phoenix
FZ = Z3 + 0.2
rod('phoenixpost', M['gold'], (PX, PY, FZ), (PX, PY, FZ + 0.03), 0.006, segs=6, outline=0)
bird = ball('phoenix', M['gold'], 0, 0, 0, 0.02, outline=0.002)
bird.scale = (0.7, 1.4, 0.8)
bird.location = (PX, PY, FZ + 0.04)
for s in (-1, 1):
    bar(f'phoenixwing{s}', M['gold'], (PX, PY, FZ + 0.045), (PX + s * 0.04, PY + 0.01, FZ + 0.07), 0.01, outline=0.001)
bar('phoenixtail', M['gold'], (PX, PY + 0.02, FZ + 0.045), (PX, PY + 0.06, FZ + 0.08), 0.01, outline=0.001)
# the reflection, a gold shimmer in the pond below the pavilion
for k in range(4):
    box(f'reflection{k}', M['goldDim'], PX + rng.uniform(-0.05, 0.05), PY - S1 / 2 - 0.12 - k * 0.05, G + 0.006, 0.2 - k * 0.03, 0.02, 0.002, outline=0, bevel=0)

bpy.context.view_layer.update()
grow = Matrix.Translation((PX, PY, G)) @ Matrix.Scale(1.4, 4) @ Matrix.Translation((-PX, -PY, -G))
for o in set(bpy.data.objects) - pavilion:
    o.matrix_world = grow @ o.matrix_world

# ---------- the woods behind ----------
for k, (x, y) in enumerate(((-0.62, 0.68), (-0.4, 0.92), (0.5, 0.92), (0.75, 0.66), (-0.88, 0.32), (0.92, 0.3))):
    rod(f'treetrunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.1), 0.014, segs=6, outline=0.002)
    ball(f'tree{k}', M['pine'], x, y, G + 0.2, 0.13, outline=0.012)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
