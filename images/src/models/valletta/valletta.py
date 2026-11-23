# A cartoon City of Valletta for the country maps, built in the set's shared look (../toon.py):
# Malta's fortified capital, its honey-coloured bastions rising from the Grand Harbour, the town
# packed on top with its bright wooden balconies, the great dome of the Carmelite church and St
# Paul's spire, and a colourful luzzu fishing boat with its painted eye. Turned a little towards the
# camera.
# Run: blender -b --factory-startup -P valletta.py -- valletta-1024.png 1024 valletta.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#2f8fc8', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'limestone': toon('limestone', '#e2c48c', shadow_mul=(0.84, 0.78, 0.72)),
    'limestoneDark': toon('limestoneDark', '#cca870', shadow_mul=(0.84, 0.78, 0.72)),
    'dome': toon('dome', '#9aa8b0', shadow_mul=(0.8, 0.82, 0.9)),
    'spire': toon('spire', '#7a8088', shadow_mul=(0.8, 0.8, 0.88)),
    'b1': toon('b1', '#3f9a5a'), 'b2': toon('b2', '#d0402f'), 'b3': toon('b3', '#3f7fc0'), 'b4': toon('b4', '#f2c84a', shadow_mul=(0.84, 0.72, 0.6)),
    'window': flat('window', '#3a3640'),
    'boatBlue': toon('boatBlue', '#2f6fb8'), 'boatYellow': toon('boatYellow', '#f2c84a', shadow_mul=(0.84, 0.72, 0.6)),
    'boatRed': toon('boatRed', '#d0402f'), 'eye': flat('eye', '#ffffff'),
})

G = tile(M['sea'])
before = set(bpy.data.objects)
rng = random.Random(853)

# ---------- the peninsula: sloping bastion walls, the town on top ----------
PX, PY, W, D = 0.0, 0.3, 1.5, 0.95
TOPZ = G + 0.2
pts = [(PX - W / 2, PY - D / 2), (PX + W / 2 - 0.1, PY - D / 2), (PX + W / 2, PY - D / 2 + 0.15), (PX + W / 2, PY + D / 2 - 0.15), (PX + W / 2 - 0.2, PY + D / 2),
       (PX - W / 2 + 0.2, PY + D / 2), (PX - W / 2, PY + D / 2 - 0.2)]
inset = [(x * 0.95 + PX * 0.05, (y - PY) * 0.93 + PY) for x, y in pts]
walls = loft('bastions', M['limestone'], [[(x, y, G - 0.01) for x, y in pts], [(x, y, TOPZ) for x, y in inset]], outline=0.02)
walls.visible_shadow = False
for k in range(3):
    box(f'cordon{k}', M['limestoneDark'], PX - 0.3 + k * 0.3, PY - D / 2 + 0.012, G + 0.1, 0.25, 0.012, 0.012, outline=0, bevel=0)

# ---------- the town's houses, with bright balconies on the front row ----------
for row in range(3):
    for j in range(7):
        x = PX - W / 2 + 0.18 + j * 0.19
        y = PY - D / 2 + 0.15 + row * 0.22
        if math.hypot(x, y) > 1.2:
            continue
        h = rng.uniform(0.08, 0.14)
        box(f'house{row}{j}', M['limestone' if (row + j) % 2 else 'limestoneDark'], x, y, TOPZ - 0.005, 0.16, 0.16, h, outline=0.008, bevel=0)
        if row == 0:
            box(f'balcony{j}', M[('b1', 'b2', 'b3', 'b4')[j % 4]], x, y - 0.09, TOPZ + h * 0.45, 0.07, 0.03, 0.05, outline=0.004, bevel=0)
            box(f'balconywin{j}', M['window'], x, y - 0.106, TOPZ + h * 0.45 + 0.01, 0.04, 0.004, 0.03, outline=0, bevel=0)

# ---------- the Carmelite church's dome and St Paul's spire ----------
CX, CY = PX + 0.05, PY + 0.12
box('church', M['limestone'], CX, CY, TOPZ - 0.005, 0.24, 0.24, 0.16, outline=0.012, bevel=0)
lathe('drum', M['limestone'], ((0.1, 0), (0.1, 0.08)), TOPZ + 0.15, CX, CY, segs=16, outline=0.01)
lathe('dome', M['dome'], ((0.11, 0), (0.105, 0.05), (0.08, 0.11), (0.04, 0.15), (0.004, 0.16)), TOPZ + 0.225, CX, CY, segs=20, outline=0.012)
lathe('lantern', M['limestone'], ((0.025, 0), (0.025, 0.04), (0.004, 0.08)), TOPZ + 0.38, CX, CY, segs=8, outline=0.005)
SX, SY = PX - 0.42, PY + 0.2
box('stpauls', M['limestone'], SX, SY, TOPZ - 0.005, 0.1, 0.1, 0.24, outline=0.01, bevel=0)
lathe('stpaulsspire', M['spire'], ((0.06, 0), (0.004, 0.24)), TOPZ + 0.235, SX, SY, segs=8, outline=0.008, smooth=False)

# ---------- a luzzu on the harbour ----------
LX, LY = 0.1, -0.55
loft('luzzu', M['boatBlue'], [[(LX - 0.14, LY, G + 0.0), (LX + 0.1, LY - 0.04, G + 0.0), (LX + 0.16, LY, G + 0.0), (LX + 0.1, LY + 0.04, G + 0.0)],
                              [(LX - 0.17, LY, G + 0.08), (LX + 0.1, LY - 0.055, G + 0.05), (LX + 0.2, LY, G + 0.09), (LX + 0.1, LY + 0.055, G + 0.05)]], outline=0.008)
box('luzzustripe', M['boatYellow'], LX + 0.02, LY - 0.05, G + 0.03, 0.22, 0.008, 0.015, rot_z=-0.08, outline=0, bevel=0)
box('luzzustripe2', M['boatRed'], LX + 0.02, LY - 0.052, G + 0.045, 0.2, 0.008, 0.01, rot_z=-0.08, outline=0, bevel=0)
cyl('luzzueye', M['eye'], 0.014, 0.004, segs=12, outline=0.002, matrix=Matrix.Translation((LX + 0.15, LY - 0.03, G + 0.055)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
cyl('luzzupupil', M['window'], 0.006, 0.006, segs=10, outline=0, matrix=Matrix.Translation((LX + 0.15, LY - 0.034, G + 0.055)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))

turn(before, -20)
render(G)
