# A cartoon Aqueduct of Padre Tembleque for the country maps, built in the set's shared look
# (../toon.py): the sixteenth-century aqueduct on the high plain of central Mexico, its great arcade
# of tall, slender arches striding across the ravine, highest in the middle where the stream runs
# at the bottom, the water channel along its top, the dry slopes with their maguey and nopal
# cactuses on either side. Turned a little towards the camera.
# Run: blender -b --factory-startup -P padre-tembleque.py -- padre-tembleque-1024.png 1024 padre-tembleque.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#b8b070', shadow_mul=(0.78, 0.78, 0.8), lift=0.15),
    'slope': toon('slope', '#a8a060', shadow_mul=(0.78, 0.78, 0.8)),
    'adobe': toon('adobe', '#d8b890', shadow_mul=(0.8, 0.76, 0.8), lift=0.15),
    'adobeDark': toon('adobeDark', '#b8987a'),
    'water': toon('water', '#4a9ab0', lift=0.3),
    'maguey': toon('maguey', '#6a9a7a'),
    'nopal': toon('nopal', '#5a8a44'),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(1554)

# ---------- the ravine: slopes rising to both sides, the stream at the bottom ----------
SH = 0.22


def ground_z(x):
    return G + SH * min(1.0, max(0.0, (abs(x) - 0.12) / 0.75))


def vstrip(x0, x1, r):
    """The part of a disc of radius r between x0 and x1, counter-clockwise from above, as (x, y)."""
    a0, a1 = math.acos(x1 / r), math.acos(x0 / r)
    bottom = [(r * math.cos(-a1 + (a1 - a0) * k / 12), r * math.sin(-a1 + (a1 - a0) * k / 12)) for k in range(13)]
    top = [(r * math.cos(a0 + (a1 - a0) * k / 12), r * math.sin(a0 + (a1 - a0) * k / 12)) for k in range(13)]
    return bottom + top


for s in (-1, 1):
    pts = vstrip(0.12, 0.87, 1.3) if s > 0 else vstrip(-0.87, -0.12, 1.3)
    sl = loft(f'slope{s}', M['slope'], [[(x, y, G - 0.01) for x, y in pts], [(x, y, ground_z(x) - 0.005) for x, y in pts]], outline=0.004)
    sl.visible_shadow = False
    pts = vstrip(0.87, 1.3, 1.3) if s > 0 else vstrip(-1.3, -0.87, 1.3)
    pl = loft(f'plateau{s}', M['slope'], [[(x, y, G - 0.01) for x, y in pts], [(x, y, G + SH - 0.005) for x, y in pts]], outline=0.004)
    pl.visible_shadow = False
loft('stream', M['water'], [[(x, y, G - 0.004) for x, y in vstrip(-0.1, 0.1, 1.3)], [(x, y, G + 0.008) for x, y in vstrip(-0.1, 0.1, 1.3)]], outline=0.002)

# ---------- the arcade ----------
AY = 0.0
N, SPAN, PIER = 13, 0.1, 0.04
L = N * SPAN + (N + 1) * PIER
X0 = -L / 2
TOP = G + SH + 0.24
for k in range(N + 1):
    x = X0 + PIER / 2 + k * (SPAN + PIER)
    box(f'pier{k}', M['adobe'], x, AY, ground_z(x) - 0.01, PIER, 0.07, TOP - ground_z(x) - 0.04, outline=0.004, bevel=0)
for k in range(N):
    x0 = X0 + PIER + k * (SPAN + PIER)
    spring = TOP - 0.09
    for j in range(6):
        um = (j + 0.5) / 6
        z = spring + 0.05 * math.sqrt(max(0.0, 1 - (2 * um - 1) ** 2))
        box(f'arch{k}_{j}', M['adobe'], x0 + SPAN * um, AY, z, SPAN / 6 + 0.002, 0.065, TOP - z, outline=0.002, bevel=0)
box('channel', M['adobeDark'], 0.0, AY, TOP - 0.005, L + 0.02, 0.08, 0.035, outline=0.005, bevel=0)
for s in (-1, 1):
    box(f'abutment{s}', M['adobe'], s * (L / 2 + 0.08), AY, G + SH - 0.01, 0.16, 0.08, TOP - G - SH + 0.04, outline=0.004, bevel=0)

# ---------- maguey and nopal on the slopes ----------
for k in range(14):
    s = -1 if k % 2 else 1
    x = s * (0.3 + 0.75 * rng.random())
    y = -0.85 + 1.7 * rng.random()
    if abs(y) < 0.12 or math.hypot(x, y) > 1.15:
        continue
    z = ground_z(x) if abs(x) < 0.87 else G + SH
    if k % 3:
        for j in range(6):
            a = 2 * math.pi * j / 6
            rod(f'maguey{k}{j}', M['maguey'], (x, y, z), (x + 0.05 * math.cos(a), y + 0.05 * math.sin(a), z + 0.07), 0.01, r2=0.002, segs=4, outline=0.001)
    else:
        for j, (dx, dz, rot) in enumerate(((0, 0.04, 0.0), (0.025, 0.09, 0.4), (-0.02, 0.085, -0.4))):
            b = ball(f'nopal{k}{j}', M['nopal'], 0, 0, 0, 1.0, outline=0.003)
            b.scale = (0.03, 0.008, 0.04)
            b.rotation_euler = (0, rot, 0.3)
            b.location = (x + dx, y, z + dz)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
