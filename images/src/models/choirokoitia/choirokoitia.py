# A cartoon Choirokoitia for the country maps, built in the set's shared look (../toon.py): the
# Neolithic village on its hillside in the south of Cyprus, nine thousand years old, its round
# houses of stone and mud brick with flat roofs rebuilt beside the excavated ones, their low
# doorways and the ladders onto the roofs, the stone wall round the village, and the
# carob trees. Turned a little towards the camera.
# Run: blender -b --factory-startup -P choirokoitia.py -- choirokoitia-1024.png 1024 choirokoitia.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#b0b86c', shadow_mul=(0.74, 0.78, 0.8), lift=0.2),
    'slope': toon('slope', '#c0b07c', shadow_mul=(0.78, 0.78, 0.82)),
    'stone': toon('stone', '#d0bc98', shadow_mul=(0.8, 0.78, 0.84), lift=0.15),
    'mud': toon('mud', '#c8a070', lift=0.12),
    'roof': toon('roof', '#b89468'),
    'wood': toon('wood', '#6a4a30'),
    'dark': flat('dark', '#2e2420'),
    'tree': toon('tree', '#5a8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(385086)
def tree(name, x, y, r=0.09, h=0.12, mat="tree"):
    rod(name + "trunk", M["trunk"], (x, y, G), (x, y, G + h), 0.012, segs=6, outline=0.002)
    b = ball(name, M[mat], 0, 0, 0, r, outline=0.008)
    b.scale = (1.1, 1.1, 0.95)
    b.location = (x, y, G + h + r * 0.75)


# ---------- the round houses ----------
HOUSES = ((-0.3, -0.15, 0.17, 0.2), (0.05, -0.3, 0.14, 0.17), (0.3, 0.0, 0.16, 0.19), (-0.05, 0.15, 0.13, 0.16), (-0.5, 0.25, 0.12, 0.15), (0.45, -0.4, 0.11, 0.14))
for k, (x, y, r, h) in enumerate(HOUSES):
    lathe(f'house{k}', M['stone'] if k % 2 == 0 else M['mud'], ((r, 0), (r * 0.97, h)), G - 0.005, x, y, segs=24, outline=0.005, smooth=False)
    lathe(f'roof{k}', M['roof'], ((r + 0.015, 0), (r + 0.015, 0.02), (r * 0.8, 0.035)), G + h - 0.005, x, y, segs=24, outline=0.003, smooth=False)
    box(f'door{k}', M['dark'], x, y - r - 0.002, G - 0.005, 0.045, 0.01, 0.07, outline=0, bevel=0)
    if k < 3:
        for s in (-1, 1):
            bar(f'ladder{k}{s}', M['wood'], (x + r * 0.7 + s * 0.016, y - r * 0.7, G), (x + r * 0.6 + s * 0.016, y - r * 0.55, G + h + 0.05), 0.007, outline=0)
# the excavated ones: low round walls
for k in range(7):
    x, y = -0.75 + 1.4 * rng.random(), 0.45 + 0.35 * rng.random()
    if math.hypot(x, y) > 1.05:
        continue
    lathe(f'ruin{k}', M['stone'], ((0.08, 0), (0.08, 0.03 + 0.02 * rng.random()), (0.06, 0.04), (0.06, 0.0)), G - 0.005, x, y, segs=16, outline=0.002, smooth=False)
# the village wall
for k in range(12):
    a0, a1 = math.pi + 0.25 + k * 0.22, math.pi + 0.25 + (k + 1) * 0.22
    p0 = (0.85 * math.cos(a0), 0.85 * math.sin(a0) + 0.1)
    p1 = (0.85 * math.cos(a1), 0.85 * math.sin(a1) + 0.1)
    bar(f'wall{k}', M['stone'], (p0[0], p0[1], G + 0.03), (p1[0], p1[1], G + 0.03), 0.05, outline=0.002)

for k, (x, y) in enumerate(((-0.95, -0.55), (0.9, -0.55), (1.0, 0.3), (-1.0, 0.2))):
    tree(f'carob{k}', x, y, r=0.1, h=0.1)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
