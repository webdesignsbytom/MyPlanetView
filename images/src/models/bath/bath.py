# A cartoon Bath for the country maps, built in the set's shared look (../toon.py): the Roman Baths'
# green pool in its colonnaded terrace with statues along the top, Bath Abbey's Gothic tower behind
# it, and the Royal Crescent's curved row of Georgian houses on its lawn, all in honey-coloured
# Bath stone. Turned a little towards the camera.
# Run: blender -b --factory-startup -P bath.py -- bath-1024.png 1024 bath.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cc061', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'stone': toon('bathStone', '#e8cc94', shadow_mul=(0.86, 0.8, 0.74), lift=0.15),
    'stoneDark': toon('bathStoneDark', '#c8aa74', shadow_mul=(0.86, 0.8, 0.74)),
    'pool': toon('pool', '#5aa878', shadow_mul=(0.74, 0.84, 0.8), lift=0.3),
    'roof': toon('roof', '#5a5e6a'),
    'window': flat('window', '#3a4a64'),
    'paving': toon('paving', '#d8ccb0', lift=0.2),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)
rng = random.Random(1559)

# ---------- the Royal Crescent behind ----------
RC, RR = (0.0, -0.25), 1.05
for k in range(16):
    a = math.radians(55 + k * 4.4)
    x, y = RC[0] + RR * math.cos(a), RC[1] + RR * math.sin(a)
    box(f'crescent{k}', M['stone'], x, y, G - 0.005, 0.085, 0.14, 0.18, rot_z=a + math.pi / 2, outline=0.006, bevel=0)
    box(f'crescentroof{k}', M['roof'], x + 0.02 * math.cos(a), y + 0.02 * math.sin(a), G + 0.175, 0.086, 0.1, 0.03, rot_z=a + math.pi / 2, outline=0.003, bevel=0)
    for row in range(2):
        box(f'crescentwin{k}{row}', M['window'], x - 0.072 * math.cos(a), y - 0.072 * math.sin(a), G + 0.05 + row * 0.07, 0.025, 0.006, 0.04, rot_z=a + math.pi / 2, outline=0,
            bevel=0)
    rod(f'column{k}', M['stone'], (x - 0.075 * math.cos(a), y - 0.075 * math.sin(a), G + 0.05), (x - 0.075 * math.cos(a), y - 0.075 * math.sin(a), G + 0.17), 0.006, segs=6,
        outline=0.002)

# ---------- the Roman Baths: the Great Bath and its terrace ----------
PX, PY = -0.15, -0.35
box('terrace', M['paving'], PX, PY, G - 0.005, 0.8, 0.5, 0.03, outline=0.008, bevel=0)
box('greatbath', M['pool'], PX, PY, G + 0.022, 0.52, 0.26, 0.01, outline=0.004, bevel=0)
for s in (-1, 1):
    box(f'colonnadewall{s}', M['stoneDark'], PX, PY + s * 0.21, G + 0.02, 0.76, 0.06, 0.1, outline=0.006, bevel=0)
    for j in range(9):
        x = PX - 0.34 + j * 0.085
        rod(f'pillar{s}{j}', M['stone'], (x, PY + s * 0.17, G + 0.025), (x, PY + s * 0.17, G + 0.1), 0.009, segs=6, outline=0.002)
        if s > 0:
            rod(f'statue{j}', M['stoneDark'], (x, PY + 0.21, G + 0.12), (x, PY + 0.21, G + 0.17), 0.01, segs=6, outline=0.002)
            ball(f'statuehead{j}', M['stoneDark'], x, PY + 0.21, G + 0.18, 0.01, outline=0.002)
    box(f'colonnaderoof{s}', M['stone'], PX, PY + s * 0.19, G + 0.1, 0.78, 0.1, 0.02, outline=0.004, bevel=0)

# ---------- Bath Abbey ----------
AX, AY = 0.45, 0.05
box('abbeynave', M['stone'], AX, AY, G - 0.005, 0.18, 0.5, 0.2, outline=0.01, bevel=0)
loft('abbeyroof', M['roof'], [[(AX - 0.09, AY - 0.25, G + 0.195), (AX + 0.09, AY - 0.25, G + 0.195), (AX + 0.09, AY + 0.25, G + 0.195), (AX - 0.09, AY + 0.25, G + 0.195)],
                              [(AX - 0.004, AY - 0.25, G + 0.24), (AX + 0.004, AY - 0.25, G + 0.24), (AX + 0.004, AY + 0.25, G + 0.24), (AX - 0.004, AY + 0.25, G + 0.24)]],
     outline=0.008)
box('abbeytower', M['stone'], AX, AY + 0.05, G - 0.005, 0.15, 0.13, 0.42, outline=0.012, bevel=0)
for k in range(4):
    a = math.pi / 4 + k * math.pi / 2
    lathe(f'abbeypinnacle{k}', M['stone'], ((0.014, 0), (0.004, 0.07)), G + 0.41, AX + 0.068 * math.cos(a), AY + 0.05 + 0.06 * math.sin(a), segs=4, outline=0.002, smooth=False)
box('abbeywest', M['window'], AX, AY - 0.254, G + 0.05, 0.08, 0.006, 0.12, outline=0, bevel=0)
for j in range(4):
    box(f'abbeywin{j}', M['window'], AX - 0.094, AY - 0.18 + j * 0.12, G + 0.06, 0.006, 0.05, 0.1, outline=0, bevel=0)
for k, (x, y) in enumerate(((-0.95, -0.2), (0.95, -0.3), (-0.75, -0.75), (0.7, -0.7))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.08, rng.uniform(0.07, 0.09), outline=0.011)

turn(before, -20)
render(G)
