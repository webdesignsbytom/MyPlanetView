# A cartoon Taxila for the country maps, built in the set's shared look (../toon.py): the Gandharan
# city in the Punjab of Pakistan, its great Dharmarajika stupa, a round dome of stone on its
# drum, ringed by the bases of the little votive stupas and chapels, the monastery's square
# court of cells beside it, and the green Margalla hills behind. Turned a little towards the camera.
# Run: blender -b --factory-startup -P taxila.py -- taxila-1024.png 1024 taxila.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#94bc62', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'hill': toon('hill', '#7aa058', shadow_mul=(0.7, 0.78, 0.8)),
    'stone': toon('stone', '#c8b498', shadow_mul=(0.8, 0.78, 0.84), lift=0.15),
    'stoneDark': toon('stoneDark', '#a8947a'),
    'path': toon('path2', '#e0d2b2', lift=0.18),
    'dark': flat('dark', '#2e2822'),
    'tree': toon('tree', '#4e8a3e', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(156093)

for k, (x, y, r, h) in enumerate(((-0.55, 0.95, 0.4, 0.3), (0.3, 1.0, 0.36, 0.36))):
    hl = lathe(f'hill{k}', M['hill'], ((r, 0), (r * 0.7, h * 0.6), (r * 0.3, h * 0.95), (0.0, h)), G - 0.01, x, y, segs=20, outline=0.006)
    hl.visible_shadow = False

# ---------- the Dharmarajika stupa ----------
SX, SY = -0.2, 0.15
lathe('stupaterrace', M['stoneDark'], ((0.4, 0), (0.4, 0.05), (0.36, 0.06)), G - 0.005, SX, SY, segs=32, outline=0.004)
lathe('stupadrum', M['stone'], ((0.3, 0), (0.3, 0.12), (0.28, 0.13)), G + 0.055, SX, SY, segs=32, outline=0.005)
lathe('stupadome', M['stone'], [(0.27 * math.cos(a), 0.2 * math.sin(a)) for a in [k * math.pi / 16 for k in range(9)]], G + 0.18, SX, SY, segs=32, outline=0.006)
box('stupaharmika', M['stoneDark'], SX, SY, G + 0.37, 0.07, 0.07, 0.04, outline=0.002, bevel=0)
for k in range(4):
    a = k * math.pi / 2 - math.pi / 2
    x, y = SX + 0.38 * math.cos(a), SY + 0.38 * math.sin(a)
    box(f'stair{k}', M['stoneDark'], x, y, G - 0.005, 0.08 if k % 2 == 0 else 0.06, 0.06 if k % 2 == 0 else 0.08, 0.04, outline=0.002, bevel=0)
for k in range(14):
    a = 2 * math.pi * k / 14 + 0.2
    x, y = SX + 0.52 * math.cos(a), SY + 0.52 * math.sin(a)
    if y > 0.62:
        continue
    box(f'chapel{k}', M['stone'], x, y, G - 0.005, 0.08, 0.08, 0.04 + 0.04 * rng.random(), rot_z=a, outline=0.002, bevel=0)
for k in range(6):
    a = 2 * math.pi * k / 6 + 0.5
    x, y = SX + 0.68 * math.cos(a), SY + 0.68 * math.sin(a)
    lathe(f'votive{k}', M['stone'], ((0.04, 0), (0.04, 0.03), (0.032, 0.035), (0.02, 0.06), (0.0, 0.065)), G - 0.005, x, y, segs=12, outline=0.002)

# ---------- the monastery's court of cells ----------
MX, MY, W = 0.55, -0.4, 0.5
for k, (x, y, sx, sy) in enumerate(((MX, MY - W / 2, W, 0.04), (MX, MY + W / 2, W, 0.04), (MX - W / 2, MY, 0.04, W), (MX + W / 2, MY, 0.04, W))):
    box(f'cellouter{k}', M['stone'], x, y, G - 0.005, sx, sy, 0.08, outline=0.003, bevel=0)
for k, (x, y, sx, sy) in enumerate(((MX, MY - W / 2 + 0.1, W - 0.16, 0.03), (MX, MY + W / 2 - 0.1, W - 0.16, 0.03), (MX - W / 2 + 0.1, MY, 0.03, W - 0.16), (MX + W / 2 - 0.1, MY, 0.03, W - 0.16))):
    box(f'cellinner{k}', M['stone'], x, y, G - 0.005, sx, sy, 0.06, outline=0.002, bevel=0)
for k in range(4):
    t = -W / 2 + 0.1 + k * (W - 0.2) / 3
    box(f'cellwallf{k}', M['stone'], MX + t, MY - W / 2 + 0.05, G - 0.005, 0.02, 0.1, 0.07, outline=0.001, bevel=0)
    box(f'cellwallb{k}', M['stone'], MX + t, MY + W / 2 - 0.05, G - 0.005, 0.02, 0.1, 0.07, outline=0.001, bevel=0)
box('cellcourt', M['path'], MX, MY, G - 0.004, W - 0.2, W - 0.2, 0.008, outline=0.001, bevel=0)
box('cellgate', M['dark'], MX, MY - W / 2 - 0.021, G - 0.005, 0.06, 0.006, 0.07, outline=0, bevel=0)

for k, (x, y) in enumerate(((-0.85, -0.3), (-0.7, -0.6), (0.2, -0.85), (0.95, 0.25), (-0.95, 0.25))):
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.12), 0.012, segs=6, outline=0.002)
    b = ball(f'tree{k}', M['tree'], 0, 0, 0, 0.09, outline=0.008)
    b.scale = (1.1, 1.1, 0.95)
    b.location = (x, y, G + 0.19)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
