# A cartoon Wallblake House for the country maps, built in the set's shared look (../toon.py):
# Anguilla's 18th-century plantation house in The Valley, its timber upper floor and veranda on a
# stone ground floor under a hipped roof, the stone kitchen with its chimney, St Gerard's church
# beside it with its open stone front, a flamboyant tree in flower, palms and a low stone wall.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P wallblake-house.py -- wallblake-house-1024.png 1024 wallblake-house.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'stone': toon('stone', '#b8a890', shadow_mul=(0.82, 0.8, 0.84)),
    'stoneDark': toon('stoneDark', '#9a8a74', shadow_mul=(0.82, 0.8, 0.84)),
    'timber': toon('timber', '#f2ead6', shadow_mul=(0.82, 0.8, 0.86), lift=0.2),
    'roof': toon('roof', '#8a3a2c'),
    'shutter': toon('shutter', '#3f8a7a'),
    'window': flat('window', '#3a3640'),
    'white': toon('white', '#f8f6f0', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'flamboyant': toon('flamboyant', '#e0402a'),
    'leaf': toon('leaf', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
    'path': toon('path2', '#d9c9a8', lift=0.25),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(1049)


def squashed(name, mat, x, y, z, r, sx, sy, sz, outline=0.02):
    b = ball(name, mat, 0, 0, 0, r, outline=outline)
    b.scale = (sx, sy, sz)
    b.location = (x, y, z)
    return b


# ---------- Wallblake House ----------
HX, HY, HW, HD = -0.1, 0.2, 0.6, 0.32
box('groundfloor', M['stone'], HX, HY, G - 0.005, HW, HD, 0.14, outline=0.016, bevel=0)
box('upperfloor', M['timber'], HX, HY, G + 0.135, HW, HD, 0.13, outline=0.014, bevel=0)
loft('roof', M['roof'], [[(HX - HW / 2 - 0.05, HY - HD / 2 - 0.12, G + 0.26), (HX + HW / 2 + 0.05, HY - HD / 2 - 0.12, G + 0.26), (HX + HW / 2 + 0.05, HY + HD / 2 + 0.04, G + 0.26),
                          (HX - HW / 2 - 0.05, HY + HD / 2 + 0.04, G + 0.26)],
                         [(HX - HW / 2 + 0.12, HY - 0.02, G + 0.4), (HX + HW / 2 - 0.12, HY - 0.02, G + 0.4), (HX + HW / 2 - 0.12, HY - 0.01, G + 0.4),
                          (HX - HW / 2 + 0.12, HY - 0.01, G + 0.4)]], outline=0.014)
box('veranda', M['timber'], HX, HY - HD / 2 - 0.05, G + 0.135, HW + 0.04, 0.1, 0.012, outline=0.004, bevel=0)
for k in range(7):
    x = HX - HW / 2 + k * HW / 6
    rod(f'verandapost{k}', M['white'], (x, HY - HD / 2 - 0.095, G + 0.145), (x, HY - HD / 2 - 0.095, G + 0.26), 0.006, segs=6, outline=0.002)
for k in range(5):
    x = HX - HW / 2 + 0.07 + k * (HW - 0.14) / 4
    box(f'shutterup{k}', M['shutter'], x, HY - HD / 2 - 0.004, G + 0.16, 0.05, 0.01, 0.08, outline=0, bevel=0)
    box(f'arch{k}', M['window'], x, HY - HD / 2 - 0.004, G + 0.02, 0.04, 0.01, 0.09, outline=0, bevel=0)
# the stone kitchen with its chimney
KX, KY = HX + 0.5, HY + 0.1
box('kitchen', M['stoneDark'], KX, KY, G - 0.005, 0.2, 0.16, 0.12, outline=0.012, bevel=0)
pyramid('kitchenroof', M['roof'], KX, KY, G + 0.115, 0.24, 0.07, outline=0.008)
box('chimney', M['stoneDark'], KX + 0.06, KY + 0.04, G + 0.1, 0.05, 0.05, 0.14, outline=0.006, bevel=0)

# ---------- St Gerard's church: an open stone front ----------
CX, CY = -0.75, -0.1
box('church', M['white'], CX, CY + 0.08, G - 0.005, 0.22, 0.3, 0.16, outline=0.012, bevel=0)
loft('churchroof', M['roof'], [[(CX - 0.125, CY - 0.08, G + 0.155), (CX + 0.125, CY - 0.08, G + 0.155), (CX + 0.125, CY + 0.24, G + 0.155), (CX - 0.125, CY + 0.24, G + 0.155)],
                               [(CX - 0.004, CY - 0.08, G + 0.24), (CX + 0.004, CY - 0.08, G + 0.24), (CX + 0.004, CY + 0.24, G + 0.24), (CX - 0.004, CY + 0.24, G + 0.24)]],
     outline=0.01)
box('churchfront', M['stone'], CX, CY - 0.08, G - 0.005, 0.26, 0.04, 0.28, outline=0.012, bevel=0)
for row in range(3):
    for j in range(4):
        box(f'openwork{row}{j}', M['window'], CX - 0.09 + j * 0.06, CY - 0.102, G + 0.05 + row * 0.07, 0.025, 0.01, 0.035, outline=0, bevel=0)
bar('crossup', M['white'], (CX, CY - 0.08, G + 0.275), (CX, CY - 0.08, G + 0.34), 0.012, outline=0.002)
bar('crossbar', M['white'], (CX - 0.025, CY - 0.08, G + 0.315), (CX + 0.025, CY - 0.08, G + 0.315), 0.012, outline=0.002)

# ---------- the stone wall, the path, a flamboyant tree and palms ----------
for k in range(6):
    box(f'wall{k}', M['stoneDark'], -0.55 + k * 0.22, -0.45, G - 0.005, 0.2, 0.05, 0.06, outline=0.006, bevel=0)
box('path', M['path'], HX, -0.2, G - 0.004, 0.12, 0.45, 0.008, outline=0.004, bevel=0)
FX, FY = 0.6, -0.35
rod('flamboyanttrunk', M['trunk'], (FX, FY, G), (FX, FY, G + 0.16), 0.022, segs=8, outline=0.006)
squashed('flamboyant', M['flamboyant'], FX, FY, G + 0.2, 0.17, 1.4, 1.2, 0.45, outline=0.016)
squashed('flamboyantleaves', M['leaf'], FX + 0.05, FY + 0.06, G + 0.19, 0.12, 1.3, 1.1, 0.35, outline=0.01)
for k, (x, y) in enumerate(((-1.0, 0.45), (0.95, 0.55), (-0.4, 0.85), (1.05, 0.0))):
    h = rng.uniform(0.24, 0.3)
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.03, y, G + h), 0.013, r2=0.01, segs=8, outline=0.005)
    for f in range(6):
        b = 2 * math.pi * f / 6 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.03, y, G + h), (x + 0.03 + 0.1 * math.cos(b), y + 0.1 * math.sin(b), G + h - 0.05), 0.019, outline=0.005)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
