# A cartoon Fisherman's Bastion for the country maps, built in the set's shared look (../toon.py): the
# white neo-Romanesque terrace on Buda's Castle Hill, its arcades and seven conical-capped turrets
# along the wall, the stairs down the hillside, the bronze statue of St Stephen on horseback, and
# Matthias Church behind with its tall Gothic spire and its roof of colourful glazed tiles. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P fishermans-bastion.py -- fishermans-bastion-1024.png 1024 fishermans-bastion.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'hill': toon('hill', '#6aa54a', shadow_mul=(0.7, 0.78, 0.8)),
    'white': toon('white', '#f2ecde', shadow_mul=(0.84, 0.84, 0.9), lift=0.2),
    'whiteDark': toon('whiteDark', '#d4ccba'),
    'cap': toon('cap', '#7a8290', shadow_mul=(0.82, 0.86, 0.94)),
    'dark': flat('dark', '#2e2a2e'),
    'paving': toon('paving', '#d0c8b8', lift=0.2),
    'tileOrange': toon('tileOrange', '#e08a3a', lift=0.12),
    'tileGreen': toon('tileGreen', '#4a9a6a', lift=0.12),
    'tileYellow': toon('tileYellow', '#f0c840', lift=0.12),
    'bronze': toon('bronze', '#4a6a5a', lift=0.1),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile()
before = set(bpy.data.objects)

# ---------- the hill: the terrace's top level at the back, the slope down to the front ----------
TZ = G + 0.24
loft('hilltop', M['paving'], [[(-1.1, -0.1, G - 0.01), (1.1, -0.1, G - 0.01), (1.0, 0.9, G - 0.01), (-1.0, 0.9, G - 0.01)],
                              [(-1.1, -0.1, TZ), (1.1, -0.1, TZ), (1.0, 0.9, TZ), (-1.0, 0.9, TZ)]], outline=0.006)
loft('slope', M['hill'], [[(-1.2, -0.6, G - 0.01), (1.2, -0.6, G - 0.01), (1.1, -0.1, G - 0.01), (-1.1, -0.1, G - 0.01)],
                          [(-1.2, -0.6, G - 0.005), (1.2, -0.6, G - 0.005), (1.1, -0.1, TZ - 0.04), (-1.1, -0.1, TZ - 0.04)]], outline=0.006)

# ---------- the bastion along the front edge ----------
WY = -0.1
box('wall', M['white'], 0, WY, G - 0.005, 1.5, 0.06, TZ - G + 0.06, outline=0.008, bevel=0)
for j in range(14):
    x = -0.7 + j * 0.108
    box(f'arcade{j}', M['dark'], x, WY - 0.032, TZ - 0.03, 0.05, 0.006, 0.07, outline=0, bevel=0)
    cyl(f'arcadetop{j}', M['dark'], 0.025, 0.006, segs=10, outline=0, matrix=Matrix.Translation((x, WY - 0.032, TZ + 0.04)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
box('parapet', M['whiteDark'], 0, WY, TZ + 0.055, 1.52, 0.07, 0.02, outline=0.003, bevel=0)
# the seven turrets for the seven Magyar tribes
for k in range(7):
    x = -0.66 + k * 0.22
    big = k == 3
    r = 0.07 if big else 0.05
    h = 0.5 if big else 0.38
    lathe(f'turret{k}', M['white'], ((r, 0), (r, h)), G - 0.005, x, WY - 0.02, segs=12, outline=0.004, smooth=False)
    lathe(f'turretband{k}', M['whiteDark'], ((r + 0.005, 0), (r + 0.005, 0.015)), G + h * 0.7, x, WY - 0.02, segs=12, outline=0.001, smooth=False)
    for j in range(4):
        a = -math.pi / 2 + (j - 1.5) * 0.5
        box(f'turretwin{k}{j}', M['dark'], x + (r + 0.002) * math.cos(a), WY - 0.02 + (r + 0.002) * math.sin(a), G + h * 0.78, 0.012, 0.01, 0.035, rot_z=a + math.pi / 2, outline=0, bevel=0)
    lathe(f'turretcap{k}', M['cap'], ((r + 0.012, 0), (r * 0.6, h * 0.25), (0.004, h * 0.65)), G + h - 0.005, x, WY - 0.02, segs=12, outline=0.003, smooth=False)
# the stairs down the slope in the middle
for i in range(8):
    t = i / 8
    y = -0.6 + 0.48 * t
    box(f'stair{i}', M['white'], 0.35, y, G - 0.005, 0.16, 0.065, (TZ - G) * t + 0.02, outline=0.002, bevel=0)

# ---------- St Stephen on horseback ----------
SX, SY = -0.35, 0.15
box('statueplinth', M['white'], SX, SY, TZ - 0.005, 0.1, 0.14, 0.1, outline=0.004, bevel=0)
horse = ball('horse', M['bronze'], 0, 0, 0, 0.035, outline=0.004)
horse.scale = (0.8, 1.6, 0.9)
horse.location = (SX, SY, TZ + 0.15)
for fy in (-0.035, 0.035):
    for fx in (-0.015, 0.015):
        rod(f'horseleg{fy}{fx}', M['bronze'], (SX + fx, SY + fy, TZ + 0.095), (SX + fx, SY + fy, TZ + 0.14), 0.007, segs=5, outline=0.001)
rod('horseneck', M['bronze'], (SX, SY - 0.045, TZ + 0.16), (SX, SY - 0.07, TZ + 0.2), 0.014, segs=6, outline=0.002)
ball('horsehead', M['bronze'], SX, SY - 0.078, TZ + 0.205, 0.014, outline=0.002)
rod('king', M['bronze'], (SX, SY, TZ + 0.17), (SX, SY, TZ + 0.24), 0.018, r2=0.012, segs=8, outline=0.002)
ball('kinghead', M['bronze'], SX, SY, TZ + 0.255, 0.012, outline=0.002)
rod('crossstaff', M['bronze'], (SX + 0.02, SY - 0.01, TZ + 0.2), (SX + 0.03, SY - 0.02, TZ + 0.3), 0.004, segs=4, outline=0)

# ---------- Matthias Church ----------
CX, CY = 0.15, 0.48
box('nave', M['white'], CX, CY, TZ - 0.005, 0.3, 0.5, 0.2, outline=0.008, bevel=0)
TILES = ('tileOrange', 'tileGreen', 'tileYellow')
for k in range(6):
    y0, y1 = CY - 0.25 + k * 0.5 / 6, CY - 0.25 + (k + 1) * 0.5 / 6
    loft(f'churchroof{k}', M[TILES[k % 3]], [[(CX - 0.16, y0, TZ + 0.195), (CX + 0.16, y0, TZ + 0.195), (CX + 0.16, y1, TZ + 0.195), (CX - 0.16, y1, TZ + 0.195)],
                                              [(CX - 0.004, y0, TZ + 0.33), (CX + 0.004, y0, TZ + 0.33), (CX + 0.004, y1, TZ + 0.33), (CX - 0.004, y1, TZ + 0.33)]], outline=0.003)
box('rose', M['dark'], CX, CY - 0.253, TZ + 0.1, 0.06, 0.006, 0.06, outline=0, bevel=0)
box('churchdoor', M['dark'], CX, CY - 0.253, TZ - 0.005, 0.05, 0.006, 0.07, outline=0, bevel=0)
# the bell tower: square, then octagonal, then the spire
BX, BY = CX + 0.2, CY - 0.18
box('belltower', M['white'], BX, BY, TZ - 0.005, 0.13, 0.13, 0.42, outline=0.007, bevel=0)
for fy in (-1, 1):
    box(f'belltowerwin{fy}', M['dark'], BX, BY + fy * 0.066, TZ + 0.28, 0.035, 0.006, 0.08, outline=0, bevel=0)
lathe('octagon', M['white'], ((0.06, 0), (0.06, 0.12)), TZ + 0.415, BX, BY, segs=8, outline=0.004, smooth=False)
for k in range(4):
    a = k * math.pi / 2 + math.pi / 4
    lathe(f'spirelet{k}', M['whiteDark'], ((0.015, 0), (0.002, 0.08)), TZ + 0.41, BX + 0.075 * math.cos(a), BY + 0.075 * math.sin(a), segs=6, outline=0.001, smooth=False)
lathe('spire', M['tileGreen'], ((0.065, 0), (0.03, 0.1), (0.004, 0.24)), TZ + 0.53, BX, BY, segs=8, outline=0.004, smooth=False)
rod('spirecross', M['tileYellow'], (BX, BY, TZ + 0.77), (BX, BY, TZ + 0.81), 0.004, segs=4, outline=0)

for k, (x, y) in enumerate(((-0.8, 0.5), (0.75, 0.75), (-0.6, 0.75))):
    ball(f'tree{k}', M['tree'], x, y, TZ + 0.1, 0.11, outline=0.012)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
