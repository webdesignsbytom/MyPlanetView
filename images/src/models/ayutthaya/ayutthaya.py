# A cartoon Ayutthaya (Wat Phra Si Sanphet) for the country maps, built in the set's shared look
# (../toon.py): the three great bell-shaped chedis in a row, each on its stepped square base
# with its little throne and ringed spire, on a long platform among ruined red-brick walls and
# pillars, with a great tree. Turned a little towards the camera.
# Run: blender -b --factory-startup -P ayutthaya.py -- ayutthaya-1024.png 1024 ayutthaya.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'stone': toon('stone', '#aaa294', shadow_mul=(0.78, 0.76, 0.84)),
    'patina': toon('patina', '#837b70', shadow_mul=(0.78, 0.76, 0.84)),
    'brick': toon('brick', '#b5644a'),
    'tree': toon('tree', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5238'),
})

G = tile()
before = set(bpy.data.objects)

# ---------- the long platform ----------
box('platform', M['patina'], 0, 0.05, G - 0.005, 1.7, 0.6, 0.07, outline=0.028, bevel=0.006)
P = G + 0.065

BELL = ((0.13, 0), (0.17, 0.05), (0.18, 0.12), (0.165, 0.2), (0.12, 0.27), (0.07, 0.3))
SPIRE = ((0.05, 0), (0.05, 0.025), (0.043, 0.035), (0.043, 0.06), (0.036, 0.07), (0.036, 0.095), (0.029, 0.105),
         (0.029, 0.13), (0.022, 0.14), (0.02, 0.2), (0.004, 0.36))


def chedi(k, x, y):
    z = P
    for j, side in enumerate((0.42, 0.36, 0.3)):
        box(f'base{k}{j}', M['patina'] if j % 2 == 0 else M['stone'], x, y, z, side, side, 0.06, outline=0.02, bevel=0.005)
        z += 0.06
    lathe(f'bell{k}', M['stone'], BELL, z, x, y, segs=28, outline=0.03)
    z += 0.3
    box(f'throne{k}', M['patina'], x, y, z - 0.01, 0.12, 0.12, 0.07, outline=0.016, bevel=0.004)
    lathe(f'spire{k}', M['stone'], SPIRE, z + 0.06, x, y, segs=16, outline=0.016)


for k, x in enumerate((-0.56, 0.0, 0.56)):
    chedi(k, x, 0.05)

# ---------- ruined brick walls and pillars ----------
for k, (x, y, w, h) in enumerate(((-0.6, -0.55, 0.36, 0.1), (0.05, -0.62, 0.28, 0.07), (0.62, -0.5, 0.3, 0.12))):
    box(f'wall{k}', M['brick'], x, y, G - 0.005, w, 0.07, h, outline=0.018, bevel=0.004)
for k, (x, y, h) in enumerate(((-0.95, 0.0, 0.26), (-0.85, 0.45, 0.2), (0.95, 0.35, 0.24), (0.9, -0.15, 0.18))):
    box(f'pillar{k}', M['brick'], x, y, G - 0.005, 0.08, 0.08, h, outline=0.016, bevel=0.004)

# ---------- a great tree ----------
rod('trunk', M['trunk'], (-1.0, -0.6, G), (-1.0, -0.6, G + 0.3), 0.06, r2=0.04, segs=10, outline=0.02)
for k, (dx, dy, dz, r) in enumerate(((0, 0, 0.42, 0.2), (0.15, 0.05, 0.36, 0.14), (-0.13, -0.04, 0.36, 0.14))):
    ball(f'tree{k}', M['tree'], -1.0 + dx, -0.6 + dy, G + dz, r, outline=0.025)

turn(before, -20)
render(G)
