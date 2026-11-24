# A cartoon Šibenik Cathedral for the country maps, built in the set's shared look (../toon.py): the
# Cathedral of St James on the Dalmatian coast, built all of white stone, even its roofs: the barrel
# vaults of the nave and aisles showing outside, so the front ends in its three-lobed trefoil, the
# rose window and the portal, the dome on its octagonal drum over the crossing and the three apses
# at the east end, on its square above the harbour. Turned a little towards the camera.
# Run: blender -b --factory-startup -P sibenik.py -- sibenik-1024.png 1024 sibenik.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#ddd6c6', shadow_mul=(0.84, 0.84, 0.9), lift=0.2),
    'stone': toon('stone', '#f0ebe0', shadow_mul=(0.8, 0.82, 0.88), lift=0.22),
    'stoneDark': toon('stoneDark', '#d4ccba', lift=0.12),
    'water': toon('water', '#3a92c8', lift=0.3),
    'roof': toon('roof', '#c0643e'),
    'dark': flat('dark', '#2e2a2a'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['paving'])
before = set(bpy.data.objects)


def strip(y0, y1, r, z):
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    right = [(r * math.cos(a0 + (a1 - a0) * k / 12), r * math.sin(a0 + (a1 - a0) * k / 12), z) for k in range(13)]
    left = [(-r * math.cos(a1 + (a0 - a1) * k / 12), r * math.sin(a1 + (a0 - a1) * k / 12), z) for k in range(13)]
    return right + left


def barrel(name, x, y0, y1, z, r):
    """A stone barrel vault along y, its axis at height z."""
    cyl(name, M['stone'], r, y1 - y0, segs=24, outline=0.005, matrix=Matrix.Translation((x, (y0 + y1) / 2, z)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))


# ---------- the harbour in front ----------
loft('harbour', M['water'], [strip(-1.31, -0.78, 1.32, G - 0.004), strip(-1.31, -0.78, 1.32, G + 0.008)], outline=0.002)

# ---------- nave and aisles, their barrel vaults making the trefoil front ----------
CX, Y0, Y1 = 0.05, -0.25, 0.4
NW, AW = 0.24, 0.12
box('nave', M['stone'], CX, (Y0 + Y1) / 2, G - 0.005, NW, Y1 - Y0, 0.3, outline=0.007, bevel=0)
barrel('navevault', CX, Y0, Y1, G + 0.295, NW / 2)
for s in (-1, 1):
    box(f'aisle{s}', M['stone'], CX + s * (NW + AW) / 2, (Y0 + Y1) / 2, G - 0.005, AW, Y1 - Y0, 0.17, outline=0.005, bevel=0)
    barrel(f'aislevault{s}', CX + s * NW / 2, Y0, Y1, G + 0.165, AW)
    for k in range(3):
        box(f'aislewin{s}{k}', M['dark'], CX + s * (NW / 2 + AW) + s * 0.002, Y0 + 0.1 + k * 0.17, G + 0.06, 0.006, 0.03, 0.07, outline=0, bevel=0)
# the front: portal, rose window and the little side windows
box('portal', M['stoneDark'], CX, Y0 - 0.006, G - 0.005, 0.1, 0.012, 0.15, outline=0.002, bevel=0)
box('portaldoor', M['dark'], CX, Y0 - 0.013, G - 0.005, 0.06, 0.006, 0.12, outline=0, bevel=0)
cyl('roseframe', M['stoneDark'], 0.06, 0.012, segs=20, outline=0.002, matrix=Matrix.Translation((CX, Y0 - 0.006, G + 0.27)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
cyl('rose', M['dark'], 0.045, 0.006, segs=20, outline=0, matrix=Matrix.Translation((CX, Y0 - 0.013, G + 0.27)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for k in range(8):
    a = k * math.pi / 4
    bar(f'rosespoke{k}', M['stoneDark'], (CX, Y0 - 0.017, G + 0.27), (CX + 0.045 * math.cos(a), Y0 - 0.017, G + 0.27 + 0.045 * math.sin(a)), 0.006, outline=0)
for s in (-1, 1):
    cyl(f'sidewin{s}', M['dark'], 0.02, 0.006, segs=12, outline=0, matrix=Matrix.Translation((CX + s * (NW + AW) / 2, Y0 - 0.004, G + 0.13)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
# the steps up to the portal
for i in range(3):
    box(f'step{i}', M['stoneDark'], CX, Y0 - 0.04 - i * 0.03, G - 0.005, 0.3 + i * 0.06, 0.03, 0.03 - i * 0.008, outline=0.001, bevel=0)

# ---------- the crossing's dome and the three apses ----------
DY = Y1 + 0.08
box('crossing', M['stone'], CX, DY, G - 0.005, NW + 2 * AW, 0.16, 0.3, outline=0.006, bevel=0)
barrel('transept', CX, DY - 0.08, DY + 0.08, G + 0.295, NW / 2)
lathe('drum', M['stone'], ((0.11, 0), (0.11, 0.13)), G + 0.36, CX, DY, segs=8, outline=0.004, smooth=False)
for k in range(8):
    a = math.pi / 8 + k * math.pi / 4
    box(f'drumwin{k}', M['dark'], CX + 0.103 * math.cos(a), DY + 0.103 * math.sin(a), G + 0.39, 0.03, 0.006, 0.06, rot_z=a + math.pi / 2, outline=0, bevel=0)
lathe('dome', M['stone'], ((0.115, 0), (0.105, 0.05), (0.08, 0.1), (0.04, 0.135), (0.0, 0.145)), G + 0.49, CX, DY, segs=24, outline=0.005)
lathe('domelantern', M['stoneDark'], ((0.025, 0), (0.025, 0.05), (0.003, 0.08)), G + 0.63, CX, DY, segs=8, outline=0.002, smooth=False)
for k, (dx, r) in enumerate(((0.0, 0.12), (-0.18, 0.07), (0.18, 0.07))):
    lathe(f'apse{k}', M['stone'], ((r, 0), (r, 0.22 if k == 0 else 0.14)), G - 0.005, CX + dx, DY + 0.08, segs=16, outline=0.004)
    lathe(f'apseroof{k}', M['stone'], ((r, 0), (r * 0.85, r * 0.45), (0.0, r * 0.6)), G + (0.215 if k == 0 else 0.135), CX + dx, DY + 0.08, segs=16, outline=0.003)

# ---------- the old town's houses round the square ----------
for k, (x, y, w) in enumerate(((-0.72, 0.1, 0.3), (-0.7, -0.38, 0.3), (0.75, 0.05, 0.28), (0.72, -0.4, 0.28), (-0.4, 0.82, 0.34))):
    box(f'house{k}', M['stoneDark'], x, y, G - 0.005, w, 0.2, 0.2, outline=0.005, bevel=0)
    for j in range(2):
        box(f'housewin{k}{j}', M['dark'], x - w / 4 + j * w / 2, y - 0.103, G + 0.1, 0.03, 0.006, 0.05, outline=0, bevel=0)
    loft(f'houseroof{k}', M['roof'], [[(x - w / 2, y - 0.11, G + 0.195), (x + w / 2, y - 0.11, G + 0.195), (x + w / 2, y + 0.11, G + 0.195), (x - w / 2, y + 0.11, G + 0.195)],
                                      [(x - w / 2 + 0.03, y - 0.004, G + 0.27), (x + w / 2 - 0.03, y - 0.004, G + 0.27), (x + w / 2 - 0.03, y + 0.004, G + 0.27), (x - w / 2 + 0.03, y + 0.004, G + 0.27)]], outline=0.004)
for k, (x, y) in enumerate(((0.55, 0.75), (0.95, 0.45), (-1.0, -0.15))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.13, 0.11, outline=0.01)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
