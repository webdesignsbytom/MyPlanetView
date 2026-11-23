# A cartoon Cristo Rei of Dili for the country maps, built in the set's shared look (../toon.py):
# the statue of Christ with open arms standing on a globe at the tip of Cape Fatucama, the white
# stairway climbing the green cape to it, the beach at its foot, and the bay looking back to Dili.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P cristo-rei-dili.py -- cristo-rei-dili-1024.png 1024 cristo-rei-dili.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#2a8ac0', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'shallow': toon('shallow', '#4cc0cc', shadow_mul=(0.74, 0.84, 0.88), lift=0.35),
    'sand': toon('sand', '#f2e6c8', shadow_mul=(0.82, 0.8, 0.88), lift=0.2),
    'cape': toon('cape', '#7aa84a', shadow_mul=(0.7, 0.78, 0.8)),
    'scrub': toon('scrub', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'rock': toon('rock', '#9a8a74', shadow_mul=(0.82, 0.8, 0.86)),
    'stairs': toon('stairs', '#f2efe8', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'plinth': toon('plinth', '#e8e4dc', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'globe': toon('globe', '#a8b8c0', shadow_mul=(0.8, 0.82, 0.9)),
    'bronze': toon('bronze', '#7a6a54', shadow_mul=(0.82, 0.78, 0.76)),
    'town': toon('town', '#f2efe8', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'roof': toon('roof', '#c4573a'),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
})

G = tile(M['sea'])
before = set(bpy.data.objects)
rng = random.Random(1193)


def ring(cx, cy, rx, ry, z, k, sides=22):
    return [(cx + rx * math.cos(t) * (1 + 0.06 * math.sin(3 * t + k)), cy + ry * math.sin(t) * (1 + 0.06 * math.cos(2 * t + k)), G + z) for t in (2 * math.pi * j / sides for j in range(sides))]


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


# ---------- the bay and Dili's shore far behind ----------
flat_face('shore', M['sand'], [(1.41 * math.cos(math.radians(a)), 1.41 * math.sin(math.radians(a))) for a in range(100, 176, 4)], G + 0.003, outline=0.008)
for k in range(5):
    a = math.radians(118 + k * 12)
    x, y = 1.28 * math.cos(a), 1.28 * math.sin(a)
    box(f'town{k}', M['town'], x, y, G - 0.005, 0.12, 0.1, 0.08, rot_z=a, outline=0.007, bevel=0)
    pyramid(f'townroof{k}', M['roof'], x, y, G + 0.075, 0.13, 0.04, outline=0.005)

# ---------- Cape Fatucama: a green headland, shallows round its foot ----------
CX, CY = 0.3, 0.15
flat_face('shallows', M['shallow'], [(p[0], p[1]) for p in ring(CX, CY, 0.95, 0.75, 0, 1)], G + 0.004, outline=0.006)
beach = loft('beach', M['sand'], [ring(CX, CY, 0.84, 0.66, -0.01, 1), ring(CX, CY, 0.8, 0.62, 0.03, 1)], outline=0.012, smooth=True)
beach.visible_shadow = False
cape = loft('cape', M['cape'], [ring(CX + 0.05, CY + 0.05, 0.74, 0.56, 0.02, 2), ring(CX + 0.08, CY + 0.08, 0.42, 0.32, 0.3, 2), ring(CX + 0.1, CY + 0.1, 0.18, 0.14, 0.42, 2)],
            outline=0.016, smooth=True)
cape.visible_shadow = False
for k in range(14):
    a = 2 * math.pi * k / 14
    r = rng.uniform(0.45, 0.62)
    x, y = CX + 0.05 + r * math.cos(a), CY + 0.05 + r * 0.76 * math.sin(a)
    if -2.1 < a - math.pi < -0.6:
        continue
    ball(f'scrub{k}', M['scrub'], x, y, G + 0.1, rng.uniform(0.05, 0.07), outline=0.01)
for k, (x, y) in enumerate(((CX - 0.75, CY - 0.1), (CX + 0.85, CY - 0.05))):
    ball(f'rock{k}', M['rock'], x, y, G + 0.02, 0.06, outline=0.01)

# ---------- the stairway zigzagging up the front of the cape ----------
TX, TY, TZ = CX + 0.1, CY + 0.1, G + 0.42
ZIG = [(CX - 0.1, CY - 0.6, 0.03), (CX + 0.15, CY - 0.48, 0.12), (CX - 0.05, CY - 0.33, 0.22), (CX + 0.12, CY - 0.2, 0.31), (TX, TY - 0.08, 0.41)]
for k in range(len(ZIG) - 1):
    (x0, y0, z0), (x1, y1, z1) = ZIG[k], ZIG[k + 1]
    bar(f'stairs{k}', M['stairs'], (x0, y0, G + z0 + 0.01), (x1, y1, G + z1 + 0.01), 0.04, outline=0.004)

# ---------- the statue on its globe ----------
cyl('platform', M['plinth'], 0.16, 0.02, segs=20, outline=0.008, matrix=Matrix.Translation((TX, TY, TZ - 0.01)))
lathe('plinth', M['plinth'], ((0.06, 0), (0.05, 0.06), (0.035, 0.08)), TZ + 0.005, TX, TY, segs=14, outline=0.008)
ball('globe', M['globe'], TX, TY, TZ + 0.13, 0.065, outline=0.01)
lathe('globeband', M['plinth'], ((0.067, 0), (0.067, 0.012)), TZ + 0.124, TX, TY, segs=18, outline=0.002)
SZ, K = TZ + 0.185, 1.5
lathe('robe', M['bronze'], tuple((r * K, h * K) for r, h in ((0.045, 0), (0.042, 0.06), (0.034, 0.14), (0.028, 0.2), (0.014, 0.23))), SZ, TX, TY, segs=14, outline=0.01)
ball('head', M['bronze'], TX, TY, SZ + 0.25 * K, 0.024 * K, outline=0.006)
for side in (-1, 1):
    bar(f'arm{side}', M['bronze'], (TX + side * 0.02 * K, TY, SZ + 0.19 * K), (TX + side * 0.13 * K, TY - 0.01, SZ + 0.21 * K), 0.024 * K, outline=0.006)
    ball(f'hand{side}', M['bronze'], TX + side * 0.14 * K, TY - 0.01, SZ + 0.212 * K, 0.014 * K, outline=0.003)

# ---------- palms along the beach ----------
for k, (x, y) in enumerate(((CX - 0.65, CY - 0.35), (CX + 0.7, CY - 0.4), (CX - 0.7, CY + 0.25))):
    hgt = 0.26
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G + 0.02), (x + 0.03, y, G + hgt), 0.012, r2=0.009, segs=8, outline=0.004)
    for f in range(6):
        b = 2 * math.pi * f / 6 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.03, y, G + hgt), (x + 0.03 + 0.09 * math.cos(b), y + 0.09 * math.sin(b), G + hgt - 0.045), 0.017, outline=0.004)

turn(before, -20)
render(G)
