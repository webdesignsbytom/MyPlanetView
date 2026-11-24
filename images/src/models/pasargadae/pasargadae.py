# A cartoon Pasargadae for the country maps, built in the set's shared look (../toon.py): the Tomb
# of Cyrus the Great alone on the plain, the little gabled stone house of his burial chamber on its
# six great stepped tiers of limestone, the lone columns of his palaces standing in the distance,
# and the dry grass and hills of Fars. Turned a little towards the camera.
# Run: blender -b --factory-startup -P pasargadae.py -- pasargadae-1024.png 1024 pasargadae.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'plain': toon('plain', '#c8b880', shadow_mul=(0.82, 0.8, 0.8), lift=0.2),
    'hill': toon('hill', '#b0a070', shadow_mul=(0.8, 0.8, 0.82)),
    'stone': toon('stone', '#e0d4b8', shadow_mul=(0.84, 0.84, 0.88), lift=0.1),
    'stoneDark': toon('stoneDark', '#c0b294'),
    'dark': flat('dark', '#3a3028'),
    'path': toon('path', '#d8ccb0'),
    'shrub': toon('shrub', '#8a9a50'),
})

G = tile(M['plain'])
before = set(bpy.data.objects)
rng = random.Random(2579)

for k, (x, y, r, h) in enumerate(((-0.6, 0.85, 0.36, 0.18), (0.2, 0.98, 0.32, 0.22), (0.78, 0.7, 0.3, 0.16))):
    hl = lathe(f'hill{k}', M['hill'], ((r, 0), (r * 0.7, h * 0.65), (r * 0.3, h * 0.95), (0.004, h)), G - 0.01, x, y, segs=20, outline=0.008)
    hl.visible_shadow = False
bar('path', M['path'], (0.0, -0.95, G + 0.002), (0.0, -0.3, G + 0.002), 0.12, outline=0)

# ---------- the tomb ----------
TX, TY = 0.0, 0.0
z = G - 0.005
w = 0.5
for k in range(6):
    h = 0.06 if k < 3 else 0.045
    box(f'tier{k}', M['stone'], TX, TY, z, w, w * 0.85, h, outline=0.006, bevel=0)
    box(f'tierjoint{k}', M['stoneDark'], TX, TY - w * 0.425 - 0.002, z + h * 0.5, w, 0.004, 0.004, outline=0, bevel=0)
    z += h
    w -= 0.055
box('chamber', M['stone'], TX, TY, z - 0.005, 0.2, 0.16, 0.12, outline=0.006, bevel=0)
box('door', M['dark'], TX, TY - 0.083, z - 0.005, 0.04, 0.006, 0.07, outline=0, bevel=0)
box('doorframe', M['stoneDark'], TX, TY - 0.082, z + 0.065, 0.06, 0.006, 0.012, outline=0, bevel=0)
loft('gable', M['stone'], [[(TX - 0.11, TY - 0.09, z + 0.115), (TX + 0.11, TY - 0.09, z + 0.115), (TX + 0.11, TY + 0.09, z + 0.115), (TX - 0.11, TY + 0.09, z + 0.115)],
                           [(TX - 0.004, TY - 0.09, z + 0.18), (TX + 0.004, TY - 0.09, z + 0.18), (TX + 0.004, TY + 0.09, z + 0.18), (TX - 0.004, TY + 0.09, z + 0.18)]], outline=0.004)

# ---------- the palace columns in the distance ----------
for k, (x, y, h) in enumerate(((0.55, 0.45, 0.32), (-0.6, 0.35, 0.28), (-0.5, 0.42, 0.12), (0.68, 0.32, 0.14))):
    box(f'colbase{k}', M['stoneDark'], x, y, G - 0.005, 0.06, 0.06, 0.03, outline=0.002, bevel=0)
    rod(f'col{k}', M['stone'], (x, y, G + 0.025), (x, y, G + h), 0.02, segs=10, outline=0.003)
    box(f'colbed{k}', M['stoneDark'], x + 0.05, y - 0.05, G - 0.005, 0.25, 0.18, 0.012, outline=0.001, bevel=0)
for k in range(14):
    x, y = rng.uniform(-0.9, 0.9), rng.uniform(-0.8, 0.3)
    if math.hypot(x, y) > 1.05 or (abs(x) < 0.35 and abs(y) < 0.35) or abs(x) < 0.1:
        continue
    ball(f'shrub{k}', M['shrub'], x, y, G + 0.015, 0.03, outline=0.002)

turn(before, -20)
render(G)
