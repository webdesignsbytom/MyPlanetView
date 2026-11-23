# A cartoon Alamo for the country maps, built in the set's shared look (../toon.py): the old
# mission chapel in San Antonio, its pale limestone front with the famous curved hump of a parapet,
# the arched doorway between pairs of columns and the empty niches, the chapel's body behind, the
# long barrack's low wall beside it, and the spreading live oaks on the plaza. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P alamo.py -- alamo-1024.png 1024 alamo.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'plaza': toon('plaza', '#d8ccb0', shadow_mul=(0.84, 0.82, 0.86), lift=0.2),
    'lawn': toon('lawn', '#8ab85a'),
    'limestone': toon('limestone', '#e4d8b8', shadow_mul=(0.86, 0.84, 0.8), lift=0.1),
    'limeDark': toon('limeDark', '#c4b48e'),
    'dark': flat('dark', '#3a3028'),
    'oak': toon('oak', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#5a4a40'),
    'flag': toon('flag', '#c43a2a'),
    'white': toon('white', '#f4f0e6'),
})

G = tile(M['plaza'])
before = set(bpy.data.objects)
box('lawn', M['lawn'], 0.0, -0.45, G - 0.003, 0.7, 0.3, 0.008, outline=0.002, bevel=0)

# ---------- the chapel ----------
CX, CY = 0.0, 0.1
box('chapelbody', M['limestone'], CX, CY + 0.25, G - 0.005, 0.4, 0.5, 0.22, outline=0.008, bevel=0)
FW, FH = 0.5, 0.26
box('front', M['limestone'], CX, CY, G - 0.005, FW, 0.08, FH, outline=0.008, bevel=0)
# the hump
cyl('hump', M['limestone'], 0.11, 0.08, segs=24, outline=0.006, matrix=Matrix.Translation((CX, CY, G + FH - 0.02)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for s in (-1, 1):
    cyl(f'scroll{s}', M['limestone'], 0.035, 0.08, segs=14, outline=0.004, matrix=Matrix.Translation((CX + s * 0.13, CY, G + FH)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
box('cornice', M['limeDark'], CX, CY - 0.02, G + FH - 0.02, FW + 0.02, 0.06, 0.02, outline=0.002, bevel=0)
# the doorway, columns and niches
box('door', M['dark'], CX, CY - 0.042, G - 0.005, 0.09, 0.006, 0.12, outline=0, bevel=0)
cyl('doortop', M['dark'], 0.045, 0.006, segs=14, outline=0, matrix=Matrix.Translation((CX, CY - 0.042, G + 0.115)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for s in (-1, 1):
    for j, dx in enumerate((0.08, 0.17)):
        rod(f'column{s}{j}', M['limeDark'], (CX + s * dx, CY - 0.05, G - 0.005), (CX + s * dx, CY - 0.05, G + 0.14), 0.013, segs=10, outline=0.002)
        rod(f'uppercolumn{s}{j}', M['limeDark'], (CX + s * dx, CY - 0.05, G + 0.15), (CX + s * dx, CY - 0.05, G + 0.23), 0.011, segs=10, outline=0.002)
    for z in (0.04, 0.16):
        box(f'niche{s}{z}', M['dark'], CX + s * 0.125, CY - 0.042, G + z, 0.035, 0.006, 0.06, outline=0, bevel=0)
    box(f'window{s}', M['dark'], CX + s * 0.05, CY - 0.042, G + 0.17, 0.02, 0.006, 0.03, outline=0, bevel=0)
box('ledge', M['limeDark'], CX, CY - 0.05, G + 0.14, FW, 0.02, 0.012, outline=0.001, bevel=0)

# ---------- the long barrack ----------
box('barrack', M['limestone'], -0.62, 0.25, G - 0.005, 0.4, 0.14, 0.12, outline=0.006, bevel=0)
for j in range(4):
    box(f'barrackwin{j}', M['dark'], -0.77 + j * 0.1, 0.178, G + 0.03, 0.03, 0.006, 0.05, outline=0, bevel=0)
box('lowwall', M['limestone'], -0.42, -0.05, G - 0.005, 0.04, 0.5, 0.06, outline=0.003, bevel=0)
rod('flagpole', M['white'], (0.55, -0.2, G), (0.55, -0.2, G + 0.4), 0.005, segs=6, outline=0)
box('flag', M['flag'], 0.6, -0.2, G + 0.33, 0.09, 0.004, 0.06, outline=0.001, bevel=0)

# ---------- live oaks ----------
for k, (x, y, r) in enumerate(((0.7, 0.3, 0.16), (-0.7, -0.45, 0.15), (0.45, -0.7, 0.13), (-0.25, 0.75, 0.13))):
    rod(f'oaktrunk{k}', M['trunk'], (x, y, G), (x + 0.03, y, G + 0.14), 0.025, segs=6, outline=0.003)
    b = ball(f'oak{k}', M['oak'], 0, 0, 0, r, outline=0.008)
    b.scale = (1.4, 1.3, 0.6)
    b.location = (x + 0.03, y, G + 0.17)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
