# A cartoon Persepolis for the country maps, built in the set's shared look (../toon.py) on a tile
# of dry ground: the great stone terrace with its double stairway, the Gate of All Nations and its
# winged bulls, the Apadana's few tall columns still standing among the stumps of the rest, and
# the bare mountain behind. Turned a little towards the camera.
# Run: blender -b --factory-startup -P persepolis.py -- persepolis-1024.png 1024 persepolis.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#ead9b0', lift=0.25),
    'stone': toon('stone', '#c4ae8a', shadow_mul=(0.8, 0.76, 0.8)),
    'stoneLight': toon('stoneLight', '#e2d6bb', shadow_mul=(0.8, 0.76, 0.8)),
    'relief': toon('relief', '#ab9a7c'),
    'mountain': toon('mountain', '#8a6a52', shadow_mul=(0.78, 0.72, 0.78)),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(29)

# ---------- the bare mountain behind ----------
def ring(cx, cy, rx, ry, z, jitter, sides=12):
    return [(cx + rx * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / sides),
             cy + ry * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / sides), G + z) for k in range(sides)]


mountain = loft('kuh', M['mountain'], [ring(0.1, 1.05, 1.2, 0.36, -0.01, 0.04), ring(0.1, 1.08, 0.95, 0.28, 0.32, 0.1),
                                       ring(0.15, 1.1, 0.55, 0.16, 0.62, 0.12), ring(0.2, 1.1, 0.1, 0.04, 0.74, 0.0)], outline=0.035)
mountain.visible_shadow = False

# ---------- the terrace and its double stairway ----------
T = G + 0.2
box('terrace', M['stone'], 0, 0.05, G - 0.005, 1.7, 1.15, 0.205, outline=0.035, bevel=0.006)
box('reliefband', M['relief'], 0, 0.05 - 0.578, G + 0.06, 1.2, 0.01, 0.06, outline=0, bevel=0)
for side in (-1, 1):
    # each flight climbs from the outside in, towards the middle landing
    for k in range(6):
        box(f'stair{side}{k}', M['stoneLight'], side * (0.5 - k * 0.06), -0.6, G - 0.005, 0.07, 0.16, 0.035 * (k + 1),
            outline=0.01, bevel=0)
box('landing', M['stoneLight'], 0, -0.6, G - 0.005, 0.25, 0.16, 0.21, outline=0.015, bevel=0)


def column(name, x, y, h, capital=True):
    rod(name, M['stoneLight'], (x, y, T), (x, y, T + h), 0.035, r2=0.03, segs=10, outline=0.018)
    box(name + 'base', M['stone'], x, y, T, 0.09, 0.09, 0.03, outline=0.01, bevel=0)
    if capital:
        # the double-bull capital, as a cross-piece on top
        box(name + 'cap', M['stone'], x, y, T + h, 0.06, 0.06, 0.05, outline=0.01, bevel=0)
        box(name + 'bulls', M['stone'], x, y, T + h + 0.05, 0.16, 0.06, 0.05, outline=0.012, bevel=0.006)


# ---------- the Apadana: a few tall columns standing among the stumps of the rest ----------
STANDING = {(0, 0), (1, 0), (3, 0), (0, 2), (2, 1), (3, 2)}
for i in range(4):
    for j in range(3):
        x, y = 0.15 + i * 0.17, 0.15 + j * 0.17
        if (i, j) in STANDING:
            column(f'col{i}{j}', x, y, 0.72)
        else:
            column(f'stump{i}{j}', x, y, rng.uniform(0.05, 0.14), capital=False)

# ---------- the Gate of All Nations and its winged bulls ----------
GX, GY = -0.45, 0.0


def lamassu(name, x, y, facing):
    """A winged bull carved on the gate's jamb, standing out from it, facing out."""
    box(name + 'body', M['stoneLight'], x, y + facing * 0.08, T + 0.18, 0.1, 0.24, 0.12, outline=0.012, bevel=0.01)
    box(name + 'head', M['stoneLight'], x, y + facing * 0.21, T + 0.28, 0.08, 0.06, 0.1, outline=0.012, bevel=0.01)
    box(name + 'wing', M['relief'], x, y + facing * 0.04, T + 0.3, 0.104, 0.14, 0.08, outline=0.01, bevel=0)
    for dy in (0.0, 0.16):
        rod(name + f'leg{dy}', M['stoneLight'], (x, y + facing * dy, T), (x, y + facing * dy, T + 0.18), 0.02, segs=6, outline=0.008)


for side in (-1, 1):
    x = GX + side * 0.13
    box(f'jamb{side}', M['stone'], x, GY, T, 0.12, 0.44, 0.62, outline=0.025, bevel=0.006)
    lamassu(f'bull{side}', x, GY - 0.12, -1)
for k, y in enumerate((0.3, 0.45)):
    column(f'gatecol{k}', GX, y, 0.6)

turn(before, -20)
render(G)
