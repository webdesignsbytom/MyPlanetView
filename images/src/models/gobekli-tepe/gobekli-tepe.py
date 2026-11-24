# A cartoon Göbekli Tepe for the country maps, built in the set's shared look (../toon.py): the
# world's oldest known temple, its round enclosures of carved T-shaped limestone pillars, two great
# pillars in the middle of each with their arms and belts carved on, foxes and boars in relief, the
# walls between, on its hilltop among the olive trees. Turned a little towards the camera.
# Run: blender -b --factory-startup -P gobekli-tepe.py -- gobekli-tepe-1024.png 1024 gobekli-tepe.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'hill': toon('hill', '#c8b080', shadow_mul=(0.86, 0.8, 0.74), lift=0.2),
    'pit': toon('pit', '#a88a60', shadow_mul=(0.86, 0.8, 0.74)),
    'limestone': toon('limestone', '#ece4d0', shadow_mul=(0.82, 0.82, 0.86), lift=0.12),
    'relief': toon('relief', '#c8bca4'),
    'wall': toon('wall', '#b8a07a', shadow_mul=(0.86, 0.8, 0.74)),
    'canopy': toon('canopy', '#f8f8f6', shadow_mul=(0.84, 0.86, 0.92), lift=0.15),
    'steel': toon('steel', '#6a6a70'),
    'olive': toon('olive', '#8a9a58'),
})

G = tile(M['hill'])
before = set(bpy.data.objects)


def pillar(name, x, y, a, h, s=1.0, carve=False):
    ca, sa = math.cos(a), math.sin(a)
    box(f'{name}stem', M['limestone'], x, y, G - 0.005, 0.05 * s, 0.11 * s, h, rot_z=a, outline=0.004, bevel=0)
    box(f'{name}top', M['limestone'], x, y, G + h - 0.01, 0.06 * s, 0.2 * s, 0.06 * s, rot_z=a, outline=0.004, bevel=0)
    if carve:
        for side in (-1, 1):
            px, py = x + side * 0.027 * s * ca, y + side * 0.027 * s * sa
            bar(f'{name}arm{side}', M['relief'], (px - 0.04 * s * sa, py + 0.04 * s * ca, G + h * 0.75), (px + 0.03 * s * sa, py - 0.03 * s * ca, G + h * 0.45), 0.012 * s, outline=0)
            box(f'{name}belt{side}', M['relief'], px, py, G + h * 0.4, 0.004, 0.11 * s, 0.015 * s, rot_z=a, outline=0, bevel=0)


# ---------- two enclosures ----------
for e, (cx, cy, r) in enumerate(((-0.25, 0.05, 0.45), (0.5, 0.3, 0.32))):
    lathe(f'pit{e}', M['pit'], ((r + 0.05, 0), (r + 0.05, 0.004)), G - 0.004, cx, cy, segs=28, outline=0.003)
    n = 10 if e == 0 else 8
    for j in range(n):
        a = 2 * math.pi * j / n + 0.2
        wx, wy = cx + r * math.cos(a), cy + r * math.sin(a)
        a1 = 2 * math.pi * (j + 1) / n + 0.2
        wx1, wy1 = cx + r * math.cos(a1), cy + r * math.sin(a1)
        box(f'wall{e}{j}', M['wall'], (wx + wx1) / 2, (wy + wy1) / 2, G - 0.005, math.hypot(wx1 - wx, wy1 - wy), 0.04, 0.12, rot_z=math.atan2(wy1 - wy, wx1 - wx), outline=0.003, bevel=0)
        pillar(f'ring{e}{j}', wx, wy, a + math.pi / 2, 0.2 if e == 0 else 0.17, 0.85)
    for s in (-1, 1):
        pillar(f'centre{e}{s}', cx + s * 0.1, cy, 0.0, 0.34 if e == 0 else 0.28, 1.25, carve=True)

for k, (x, y) in enumerate(((-1.0, 0.45), (1.0, -0.45), (-0.7, -0.75))):
    ball(f'olive{k}', M['olive'], x, y, G + 0.08, 0.07, outline=0.007)

turn(before, -20)
render(G)
