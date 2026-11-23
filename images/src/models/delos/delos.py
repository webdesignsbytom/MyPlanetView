# A cartoon Delos for the country maps, built in the set's shared look (../toon.py): the sacred
# island's Terrace of the Lions, the row of lean marble lions sitting upright on their bases and
# keeping watch over the dry sacred lake, the broken columns and house walls of the ancient town,
# the bare golden hillside, and the blue Aegean all round. Turned a little towards the camera.
# Run: blender -b --factory-startup -P delos.py -- delos-1024.png 1024 delos.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#2f7ab8', shadow_mul=(0.76, 0.84, 0.92), lift=0.3),
    'land': toon('land', '#d8c08a', shadow_mul=(0.86, 0.82, 0.74)),
    'marble': toon('marble', '#f2ece0', shadow_mul=(0.82, 0.84, 0.9), lift=0.15),
    'marbleDark': toon('marbleDark', '#d4ccbc', shadow_mul=(0.82, 0.84, 0.9)),
    'ruin': toon('ruin', '#c8b898'),
    'scrub': toon('scrub', '#9aa060'),
})

G = tile(M['sea'])
before = set(bpy.data.objects)
rng = random.Random(2351)


def grow(objs, f, px, py):
    m = Matrix.Translation((px, py, G)) @ Matrix.Scale(f, 4) @ Matrix.Translation((-px, -py, -G))
    for o in objs:
        o.matrix_world = m @ o.matrix_world


def ring(cx, cy, rx, ry, z, k, sides=28):
    return [(cx + rx * math.cos(t) * (1 + 0.06 * math.sin(3 * t + k)), cy + ry * math.sin(t) * (1 + 0.06 * math.cos(2 * t + k)), G + z) for t in (2 * math.pi * j / sides for j in range(sides))]


isl = loft('island', M['land'], [ring(0.0, 0.1, 1.1, 0.85, -0.01, 1), ring(0.0, 0.1, 1.06, 0.8, 0.05, 1)], outline=0.012, smooth=True)
isl.visible_shadow = False
hill = loft('hill', M['land'], [ring(0.45, 0.6, 0.4, 0.25, 0.04, 2), ring(0.45, 0.65, 0.2, 0.11, 0.18, 2)], outline=0.008, smooth=True)
hill.visible_shadow = False
T = G + 0.05

# ---------- the Terrace of the Lions ----------
mark = set(bpy.data.objects)
for j in range(5):
    x = -0.55 + j * 0.24
    y = -0.25 + 0.04 * j
    box(f'lionbase{j}', M['marbleDark'], x, y, T - 0.005, 0.12, 0.2, 0.06, outline=0.004, bevel=0)
    Z = T + 0.055
    # haunches and front legs: a lion sitting upright, facing the camera's left
    b = ball(f'lionhaunch{j}', M['marble'], 0, 0, 0, 0.05, outline=0.005)
    b.scale = (0.9, 1.3, 0.9)
    b.location = (x, y + 0.04, Z + 0.04)
    for s in (-1, 1):
        rod(f'lionleg{j}{s}', M['marble'], (x + s * 0.025, y - 0.05, Z), (x + s * 0.025, y - 0.04, Z + 0.1), 0.014, segs=6, outline=0.002)
    rod(f'lionchest{j}', M['marble'], (x, y + 0.02, Z + 0.06), (x, y - 0.04, Z + 0.16), 0.035, r2=0.03, segs=8, outline=0.004)
    b = ball(f'lionhead{j}', M['marble'], 0, 0, 0, 0.035, outline=0.004)
    b.scale = (0.9, 1.2, 0.9)
    b.location = (x, y - 0.06, Z + 0.19)
    rod(f'lionsnout{j}', M['marble'], (x, y - 0.08, Z + 0.19), (x, y - 0.11, Z + 0.18), 0.018, segs=6, outline=0.002)
bpy.context.view_layer.update()
grow([o for o in bpy.data.objects if o not in mark], 1.4, -0.07, -0.17)

# ---------- ruins of the town ----------
for k, (x, y, h) in enumerate(((0.45, 0.2, 0.26), (0.55, 0.22, 0.18), (0.65, 0.18, 0.26), (0.75, 0.2, 0.12))):
    rod(f'column{k}', M['marble'], (x, y, T), (x, y, T + h), 0.022, segs=10, outline=0.004)
for k in range(8):
    x, y = rng.uniform(-0.8, 0.0), rng.uniform(0.3, 0.75)
    box(f'housewall{k}', M['ruin'], x, y, T - 0.005, rng.uniform(0.15, 0.25), 0.03, rng.uniform(0.04, 0.08), rot_z=rng.choice((0.0, math.pi / 2)), outline=0.003, bevel=0)
for k in range(10):
    x, y = rng.uniform(-0.9, 0.9), rng.uniform(-0.6, 0.8)
    if (x / 1.0) ** 2 + ((y - 0.1) / 0.75) ** 2 > 1:
        continue
    ball(f'scrub{k}', M['scrub'], x, y, T + 0.01, 0.035, outline=0.003)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
