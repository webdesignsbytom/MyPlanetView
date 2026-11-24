# A cartoon Medina of Sousse for the country maps, built in the set's shared look (../toon.py): the old
# town on Tunisia's coast, the Ribat, the eighth-century fortress-monastery, its square walls with
# round and square corner towers and the tall round watchtower, the nador, rising from one corner,
# the medina's crenellated ochre walls and gate in front, the white houses with their blue doors and
# the Great Mosque's square minaret. Turned a little towards the camera.
# Run: blender -b --factory-startup -P sousse.py -- sousse-1024.png 1024 sousse.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#e0d0aa', shadow_mul=(0.82, 0.8, 0.84), lift=0.18),
    'ochre': toon('ochre', '#d8b07c', shadow_mul=(0.8, 0.76, 0.8), lift=0.15),
    'ochreDark': toon('ochreDark', '#b8905e'),
    'white': toon('white', '#f6f4ee', shadow_mul=(0.82, 0.84, 0.9), lift=0.22),
    'blue': toon('blue', '#2a6ab0', lift=0.15),
    'dark': flat('dark', '#2e2a26'),
    'palm': toon('palm', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6a4a'),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(821)


def merlons(name, x0, y0, x1, y1, z, n):
    """Rounded merlons along a wall top from (x0, y0) to (x1, y1)."""
    for k in range(n):
        t = (k + 0.5) / n
        x, y = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
        lathe(f'{name}{k}', M['ochre'], ((0.014, 0), (0.014, 0.018), (0.0, 0.03)), z, x, y, segs=8, outline=0.001)


# ---------- the medina's wall and gate in front ----------
WY = -0.55
for s in (-1, 1):
    x0, x1 = s * 0.12, s * 0.95
    xa, xb = sorted((x0, x1))
    box(f'medinawall{s}', M['ochre'], (xa + xb) / 2, WY, G - 0.005, xb - xa, 0.06, 0.16, outline=0.005, bevel=0)
    merlons(f'wallmerlon{s}', xa, WY, xb, WY, G + 0.155, 16)
    box(f'walltower{s}', M['ochre'], s * 0.6, WY, G - 0.005, 0.1, 0.1, 0.2, outline=0.004, bevel=0)
box('gate', M['ochre'], 0.0, WY, G - 0.005, 0.24, 0.1, 0.22, outline=0.005, bevel=0)
box('gatedoor', M['dark'], 0.0, WY - 0.054, G - 0.005, 0.08, 0.006, 0.12, outline=0, bevel=0)
cyl('gatearch', M['dark'], 0.04, 0.006, segs=12, outline=0, matrix=Matrix.Translation((0.0, WY - 0.054, G + 0.115)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
merlons('gatemerlon', -0.12, WY, 0.12, WY, G + 0.215, 6)

# ---------- the Ribat ----------
RX, RY, S = -0.2, 0.12, 0.26
box('ribat', M['ochre'], RX, RY, G - 0.005, 2 * S, 2 * S, 0.2, outline=0.007, bevel=0)
box('ribatcourt', M['ochreDark'], RX, RY, G + 0.19, 2 * S - 0.1, 2 * S - 0.1, 0.012, outline=0, bevel=0)
merlons('ribatmerlonf', RX - S, RY - S, RX + S, RY - S, G + 0.195, 12)
merlons('ribatmerlonl', RX - S, RY - S, RX - S, RY + S, G + 0.195, 12)
box('ribatgate', M['dark'], RX, RY - S - 0.004, G - 0.005, 0.06, 0.006, 0.1, outline=0, bevel=0)
for k, (dx, dy) in enumerate(((-1, -1), (-1, 1), (1, 1))):
    if k == 1:
        box(f'corner{k}', M['ochre'], RX + dx * S, RY + dy * S, G - 0.005, 0.1, 0.1, 0.24, outline=0.004, bevel=0)
    else:
        lathe(f'corner{k}', M['ochre'], ((0.06, 0), (0.06, 0.24)), G - 0.005, RX + dx * S, RY + dy * S, segs=14, outline=0.004)
# the nador, the watchtower, on its square base at the corner
NX, NY = RX + S, RY - S
box('nadorbase', M['ochre'], NX, NY, G - 0.005, 0.14, 0.14, 0.24, outline=0.005, bevel=0)
lathe('nador', M['ochre'], ((0.055, 0), (0.05, 0.34)), G + 0.23, NX, NY, segs=16, outline=0.005)
for k in range(3):
    box(f'nadorslit{k}', M['dark'], NX, NY - 0.054, G + 0.3 + k * 0.08, 0.01, 0.006, 0.035, outline=0, bevel=0)
lathe('nadortop', M['ochreDark'], ((0.062, 0), (0.062, 0.02)), G + 0.565, NX, NY, segs=16, outline=0.002)
for k in range(8):
    a = 2 * math.pi * k / 8
    lathe(f'nadormerlon{k}', M['ochre'], ((0.012, 0), (0.012, 0.016), (0.0, 0.026)), G + 0.585, NX + 0.05 * math.cos(a), NY + 0.05 * math.sin(a), segs=8, outline=0.001)

# ---------- the medina's houses and the Great Mosque's minaret ----------
for k in range(7):
    x, y = 0.25 + (k % 3) * 0.22, -0.3 + (k // 3) * 0.3
    if math.hypot(x + 0.1, y + 0.1) > 1.15:
        continue
    h = 0.08 + 0.05 * rng.random()
    box(f'house{k}', M['white'], x, y, G - 0.005, 0.18, 0.18, h, outline=0.004, bevel=0)
    box(f'housedoor{k}', M['blue'], x, y - 0.093, G - 0.005, 0.035, 0.006, 0.06, outline=0, bevel=0)
    box(f'housewin{k}', M['blue'], x + 0.05, y - 0.093, G + h * 0.55, 0.025, 0.006, 0.025, outline=0, bevel=0)
box('minaret', M['ochre'], 0.55, 0.55, G - 0.005, 0.09, 0.09, 0.36, outline=0.004, bevel=0)
box('minarettop', M['ochre'], 0.55, 0.55, G + 0.355, 0.055, 0.055, 0.06, outline=0.002, bevel=0)
lathe('minaretdome', M['white'], ((0.03, 0), (0.02, 0.02), (0.0, 0.035)), G + 0.41, 0.55, 0.55, segs=10, outline=0.002)

for k, (x, y) in enumerate(((-0.75, -0.85), (0.75, -0.85), (-0.85, 0.4))):
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + 0.3), 0.012, segs=6, outline=0.002)
    for j in range(6):
        a = 2 * math.pi * j / 6
        b = ball(f'frond{k}{j}', M['palm'], 0, 0, 0, 1.0, outline=0.003)
        b.scale = (0.08, 0.02, 0.012)
        b.rotation_euler = (0, 0.35, a)
        b.location = (x + 0.02 + 0.06 * math.cos(a), y + 0.06 * math.sin(a), G + 0.29)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
