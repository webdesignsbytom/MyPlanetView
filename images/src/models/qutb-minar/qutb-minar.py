# A cartoon Qutb Minar for the country maps, built in the set's shared look (../toon.py): Delhi's
# fluted red sandstone minaret, its five storeys narrowing upwards with a balcony at each, the
# white marble of the upper storeys, the Alai Darwaza gate's dome, the ruined mosque's arches, and
# the iron pillar. Turned a little towards the camera.
# Run: blender -b --factory-startup -P qutb-minar.py -- qutb-minar-1024.png 1024 qutb-minar.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#8ab860', shadow_mul=(0.72, 0.8, 0.74), lift=0.2),
    'red': toon('redSandstone', '#c0684a', shadow_mul=(0.86, 0.76, 0.72)),
    'redDark': toon('redSandstoneDark', '#a0543a', shadow_mul=(0.86, 0.76, 0.72)),
    'marble': toon('marble', '#f4efe4', lift=0.2),
    'stone': toon('stone', '#c8b08a', shadow_mul=(0.86, 0.8, 0.76)),
    'iron': toon('iron', '#4a4650'),
    'window': flat('window', '#2e2a28'),
    'path': toon('path2', '#d9c9a8', lift=0.25),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)

# ---------- the minaret: five storeys, fluted, a balcony on each ----------
MX, MY = 0.15, 0.25
STOREYS = [(0.14, 0.12, 0.3, 'red'), (0.12, 0.105, 0.22, 'red'), (0.105, 0.09, 0.17, 'red'), (0.09, 0.08, 0.12, 'marble'), (0.08, 0.07, 0.1, 'marble')]
z = G - 0.005
for i, (r0, r1, h, mat) in enumerate(STOREYS):
    lathe(f'storey{i}', M[mat], ((r0, 0), (r1, h)), z, MX, MY, segs=24, outline=0.01)
    for j in range(12):
        a = 2 * math.pi * j / 12
        rr = (r0 + r1) / 2
        rod(f'flute{i}{j}', M['redDark' if mat == 'red' else 'stone'], (MX + r0 * math.cos(a), MY + r0 * math.sin(a), z + 0.01), (MX + r1 * math.cos(a), MY + r1 * math.sin(a), z + h - 0.01),
            0.012 if i < 3 else 0.008, segs=6, outline=0)
    z += h
    lathe(f'balcony{i}', M['stone'], ((r1 + 0.04, 0), (r1 + 0.04, 0.02)), z - 0.015, MX, MY, segs=24, outline=0.005)
lathe('cupola', M['stone'], ((0.05, 0), (0.04, 0.03), (0.004, 0.06)), z, MX, MY, segs=12, outline=0.004)

# ---------- the Alai Darwaza, the mosque's arches, the iron pillar ----------
AX, AY = -0.55, -0.1
box('alaidarwaza', M['red'], AX, AY, G - 0.005, 0.24, 0.24, 0.18, outline=0.01, bevel=0)
box('alaiarch', M['window'], AX, AY - 0.124, G, 0.07, 0.006, 0.12, outline=0, bevel=0)
lathe('alaidome', M['marble'], ((0.1, 0), (0.09, 0.04), (0.06, 0.08), (0.004, 0.11)), G + 0.175, AX, AY, segs=16, outline=0.008)
for j in range(4):
    x = -0.35 + j * 0.18
    box(f'screenpier{j}', M['stone'], x, 0.65, G - 0.005, 0.05, 0.08, 0.3, outline=0.006, bevel=0)
    if j < 3:
        for k in range(4):
            um = (k + 0.5) / 4
            zz = G + 0.18 + 0.06 * math.sqrt(max(0.0, 1 - (2 * um - 1) ** 2))
            box(f'screenarch{j}{k}', M['stone'], x + 0.025 + 0.13 * um, 0.65, zz, 0.034, 0.08, G + 0.3 - zz, outline=0.002, bevel=0)
rod('ironpillar', M['iron'], (-0.15, -0.25, G), (-0.15, -0.25, G + 0.2), 0.016, segs=10, outline=0.003)
lathe('ironcap', M['iron'], ((0.022, 0), (0.022, 0.02)), G + 0.2, -0.15, -0.25, segs=10, outline=0.002)
box('path', M['path'], 0.0, -0.6, G - 0.004, 0.18, 0.7, 0.008, outline=0.003, bevel=0)
for k, (x, y) in enumerate(((-0.95, 0.2), (0.9, -0.2), (-0.8, -0.6), (0.85, 0.55), (0.55, -0.7))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.08, 0.08, outline=0.011)

turn(before, -20)
render(G)
