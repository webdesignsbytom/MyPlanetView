# A cartoon Humberstone and Santa Laura for the country maps, built in the set's shared look
# (../toon.py): the abandoned saltpetre works in the Atacama desert of Chile, the rusting iron
# leaching plant's tall timber and corrugated-iron shed with its sloping roof, the brick chimney,
# the narrow-gauge rail with a wagon, the town's wooden theatre with its clock, the
# swimming pool tank made from a ship's hull, and the bare desert. Turned a little towards the camera.
# Run: blender -b --factory-startup -P humberstone.py -- humberstone-1024.png 1024 humberstone.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sand': toon('sand', '#d8b88a', shadow_mul=(0.82, 0.8, 0.84), lift=0.18),
    'rust': toon('rust', '#a85a3a', shadow_mul=(0.78, 0.7, 0.74), lift=0.12),
    'rustDark': toon('rustDark', '#7a4a32'),
    'iron': toon('iron', '#7a7a7e'),
    'wood': toon('wood', '#a8845a', lift=0.14),
    'brick': toon('brick', '#b8664a', lift=0.12),
    'white': toon('white', '#f2eee4', lift=0.22),
    'dark': flat('dark', '#2e2622'),
})

G = tile(M['sand'])
before = set(bpy.data.objects)

# ---------- the leaching plant's great shed ----------
PX, PY = -0.15, 0.25
loft('plant', M['rust'], [[(PX - 0.35, PY - 0.2, G - 0.005), (PX + 0.35, PY - 0.2, G - 0.005), (PX + 0.35, PY + 0.2, G - 0.005), (PX - 0.35, PY + 0.2, G - 0.005)],
                          [(PX - 0.35, PY - 0.2, G + 0.22), (PX + 0.35, PY - 0.2, G + 0.42), (PX + 0.35, PY + 0.2, G + 0.42), (PX - 0.35, PY + 0.2, G + 0.22)]], outline=0.007)
for j in range(8):
    x = PX - 0.3 + j * 0.086
    h = 0.22 + 0.2 * (x - PX + 0.35) / 0.7
    box(f'plantrib{j}', M['rustDark'], x, PY - 0.203, G - 0.005, 0.01, 0.006, h, outline=0, bevel=0)
    box(f'plantwin{j}', M['dark'], x + 0.04, PY - 0.203, G + h - 0.1, 0.03, 0.006, 0.05, outline=0, bevel=0)
# the timber trestles and tanks beside it
for k in range(4):
    for s in (-1, 1):
        rod(f'trestle{k}{s}', M['wood'], (PX + 0.45 + s * 0.05, PY - 0.15 + k * 0.1, G), (PX + 0.45 + s * 0.05, PY - 0.15 + k * 0.1, G + 0.2), 0.008, segs=6, outline=0.001)
box('tank', M['iron'], PX + 0.45, PY, G + 0.2, 0.14, 0.38, 0.08, outline=0.004, bevel=0)

# ---------- the chimney ----------
lathe('chimney', M['brick'], ((0.045, 0), (0.035, 0.6), (0.04, 0.62)), G - 0.005, PX - 0.5, PY + 0.25, segs=16, outline=0.005)

# ---------- the rail and a wagon ----------
for s in (-1, 1):
    bar(f'rail{s}', M['iron'], (-1.0, -0.3 + s * 0.025, G + 0.005), (1.0, -0.3 + s * 0.025, G + 0.005), 0.008, outline=0)
for k in range(16):
    box(f'sleeper{k}', M['wood'], -0.95 + k * 0.127, -0.3, G - 0.004, 0.02, 0.08, 0.008, outline=0, bevel=0)
box('wagon', M['rustDark'], 0.25, -0.3, G + 0.03, 0.16, 0.08, 0.07, outline=0.003, bevel=0)
for s in (-1, 1):
    cyl(f'wheel{s}', M['iron'], 0.02, 0.09, segs=10, outline=0.001, matrix=Matrix.Translation((0.25 + s * 0.05, -0.3, G + 0.025)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))

# ---------- the theatre and the pool ----------
TX, TY = 0.5, -0.65
box('theatre', M['wood'], TX, TY, G - 0.005, 0.26, 0.18, 0.16, outline=0.005, bevel=0)
gable('theatreroof', M['iron'], TX, TY, G + 0.155, 0.26, 0.18, 0.07, ridge_x=True, over=0.01)
box('theatrefront', M['wood'], TX, TY - 0.09, G + 0.15, 0.1, 0.01, 0.07, outline=0.002, bevel=0)
cyl('clock', M['white'], 0.025, 0.006, segs=16, outline=0.001, matrix=Matrix.Translation((TX, TY - 0.097, G + 0.19)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for j in range(3):
    box(f'theatredoor{j}', M['dark'], TX - 0.07 + j * 0.07, TY - 0.093, G - 0.005, 0.035, 0.006, 0.08, outline=0, bevel=0)
box('pool', M['rust'], -0.55, -0.65, G - 0.005, 0.3, 0.16, 0.06, outline=0.004, bevel=0)
box('poolinside', M['rustDark'], -0.55, -0.65, G + 0.05, 0.26, 0.12, 0.008, outline=0, bevel=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
