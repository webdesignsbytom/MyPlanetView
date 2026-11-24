# A cartoon Anjar for the country maps, built in the set's shared look (../toon.py): the Umayyad town
# in Lebanon's Beqaa valley, laid out like a Roman camp, its two main streets crossing at the
# tetrapylon with its four groups of columns, the rows of shops along them, and the Great Palace's
# rebuilt wall with its two tiers of arches in bands of pale stone and brick, the mountains of the
# Anti-Lebanon behind. Turned a little towards the camera.
# Run: blender -b --factory-startup -P anjar.py -- anjar-1024.png 1024 anjar.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#9ab86a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'road': toon('road', '#ddd4bc', lift=0.18),
    'stone': toon('stone', '#e4d8bc', shadow_mul=(0.82, 0.82, 0.88), lift=0.18),
    'brick': toon('brick', '#b8784e', lift=0.12),
    'white': toon('white', '#f2eee6', lift=0.22),
    'mountain': toon('mountain', '#9a9a7a', shadow_mul=(0.78, 0.78, 0.82)),
    'dark': flat('dark', '#3a322a'),
    'cypress': toon('cypress', '#2f5e34', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['grass'])
before = set(bpy.data.objects)

# ---------- the mountains behind ----------
for k, (x, y, r, h) in enumerate(((-0.5, 0.95, 0.38, 0.32), (0.25, 1.0, 0.32, 0.4), (0.8, 0.75, 0.3, 0.26))):
    mt = lathe(f'mountain{k}', M['mountain'], ((r, 0), (r * 0.65, h * 0.55), (r * 0.25, h * 0.92), (0.0, h)), G - 0.01, x, y, segs=24, outline=0.006)
    mt.visible_shadow = False

# ---------- the two streets and the shops along them ----------
box('cardo', M['road'], 0.0, -0.2, G - 0.004, 0.2, 1.4, 0.012, outline=0.001, bevel=0)
box('decumanus', M['road'], 0.0, -0.2, G - 0.004, 1.9, 0.2, 0.012, outline=0.001, bevel=0)
for sx in (-1, 1):
    for sy in (-1, 1):
        for j in range(3):
            x = sx * (0.22 + j * 0.2)
            y = -0.2 + sy * 0.18
            if math.hypot(abs(x) + 0.1, abs(y) + 0.06) > 1.2:
                continue
            box(f'shop{sx}{sy}{j}', M['stone'], x, y, G - 0.005, 0.16, 0.12, 0.06 + 0.03 * ((j + (sx > 0)) % 2), outline=0.003, bevel=0)
            box(f'shopdoor{sx}{sy}{j}', M['dark'], x, y - sy * 0.063, G - 0.005, 0.05, 0.006, 0.05, outline=0, bevel=0)

# ---------- the tetrapylon at the crossing ----------
for sx in (-1, 1):
    for sy in (-1, 1):
        px, py = sx * 0.07, -0.2 + sy * 0.07
        box(f'plinth{sx}{sy}', M['white'], px, py, G - 0.005, 0.07, 0.07, 0.04, outline=0.003, bevel=0)
        for cx in (-1, 1):
            for cy in (-1, 1):
                x, y = px + cx * 0.022, py + cy * 0.022
                rod(f'tetracol{sx}{sy}{cx}{cy}', M['stone'], (x, y, G + 0.035), (x, y, G + 0.23), 0.008, segs=8, outline=0.001)
        box(f'tetracap{sx}{sy}', M['white'], px, py, G + 0.23, 0.07, 0.07, 0.02, outline=0.002, bevel=0)

# ---------- the Great Palace's wall of arches ----------
PY = 0.42
W = 0.9
for tier, (z0, h, n, span) in enumerate(((G - 0.005, 0.2, 5, 0.12), (G + 0.24, 0.13, 9, 0.065))):
    pier = (W - n * span) / (n + 1)
    for k in range(n + 1):
        x = -W / 2 + pier / 2 + k * (span + pier)
        box(f'pier{tier}{k}', M['stone'], x, PY, z0, pier, 0.07, h, outline=0.004, bevel=0)
    for k in range(n):
        x0 = -W / 2 + pier + k * (span + pier)
        spring = z0 + h - span / 2
        for j in range(6):
            um = (j + 0.5) / 6
            z = spring + span / 2 * math.sqrt(max(0.0, 1 - (2 * um - 1) ** 2))
            box(f'arch{tier}{k}{j}', M['stone'], x0 + span * um, PY, z, span / 6 + 0.002, 0.07, z0 + h + 0.04 - z, outline=0.002, bevel=0)
    for b in range(2):
        box(f'brickband{tier}{b}', M['brick'], 0.0, PY, z0 + h * (0.3 + 0.4 * b), W + 0.004, 0.074, 0.014, outline=0, bevel=0)
box('wallbeam', M['stone'], 0.0, PY, G + 0.195, W, 0.07, 0.045, outline=0.004, bevel=0)
box('wallcap', M['stone'], 0.0, PY, G + 0.41, W + 0.02, 0.08, 0.03, outline=0.003, bevel=0)

for k, (x, y) in enumerate(((-0.75, -0.6), (0.75, -0.6), (-0.6, 0.25), (0.65, 0.3))):
    lathe(f'cypress{k}', M['cypress'], ((0.035, 0), (0.045, 0.1), (0.035, 0.24), (0.003, 0.34)), G - 0.005, x, y, segs=10, outline=0.004)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
