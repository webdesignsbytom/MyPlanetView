# A cartoon Ngorongoro Crater for the country maps, built in the set's shared look (../toon.py): the
# great caldera's forested rim round its green floor, the soda lake pink at its edge with flamingos,
# zebras and wildebeest grazing, a pair of acacias, and a Maasai herder in his red shuka on the rim.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P ngorongoro.py -- ngorongoro-1024.png 1024 ngorongoro.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#7aa850', shadow_mul=(0.72, 0.8, 0.74), lift=0.2),
    'rim': toon('rim', '#5a8a3a', shadow_mul=(0.72, 0.8, 0.74)),
    'floor': toon('floor', '#b8c070', shadow_mul=(0.8, 0.82, 0.72), lift=0.15),
    'forest': toon('forest', '#3f6a30', shadow_mul=(0.72, 0.8, 0.78)),
    'lake': toon('lake', '#7ab8d0', lift=0.3),
    'soda': toon('soda', '#f0d0d8', lift=0.25),
    'flamingo': toon('flamingo', '#f07a9a', lift=0.25),
    'zebra': toon('zebra', '#f8f6f0', lift=0.2),
    'stripe': flat('stripe', '#2a2628'),
    'gnu': toon('gnu', '#5a5050'),
    'acacia': toon('acacia', '#5a8a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'bark': toon('bark', '#5a4a40'),
    'shuka': toon('shuka', '#d83a2c', lift=0.2),
    'skin': toon('skin', '#5a3a28'),
})

G = tile(M['grass'])
before = set(bpy.data.objects)
rng = random.Random(2203)

# ---------- the caldera ----------
rim = lathe('crater', M['rim'], ((1.32, 0), (1.18, 0.18), (1.04, 0.3), (0.95, 0.28), (0.86, 0.12), (0.82, 0.03)), G - 0.01, 0.0, 0.0, segs=48, outline=0.014)
rim.visible_shadow = False
lathe('craterfloor', M['floor'], ((0.86, 0), (0.86, 0.05)), G - 0.01, 0.0, 0.0, segs=48, outline=0.006)
F = G + 0.04
for k in range(26):
    a = 2 * math.pi * k / 26 + rng.uniform(-0.05, 0.05)
    if math.sin(a) < -0.6:
        continue
    r = rng.uniform(1.02, 1.12)
    ball(f'rimforest{k}', M['forest'], r * math.cos(a), r * math.sin(a), G + 0.3, rng.uniform(0.06, 0.09), outline=0.008)

# ---------- the soda lake and its flamingos ----------
LX, LY = 0.2, 0.25
lathe('soda', M['soda'], ((0.34, 0), (0.34, 0.012)), F - 0.004, LX, LY, segs=28, outline=0.003)
lathe('lake', M['lake'], ((0.27, 0), (0.27, 0.016)), F - 0.004, LX, LY, segs=28, outline=0.002)
for k in range(16):
    a = 2 * math.pi * k / 16
    x, y = LX + 0.3 * math.cos(a), LY + 0.3 * math.sin(a)
    rod(f'flamingoleg{k}', M['flamingo'], (x, y, F), (x, y, F + 0.035), 0.003, segs=4, outline=0)
    b = ball(f'flamingo{k}', M['flamingo'], 0, 0, 0, 0.016, outline=0.002)
    b.scale = (1.3, 0.8, 0.9)
    b.location = (x, y, F + 0.045)


# ---------- the grazers ----------
def animal(name, x, y, a, mat, zebra=False):
    ca, sa = math.cos(a), math.sin(a)
    for fx in (-0.04, 0.04):
        for s in (-1, 1):
            px, py = x + fx * ca - s * 0.022 * sa, y + fx * sa + s * 0.022 * ca
            rod(f'{name}leg{fx}{s}', M[mat], (px, py, F), (px, py, F + 0.06), 0.009, segs=5, outline=0.002)
    b = ball(f'{name}body', M[mat], 0, 0, 0, 0.045, outline=0.005)
    b.scale = (1.45, 0.75, 0.8)
    b.rotation_euler = (0, 0, a)
    b.location = (x, y, F + 0.085)
    hx, hy = x + 0.075 * ca, y + 0.075 * sa
    rod(f'{name}neck', M[mat], (x + 0.045 * ca, y + 0.045 * sa, F + 0.1), (hx, hy, F + 0.115), 0.018, segs=6, outline=0.003)
    b = ball(f'{name}head', M[mat], 0, 0, 0, 0.022, outline=0.003)
    b.scale = (1.5, 0.8, 0.9)
    b.rotation_euler = (0, 0, a)
    b.location = (hx + 0.012 * ca, hy + 0.012 * sa, F + 0.105)
    if zebra:
        for j in range(4):
            box(f'{name}stripe{j}', M['stripe'], x - 0.04 * ca + j * 0.027 * ca, y - 0.04 * sa + j * 0.027 * sa, F + 0.07, 0.009, 0.07, 0.06, rot_z=a, outline=0, bevel=0)


for k, (x, y, a, z) in enumerate(((-0.35, -0.1, 0.3, True), (-0.2, -0.25, 0.1, True), (-0.45, 0.25, -0.4, True), (-0.05, -0.4, 2.8, False), (0.15, -0.3, 3.0, False),
                                  (0.35, -0.35, 2.6, False), (-0.55, 0.0, 0.5, False))):
    animal(f'grazer{k}', x, y, a, 'zebra' if z else 'gnu', zebra=z)

# ---------- acacias ----------
for k, (x, y) in enumerate(((-0.45, 0.5), (0.55, -0.05))):
    rod(f'acaciatrunk{k}', M['bark'], (x, y, F), (x, y, F + 0.18), 0.016, r2=0.012, segs=6, outline=0.003)
    b = ball(f'acaciatop{k}', M['acacia'], 0, 0, 0, 0.14, outline=0.008)
    b.scale = (1.0, 1.0, 0.25)
    b.location = (x, y, F + 0.2)

# ---------- the Maasai herder on the rim ----------
a = math.radians(250)
MX, MY, MZ = 1.06 * math.cos(a), 1.06 * math.sin(a), G + 0.27
lathe('shuka', M['shuka'], ((0.035, 0), (0.025, 0.1), (0.018, 0.13)), MZ, MX, MY, segs=10, outline=0.004)
ball('herderhead', M['skin'], MX, MY, MZ + 0.155, 0.022, outline=0.003)
rod('herderstaff', M['bark'], (MX + 0.04, MY, MZ), (MX + 0.045, MY, MZ + 0.2), 0.004, segs=4, outline=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
