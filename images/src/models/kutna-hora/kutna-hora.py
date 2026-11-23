# A cartoon Kutná Hora for the country maps, built in the set's shared look (../toon.py): St
# Barbara's Church, the silver miners' Gothic cathedral, its three tall tent roofs side by side
# with their little spires, the forest of flying buttresses and pinnacles round the choir, the pale
# stone walls with tall windows, and the terrace with its balustrade of statues before the long
# Jesuit College. Turned a little towards the camera.
# Run: blender -b --factory-startup -P kutna-hora.py -- kutna-hora-1024.png 1024 kutna-hora.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'paving': toon('paving', '#d0c8b8'),
    'stone': toon('stone', '#ddd2b8', shadow_mul=(0.84, 0.84, 0.88), lift=0.1),
    'stoneDark': toon('stoneDark', '#b8ac90'),
    'slate': toon('slate', '#4a5058'),
    'window': flat('window', '#3a3a48'),
    'college': toon('college', '#ecd8a0', lift=0.1),
    'roof': toon('roof', '#c4603e'),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['grass'])
before = set(bpy.data.objects)
box('terrace', M['paving'], -0.1, -0.35, G - 0.003, 1.2, 0.3, 0.008, outline=0, bevel=0)

CX, CY, W, L, H = 0.1, 0.18, 0.46, 0.62, 0.25
box('nave', M['stone'], CX, CY, G - 0.005, W, L, H, outline=0.009, bevel=0)
for j in range(5):
    x = CX - W / 2 + 0.06 + j * (W - 0.12) / 4
    box(f'frontwin{j}', M['window'], x, CY - L / 2 - 0.003, G + 0.06, 0.04, 0.006, 0.15, outline=0, bevel=0)
box('portal', M['window'], CX, CY - L / 2 - 0.004, G - 0.005, 0.06, 0.006, 0.1, outline=0, bevel=0)
# the three tent roofs
for k, dx in enumerate((-0.15, 0.0, 0.15)):
    x = CX + dx
    lathe(f'tent{k}', M['slate'], ((0.11, 0), (0.07, 0.1), (0.04, 0.2), (0.012, 0.3), (0.004, 0.32)), G + H - 0.005, x, CY - 0.1, segs=8, outline=0.005, smooth=False)
    lathe(f'tentspire{k}', M['slate'], ((0.014, 0), (0.004, 0.08)), G + H + 0.31, x, CY - 0.1, segs=6, outline=0.001, smooth=False)
    for z in (0.1, 0.2):
        lathe(f'tentring{k}{z}', M['stoneDark'], ((0.11 - z * 0.38, 0), (0.11 - z * 0.38, 0.012)), G + H + z - 0.02, x, CY - 0.1, segs=8, outline=0, smooth=False)
loft('backroof', M['slate'], [[(CX - W / 2, CY + 0.0, G + H - 0.005), (CX + W / 2, CY + 0.0, G + H - 0.005), (CX + W / 2, CY + L / 2, G + H - 0.005), (CX - W / 2, CY + L / 2, G + H - 0.005)],
                              [(CX - 0.004, CY + 0.0, G + H + 0.12), (CX + 0.004, CY + 0.0, G + H + 0.12), (CX + 0.004, CY + L / 2, G + H + 0.12), (CX - 0.004, CY + L / 2, G + H + 0.12)]], outline=0.005)
# flying buttresses down the sides
for s in (-1, 1):
    for j in range(5):
        y = CY - L / 2 + 0.08 + j * 0.13
        bx = CX + s * (W / 2 + 0.08)
        box(f'pier{s}{j}', M['stoneDark'], bx, y, G - 0.005, 0.035, 0.035, 0.2, outline=0.002, bevel=0)
        lathe(f'pinnacle{s}{j}', M['stoneDark'], ((0.02, 0), (0.004, 0.09)), G + 0.195, bx, y, segs=4, outline=0.001, smooth=False)
        bar(f'flyer{s}{j}', M['stoneDark'], (bx, y, G + 0.17), (CX + s * W / 2, y, G + 0.23), 0.02, outline=0.002)
        bar(f'flyerlow{s}{j}', M['stoneDark'], (bx, y, G + 0.1), (CX + s * W / 2, y, G + 0.14), 0.016, outline=0.001)
        box(f'sidewin{s}{j}', M['window'], CX + s * (W / 2 + 0.003), y + 0.065, G + 0.06, 0.006, 0.04, 0.15, outline=0, bevel=0)

# ---------- the terrace statues and the Jesuit College ----------
for j in range(9):
    x = -0.7 + j * 0.1
    box(f'balustrade{j}', M['stone'], x, -0.5, G - 0.005, 0.1, 0.03, 0.05, outline=0.001, bevel=0)
    if j % 2 == 0:
        box(f'statueplinth{j}', M['stone'], x, -0.5, G + 0.045, 0.035, 0.035, 0.025, outline=0.001, bevel=0)
        lathe(f'statue{j}', M['stoneDark'], ((0.013, 0), (0.01, 0.05)), G + 0.07, x, -0.5, segs=8, outline=0.001)
        ball(f'statuehead{j}', M['stoneDark'], x, -0.5, G + 0.13, 0.01, outline=0)
box('college', M['college'], -0.6, 0.15, G - 0.005, 0.2, 0.8, 0.18, outline=0.007, bevel=0)
for r in range(2):
    for j in range(6):
        box(f'collegewin{r}{j}', M['window'], -0.497, -0.15 + j * 0.12, G + 0.04 + r * 0.07, 0.006, 0.035, 0.04, outline=0, bevel=0)
loft('collegeroof', M['roof'], [[(-0.7, -0.25, G + 0.175), (-0.5, -0.25, G + 0.175), (-0.5, 0.55, G + 0.175), (-0.7, 0.55, G + 0.175)],
                                [(-0.604, -0.25, G + 0.25), (-0.596, -0.25, G + 0.25), (-0.596, 0.55, G + 0.25), (-0.604, 0.55, G + 0.25)]], outline=0.004)
for k, (x, y, r) in enumerate(((0.75, -0.45, 0.11), (0.85, 0.2, 0.1), (0.6, 0.65, 0.1), (-0.25, 0.7, 0.1))):
    ball(f'tree{k}', M['tree'], x, y, G + r * 1.1, r, outline=0.008)

turn(before, -20)
render(G)
