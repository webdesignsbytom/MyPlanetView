# A cartoon Castel Sant'Angelo for the country maps, built in the set's shared look (../toon.py):
# Hadrian's great round mausoleum on the Tiber, its massive drum on the square base with the bastions
# at its corners, the papal apartments stacked on top and the bronze Archangel Michael sheathing his
# sword on the summit, and the Ponte Sant'Angelo leading to it over the river with its rows of white
# angels. Turned a little towards the camera.
# Run: blender -b --factory-startup -P castel-sant-angelo.py -- castel-sant-angelo-1024.png 1024 castel-sant-angelo.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d0c4ae', shadow_mul=(0.82, 0.8, 0.86), lift=0.2),
    'river': toon('river', '#6a9a8a', shadow_mul=(0.8, 0.88, 0.86), lift=0.3),
    'brick': toon('brick', '#c89a6a', shadow_mul=(0.86, 0.8, 0.76), lift=0.08),
    'stone': toon('stone', '#e0d4b8', shadow_mul=(0.86, 0.82, 0.8), lift=0.12),
    'stoneDark': toon('stoneDark', '#bba886'),
    'ochre': toon('ochre', '#e0b070', lift=0.1),
    'roof': toon('roof', '#c4603e'),
    'bronze': toon('bronze', '#4a7a6a', lift=0.12),
    'marble': toon('marble', '#f6f4ee', lift=0.2),
    'dark': flat('dark', '#2e2a26'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['paving'])
before = set(bpy.data.objects)


def strip(y0, y1, r, z, n=6):
    """The band of the tile's disc between y0 and y1 (counter-clockwise from above)."""
    xa0, xa1 = math.sqrt(r * r - y0 * y0), math.sqrt(r * r - y1 * y1)
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    pts = [(-xa0, y0), (xa0, y0)]
    pts += [(r * math.cos(a0 + (a1 - a0) * k / n), r * math.sin(a0 + (a1 - a0) * k / n)) for k in range(1, n)]
    pts += [(xa1, y1), (-xa1, y1)]
    pts += [(r * math.cos(math.pi - a1 + (a1 - a0) * k / n), r * math.sin(math.pi - a1 + (a1 - a0) * k / n)) for k in range(1, n)]
    return [(x, y, G + z) for x, y in pts]


# the Tiber across the front of the tile, the castle on its far bank
loft('tiber', M['river'], [strip(-0.95, -0.4, 1.42, -0.004), strip(-0.95, -0.4, 1.42, 0.004)], outline=0)

# ---------- the castle ----------
CX, CY = 0.0, 0.32
box('base', M['brick'], CX, CY, G - 0.005, 0.9, 0.9, 0.12, outline=0.008, bevel=0)
for sx in (-1, 1):
    for sy in (-1, 1):
        bx, by = CX + sx * 0.45, CY + sy * 0.45
        lathe(f'bastion{sx}{sy}', M['brick'], ((0.11, 0), (0.1, 0.15)), G - 0.005, bx, by, segs=4, outline=0.005, smooth=False)
        lathe(f'bastioncap{sx}{sy}', M['stoneDark'], ((0.11, 0), (0.11, 0.012)), G + 0.14, bx, by, segs=4, outline=0.001, smooth=False)
lathe('drum', M['stone'], ((0.36, 0), (0.35, 0.3)), G + 0.11, CX, CY, segs=40, outline=0.009)
lathe('drumband', M['stoneDark'], ((0.355, 0), (0.355, 0.02)), G + 0.38, CX, CY, segs=40, outline=0.002)
for k in range(10):
    a = 2 * math.pi * k / 10
    if math.sin(a) > 0.3:
        continue
    box(f'drumwin{k}', M['dark'], CX + 0.352 * math.cos(a), CY + 0.352 * math.sin(a), G + 0.25, 0.03, 0.03, 0.04, rot_z=a + math.pi / 2, outline=0, bevel=0)
# the papal apartments on the drum's top
box('apartments', M['ochre'], CX - 0.02, CY + 0.04, G + 0.4, 0.4, 0.34, 0.12, outline=0.006, bevel=0)
for j in range(5):
    box(f'aptwin{j}', M['dark'], CX - 0.18 + j * 0.08, CY + 0.04 - 0.173, G + 0.44, 0.03, 0.006, 0.05, outline=0, bevel=0)
loft('aptroof', M['roof'], [[(CX - 0.22, CY - 0.13, G + 0.515), (CX + 0.18, CY - 0.13, G + 0.515), (CX + 0.18, CY + 0.21, G + 0.515), (CX - 0.22, CY + 0.21, G + 0.515)],
                            [(CX - 0.22, CY + 0.03, G + 0.58), (CX + 0.18, CY + 0.03, G + 0.58), (CX + 0.18, CY + 0.05, G + 0.58), (CX - 0.22, CY + 0.05, G + 0.58)]], outline=0.004)
box('angelterrace', M['ochre'], CX + 0.08, CY + 0.06, G + 0.4, 0.14, 0.14, 0.24, outline=0.005, bevel=0)
# the Archangel Michael, wings spread, on the summit
AX, AY, AZ = CX + 0.08, CY + 0.06, G + 0.64
lathe('angelplinth', M['stoneDark'], ((0.04, 0), (0.035, 0.04)), AZ - 0.005, AX, AY, segs=8, outline=0.002, smooth=False)
rod('angel', M['bronze'], (AX, AY, AZ + 0.035), (AX, AY, AZ + 0.14), 0.022, r2=0.014, segs=8, outline=0.003)
ball('angelhead', M['bronze'], AX, AY, AZ + 0.155, 0.014, outline=0.002)
for s in (-1, 1):
    loft(f'angelwing{s}', M['bronze'], [[(AX + s * 0.01, AY + 0.01, AZ + 0.08), (AX + s * 0.01, AY + 0.025, AZ + 0.08), (AX + s * 0.01, AY + 0.025, AZ + 0.15), (AX + s * 0.01, AY + 0.01, AZ + 0.15)],
                                        [(AX + s * 0.08, AY + 0.04, AZ + 0.15), (AX + s * 0.08, AY + 0.05, AZ + 0.15), (AX + s * 0.08, AY + 0.05, AZ + 0.22), (AX + s * 0.08, AY + 0.04, AZ + 0.22)]], outline=0.002)
bar('sword', M['bronze'], (AX + 0.02, AY - 0.01, AZ + 0.12), (AX + 0.04, AY - 0.02, AZ + 0.07), 0.006, outline=0)

# ---------- the Ponte Sant'Angelo over the Tiber ----------
BX = CX
DZ = G + 0.06
box('bridgedeck', M['stone'], BX, -0.67, DZ - 0.02, 0.18, 0.74, 0.04, outline=0.005, bevel=0)
for k in range(5):
    y = -0.93 + k * 0.13
    box(f'bridgepier{k}', M['stoneDark'], BX, y, G - 0.005, 0.18, 0.04, DZ - G - 0.01, outline=0.003, bevel=0)
for s in (-1, 1):
    bar(f'parapet{s}', M['stone'], (BX + s * 0.085, -1.03, DZ + 0.03), (BX + s * 0.085, -0.31, DZ + 0.03), 0.02, outline=0.002)
    for k in range(5):
        y = -0.95 + k * 0.15
        box(f'angelplinthb{s}{k}', M['stone'], BX + s * 0.085, y, DZ + 0.02, 0.03, 0.03, 0.04, outline=0.001, bevel=0)
        rod(f'bridgeangel{s}{k}', M['marble'], (BX + s * 0.085, y, DZ + 0.06), (BX + s * 0.085, y, DZ + 0.13), 0.012, r2=0.008, segs=6, outline=0.002)
        ball(f'bridgeangelhead{s}{k}', M['marble'], BX + s * 0.085, y, DZ + 0.14, 0.008, outline=0.001)
        bar(f'bridgeangelwing{s}{k}', M['marble'], (BX + s * 0.085, y + 0.006, DZ + 0.11), (BX + s * 0.085, y + 0.03, DZ + 0.15), 0.01, outline=0)
for k, (x, y) in enumerate(((-0.8, -0.2), (0.8, -0.2), (-0.65, 0.95), (0.65, 0.95))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.13, 0.11, outline=0.012)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
