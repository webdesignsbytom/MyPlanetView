# A cartoon Endless Column for the country maps, built in the set's shared look (../toon.py):
# Brâncuși's tall column at Târgu Jiu, its stack of golden rhomboid beads rising from the lawn, with
# the Table of Silence and its twelve hourglass stools and the stone Gate of the Kiss along the
# avenue in front, and trees of the park. Turned a little towards the camera.
# Run: blender -b --factory-startup -P endless-column.py -- endless-column-1024.png 1024 endless-column.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'path': toon('path', '#d8ccb0'),
    'gold': toon('gold', '#d8a840', shadow_mul=(0.84, 0.8, 0.74), lift=0.2),
    'stone': toon('stone', '#d8d0c0', shadow_mul=(0.84, 0.84, 0.88), lift=0.1),
    'stoneDark': toon('stoneDark', '#b0a898'),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#5a4a40'),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)
bar('avenue', M['path'], (0.0, -1.0, G + 0.002), (0.0, 0.3, G + 0.002), 0.14, outline=0)

# ---------- the column ----------
CX, CY = 0.0, 0.42
lathe('columnbase', M['stoneDark'], ((0.1, 0), (0.1, 0.02)), G - 0.005, CX, CY, segs=24, outline=0.003)


def sq(w, z):
    return [(CX - w / 2, CY - w / 2, z), (CX + w / 2, CY - w / 2, z), (CX + w / 2, CY + w / 2, z), (CX - w / 2, CY + w / 2, z)]


n, h, wn, wx = 15, 0.055, 0.035, 0.07
z = G + 0.015
loft('halfbead', M['gold'], [sq(wn, z), sq(wx, z + h / 2)], outline=0.003)
z += h / 2
for k in range(n):
    loft(f'bead{k}a', M['gold'], [sq(wx, z), sq(wn, z + h / 2)], outline=0.003)
    loft(f'bead{k}b', M['gold'], [sq(wn, z + h / 2), sq(wx, z + h)], outline=0.003)
    z += h

# ---------- the Gate of the Kiss ----------
GX, GY = 0.0, -0.25
for s in (-1, 1):
    box(f'gatepillar{s}', M['stone'], GX + s * 0.13, GY, G - 0.005, 0.1, 0.08, 0.22, outline=0.005, bevel=0)
    cyl(f'kiss{s}', M['stoneDark'], 0.03, 0.006, segs=16, outline=0, matrix=Matrix.Translation((GX + s * 0.13, GY - 0.043, G + 0.13)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    box(f'kissline{s}', M['stone'], GX + s * 0.13, GY - 0.047, G + 0.13, 0.004, 0.004, 0.06, outline=0, bevel=0)
box('gatelintel', M['stone'], GX, GY, G + 0.215, 0.38, 0.09, 0.06, outline=0.005, bevel=0)
for j in range(8):
    box(f'lintelmark{j}', M['stoneDark'], GX - 0.16 + j * 0.046, GY - 0.046, G + 0.23, 0.02, 0.004, 0.03, outline=0, bevel=0)

# ---------- the Table of Silence ----------
TX, TY = 0.0, -0.72
lathe('table', M['stone'], ((0.05, 0), (0.05, 0.04), (0.1, 0.045), (0.1, 0.07)), G - 0.005, TX, TY, segs=24, outline=0.004)
for k in range(12):
    a = 2 * math.pi * k / 12
    lathe(f'stool{k}', M['stone'], ((0.022, 0), (0.012, 0.02), (0.022, 0.04)), G - 0.005, TX + 0.17 * math.cos(a), TY + 0.17 * math.sin(a), segs=12, outline=0.002)

for k, (x, y, r) in enumerate(((-0.6, 0.45, 0.14), (0.62, 0.42, 0.14), (-0.75, -0.15, 0.12), (0.78, -0.2, 0.12), (-0.45, -0.75, 0.11), (0.5, -0.75, 0.11))):
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + r * 1.5), 0.02, segs=6, outline=0.003)
    ball(f'tree{k}', M['tree'], x, y, G + r * 1.8, r, outline=0.008)

turn(before, -20)
render(G)
