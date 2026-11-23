# A cartoon Saint Sophia Cathedral (Kyiv) for the country maps, built in the set's shared look
# (../toon.py): the white cathedral under its pale green roofs, its curving Baroque gables, the
# apses at the back, the great golden dome in the middle and the smaller golden domes round it on
# their drums, and in front the tiered sky-blue bell tower with its white columns and gold dome.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P saint-sophia.py -- saint-sophia-1024.png 1024 saint-sophia.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#ddd3c0', lift=0.25),
    'white': toon('white', '#f6f3ec', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'roof': toon('roof', '#7fb89a', shadow_mul=(0.72, 0.82, 0.84)),
    'blue': toon('blue', '#7fb0d8', shadow_mul=(0.74, 0.78, 0.88)),
    'window': flat('window', '#3f4a5a'),
    'tree': toon('tree', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'lawn': toon('lawn', '#7cc061', lift=0.25),
})

G = tile()
before = set(bpy.data.objects)


def slab(name, mat, pts, y0, y1, outline=0.0):
    return loft(name, mat, [[(px, y0, pz) for px, pz in pts], [(px, y1, pz) for px, pz in pts]], outline=outline)


def onion(name, x, y, z, r, mat='gold'):
    """An onion dome on its drum, with a cross."""
    lathe(f'{name}drum', M['white'], ((r * 0.8, 0), (r * 0.8, r * 1.1)), z, x, y, segs=16, outline=0.012)
    lathe(f'{name}band', M['roof'], ((r * 0.86, 0), (r * 0.86, r * 0.2)), z + r * 1.1, x, y, segs=16, outline=0.008)
    lathe(f'{name}dome', M[mat], ((r * 0.86, 0), (r * 1.12, r * 0.45), (r * 1.0, r * 0.95), (r * 0.5, r * 1.4), (r * 0.12, r * 1.7), (0.003, r * 1.85)),
          z + r * 1.3, x, y, segs=20, outline=0.012)
    rod(f'{name}cross', M['gold'], (x, y, z + r * 3.15), (x, y, z + r * 3.15 + 0.05), 0.005, segs=6, outline=0)


def baroque_gable(name, x, y, z, w, h):
    """A curving Baroque gable on a front face (y), white with a window."""
    side = [(w / 2 * (1 - 0.35 * math.sin(math.pi * t) - 0.55 * t), h * t) for t in (k / 8 for k in range(1, 8))]
    pts = [(-w / 2, 0), (w / 2, 0)] + side + [(0, h)] + [(-sx, sz) for sx, sz in reversed(side)]
    slab(name, M['white'], [(x + px, z + pz) for px, pz in pts], y - 0.03, y + 0.02, outline=0.012)
    box(f'{name}win', M['window'], x, y - 0.034, z + h * 0.3, 0.035, 0.01, 0.06, outline=0, bevel=0)


# ---------- the paved square, lawns and chestnut trees ----------
box('square', M['paving'], 0, 0.05, G - 0.005, 2.0, 1.6, 0.012, outline=0.01, bevel=0)
for k, (x, y) in enumerate(((-1.05, 0.45), (1.05, 0.35), (0.85, -0.75), (-1.0, -0.15))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.16, 0.12, outline=0.02)

# ---------- the cathedral ----------
CX, CY, W, D, H = 0.15, 0.32, 0.9, 0.62, 0.3
FY = CY - D / 2
box('cathedral', M['white'], CX, CY, G - 0.005, W, D, H, outline=0.026, bevel=0.003)
loft('roof', M['roof'], [[(CX - W / 2 - 0.02, CY - D / 2 - 0.02, G + H), (CX + W / 2 + 0.02, CY - D / 2 - 0.02, G + H),
                          (CX + W / 2 + 0.02, CY + D / 2 + 0.02, G + H), (CX - W / 2 - 0.02, CY + D / 2 + 0.02, G + H)],
                         [(CX - W / 2 + 0.1, CY - D / 2 + 0.1, G + H + 0.08), (CX + W / 2 - 0.1, CY - D / 2 + 0.1, G + H + 0.08),
                          (CX + W / 2 - 0.1, CY + D / 2 - 0.1, G + H + 0.08), (CX - W / 2 + 0.1, CY + D / 2 - 0.1, G + H + 0.08)]], outline=0.018)
for k in range(5):
    x = CX - W / 2 + 0.1 + k * (W - 0.2) / 4
    baroque_gable(f'gable{k}', x, FY, G + H - 0.01, 0.15, 0.14)
    for row, z in enumerate((0.06, 0.17)):
        box(f'win{k}{row}', M['window'], x, FY - 0.004, G + z, 0.035, 0.01, 0.07, outline=0, bevel=0)
box('door', M['window'], CX, FY - 0.004, G, 0.08, 0.01, 0.12, outline=0, bevel=0)
for k, dx in enumerate((-0.25, 0.0, 0.25)):
    lathe(f'apse{k}', M['white'], ((0.1 if k == 1 else 0.08, 0), (0.1 if k == 1 else 0.08, H - 0.04)), G - 0.005, CX + dx, CY + D / 2, segs=16, outline=0.016)
    lathe(f'apseroof{k}', M['roof'], ((0.11 if k == 1 else 0.09, 0), (0.004, 0.06)), G + H - 0.045, CX + dx, CY + D / 2, segs=16, outline=0.012)
# the golden domes: the great one in the middle, the others round it
DZ = G + H + 0.06
onion('centre', CX, CY, DZ, 0.11)
for k, (dx, dy) in enumerate(((-0.2, -0.14), (0.2, -0.14), (-0.2, 0.14), (0.2, 0.14))):
    onion(f'mid{k}', CX + dx, CY + dy, DZ - 0.03, 0.07)
for k, (dx, dy) in enumerate(((-0.36, 0.0), (0.36, 0.0), (0.0, -0.22), (-0.36, -0.2), (0.36, -0.2))):
    onion(f'small{k}', CX + dx, CY + dy, DZ - 0.05, 0.045)

# ---------- the bell tower in front ----------
BX, BY = -0.6, -0.5
z = G - 0.005
for k, (w, h) in enumerate(((0.28, 0.3), (0.23, 0.22), (0.18, 0.18))):
    box(f'bell{k}', M['blue'], BX, BY, z, w, w, h, outline=0.02, bevel=0.002)
    box(f'bellcornice{k}', M['white'], BX, BY, z + h - 0.02, w + 0.02, w + 0.02, 0.025, outline=0.01, bevel=0)
    for sx in (-1, 1):
        for sy in (-1, 1):
            rod(f'bellcol{k}{sx}{sy}', M['white'], (BX + sx * (w / 2 + 0.004), BY + sy * (w / 2 + 0.004), z), (BX + sx * (w / 2 + 0.004), BY + sy * (w / 2 + 0.004), z + h - 0.02),
                0.012, segs=8, outline=0.004)
    box(f'bellarch{k}', M['window'] if k else M['white'], BX, BY - w / 2 - 0.004, z + h * 0.2, w * 0.35, 0.01, h * 0.55, outline=0, bevel=0)
    z += h
lathe('belldrum', M['blue'], ((0.08, 0), (0.08, 0.08)), z, BX, BY, segs=16, outline=0.012)
onion('belldome', BX, BY, z + 0.05, 0.075)

turn(before, -20)
render(G)
