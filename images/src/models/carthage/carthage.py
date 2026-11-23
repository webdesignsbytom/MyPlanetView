# A cartoon Carthage for the country maps, built in the set's shared look (../toon.py): the
# Antonine Baths by the Gulf of Tunis, their brick walls and broken vaults, the one great grey
# granite column raised again with its white marble capital, fallen column drums, palms, and the
# sea behind. Turned a little towards the camera.
# Run: blender -b --factory-startup -P carthage.py -- carthage-1024.png 1024 carthage.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#d8c08a', shadow_mul=(0.86, 0.8, 0.74), lift=0.2),
    'grass': toon('grass2', '#9ab860', shadow_mul=(0.74, 0.8, 0.74)),
    'sea': toon('sea', '#2f7ab8', lift=0.3),
    'brick': toon('brick', '#b87a5a', shadow_mul=(0.86, 0.78, 0.76)),
    'stone': toon('stone', '#e0d4bc', shadow_mul=(0.84, 0.82, 0.86), lift=0.15),
    'granite': toon('granite', '#8a8890', shadow_mul=(0.84, 0.84, 0.9)),
    'marble': toon('marble', '#f8f6f0', lift=0.2),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(2047)


def segment(c, r, z, n=26):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


loft('sea', M['sea'], [segment(0.75, 1.4, -0.004), segment(0.75, 1.4, 0.004)], outline=0.004)
for k in range(6):
    x, y = rng.uniform(-0.9, 0.9), rng.uniform(-0.9, -0.4)
    lathe(f'grass{k}', M['grass'], ((0.12, 0), (0.12, 0.005)), G - 0.003, x, y, segs=12, outline=0.002)

# ---------- the brick walls and vaults of the baths ----------
for k, (x, y, w, d, h) in enumerate(((-0.7, 0.35, 0.5, 0.06, 0.26), (-0.45, 0.1, 0.06, 0.45, 0.18), (0.55, 0.4, 0.5, 0.06, 0.2), (0.3, 0.15, 0.06, 0.4, 0.14),
                                     (-0.1, 0.5, 0.6, 0.06, 0.12), (0.75, 0.0, 0.06, 0.35, 0.1))):
    box(f'wall{k}', M['brick'], x, y, G - 0.005, w, d, h, outline=0.007, bevel=0)
    for j in range(int(max(w, d) / 0.12)):
        box(f'wallstep{k}{j}', M['brick'], x - (w / 2 - 0.06 - j * 0.12 if w > d else 0), y - (d / 2 - 0.06 - j * 0.12 if d > w else 0), G + h - 0.01, 0.06 if w > d else w, 0.06 if d > w else d, rng.uniform(0.01, 0.06),
            outline=0.003, bevel=0)
# a broken vault: two piers and a half arch
for s in (-1, 1):
    box(f'pier{s}', M['brick'], -0.15 + s * 0.15, 0.25, G - 0.005, 0.08, 0.1, 0.3, outline=0.007, bevel=0)
pts = [(-0.3 + 0.3 * j / 6, 0.25, G + 0.3 + 0.12 * math.sin(math.pi * j / 6)) for j in range(5)]
for j in range(4):
    bar(f'vault{j}', M['brick'], pts[j], pts[j + 1], 0.07, outline=0.005)

# ---------- the great column and its capital ----------
CX, CY = 0.15, -0.15
box('columnbase', M['stone'], CX, CY, G - 0.005, 0.16, 0.16, 0.06, outline=0.006, bevel=0)
rod('column', M['granite'], (CX, CY, G + 0.055), (CX, CY, G + 0.72), 0.05, r2=0.044, segs=16, outline=0.007)
lathe('capital', M['marble'], ((0.05, 0), (0.07, 0.05), (0.09, 0.09)), G + 0.72, CX, CY, segs=10, outline=0.006, smooth=False)
box('abacus', M['marble'], CX, CY, G + 0.805, 0.2, 0.2, 0.035, outline=0.006, bevel=0)
for j in range(8):
    a = 2 * math.pi * j / 8
    ball(f'acanthus{j}', M['marble'], CX + 0.065 * math.cos(a), CY + 0.065 * math.sin(a), G + 0.76, 0.022, outline=0.003)

# ---------- fallen drums and capitals ----------
for k, (x, y, a) in enumerate(((-0.5, -0.35, 0.3), (0.55, -0.45, -0.4), (-0.2, -0.6, 1.2))):
    rod(f'drum{k}', M['granite'], (x - 0.12 * math.cos(a), y - 0.12 * math.sin(a), G + 0.045), (x + 0.12 * math.cos(a), y + 0.12 * math.sin(a), G + 0.045), 0.045, segs=14, outline=0.005)
box('fallencapital', M['marble'], -0.75, -0.1, G - 0.005, 0.14, 0.14, 0.07, rot_z=0.4, outline=0.005, bevel=0)

# ---------- palms ----------
for k, (x, y) in enumerate(((-1.0, 0.1), (1.0, 0.3), (0.85, -0.55))):
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + 0.36), 0.014, r2=0.01, segs=8, outline=0.004)
    for f in range(7):
        b = 2 * math.pi * f / 7 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.02, y, G + 0.36), (x + 0.02 + 0.11 * math.cos(b), y + 0.11 * math.sin(b), G + 0.31), 0.02, outline=0.005)

turn(before, -20)
render(G)
