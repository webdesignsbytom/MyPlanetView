# A cartoon Aachen Cathedral for the country maps, built in the set's shared look (../toon.py):
# Charlemagne's Palatine Chapel, the sixteen-sided ambulatory round the octagon with its pleated
# dome and lantern, the tall Gothic "glass house" choir with its long windows between buttresses
# and pinnacles under a steep roof, the west tower and its spire, and the little chapels round it.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P aachen-cathedral.py -- aachen-cathedral-1024.png 1024 aachen-cathedral.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d8d0c0', shadow_mul=(0.84, 0.82, 0.88), lift=0.2),
    'stone': toon('stone', '#d8ccb4', shadow_mul=(0.86, 0.84, 0.82), lift=0.1),
    'stoneDark': toon('stoneDark', '#b8a888'),
    'slate': toon('slate', '#5a5e66'),
    'glass': flat('glass', '#3a5a8a'),
    'gold': toon('gold', '#f0c030', lift=0.3),
    'window': flat('window', '#3a3a42'),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['paving'])
before = set(bpy.data.objects)

# ---------- the octagon ----------
OX, OY = -0.12, 0.15
lathe('ambulatory', M['stone'], ((0.3, 0), (0.3, 0.17)), G - 0.005, OX, OY, segs=16, outline=0.008, smooth=False)
lathe('ambulatoryroof', M['slate'], ((0.31, 0), (0.22, 0.07)), G + 0.165, OX, OY, segs=16, outline=0.005, smooth=False)
for k in range(16):
    a = 2 * math.pi * (k + 0.5) / 16
    if math.sin(a) > 0.3:
        continue
    box(f'ambwin{k}', M['window'], OX + 0.288 * math.cos(a), OY + 0.288 * math.sin(a), G + 0.05, 0.03, 0.006, 0.07, rot_z=a + math.pi / 2, outline=0, bevel=0)
lathe('octagon', M['stone'], ((0.2, 0), (0.2, 0.33)), G - 0.005, OX, OY, segs=8, outline=0.008, smooth=False)
for k in range(8):
    a = 2 * math.pi * (k + 0.5) / 8
    if math.sin(a) > 0.5:
        continue
    box(f'octwin{k}', M['window'], OX + 0.187 * math.cos(a), OY + 0.187 * math.sin(a), G + 0.24, 0.05, 0.006, 0.06, rot_z=a + math.pi / 2, outline=0, bevel=0)
lathe('dome', M['slate'], ((0.21, 0), (0.17, 0.09), (0.08, 0.15), (0.004, 0.17)), G + 0.32, OX, OY, segs=8, outline=0.006, smooth=False)
lathe('lantern', M['slate'], ((0.035, 0), (0.035, 0.05), (0.004, 0.1)), G + 0.47, OX, OY, segs=8, outline=0.003, smooth=False)
ball('lanternball', M['gold'], OX, OY, G + 0.575, 0.012, outline=0.001)

# ---------- the Gothic glass choir ----------
CX0, CX1, CY, CW, CH = 0.12, 0.6, 0.15, 0.22, 0.42
box('choir', M['stone'], (CX0 + CX1) / 2, CY, G - 0.005, CX1 - CX0, CW, CH, outline=0.008, bevel=0)
lathe('apse', M['stone'], ((0.11, 0), (0.11, CH)), G - 0.005, CX1, CY, segs=7, outline=0.007, smooth=False)
for j in range(4):
    x = CX0 + 0.06 + j * 0.11
    box(f'choirwin{j}', M['glass'], x, CY - CW / 2 - 0.003, G + 0.05, 0.06, 0.006, 0.32, outline=0, bevel=0)
    cyl(f'choirwintop{j}', M['glass'], 0.03, 0.006, segs=12, outline=0, matrix=Matrix.Translation((x, CY - CW / 2 - 0.003, G + 0.37)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for j in range(5):
    x = CX0 + 0.005 + j * 0.11
    box(f'buttress{j}', M['stoneDark'], x, CY - CW / 2 - 0.02, G - 0.005, 0.03, 0.05, CH - 0.03, outline=0.002, bevel=0)
    lathe(f'pinnacle{j}', M['stoneDark'], ((0.018, 0), (0.004, 0.09)), G + CH - 0.04, x, CY - CW / 2 - 0.02, segs=4, outline=0.002, smooth=False)
loft('choirroof', M['slate'], [[(CX0, CY - CW / 2 - 0.005, G + CH - 0.005), (CX1, CY - CW / 2 - 0.005, G + CH - 0.005), (CX1, CY + CW / 2 + 0.005, G + CH - 0.005), (CX0, CY + CW / 2 + 0.005, G + CH - 0.005)],
                               [(CX0, CY - 0.004, G + CH + 0.16), (CX1, CY - 0.004, G + CH + 0.16), (CX1, CY + 0.004, G + CH + 0.16), (CX0, CY + 0.004, G + CH + 0.16)]], outline=0.006)
lathe('apseroof', M['slate'], ((0.115, 0), (0.004, 0.16)), G + CH - 0.005, CX1, CY, segs=7, outline=0.005, smooth=False)
rod('choirridgespire', M['slate'], (0.36, CY, G + CH + 0.15), (0.36, CY, G + CH + 0.26), 0.012, r2=0.002, segs=6, outline=0.002)

# ---------- the west tower ----------
WX = -0.5
box('westtower', M['stone'], WX, OY, G - 0.005, 0.15, 0.15, 0.5, outline=0.007, bevel=0)
box('westwin', M['window'], WX, OY - 0.078, G + 0.36, 0.04, 0.006, 0.08, outline=0, bevel=0)
lathe('westspire', M['slate'], ((0.08, 0), (0.05, 0.08), (0.06, 0.1), (0.004, 0.28)), G + 0.495, WX, OY, segs=8, outline=0.005, smooth=False)

# ---------- chapels ----------
for k, (x, y) in enumerate(((-0.2, -0.22), (0.05, -0.18))):
    box(f'chapel{k}', M['stone'], x, y, G - 0.005, 0.16, 0.12, 0.14, outline=0.005, bevel=0)
    lathe(f'chapeldome{k}', M['slate'], ((0.06, 0), (0.05, 0.04), (0.012, 0.08), (0.004, 0.12)), G + 0.135, x, y, segs=8, outline=0.003, smooth=False)
for k, (x, y, r) in enumerate(((-0.85, -0.3, 0.11), (0.85, -0.35, 0.11), (-0.6, -0.7, 0.1), (0.5, -0.7, 0.1))):
    ball(f'tree{k}', M['tree'], x, y, G + r * 1.1, r, outline=0.008)

turn(before, -20)
render(G)
