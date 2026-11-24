# A cartoon Golestan Palace for the country maps, built in the set's shared look (../toon.py): the
# Qajar palace in Tehran, the Shams-ol-Emareh with its two tiled towers, the Marble Throne terrace's
# open front on its twisted columns, every wall covered in tiles of blue, yellow and pink, and the
# long pool down the garden with its fountains and plane trees. Turned a little towards the camera.
# Run: blender -b --factory-startup -P golestan.py -- golestan-1024.png 1024 golestan.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'paving': toon('paving', '#e8dcc8', lift=0.15),
    'pool': toon('pool', '#3aa0c8', lift=0.3),
    'tileBlue': toon('tileBlue', '#2f7ac0', lift=0.15),
    'tileYellow': toon('tileYellow', '#f0c050', lift=0.2),
    'tilePink': toon('tilePink', '#e88a9a', lift=0.15),
    'cream': toon('cream', '#f2e8d4', lift=0.15),
    'marble': toon('marble', '#f8f6f0', lift=0.2),
    'window': flat('window', '#2e3a54'),
    'mirror': toon('mirror', '#b8d8e8', lift=0.35),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)

box('courtyard', M['paving'], 0.0, -0.1, G - 0.004, 1.5, 0.95, 0.01, outline=0.003, bevel=0)
box('poolrim', M['marble'], 0.0, -0.3, G - 0.003, 0.24, 0.8, 0.025, outline=0.004, bevel=0)
box('pool', M['pool'], 0.0, -0.3, G - 0.002, 0.18, 0.74, 0.03, outline=0.002, bevel=0)
for j in range(4):
    lathe(f'fountain{j}', M['marble'], ((0.012, 0), (0.004, 0.06)), G + 0.025, 0.0, -0.6 + j * 0.2, segs=6, outline=0.001)


def tiled_front(name, x, y, w, h, z=0.0):
    rows = int(h / 0.06)
    for r in range(rows):
        for c in range(int(w / 0.06)):
            mat = ('tileBlue', 'tileYellow', 'tilePink')[(r + c) % 3]
            box(f'{name}tile{r}{c}', M[mat], x - w / 2 + 0.03 + c * 0.06, y, G + z + 0.03 + r * 0.06, 0.05, 0.006, 0.05, outline=0, bevel=0)


# ---------- the palace range along the back ----------
PY = 0.45
box('range', M['cream'], 0.0, PY, G - 0.005, 1.3, 0.24, 0.24, outline=0.01, bevel=0)
for s in (-1, 1):
    tiled_front(f'range{s}', s * 0.42, PY - 0.124, 0.42, 0.18)
# the Marble Throne terrace in the middle: an open front on twisted columns
box('terraceroom', M['cream'], 0.0, PY - 0.02, G - 0.005, 0.36, 0.2, 0.3, outline=0.009, bevel=0)
box('mirrorwall', M['mirror'], 0.0, PY - 0.123, G + 0.06, 0.3, 0.006, 0.18, outline=0, bevel=0)
for j in range(4):
    x = -0.13 + j * 0.087
    rod(f'twistcol{j}', M['marble'], (x, PY - 0.18, G + 0.04), (x, PY - 0.18, G + 0.25), 0.012, segs=6, outline=0.002)
box('terraceplatform', M['marble'], 0.0, PY - 0.16, G - 0.005, 0.38, 0.1, 0.045, outline=0.004, bevel=0)
box('terraceroof', M['cream'], 0.0, PY - 0.15, G + 0.25, 0.4, 0.12, 0.03, outline=0.004, bevel=0)

# ---------- the Shams-ol-Emareh ----------
SX, SY = 0.42, PY - 0.05
box('shams', M['cream'], SX, SY, G - 0.005, 0.26, 0.2, 0.42, outline=0.01, bevel=0)
tiled_front('shams', SX, SY - 0.102, 0.24, 0.36, 0.0)
for s in (-1, 1):
    tx = SX + s * 0.1
    box(f'shamstower{s}', M['cream'], tx, SY, G + 0.415, 0.08, 0.08, 0.16, outline=0.006, bevel=0)
    tiled_front(f'shamstower{s}', tx, SY - 0.042, 0.06, 0.12, 0.42)
    lathe(f'shamscupola{s}', M['tileBlue'], ((0.05, 0), (0.04, 0.03), (0.004, 0.07)), G + 0.575, tx, SY, segs=10, outline=0.004)

for k, (x, y) in enumerate(((-0.55, -0.15), (-0.55, -0.55), (0.55, -0.55), (0.6, -0.15), (-0.95, 0.25), (0.95, 0.2))):
    rod(f'trunk{k}', M['cream'], (x, y, G), (x, y, G + 0.1), 0.014, segs=6, outline=0.003)
    ball(f'tree{k}', M['tree'], x, y, G + 0.16, 0.09, outline=0.009)

turn(before, -20)
render(G)
