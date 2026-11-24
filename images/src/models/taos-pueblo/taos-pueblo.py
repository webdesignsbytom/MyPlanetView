# A cartoon Taos Pueblo for the country maps, built in the set's shared look (../toon.py): the
# thousand-year-old adobe village under Taos Mountain, its many-storeyed houses stepping back in
# terraces, the wooden ladders and the ends of roof beams poking from the walls, the turquoise doors,
# the creek running through the plaza with its little footbridge, and the white chapel of San
# Geronimo. Turned a little towards the camera.
# Run: blender -b --factory-startup -P taos-pueblo.py -- taos-pueblo-1024.png 1024 taos-pueblo.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#c8b088', shadow_mul=(0.84, 0.82, 0.8), lift=0.2),
    'adobe': toon('adobe', '#c89a6a', shadow_mul=(0.86, 0.82, 0.76), lift=0.06),
    'wood': toon('wood', '#7a5a3a'),
    'turquoise': toon('turquoise', '#3ab0b0', lift=0.15),
    'dark': flat('dark', '#3a2a20'),
    'creek': toon('creek', '#5aa8c8', lift=0.3),
    'white': toon('white', '#f4f0e6', lift=0.15),
    'mountain': toon('mountain', '#6a8a5a', shadow_mul=(0.76, 0.8, 0.82)),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(2609)

for k, (x, y, r, h) in enumerate(((-0.3, 0.88, 0.4, 0.4), (0.45, 0.85, 0.34, 0.3))):
    mt = lathe(f'mountain{k}', M['mountain'], ((r, 0), (r * 0.65, h * 0.6), (r * 0.25, h * 0.92), (0.004, h)), G - 0.01, x, y, segs=14, outline=0.008)
    mt.visible_shadow = False
bar('creek', M['creek'], (-0.95, -0.12, G - 0.001), (0.95, -0.2, G - 0.001), 0.08, outline=0.002)
for s in (-1, 1):
    bar(f'footbridge{s}', M['wood'], (0.05 + s * 0.02, -0.25, G + 0.02), (0.05 + s * 0.02, -0.07, G + 0.02), 0.02, outline=0.001)


def pueblo(name, cx, cy, tiers):
    for i, (w, d, dx, dy) in enumerate(tiers):
        z = G - 0.005 + i * 0.08
        box(f'{name}tier{i}', M['adobe'], cx + dx, cy + dy, z, w, d, 0.08, outline=0.005, bevel=0)
        fy = cy + dy - d / 2
        for j in range(int(w / 0.12)):
            x = cx + dx - w / 2 + 0.06 + j * 0.12
            if rng.random() < 0.6:
                box(f'{name}door{i}{j}', M['turquoise'] if j % 2 else M['dark'], x, fy - 0.003, z + 0.01, 0.025, 0.006, 0.045, outline=0, bevel=0)
            for v in range(2):
                rod(f'{name}viga{i}{j}{v}', M['wood'], (x - 0.02 + v * 0.04, fy + 0.01, z + 0.07), (x - 0.02 + v * 0.04, fy - 0.025, z + 0.07), 0.006, segs=4, outline=0)
        if i < len(tiers) - 1:
            lx = cx + dx - w / 2 + 0.08 + rng.uniform(0, w - 0.16)
            ly = fy - 0.03
            for s in (-1, 1):
                bar(f'{name}ladder{i}{s}', M['wood'], (lx + s * 0.015, ly, z), (lx + s * 0.015, ly + 0.03, z + 0.14), 0.006, outline=0)
            for r in range(4):
                t = (r + 1) / 5
                bar(f'{name}rung{i}{r}', M['wood'], (lx - 0.015, ly + 0.03 * t, z + 0.14 * t), (lx + 0.015, ly + 0.03 * t, z + 0.14 * t), 0.004, outline=0)


pueblo('north', -0.05, 0.42, ((0.9, 0.3, 0.0, 0.0), (0.7, 0.24, 0.05, 0.03), (0.48, 0.18, 0.08, 0.06), (0.28, 0.14, 0.1, 0.08), (0.14, 0.1, 0.12, 0.09)))
pueblo('south', 0.25, -0.48, ((0.6, 0.24, 0.0, 0.0), (0.44, 0.18, -0.03, 0.03), (0.26, 0.14, -0.05, 0.05)))

# ---------- San Geronimo ----------
CX, CY = -0.55, -0.45
box('chapel', M['white'], CX, CY, G - 0.005, 0.18, 0.24, 0.14, outline=0.005, bevel=0)
for s in (-1, 1):
    box(f'chapeltower{s}', M['white'], CX + s * 0.07, CY - 0.11, G - 0.005, 0.05, 0.05, 0.2, outline=0.003, bevel=0)
    box(f'chapelbell{s}', M['dark'], CX + s * 0.07, CY - 0.137, G + 0.15, 0.02, 0.006, 0.03, outline=0, bevel=0)
box('chapeldoor', M['wood'], CX, CY - 0.123, G - 0.005, 0.04, 0.006, 0.07, outline=0, bevel=0)
rod('chapelcross', M['wood'], (CX, CY - 0.11, G + 0.135), (CX, CY - 0.11, G + 0.2), 0.005, segs=4, outline=0)

turn(before, -20)
render(G)
