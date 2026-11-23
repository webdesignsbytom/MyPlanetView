# A cartoon Serengeti for the country maps, built in the set's shared look (../toon.py): the
# golden plains, a flat-topped umbrella acacia, a granite kopje with a lion resting on top, and a
# line of wildebeest on the great migration with a couple of zebras among them. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P serengeti.py -- serengeti-1024.png 1024 serengeti.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'savanna': toon('savanna', '#d8b860', shadow_mul=(0.86, 0.8, 0.7), lift=0.2),
    'tuft': toon('tuft', '#c8a040'),
    'acacia': toon('acacia', '#5a8a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'bark': toon('bark', '#5a4a40'),
    'granite': toon('granite', '#a89a90', shadow_mul=(0.84, 0.84, 0.9), lift=0.1),
    'lion': toon('lion', '#d8a050', lift=0.15),
    'mane': toon('mane', '#9a5a2a'),
    'gnu': toon('gnu', '#5a5050', shadow_mul=(0.84, 0.84, 0.9)),
    'horn': toon('horn', '#e8e0d0'),
    'zebra': toon('zebra', '#f8f6f0', lift=0.2),
    'black': flat('stripe', '#2a2628'),
})

G = tile(M['savanna'])
before = set(bpy.data.objects)
rng = random.Random(2059)

for k in range(16):
    x, y = rng.uniform(-1.1, 1.1), rng.uniform(-1.0, 1.0)
    if math.hypot(x, y) > 1.2:
        continue
    lathe(f'tuft{k}', M['tuft'], ((0.04, 0), (0.004, 0.05)), G - 0.005, x, y, segs=5, outline=0.003, smooth=False)

# ---------- the umbrella acacia ----------
AX, AY = -0.55, 0.45
rod('acaciatrunk', M['bark'], (AX, AY, G), (AX + 0.02, AY, G + 0.3), 0.03, r2=0.022, segs=8, outline=0.005)
for k, a in enumerate((0.3, 2.4, 4.4)):
    rod(f'acaciabranch{k}', M['bark'], (AX + 0.02, AY, G + 0.28), (AX + 0.02 + 0.18 * math.cos(a), AY + 0.18 * math.sin(a), G + 0.44), 0.016, r2=0.01, segs=6, outline=0.004)
for k, (dx, dy, r) in enumerate(((0.0, 0.0, 0.3), (0.2, 0.08, 0.2), (-0.2, -0.05, 0.22), (0.05, 0.18, 0.2))):
    b = ball(f'acaciatop{k}', M['acacia'], 0, 0, 0, r, outline=0.012)
    b.scale = (1.0, 1.0, 0.22)
    b.location = (AX + 0.02 + dx, AY + dy, G + 0.47)

# ---------- the kopje and its lion ----------
KX, KY = 0.55, 0.45
for k, (dx, dy, r, h) in enumerate(((0.0, 0.0, 0.26, 0.22), (0.25, 0.1, 0.17, 0.16), (-0.2, 0.15, 0.15, 0.14), (0.05, 0.05, 0.16, 0.34))):
    b = ball(f'boulder{k}', M['granite'], 0, 0, 0, r, outline=0.012)
    b.scale = (1.15, 0.95, h / r)
    b.location = (KX + dx, KY + dy, G + h * 0.55 + (0.12 if k == 3 else 0))
LX, LY, LZ = KX + 0.05, KY - 0.02, G + 0.5
b = ball('lionbody', M['lion'], 0, 0, 0, 0.065, outline=0.007)
b.scale = (1.5, 0.85, 0.7)
b.location = (LX, LY, LZ)
ball('lionmane', M['mane'], LX - 0.09, LY - 0.01, LZ + 0.04, 0.055, outline=0.006)
ball('lionhead', M['lion'], LX - 0.11, LY - 0.03, LZ + 0.04, 0.035, outline=0.004)
rod('liontail', M['lion'], (LX + 0.09, LY, LZ), (LX + 0.15, LY - 0.02, LZ - 0.04), 0.008, segs=5, outline=0)

# ---------- the migration ----------


def animal(name, x, y, a, mat, zebra=False):
    ca, sa = math.cos(a), math.sin(a)
    for fx in (-0.045, 0.045):
        for s in (-1, 1):
            px, py = x + fx * ca - s * 0.025 * sa, y + fx * sa + s * 0.025 * ca
            rod(f'{name}leg{fx}{s}', M[mat], (px, py, G), (px, py, G + 0.07), 0.01, segs=5, outline=0.002)
    b = ball(f'{name}body', M[mat], 0, 0, 0, 0.05, outline=0.006)
    b.scale = (1.45, 0.75, 0.8)
    b.rotation_euler = (0, 0, a)
    b.location = (x, y, G + 0.1)
    hx, hy = x + 0.085 * ca, y + 0.085 * sa
    rod(f'{name}neck', M[mat], (x + 0.05 * ca, y + 0.05 * sa, G + 0.12), (hx, hy, G + 0.13), 0.02, segs=6, outline=0.003)
    b = ball(f'{name}head', M[mat], 0, 0, 0, 0.025, outline=0.003)
    b.scale = (1.5, 0.8, 0.9)
    b.rotation_euler = (0, 0, a)
    b.location = (hx + 0.015 * ca, hy + 0.015 * sa, G + 0.12)
    if zebra:
        for j in range(4):
            box(f'{name}stripe{j}', M['black'], x - 0.045 * ca + j * 0.03 * ca, y - 0.045 * sa + j * 0.03 * sa, G + 0.085, 0.01, 0.08, 0.07, rot_z=a, outline=0, bevel=0)
    else:
        for s in (-1, 1):
            bar(f'{name}horn{s}', M['horn'], (hx - s * 0.012 * sa, hy + s * 0.012 * ca, G + 0.14), (hx - s * 0.03 * sa, hy + s * 0.03 * ca, G + 0.16), 0.008, outline=0)


for k in range(11):
    x = -1.0 + k * 0.19
    y = -0.35 - 0.25 * math.sin(k * 0.55) + rng.uniform(-0.06, 0.06)
    if math.hypot(x, y) > 1.15:
        continue
    animal(f'beast{k}', x, y, math.pi + rng.uniform(-0.25, 0.25), 'zebra' if k in (3, 8) else 'gnu', zebra=k in (3, 8))

bpy.context.view_layer.update()
turn(before, -20)
render(G)
