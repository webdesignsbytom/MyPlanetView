# A cartoon Maramureș wooden church for the country maps, built in the set's shared look (../toon.py):
# one of the oak churches of northern Romania, its log walls on a stone plinth, the steep double
# roof of grey shingles with its lower skirt, and at the west end the tower rising through the roof
# to its open gallery and the tall needle spire with four little corner spires; in front the carved
# Maramureș gate with its own shingled roof, and the wooden crosses of the churchyard. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P maramures.py -- maramures-1024.png 1024 maramures.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'logs': toon('logs', '#9a6440'),
    'logsDark': flat('logsDark', '#5e3a22'),
    'shingle': toon('shingle', '#5e5650', shadow_mul=(0.8, 0.8, 0.86)),
    'stone': toon('stone', '#c8c0b0', lift=0.12),
    'wood': toon('wood', '#7a5236'),
    'dark': flat('dark', '#2e2a2a'),
    'metal': toon('metal', '#d0d4da', lift=0.3),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['grass'])
before = set(bpy.data.objects)


def hipped(name, mat, cx, cy, z0, hx0, hy0, z1, hx1, hy1):
    """A shingled roof from an eave ring to a smaller ring above."""
    return loft(name, mat, [[(cx - hx0, cy - hy0, z0), (cx + hx0, cy - hy0, z0), (cx + hx0, cy + hy0, z0), (cx - hx0, cy + hy0, z0)],
                            [(cx - hx1, cy - hy1, z1), (cx + hx1, cy - hy1, z1), (cx + hx1, cy + hy1, z1), (cx - hx1, cy + hy1, z1)]], outline=0.004)


# ---------- the church: log walls on a stone plinth ----------
CX, CY = 0.15, 0.2
W, D = 0.62, 0.26
box('plinth', M['stone'], CX, CY, G - 0.005, W + 0.04, D + 0.04, 0.035, outline=0.003, bevel=0)
box('walls', M['logs'], CX, CY, G + 0.03, W, D, 0.14, outline=0.006, bevel=0)
for k in range(5):
    z = G + 0.05 + k * 0.025
    bar(f'log{k}', M['logsDark'], (CX - W / 2, CY - D / 2 - 0.003, z), (CX + W / 2, CY - D / 2 - 0.003, z), 0.004, outline=0)
for j in range(2):
    box(f'win{j}', M['dark'], CX + 0.06 + j * 0.14, CY - D / 2 - 0.005, G + 0.08, 0.03, 0.006, 0.04, outline=0, bevel=0)
box('door', M['dark'], CX - 0.2, CY - D / 2 - 0.005, G + 0.03, 0.05, 0.006, 0.09, outline=0, bevel=0)
# the lower skirt roof, a band of logs, then the tall steep roof
hipped('skirt', M['shingle'], CX, CY, G + 0.14, W / 2 + 0.08, D / 2 + 0.08, G + 0.21, W / 2 + 0.01, D / 2 + 0.01)
box('band', M['logs'], CX, CY, G + 0.17, W + 0.02, D + 0.02, 0.08, outline=0.003, bevel=0)
hipped('roof', M['shingle'], CX, CY, G + 0.24, W / 2 + 0.05, D / 2 + 0.05, G + 0.58, W / 2 + 0.01, 0.004)

# ---------- the tower at the west end, its gallery and the needle spire ----------
TX, TY = CX - W / 2 + 0.11, CY
box('tower', M['shingle'], TX, TY, G + 0.4, 0.13, 0.13, 0.33, outline=0.005, bevel=0)
GZ = G + 0.72
box('galleryfloor', M['wood'], TX, TY, GZ, 0.19, 0.19, 0.015, outline=0.002, bevel=0)
box('gallerycore', M['dark'], TX, TY, GZ + 0.01, 0.11, 0.11, 0.08, outline=0, bevel=0)
for k in range(4):
    for j in range(4):
        t = -0.09 + j * 0.06
        x, y = ((t, -0.09), (0.09, t), (-t, 0.09), (-0.09, -t))[k]
        rod(f'gallerypost{k}{j}', M['wood'], (TX + x, TY + y, GZ + 0.01), (TX + x, TY + y, GZ + 0.085), 0.006, segs=4, outline=0.001)
box('gallerybeam', M['wood'], TX, TY, GZ + 0.08, 0.2, 0.2, 0.015, outline=0.002, bevel=0)
hipped('galleryroof', M['shingle'], TX, TY, GZ + 0.09, 0.13, 0.13, GZ + 0.15, 0.06, 0.06)
lathe('spire', M['shingle'], ((0.068, 0), (0.003, 0.52)), GZ + 0.14, TX, TY, segs=8, outline=0.004, smooth=False)
for sx in (-1, 1):
    for sy in (-1, 1):
        lathe(f'cornerspire{sx}{sy}', M['shingle'], ((0.02, 0), (0.002, 0.15)), GZ + 0.09, TX + sx * 0.1, TY + sy * 0.1, segs=6, outline=0.002, smooth=False)
TOP = GZ + 0.66
rod('cross', M['metal'], (TX, TY, TOP - 0.01), (TX, TY, TOP + 0.08), 0.006, segs=4, outline=0.001)
bar('crossbar', M['metal'], (TX - 0.025, TY, TOP + 0.05), (TX + 0.025, TY, TOP + 0.05), 0.008, outline=0.001)

# ---------- the carved gate and the fence ----------
GX, GY = 0.0, -0.55
for s in (-1, 1):
    box(f'gatepost{s}', M['wood'], GX + s * 0.13, GY, G - 0.005, 0.05, 0.05, 0.27, outline=0.003, bevel=0)
box('gatebeam', M['wood'], GX, GY, G + 0.26, 0.34, 0.06, 0.04, outline=0.003, bevel=0)
hipped('gateroof', M['shingle'], GX, GY, G + 0.295, 0.21, 0.08, G + 0.38, 0.2, 0.004)
for s in (-1, 1):
    x0 = GX + s * 0.16
    x1 = s * 0.82
    for z in (G + 0.04, G + 0.09):
        bar(f'rail{s}{z:.2f}', M['wood'], (x0, GY, z), (x1, GY, z), 0.012, outline=0.001)
    for k in range(6):
        x = x0 + (x1 - x0) * (k + 0.5) / 6
        bar(f'fencepost{s}{k}', M['wood'], (x, GY, G), (x, GY, G + 0.11), 0.014, outline=0.001)

# ---------- the churchyard's crosses and trees ----------
for k, (x, y) in enumerate(((-0.55, 0.05), (-0.45, 0.42), (0.75, -0.2), (0.8, 0.15), (-0.2, 0.62), (0.5, 0.6), (-0.6, -0.3))):
    bar(f'yardcross{k}', M['wood'], (x, y, G), (x, y, G + 0.1), 0.014, outline=0.001)
    bar(f'yardcrossbar{k}', M['wood'], (x - 0.03, y, G + 0.07), (x + 0.03, y, G + 0.07), 0.012, outline=0.001)
for k, (x, y) in enumerate(((-0.85, 0.45), (0.9, 0.45), (-0.95, -0.05), (0.25, 0.92))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.17, 0.14, outline=0.012)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
