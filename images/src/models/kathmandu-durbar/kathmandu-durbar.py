# A cartoon Kathmandu Durbar Square for the country maps, built in the set's shared look (../toon.py):
# the old royal square of Kathmandu, its tiered Newar pagoda temples standing on their tall stepped
# brick plinths, each with its red brick cella, carved dark wooden doors and struts, roofs of dark
# tiles stacked one over the other and golden finials, the old palace's long brick front with its
# carved wooden windows, and the paving of the square. Turned a little towards the camera.
# Run: blender -b --factory-startup -P kathmandu-durbar.py -- kathmandu-durbar-1024.png 1024 kathmandu-durbar.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#c8b8a0', shadow_mul=(0.84, 0.84, 0.9), lift=0.18),
    'brick': toon('brick', '#a8503a', shadow_mul=(0.8, 0.74, 0.78), lift=0.12),
    'plinth': toon('plinth', '#b8684a', lift=0.12),
    'wood': toon('wood', '#4a3226'),
    'roof': toon('roof', '#5a4636', shadow_mul=(0.8, 0.78, 0.84)),
    'gold': toon('gold', '#e8b440', lift=0.3),
    'white': toon('white', '#f2eee6', lift=0.2),
    'dark': flat('dark', '#2a2220'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)


def pagoda(name, x, y, steps, base, roofs):
    """A temple on its stepped plinth: steps of brick, a square cella, tiered roofs and a gold finial."""
    z = G - 0.005
    for i in range(steps):
        w = base - i * (base - 0.18) / steps
        box(f'{name}step{i}', M['plinth'], x, y, z, w, w, 0.03, outline=0.003, bevel=0)
        z += 0.03
    for i in range(steps):
        w = base - i * (base - 0.18) / steps
        box(f'{name}stair{i}', M['plinth'], x, y - w / 2 - 0.015, G - 0.005, 0.06, 0.03, 0.03 * (i + 1), outline=0.001, bevel=0)
    cw = 0.14
    h = 0.11
    box(f'{name}cella', M['brick'], x, y, z, cw, cw, h, outline=0.004, bevel=0)
    box(f'{name}door', M['wood'], x, y - cw / 2 - 0.004, z, 0.05, 0.006, 0.08, outline=0, bevel=0)
    for s in (-1, 1):
        box(f'{name}doorside{s}', M['wood'], x + s * 0.045, y - cw / 2 - 0.004, z, 0.012, 0.006, 0.1, outline=0, bevel=0)
    z += h
    for k in range(roofs):
        w = 0.32 - k * 0.07
        top = w * 0.4
        loft(f'{name}roof{k}', M['roof'], [[(x - w / 2, y - w / 2, z), (x + w / 2, y - w / 2, z), (x + w / 2, y + w / 2, z), (x - w / 2, y + w / 2, z)],
                                           [(x - top / 2, y - top / 2, z + 0.06), (x + top / 2, y - top / 2, z + 0.06), (x + top / 2, y + top / 2, z + 0.06), (x - top / 2, y + top / 2, z + 0.06)]], outline=0.004)
        if k < roofs - 1:
            box(f'{name}tier{k}', M['brick'], x, y, z + 0.055, top + 0.005, top + 0.005, 0.05, outline=0.003, bevel=0)
            z += 0.1
        else:
            z += 0.06
    lathe(f'{name}finial', M['gold'], ((0.025, 0), (0.02, 0.02), (0.01, 0.05), (0.014, 0.06), (0.002, 0.1)), z - 0.005, x, y, segs=10, outline=0.002)


pagoda('maju', -0.35, 0.05, 7, 0.5, 3)
pagoda('trailokya', 0.35, -0.3, 4, 0.36, 3)
pagoda('narayan', 0.45, 0.4, 3, 0.3, 2)

# ---------- the old palace's front ----------
box('palace', M['brick'], -0.2, 0.75, G - 0.005, 0.9, 0.2, 0.26, outline=0.007, bevel=0)
for row in range(2):
    for j in range(7):
        x = -0.56 + j * 0.12
        box(f'palacewin{row}{j}', M['wood'], x, 0.643, G + 0.06 + row * 0.1, 0.06, 0.008, 0.06, outline=0, bevel=0)
        box(f'palacelattice{row}{j}', M['dark'], x, 0.638, G + 0.07 + row * 0.1, 0.04, 0.006, 0.04, outline=0, bevel=0)
loft('palaceroof', M['roof'], [[(-0.67, 0.63, G + 0.255), (0.27, 0.63, G + 0.255), (0.27, 0.87, G + 0.255), (-0.67, 0.87, G + 0.255)],
                               [(-0.63, 0.746, G + 0.32), (0.23, 0.746, G + 0.32), (0.23, 0.754, G + 0.32), (-0.63, 0.754, G + 0.32)]], outline=0.004)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
