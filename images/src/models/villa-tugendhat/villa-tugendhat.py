# A cartoon Villa Tugendhat for the country maps, built in the set's shared look (../toon.py): Mies van
# der Rohe's modernist villa in Brno on its slope, the long low white upper storey with its terrace
# and the semicircular glass stair, and below it the great living room glazed from end to end with
# its huge windows over the garden, the chromed cross-shaped columns, the onyx wall inside, the
# terrace steps and the sloping lawn with its old trees. Turned a little towards the camera.
# Run: blender -b --factory-startup -P villa-tugendhat.py -- villa-tugendhat-1024.png 1024 villa-tugendhat.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'white': toon('white', '#f6f4ee', shadow_mul=(0.82, 0.84, 0.9), lift=0.22),
    'glass': toon('glass', '#7aa0b8', shadow_mul=(0.8, 0.88, 0.94), lift=0.3),
    'frame': flat('frame', '#2a3038'),
    'chrome': toon('chrome', '#c8ccd2', lift=0.3),
    'onyx': toon('onyx', '#e8c890', lift=0.2),
    'travertine': toon('travertine', '#e4dcc8', lift=0.15),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a4a36'),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)

# ---------- the slope: the house sits on its upper edge, the garden falls in front ----------
HZ = 0.16
slope = loft('slope', M['lawn'], [[(-1.2, -0.1, G - 0.01), (1.2, -0.1, G - 0.01), (1.05, 0.75, G - 0.01), (-1.05, 0.75, G - 0.01)],
                                  [(-1.2, -0.1, G + HZ * 0.1), (1.2, -0.1, G + HZ * 0.1), (1.05, 0.75, G + HZ), (-1.05, 0.75, G + HZ)]], outline=0.005)
slope.visible_shadow = False

# ---------- the living-room storey: glass from end to end ----------
VX, VY = 0.0, 0.25
W, D = 0.86, 0.34
LZ = G + 0.04
box('livingfloor', M['travertine'], VX, VY, LZ - 0.02, W + 0.04, D + 0.04, 0.025, outline=0.004, bevel=0)
box('livingglass', M['glass'], VX, VY, LZ, W, D, 0.16, outline=0.006, bevel=0)
for j in range(9):
    bar(f'mullion{j}', M['frame'], (VX - W / 2 + j * W / 8, VY - D / 2 - 0.004, LZ), (VX - W / 2 + j * W / 8, VY - D / 2 - 0.004, LZ + 0.16), 0.006, outline=0)
for j in range(4):
    bar(f'sidemullion{j}', M['frame'], (VX - W / 2 - 0.004, VY - D / 2 + j * D / 3, LZ), (VX - W / 2 - 0.004, VY - D / 2 + j * D / 3, LZ + 0.16), 0.006, outline=0)
# inside: the onyx wall and the cross-shaped chrome columns
box('onyxwall', M['onyx'], VX + 0.1, VY + 0.04, LZ, 0.16, 0.02, 0.15, outline=0.002, bevel=0)
for k, (x, y) in enumerate(((-0.25, 0.15), (0.0, 0.15), (0.25, 0.15), (-0.25, 0.35), (0.25, 0.35))):
    for ang in (0, math.pi / 2):
        box(f'column{k}{ang:.1f}', M['chrome'], VX + x, y, LZ, 0.02, 0.006, 0.16, rot_z=ang, outline=0, bevel=0)
# ---------- the white upper storey, set back, with its terrace ----------
UZ = LZ + 0.16
box('upper', M['white'], VX - 0.08, VY + 0.08, UZ, 0.66, 0.2, 0.14, outline=0.007, bevel=0)
box('upperroof', M['white'], VX - 0.08, VY + 0.08, UZ + 0.135, 0.68, 0.22, 0.015, outline=0.002, bevel=0)
for j in range(5):
    box(f'upperwin{j}', M['frame'], VX - 0.32 + j * 0.12, VY - 0.023, UZ + 0.04, 0.08, 0.006, 0.06, outline=0, bevel=0)
box('terraceslab', M['white'], VX, VY, UZ - 0.004, W + 0.04, D + 0.04, 0.018, outline=0.003, bevel=0)
for k in range(10):
    bar(f'railing{k}', M['frame'], (VX - W / 2 + k * W / 9, VY - D / 2 - 0.01, UZ + 0.014), (VX - W / 2 + k * W / 9, VY - D / 2 - 0.01, UZ + 0.06), 0.004, outline=0)
bar('railingtop', M['frame'], (VX - W / 2, VY - D / 2 - 0.01, UZ + 0.06), (VX + W / 2, VY - D / 2 - 0.01, UZ + 0.06), 0.006, outline=0)
# the semicircular glass stair tower on the street side
lathe('stair', M['glass'], ((0.07, 0), (0.07, 0.14)), UZ, VX + 0.3, VY + 0.18, segs=16, outline=0.003)
# ---------- the terrace steps and the garden ----------
for i in range(4):
    box(f'step{i}', M['travertine'], VX - 0.3, VY - D / 2 - 0.06 - i * 0.04, G - 0.005, 0.2, 0.04, 0.04 - i * 0.009, outline=0.001, bevel=0)
for k, (x, y) in enumerate(((-0.75, -0.45), (0.65, -0.6), (-0.3, -0.85), (0.85, 0.0))):
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.1), 0.016, segs=6, outline=0.002)
    ball(f'tree{k}', M['tree'], x, y, G + 0.21, 0.14, outline=0.012)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
