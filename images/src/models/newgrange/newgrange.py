# A cartoon Newgrange for the country maps, built in the set's shared look (../toon.py): the
# Stone Age passage tomb in the bend of the Boyne, its great round grassy mound faced with a wall of
# white quartz studded with dark granite cobbles, the ring of kerbstones, the entrance with its
# roof-box and the carved entrance stone's spirals in front, and the standing stones round it.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P newgrange.py -- newgrange-1024.png 1024 newgrange.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'mound': toon('mound', '#6aa54a', shadow_mul=(0.7, 0.78, 0.8)),
    'quartz': toon('quartz', '#f6f6f2', shadow_mul=(0.82, 0.84, 0.9), lift=0.15),
    'cobble': toon('cobble', '#6a6a70'),
    'kerb': toon('kerb', '#a8a49c', shadow_mul=(0.84, 0.84, 0.88)),
    'spiral': flat('spiral', '#5a5650'),
    'dark': flat('dark', '#2e2a28'),
    'standing': toon('standing', '#9a968e', shadow_mul=(0.84, 0.84, 0.88)),
})

G = tile(M['grass'])
before = set(bpy.data.objects)
rng = random.Random(2339)

MX, MY, R = 0.0, 0.15, 0.62
# ---------- the mound and its quartz face ----------
lathe('quartzwall', M['quartz'], ((R, 0), (R, 0.16)), G - 0.005, MX, MY, segs=40, outline=0.01)
mnd = lathe('mound', M['mound'], ((R + 0.005, 0), (R * 0.9, 0.08), (R * 0.65, 0.16), (R * 0.3, 0.21), (0.004, 0.22)), G + 0.15, MX, MY, segs=40, outline=0.01)
for j in range(40):
    a = rng.uniform(math.pi * 1.05, math.pi * 1.95)
    z = rng.uniform(0.02, 0.14)
    ball(f'cobble{j}', M['cobble'], MX + (R + 0.002) * math.cos(a), MY + (R + 0.002) * math.sin(a), G + z, 0.014, outline=0)
# the kerbstones
for j in range(30):
    a = 2 * math.pi * j / 30
    box(f'kerb{j}', M['kerb'], MX + (R + 0.04) * math.cos(a), MY + (R + 0.04) * math.sin(a), G - 0.005, 0.13, 0.04, 0.05, rot_z=a + math.pi / 2, outline=0.003, bevel=0)

# ---------- the entrance ----------
EY = MY - R
box('entranceframe', M['kerb'], MX, EY - 0.005, G - 0.005, 0.14, 0.03, 0.14, outline=0.004, bevel=0)
box('entrance', M['dark'], MX, EY - 0.021, G - 0.005, 0.07, 0.004, 0.09, outline=0, bevel=0)
box('roofbox', M['dark'], MX, EY - 0.021, G + 0.105, 0.06, 0.004, 0.025, outline=0, bevel=0)
b = ball('entrancestone', M['kerb'], 0, 0, 0, 0.5, outline=0.006)
b.scale = (0.32, 0.08, 0.1)
b.location = (MX, EY - 0.1, G + 0.03)
for s in (-1, 1):
    for k in range(3):
        y0 = EY - 0.138 - 0.004 * (2 * k)
        cyl(f'spiral{s}{k}', M['spiral'], 0.03 - k * 0.009, 0.004, segs=14, outline=0, matrix=Matrix.Translation((MX + s * 0.07, y0, G + 0.04)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
        cyl(f'spiralgap{s}{k}', M['kerb'], 0.025 - k * 0.009, 0.004, segs=14, outline=0, matrix=Matrix.Translation((MX + s * 0.07, y0 - 0.004, G + 0.04)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))

# ---------- the standing stones ----------
for j in range(10):
    a = math.radians(200 + j * 15)
    r = R + 0.32
    x, y = MX + r * math.cos(a), MY + r * math.sin(a) * 0.85
    if math.hypot(x, y) > 1.2 or abs(x) < 0.26:
        continue
    h = rng.uniform(0.12, 0.2)
    box(f'standing{j}', M['standing'], x, y, G - 0.005, 0.07, 0.05, h, rot_z=a, outline=0.004, bevel=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
