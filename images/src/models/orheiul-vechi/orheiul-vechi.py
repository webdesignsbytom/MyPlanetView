# A cartoon Orheiul Vechi for the country maps, built in the set's shared look (../toon.py): the
# limestone promontory in the great loop of the Răut river, the cave monastery cut into its cliff
# with its little balcony, the white church of the Ascension on top with its bell tower and green
# dome, the stone cross at the cliff's edge, and the village's houses and fields round the bend.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P orheiul-vechi.py -- orheiul-vechi-1024.png 1024 orheiul-vechi.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#9ab85a', shadow_mul=(0.74, 0.8, 0.76), lift=0.25),
    'field': toon('field', '#c9c070', shadow_mul=(0.82, 0.78, 0.68)),
    'river': toon('river', '#5a9ab0', shadow_mul=(0.75, 0.82, 0.88), lift=0.3),
    'lime': toon('lime', '#e0d8c4', shadow_mul=(0.8, 0.8, 0.88), lift=0.2),
    'limeDark': toon('limeDark', '#c4baa2', shadow_mul=(0.8, 0.8, 0.88)),
    'top': toon('top', '#86b85a', shadow_mul=(0.72, 0.8, 0.76)),
    'cave': flat('cave', '#2a2228'),
    'wood': toon('wood', '#7a5238'),
    'white': toon('white', '#f6f3ec', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'dome': toon('dome', '#3f9a6a', shadow_mul=(0.72, 0.82, 0.84)),
    'roof': toon('roof', '#6a7a86', shadow_mul=(0.78, 0.8, 0.86)),
    'window': flat('window', '#3a3640'),
    'house': toon('house', '#e8e0c8', shadow_mul=(0.82, 0.8, 0.84)),
    'houseRoof': toon('houseRoof', '#8f4a3a'),
    'tree': toon('tree', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['grass'])
before = set(bpy.data.objects)
rng = random.Random(523)

# ---------- the Răut looping round the promontory ----------
LOOP_C = (0.05, 0.25)
LOOP_R = (0.78, 0.6)
path = [(-1.25, -0.5)]
for k in range(25):
    t = math.radians(200 - k * 220 / 24)
    path.append((LOOP_C[0] + LOOP_R[0] * math.cos(t), LOOP_C[1] + LOOP_R[1] * math.sin(t)))
path.append((1.22, -0.45))
bm = bmesh.new()
left, right = [], []
for k, (x, y) in enumerate(path):
    (xa, ya), (xb, yb) = path[max(0, k - 1)], path[min(len(path) - 1, k + 1)]
    d = math.hypot(xb - xa, yb - ya) or 1
    px, py = -(yb - ya) / d, (xb - xa) / d
    left.append(bm.verts.new((x + px * 0.09, y + py * 0.09, G + 0.006)))
    right.append(bm.verts.new((x - px * 0.09, y - py * 0.09, G + 0.006)))
for k in range(len(path) - 1):
    bm.faces.new((left[k], right[k], right[k + 1], left[k + 1]))
finish('river', bm, M['river'], outline=0.012)

# ---------- the promontory inside the loop: cliffs of limestone, grass on top ----------
PC = (0.05, 0.18)
SIDES = 22
outline = [(PC[0] + 0.62 * math.cos(2 * math.pi * k / SIDES) * (1 + rng.uniform(-0.05, 0.05)),
            PC[1] + 0.42 * math.sin(2 * math.pi * k / SIDES) * (1 + rng.uniform(-0.05, 0.05))) for k in range(SIDES)]
H = 0.42


def tilt(y):
    """The top rises a little towards the back of the promontory."""
    return 0.08 * (y - PC[1]) / 0.42


def scaled(sc, z, jitter=0.0):
    return [(PC[0] + (x - PC[0]) * sc * (1 + rng.uniform(-jitter, jitter)), PC[1] + (y - PC[1]) * sc * (1 + rng.uniform(-jitter, jitter)), G + z + (tilt(y) if z > 0.2 else 0))
            for x, y in outline]


cliff = loft('cliff', M['lime'], [scaled(1.0, -0.01), scaled(0.985, H * 0.45, 0.04), scaled(0.94, H, 0.02)], outline=0.03)
cliff.visible_shadow = False
top = loft('top', M['top'], [[(x, y, z - 0.005) for x, y, z in scaled(0.94, H)], [(x, y, z + 0.03) for x, y, z in scaled(0.9, H)]], outline=0.016)
top.visible_shadow = False
# shrubs clinging to the cliff and its foot
for k in range(9):
    t = 2 * math.pi * k / 9 + 0.3
    z = rng.uniform(0.0, 0.25)
    sc = 1.0 - 0.06 * z / H + 0.02
    ball(f'cliffshrub{k}', M['tree'], PC[0] + 0.62 * sc * math.cos(t), PC[1] + 0.42 * sc * math.sin(t), G + z + 0.03, rng.uniform(0.04, 0.06), outline=0.01)
for k, z in enumerate((0.12, 0.26)):
    for j in range(SIDES // 2 + 1, SIDES):
        (x0, y0), (x1, y1) = outline[j], outline[(j + 1) % SIDES]
        s = 1 - 0.06 * z / H
        bar(f'stratum{k}{j}', M['limeDark'], (PC[0] + (x0 - PC[0]) * s, PC[1] + (y0 - PC[1]) * s - 0.006, G + z), (PC[0] + (x1 - PC[0]) * s, PC[1] + (y1 - PC[1]) * s - 0.006, G + z),
            0.014, outline=0)

# ---------- the cave monastery in the front cliff, its balcony ----------
for k, (a, z, w, h) in enumerate(((250, 0.12, 0.08, 0.1), (270, 0.18, 0.06, 0.08), (290, 0.1, 0.07, 0.09), (262, 0.3, 0.05, 0.06))):
    t = math.radians(a)
    s = 1 - 0.06 * (z + h / 2) / H
    x, y = PC[0] + 0.62 * s * math.cos(t), PC[1] + 0.42 * s * math.sin(t)
    box(f'cave{k}', M['cave'], x, y - 0.012, G + z, w, 0.012, h, rot_z=t + math.pi / 2, outline=0, bevel=0)
t = math.radians(270)
bx, by = PC[0] + 0.62 * math.cos(t), PC[1] + 0.42 * math.sin(t)
box('balcony', M['wood'], bx, by - 0.04, G + 0.17, 0.12, 0.06, 0.012, outline=0.005, bevel=0)
box('balconyrail', M['wood'], bx, by - 0.068, G + 0.182, 0.12, 0.006, 0.03, outline=0, bevel=0)
# the stone cross at the cliff's edge
CRX, CRY = PC[0] + 0.15, PC[1] - 0.3
rod('crosspost', M['limeDark'], (CRX, CRY, G + H + 0.03 + tilt(CRY)), (CRX, CRY, G + H + 0.18 + tilt(CRY)), 0.012, segs=6, outline=0.005)
box('crossbar', M['limeDark'], CRX, CRY, G + H + 0.14 + tilt(CRY), 0.08, 0.018, 0.018, outline=0.004, bevel=0)

# ---------- the church of the Ascension on top ----------
CX, CY = PC[0] - 0.15, PC[1] + 0.08
T = G + H + 0.03 + tilt(CY)
box('church', M['white'], CX, CY, T - 0.005, 0.3, 0.16, 0.14, outline=0.016, bevel=0)
loft('churchroof', M['roof'], [[(CX - 0.16, CY - 0.09, T + 0.135), (CX + 0.16, CY - 0.09, T + 0.135), (CX + 0.16, CY + 0.09, T + 0.135), (CX - 0.16, CY + 0.09, T + 0.135)],
                               [(CX - 0.14, CY - 0.004, T + 0.2), (CX + 0.14, CY - 0.004, T + 0.2), (CX + 0.14, CY + 0.004, T + 0.2), (CX - 0.14, CY + 0.004, T + 0.2)]],
     outline=0.01)
lathe('drum', M['white'], ((0.04, 0), (0.04, 0.06)), T + 0.17, CX + 0.05, CY, segs=12, outline=0.008)
lathe('churchdome', M['dome'], ((0.045, 0), (0.05, 0.03), (0.03, 0.06), (0.004, 0.08)), T + 0.23, CX + 0.05, CY, segs=14, outline=0.008)
box('belltower', M['white'], CX - 0.18, CY, T - 0.005, 0.08, 0.08, 0.26, outline=0.012, bevel=0)
box('belfry', M['window'], CX - 0.18, CY - 0.042, T + 0.17, 0.03, 0.01, 0.05, outline=0, bevel=0)
lathe('belldome', M['dome'], ((0.05, 0), (0.05, 0.03), (0.03, 0.06), (0.004, 0.09)), T + 0.255, CX - 0.18, CY, segs=14, outline=0.008)
for k, z in enumerate((T + 0.345, T + 0.31)):
    rod(f'churchcross{k}', M['gold'], (CX - 0.18 if k == 0 else CX + 0.05, CY, z), (CX - 0.18 if k == 0 else CX + 0.05, CY, z + 0.05), 0.004, segs=6, outline=0)
for k in range(3):
    box(f'churchwin{k}', M['window'], CX - 0.08 + k * 0.08, CY - 0.082, T + 0.05, 0.022, 0.01, 0.05, outline=0, bevel=0)

# ---------- the village and its fields round the bend ----------
for k, (x, y) in enumerate(((-0.85, 0.75), (-0.6, 0.95), (0.95, 0.65), (0.75, 0.95), (-1.05, 0.35))):
    box(f'house{k}', M['house'], x, y, G - 0.005, 0.13, 0.1, 0.09, outline=0.01, bevel=0)
    pyramid(f'houseroof{k}', M['houseRoof'], x, y, G + 0.085, 0.15, 0.07, outline=0.008)
for k, (x, y, w, d) in enumerate(((-0.3, -0.85, 0.5, 0.25), (0.45, -0.85, 0.45, 0.22), (-0.85, -0.85, 0.3, 0.2))):
    box(f'field{k}', M['field'], x, y, G - 0.005, w, d, 0.012, outline=0.006, bevel=0)
for k, (x, y) in enumerate(((1.05, 0.2), (-1.1, 0.0), (0.2, 1.1), (-0.25, 1.1))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.12, 0.1, outline=0.016)

turn(before, -20)
render(G)
