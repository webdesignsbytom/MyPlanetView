# A cartoon Command Ridge for the country maps, built in the set's shared look (../toon.py): the
# high point of Nauru, the little island in the Pacific, its ridge rising over the field of grey
# coral pinnacles the phosphate mining left, the two rusting Japanese guns of the war on top, scrub
# and palms, the ring road and the coast all round. Turned a little towards the camera.
# Run: blender -b --factory-startup -P command-ridge.py -- command-ridge-1024.png 1024 command-ridge.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#2f8fc8', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'reef': toon('reef', '#7fd0d0', shadow_mul=(0.76, 0.86, 0.9), lift=0.3),
    'sand': toon('sand', '#f2e6c8', shadow_mul=(0.82, 0.8, 0.86), lift=0.2),
    'land': toon('land', '#8cb85a', shadow_mul=(0.72, 0.78, 0.78), lift=0.25),
    'road': toon('road', '#6a6670', shadow_mul=(0.82, 0.82, 0.9)),
    'pinnacle': toon('pinnacle', '#b8b4aa', shadow_mul=(0.8, 0.8, 0.88)),
    'ridge': toon('ridge', '#6a9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'rust': toon('rust', '#8a4a30'),
    'concrete': toon('concrete', '#a8a49a', shadow_mul=(0.8, 0.8, 0.88)),
    'scrub': toon('scrub', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
})

G = tile(M['sea'])
before = set(bpy.data.objects)
rng = random.Random(881)

# ---------- the island: reef, beach, the ring road and the green coastal strip ----------
for k, (r, mat, z0, z1) in enumerate(((1.3, 'reef', -0.005, 0.002), (1.14, 'sand', -0.01, 0.025), (1.06, 'land', 0.015, 0.035), (0.98, 'road', 0.03, 0.04),
                                     (0.93, 'land', 0.03, 0.05))):
    pts = [(r * math.cos(t), r * 0.92 * math.sin(t)) for t in (2 * math.pi * j / 40 for j in range(40))]
    piece = loft(f'ring{k}', M[mat], [[(x, y, G + z0) for x, y in pts], [(x, y, G + z1) for x, y in pts]], outline=0.006 if k else 0)
    piece.visible_shadow = False
LZ = G + 0.05

# ---------- the coral pinnacles of the mined plateau ----------
for k in range(46):
    a = rng.uniform(0, 2 * math.pi)
    r = rng.uniform(0.25, 0.82)
    x, y = r * math.cos(a), r * 0.92 * math.sin(a)
    if abs(x - 0.0) < 0.45 and abs(y - 0.12) < 0.2:
        continue
    h = rng.uniform(0.06, 0.16)
    rad = rng.uniform(0.03, 0.05)
    lathe(f'pinnacle{k}', M['pinnacle'], ((rad, 0), (rad * 0.8, h * 0.6), (0.004, h)), LZ - 0.005, x, y, segs=7, outline=0.006, smooth=False)

# ---------- Command Ridge and its guns ----------
rg = loft('ridge', M['ridge'], [[(0.0 + 0.48 * math.cos(t), 0.12 + 0.2 * math.sin(t), LZ - 0.01) for t in (2 * math.pi * j / 20 for j in range(20))],
                                [(0.0 + 0.3 * math.cos(t), 0.12 + 0.11 * math.sin(t), LZ + 0.16) for t in (2 * math.pi * j / 20 for j in range(20))],
                                [(0.0 + 0.2 * math.cos(t), 0.12 + 0.07 * math.sin(t), LZ + 0.19) for t in (2 * math.pi * j / 20 for j in range(20))]], outline=0.018, smooth=True)
rg.visible_shadow = False
RZ = LZ + 0.19
for k, (x, a) in enumerate(((-0.1, -0.6), (0.12, -1.2))):
    cyl(f'gunmount{k}', M['concrete'], 0.06, 0.03, segs=14, outline=0.006, matrix=Matrix.Translation((x, 0.12, RZ + 0.01)))
    box(f'gunshield{k}', M['rust'], x, 0.12, RZ + 0.025, 0.07, 0.06, 0.05, rot_z=a + math.pi / 2, outline=0.006, bevel=0.01)
    rod(f'gunbarrel{k}', M['rust'], (x, 0.12, RZ + 0.05), (x + 0.16 * math.cos(a), 0.12 + 0.16 * math.sin(a), RZ + 0.09), 0.012, r2=0.01, segs=8, outline=0.003)

# ---------- scrub and palms ----------
for k in range(10):
    a = rng.uniform(0, 2 * math.pi)
    r = rng.uniform(0.3, 0.8)
    ball(f'scrub{k}', M['scrub'], r * math.cos(a), r * 0.92 * math.sin(a), LZ + 0.02, rng.uniform(0.04, 0.06), outline=0.008)
for k in range(9):
    a = 2 * math.pi * k / 9 + 0.3
    x, y = 1.02 * math.cos(a), 1.02 * 0.92 * math.sin(a)
    h = rng.uniform(0.2, 0.26)
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G + 0.035), (x + 0.03, y, G + 0.035 + h), 0.012, r2=0.009, segs=8, outline=0.005)
    for f in range(6):
        b = 2 * math.pi * f / 6 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.03, y, G + 0.035 + h), (x + 0.03 + 0.085 * math.cos(b), y + 0.085 * math.sin(b), G + h - 0.01), 0.017, outline=0.004)

turn(before, -20)
render(G)
