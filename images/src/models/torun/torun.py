# A cartoon Toruń for the country maps, built in the set's shared look (../toon.py): the Gothic
# Old Town Hall of red brick round its courtyard, its corner turrets and the tall tower with its
# pointed spire, the bronze statue of Copernicus on his pedestal in the market square, and the tall
# gabled burghers' houses round it. Turned a little towards the camera.
# Run: blender -b --factory-startup -P torun.py -- torun-1024.png 1024 torun.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#c8c0b0', shadow_mul=(0.84, 0.82, 0.88), lift=0.2),
    'brick': toon('brick', '#b0503a', shadow_mul=(0.86, 0.78, 0.76), lift=0.04),
    'brickDark': toon('brickDark', '#8a3a2a'),
    'roof': toon('roof', '#5a5e66'),
    'copper': toon('copper', '#4a7a6a'),
    'bronze': toon('bronze', '#4a5a50'),
    'stone': toon('stone', '#d8d0c0'),
    'ochre': toon('ochre', '#ecc888', lift=0.1),
    'cream': toon('cream', '#f0e6cc', lift=0.12),
    'pink': toon('pink', '#e8b0a0', lift=0.1),
    'window': flat('window', '#3a3a42'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)

# ---------- the town hall ----------
HX, HY, W, D, H = 0.0, 0.22, 0.6, 0.46, 0.22
box('townhall', M['brick'], HX, HY, G - 0.005, W, D, H, outline=0.009, bevel=0)
for r in range(2):
    for j in range(9):
        box(f'win{r}{j}', M['window'], HX - 0.26 + j * 0.065, HY - D / 2 - 0.003, G + 0.04 + r * 0.08, 0.025, 0.006, 0.055, outline=0, bevel=0)
for j in range(10):
    box(f'pilaster{j}', M['brickDark'], HX - 0.29 + j * 0.0645, HY - D / 2 - 0.004, G - 0.005, 0.012, 0.006, H, outline=0, bevel=0)
loft('roof', M['roof'], [[(HX - W / 2, HY - D / 2, G + H - 0.005), (HX + W / 2, HY - D / 2, G + H - 0.005), (HX + W / 2, HY + D / 2, G + H - 0.005), (HX - W / 2, HY + D / 2, G + H - 0.005)],
                         [(HX - W / 2 + 0.08, HY - D / 2 + 0.08, G + H + 0.08), (HX + W / 2 - 0.08, HY - D / 2 + 0.08, G + H + 0.08), (HX + W / 2 - 0.08, HY + D / 2 - 0.08, G + H + 0.08), (HX - W / 2 + 0.08, HY + D / 2 - 0.08, G + H + 0.08)]], outline=0.005)
for sx in (-1, 1):
    for sy in (-1, 1):
        tx, ty = HX + sx * W / 2, HY + sy * D / 2
        box(f'turret{sx}{sy}', M['brick'], tx, ty, G - 0.005, 0.06, 0.06, H + 0.06, outline=0.004, bevel=0)
        pyramid(f'turretroof{sx}{sy}', M['copper'], tx, ty, G + H + 0.055, 0.065, 0.1, outline=0.003)
    box(f'gable{sx}', M['brick'], HX + sx * 0.12, HY - D / 2 + 0.02, G + H - 0.005, 0.1, 0.03, 0.08, outline=0.003, bevel=0)
TX, TY = HX - 0.12, HY - D / 2 + 0.06
box('tower', M['brick'], TX, TY, G - 0.005, 0.12, 0.12, 0.52, outline=0.007, bevel=0)
for k in range(3):
    box(f'towerwin{k}', M['window'], TX, TY - 0.063, G + 0.27 + k * 0.08, 0.03, 0.006, 0.05, outline=0, bevel=0)
lathe('towerhelm', M['copper'], ((0.07, 0), (0.05, 0.05), (0.06, 0.08), (0.02, 0.14), (0.004, 0.22)), G + 0.515, TX, TY, segs=8, outline=0.004, smooth=False)

# ---------- Copernicus ----------
CX, CY = 0.2, -0.32
box('pedestal', M['stone'], CX, CY, G - 0.005, 0.09, 0.09, 0.14, outline=0.004, bevel=0)
lathe('copernicus', M['bronze'], ((0.03, 0), (0.026, 0.06), (0.02, 0.11)), G + 0.135, CX, CY, segs=10, outline=0.002)
ball('copernicushead', M['bronze'], CX, CY, G + 0.26, 0.016, outline=0.001)
cyl('astrolabe', M['bronze'], 0.018, 0.006, segs=12, outline=0.001, matrix=Matrix.Translation((CX + 0.03, CY - 0.02, G + 0.26)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
rod('copernicusarm', M['bronze'], (CX + 0.012, CY, G + 0.22), (CX + 0.03, CY - 0.02, G + 0.26), 0.006, segs=6, outline=0)

# ---------- the gabled houses ----------
mats = ('ochre', 'cream', 'pink')
for s in (-1, 1):
    for k in range(4):
        x = s * 0.68
        y = -0.55 + k * 0.17
        h = 0.18 + 0.03 * (k % 2)
        box(f'house{s}{k}', M[mats[(k + (s > 0)) % 3]], x, y, G - 0.005, 0.16, 0.16, h, outline=0.005, bevel=0)
        for r in range(3):
            box(f'housewin{s}{k}{r}', M['window'], x - s * 0.083, y, G + 0.03 + r * 0.05, 0.006, 0.1, 0.025, outline=0, bevel=0)
        for j, (w, gh) in enumerate(((0.16, 0.05), (0.1, 0.04), (0.05, 0.035))):
            box(f'housegable{s}{k}{j}', M[mats[(k + (s > 0)) % 3]], x - s * 0.06, y, G + h - 0.005 + j * 0.045, 0.03, w, gh, outline=0.002, bevel=0)
        loft(f'houseroof{s}{k}', M['brickDark'], [[(x - 0.08, y - 0.08, G + h - 0.005), (x + 0.08, y - 0.08, G + h - 0.005), (x + 0.08, y + 0.08, G + h - 0.005), (x - 0.08, y + 0.08, G + h - 0.005)],
                                                  [(x - 0.08, y - 0.004, G + h + 0.12), (x + 0.08, y - 0.004, G + h + 0.12), (x + 0.08, y + 0.004, G + h + 0.12), (x - 0.08, y + 0.004, G + h + 0.12)]], outline=0.003)

turn(before, -20)
render(G)
