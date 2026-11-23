# A cartoon Ephesus for the country maps, built in the set's shared look (../toon.py): the Library
# of Celsus, its two-storey marble front with paired columns on plinths, the triangular and curved
# pediments above, the three doors and the wide steps, standing over the marble street with fallen
# drums and a couple of columns still standing, and cypresses. Turned a little towards the camera.
# Run: blender -b --factory-startup -P ephesus.py -- ephesus-1024.png 1024 ephesus.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#d8c8a0', shadow_mul=(0.86, 0.8, 0.76), lift=0.2),
    'paving': toon('paving', '#ece4d4', shadow_mul=(0.84, 0.82, 0.88), lift=0.15),
    'marble': toon('marble', '#f2ead8', shadow_mul=(0.82, 0.8, 0.86), lift=0.15),
    'wall': toon('wall', '#d8c4a4', shadow_mul=(0.84, 0.8, 0.8)),
    'door': flat('door', '#3a2e28'),
    'cypress': toon('cypress', '#3f6a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'grass': toon('grass2', '#a8b870'),
})

G = tile(M['ground'])
before = set(bpy.data.objects)

box('street', M['paving'], 0.0, -0.45, G - 0.004, 2.4, 0.4, 0.01, rot_z=0.05, outline=0.004, bevel=0)

# ---------- the steps and the back wall ----------
for j in range(3):
    box(f'step{j}', M['marble'], 0.0, 0.12 + j * 0.05, G - 0.005 + j * 0.03, 1.15 - j * 0.04, 0.3 - j * 0.1, 0.035, outline=0.005, bevel=0)
P = G + 0.09
box('backwall', M['wall'], 0.0, 0.34, P - 0.01, 1.0, 0.1, 0.68, outline=0.012, bevel=0)
for k, (x, w, h) in enumerate(((-0.26, 0.09, 0.2), (0.0, 0.11, 0.24), (0.26, 0.09, 0.2))):
    box(f'door{k}', M['door'], x, 0.288, P, w, 0.006, h, outline=0, bevel=0)
    box(f'window{k}', M['door'], x, 0.288, P + 0.42, w * 0.8, 0.006, h * 0.5, outline=0, bevel=0)


def storey(name, centres, z, h, depth):
    for k, cx in enumerate(centres):
        box(f'{name}plinth{k}', M['marble'], cx, 0.22, z - 0.005, 0.15, 0.09, 0.055, outline=0.005, bevel=0)
        for s in (-1, 1):
            rod(f'{name}col{k}{s}', M['marble'], (cx + s * 0.045, 0.22, z + 0.05), (cx + s * 0.045, 0.22, z + 0.05 + h), 0.019, segs=12, outline=0.004)
        box(f'{name}entab{k}', M['marble'], cx, 0.25, z + 0.045 + h, 0.16, depth, 0.045, outline=0.005, bevel=0)


storey('lower', (-0.39, -0.13, 0.13, 0.39), P, 0.24, 0.15)
storey('upper', (-0.26, 0.0, 0.26), P + 0.34, 0.18, 0.15)
box('cornice', M['marble'], 0.0, 0.3, P + 0.33, 1.02, 0.08, 0.03, outline=0.005, bevel=0)
UT = P + 0.34 + 0.045 + 0.18 + 0.045
for k, cx in enumerate((-0.26, 0.26)):
    loft(f'pediment{k}', M['marble'], [[(cx - 0.085, 0.18, UT), (cx + 0.085, 0.18, UT), (cx + 0.085, 0.32, UT), (cx - 0.085, 0.32, UT)],
                                       [(cx - 0.004, 0.18, UT + 0.07), (cx + 0.004, 0.18, UT + 0.07), (cx + 0.004, 0.32, UT + 0.07), (cx - 0.004, 0.32, UT + 0.07)]],
         outline=0.005)
arch = [(0.085 * math.cos(math.pi * j / 8), 0.18, UT + 0.075 * math.sin(math.pi * j / 8)) for j in range(9)]
loft('curvedpediment', M['marble'], [arch, [(x, 0.32, z) for x, _, z in arch]], outline=0.005)

# ---------- the street's ruins and the cypresses ----------
for k, (x, y, h) in enumerate(((-0.85, -0.25, 0.42), (-0.7, -0.3, 0.3), (0.8, -0.25, 0.38))):
    rod(f'streetcol{k}', M['marble'], (x, y, G), (x, y, G + h), 0.025, segs=12, outline=0.005)
    box(f'streetcap{k}', M['marble'], x, y, G + h, 0.07, 0.07, 0.03, outline=0.004, bevel=0)
for k, (x, y, a) in enumerate(((-0.35, -0.6, 0.4), (0.35, -0.7, -0.3), (0.0, -0.95, 1.2))):
    rod(f'drum{k}', M['marble'], (x - 0.09 * math.cos(a), y - 0.09 * math.sin(a), G + 0.03), (x + 0.09 * math.cos(a), y + 0.09 * math.sin(a), G + 0.03), 0.032, segs=12, outline=0.004)
for k, (x, y) in enumerate(((-0.85, 0.55), (-0.7, 0.75), (0.85, 0.55), (0.72, 0.8))):
    lathe(f'cypress{k}', M['cypress'], ((0.05, 0), (0.065, 0.12), (0.04, 0.3), (0.004, 0.42)), G - 0.005, x, y, segs=10, outline=0.006)
for k, (x, y) in enumerate(((-0.6, 0.9), (0.4, 0.95), (-0.95, 0.0), (1.0, 0.1))):
    lathe(f'grass{k}', M['grass'], ((0.13, 0), (0.13, 0.005)), G - 0.003, x, y, segs=12, outline=0.002)

turn(before, -20)
render(G)
