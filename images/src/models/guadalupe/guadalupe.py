# A cartoon Royal Monastery of Guadalupe for the country maps, built in the set's shared look
# (../toon.py): the fortress-like monastery of Extremadura, its Gothic-Mudéjar front of golden stone
# between the battlemented towers, the bronze doors, the Mudéjar brick tower with its tiled spire, the
# square with its fountain and steps before it, and the little white town's red roofs climbing round.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P guadalupe.py -- guadalupe-1024.png 1024 guadalupe.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d0c4ac', shadow_mul=(0.82, 0.8, 0.86), lift=0.2),
    'stone': toon('stone', '#d8b880', shadow_mul=(0.86, 0.8, 0.74), lift=0.12),
    'stoneDark': toon('stoneDark', '#b89a64'),
    'brick': toon('brick', '#c4704a', lift=0.08),
    'tileGreen': toon('tileGreen', '#3a8a6a', lift=0.12),
    'bronze': toon('bronze', '#7a5a3a', lift=0.1),
    'white': toon('white', '#f6f4ee', lift=0.2),
    'roof': toon('roof', '#c4603e'),
    'dark': flat('dark', '#2e2622'),
    'water': toon('water', '#4a9ac8', lift=0.3),
})

G = tile(M['paving'])
before = set(bpy.data.objects)
rng = random.Random(1340)

FY = 0.05
# ---------- the front between its towers ----------
box('front', M['stone'], 0, FY + 0.25, G - 0.005, 0.42, 0.5, 0.36, outline=0.008, bevel=0)
for s in (-1, 1):
    box(f'portal{s}', M['stoneDark'], s * 0.09, FY - 0.003, G + 0.03, 0.12, 0.006, 0.26, outline=0, bevel=0)
    box(f'door{s}', M['bronze'], s * 0.09, FY - 0.006, G + 0.03, 0.07, 0.006, 0.14, outline=0, bevel=0)
    pyramid(f'doortop{s}', M['bronze'], s * 0.09, FY - 0.006, G + 0.165, 0.07, 0.04, outline=0)
    cyl(f'rose{s}', M['dark'], 0.025, 0.006, segs=12, outline=0, matrix=Matrix.Translation((s * 0.09, FY - 0.007, G + 0.25)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for j in range(9):
    box(f'frontmerlon{j}', M['stoneDark'], -0.19 + j * 0.0475, FY + 0.003, G + 0.355, 0.025, 0.02, 0.035, outline=0.001, bevel=0)
for s in (-1, 1):
    tx = s * 0.3
    box(f'tower{s}', M['stone'], tx, FY + 0.12, G - 0.005, 0.18, 0.18, 0.5, outline=0.008, bevel=0)
    for k in range(2):
        box(f'towerwin{s}{k}', M['dark'], tx, FY + 0.027, G + 0.2 + k * 0.14, 0.03, 0.006, 0.07, outline=0, bevel=0)
    for j in range(4):
        for fy in (-1, 1):
            box(f'towermerlon{s}{j}{fy}', M['stoneDark'], tx - 0.07 + j * 0.047, FY + 0.12 + fy * 0.08, G + 0.495, 0.025, 0.02, 0.035, outline=0.001, bevel=0)
# the Mudéjar brick tower behind with its tiled spire
box('mudejartower', M['brick'], 0.12, FY + 0.6, G - 0.005, 0.14, 0.14, 0.58, outline=0.007, bevel=0)
for k in range(3):
    box(f'mudejarband{k}', M['tileGreen'], 0.12, FY + 0.528, G + 0.2 + k * 0.12, 0.14, 0.006, 0.02, outline=0, bevel=0)
lathe('mudejarspire', M['tileGreen'], ((0.085, 0), (0.003, 0.18)), G + 0.575, 0.12, FY + 0.6, segs=4, outline=0.004, smooth=False)
box('nave', M['stone'], -0.1, FY + 0.6, G - 0.005, 0.3, 0.4, 0.3, outline=0.006, bevel=0)

# ---------- the square: the steps and the fountain ----------
for i in range(4):
    box(f'step{i}', M['stoneDark'], 0, FY - 0.04 - i * 0.04, G - 0.005, 0.6 + i * 0.08, 0.04, 0.06 - i * 0.014, outline=0.001, bevel=0)
lathe('fountain', M['stone'], ((0.12, 0), (0.12, 0.03), (0.1, 0.03)), G - 0.004, 0, -0.55, segs=16, outline=0.003)
lathe('fountainwater', M['water'], ((0.105, 0), (0.105, 0.025)), G - 0.002, 0, -0.55, segs=16, outline=0)
lathe('fountaincolumn', M['stone'], ((0.02, 0), (0.016, 0.1), (0.04, 0.11), (0.003, 0.14)), G, 0, -0.55, segs=10, outline=0.002)

# ---------- the town round the monastery ----------
k = 0
for x, y in ((-0.75, -0.3), (-0.75, 0.1), (-0.6, 0.55), (0.65, -0.3), (0.7, 0.1), (0.6, 0.55), (-0.45, -0.75), (0.45, -0.75)):
    h = rng.uniform(0.1, 0.16)
    box(f'house{k}', M['white'], x, y, G - 0.005, 0.2, 0.2, h, outline=0.005, bevel=0)
    box(f'housewin{k}', M['dark'], x, y - 0.103, G + h * 0.5, 0.035, 0.006, 0.04, outline=0, bevel=0)
    loft(f'houseroof{k}', M['roof'], [[(x - 0.105, y - 0.105, G + h - 0.005), (x + 0.105, y - 0.105, G + h - 0.005), (x + 0.105, y + 0.105, G + h - 0.005), (x - 0.105, y + 0.105, G + h - 0.005)],
                                      [(x - 0.105, y - 0.004, G + h + 0.06), (x + 0.105, y - 0.004, G + h + 0.06), (x + 0.105, y + 0.004, G + h + 0.06), (x - 0.105, y + 0.004, G + h + 0.06)]], outline=0.003)
    k += 1

bpy.context.view_layer.update()
turn(before, -20)
render(G)
