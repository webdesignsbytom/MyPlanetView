# A cartoon Terracotta Army for the country maps, built in the set's shared look (../toon.py): Pit 1
# by the tomb of the First Emperor at Xi'an, rank upon rank of clay warriors standing in the
# corridors between the earth walls, horses at the head of a column, and visitors at the rail
# looking down. Turned a little towards the camera.
# Run: blender -b --factory-startup -P terracotta-army.py -- terracotta-army-1024.png 1024 terracotta-army.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'floor': toon('floor', '#9a7a5a', shadow_mul=(0.86, 0.8, 0.76), lift=0.2),
    'earth': toon('earth', '#b89a74', shadow_mul=(0.86, 0.8, 0.76)),
    'clay': toon('clay', '#c09670', shadow_mul=(0.86, 0.78, 0.72), lift=0.15),
    'clayDark': toon('clayDark', '#9e7656', shadow_mul=(0.86, 0.78, 0.72)),
    'rail': toon('rail', '#8a8e96'),
    'walk': toon('walk', '#d8ccb4', lift=0.2),
    's0': toon('s0', '#e8402c'), 's1': toon('s1', '#2f6fc0'), 's2': toon('s2', '#f0c030'),
    'skin': toon('skin', '#e0a882'),
})

G = tile(M['floor'])
before = set(bpy.data.objects)
rng = random.Random(1399)

# ---------- the earth walls between the corridors ----------
ROWS = [-0.15, 0.13, 0.41, 0.69]
for k, y in enumerate([ROWS[0] - 0.14] + [r + 0.14 for r in ROWS]):
    L = 2 * math.sqrt(max(0.0, 1.3 ** 2 - y ** 2)) - 0.1
    box(f'earthwall{k}', M['earth'], 0.0, y, G - 0.005, L, 0.08, 0.13, outline=0.01, bevel=0)


# ---------- the warriors ----------
def warrior(name, x, y, s=1.0):
    for side in (-1, 1):
        rod(f'{name}leg{side}', M['clayDark'], (x + side * 0.012 * s, y, G), (x + side * 0.012 * s, y, G + 0.06 * s), 0.009 * s, segs=6, outline=0.002)
    rod(f'{name}body', M['clay'], (x, y, G + 0.055 * s), (x, y, G + 0.13 * s), 0.024 * s, r2=0.02 * s, segs=10, outline=0.004)
    for side in (-1, 1):
        rod(f'{name}arm{side}', M['clay'], (x + side * 0.024 * s, y, G + 0.12 * s), (x + side * 0.028 * s, y - 0.01 * s, G + 0.075 * s), 0.008 * s, segs=6, outline=0.002)
    ball(f'{name}head', M['clay'], x, y, G + 0.152 * s, 0.018 * s, outline=0.003)
    ball(f'{name}bun', M['clayDark'], x + 0.008 * s, y + 0.006 * s, G + 0.172 * s, 0.009 * s, outline=0.002)


for r, y in enumerate(ROWS):
    half = math.sqrt(max(0.0, 1.25 ** 2 - y ** 2)) - 0.12
    n = int(2 * half / 0.12)
    for j in range(n):
        x = -half + (j + 0.5) * 2 * half / n
        if r == 0 and abs(x) < 0.25:
            continue
        for lane in (-0.045, 0.045):
            warrior(f'w{r}_{j}_{lane}', x + rng.uniform(-0.01, 0.01), y + lane, s=1.15)
# horses at the head of the front column
for k, x in enumerate((-0.12, 0.12)):
    y = ROWS[0]
    for fx in (-0.04, 0.04):
        for side in (-1, 1):
            rod(f'horseleg{k}{fx}{side}', M['clayDark'], (x + fx, y + side * 0.018, G), (x + fx, y + side * 0.018, G + 0.07), 0.009, segs=6, outline=0.002)
    b = ball(f'horsebody{k}', M['clay'], 0, 0, 0, 0.045, outline=0.006)
    b.scale = (1.5, 0.8, 0.8)
    b.location = (x, y, G + 0.09)
    rod(f'horseneck{k}', M['clay'], (x - 0.05, y, G + 0.1), (x - 0.075, y, G + 0.16), 0.016, segs=8, outline=0.003)
    b = ball(f'horsehead{k}', M['clay'], 0, 0, 0, 0.02, outline=0.004)
    b.scale = (1.5, 0.8, 0.9)
    b.location = (x - 0.09, y, G + 0.165)

# ---------- the visitors' walkway and rail at the front ----------
box('walkway', M['walk'], 0.0, -0.55, G + 0.12, 2.2, 0.16, 0.02, outline=0.006, bevel=0)
box('walkwaywall', M['earth'], 0.0, -0.55, G - 0.005, 2.2, 0.16, 0.125, outline=0.008, bevel=0)
bar('rail', M['rail'], (-1.0, -0.47, G + 0.2), (1.0, -0.47, G + 0.2), 0.01, outline=0.002)
for k in range(9):
    x = -1.0 + k * 0.25
    rod(f'railpost{k}', M['rail'], (x, -0.47, G + 0.14), (x, -0.47, G + 0.2), 0.005, segs=5, outline=0)
for k, x in enumerate((-0.4, -0.3, 0.35)):
    rod(f'visitor{k}', M[f's{k}'], (x, -0.58, G + 0.14), (x, -0.58, G + 0.22), 0.016, segs=8, outline=0.003)
    ball(f'visitorhead{k}', M['skin'], x, -0.58, G + 0.238, 0.016, outline=0.003)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
