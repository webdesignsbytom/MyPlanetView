# A cartoon Uxmal for the country maps, built in the set's shared look (../toon.py): the Maya city in the
# Puuc hills of Yucatán, the Pyramid of the Magician rising steep on its rounded oval base in
# terraces, the great stair up its front to the temple at the top with its dark doorway, and beside
# it the long Governor's Palace on its broad platform with the carved stone frieze along its upper
# half, in the clearing in the green forest. Turned a little towards the camera.
# Run: blender -b --factory-startup -P uxmal.py -- uxmal-1024.png 1024 uxmal.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#76b456', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'plaza': toon('plaza', '#d8cdb2', shadow_mul=(0.84, 0.84, 0.9), lift=0.15),
    'stone': toon('stone', '#dccfb2', shadow_mul=(0.82, 0.82, 0.88), lift=0.15),
    'stoneDark': toon('stoneDark', '#b8aa8a'),
    'dark': flat('dark', '#2e2a2a'),
    'jungle': toon('jungle', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['grass'])
before = set(bpy.data.objects)


def oval(cx, cy, rx, ry, z, n=32, p=3.0):
    """A rounded oval ring (a superellipse), counter-clockwise from above."""
    pts = []
    for k in range(n):
        a = 2 * math.pi * k / n
        c, s = math.cos(a), math.sin(a)
        pts.append((cx + rx * math.copysign(abs(c) ** (2 / p), c), cy + ry * math.copysign(abs(s) ** (2 / p), s), z))
    return pts


# ---------- the cleared plaza ----------
loft('plaza', M['plaza'], [oval(0.05, 0.0, 1.0, 0.78, G - 0.004), oval(0.05, 0.0, 1.0, 0.78, G + 0.006)], outline=0.002)

# ---------- the Pyramid of the Magician ----------
PX, PY = -0.3, 0.15
TIERS = ((0.34, 0.22, 0.0), (0.31, 0.19, 0.12), (0.28, 0.17, 0.12), (0.25, 0.145, 0.25), (0.23, 0.13, 0.25), (0.2, 0.11, 0.38), (0.185, 0.1, 0.38), (0.16, 0.085, 0.5))
loft('pyramid', M['stone'], [oval(PX, PY, rx, ry, G - 0.005 + z) for rx, ry, z in TIERS], outline=0.007)
TOP = G + 0.495
# the great stair up the front
N = 16
for i in range(N):
    t = (i + 1) / N
    y = PY - 0.25 + 0.17 * t
    box(f'stair{i}', M['stoneDark'], PX, y, G - 0.005, 0.1, 0.17 / N + 0.002, TOP - G + 0.005 - (1 - t) * (TOP - G), outline=0.001, bevel=0)
for s in (-1, 1):
    bar(f'stairedge{s}', M['stone'], (PX + s * 0.055, PY - 0.25, G + 0.01), (PX + s * 0.055, PY - 0.08, TOP), 0.014, outline=0.002)
# the temple on top
box('temple', M['stone'], PX, PY, TOP - 0.005, 0.22, 0.12, 0.1, outline=0.005, bevel=0)
box('templefrieze', M['stoneDark'], PX, PY - 0.062, TOP + 0.045, 0.2, 0.006, 0.045, outline=0, bevel=0)
box('templedoor', M['dark'], PX, PY - 0.063, TOP - 0.005, 0.045, 0.006, 0.055, outline=0, bevel=0)
for j in range(5):
    box(f'templemask{j}', M['dark'], PX - 0.08 + j * 0.04, PY - 0.066, TOP + 0.06, 0.014, 0.004, 0.014, outline=0, bevel=0)

# ---------- the Governor's Palace on its platform ----------
GX, GY = 0.45, -0.05
box('platform', M['stone'], GX, GY, G - 0.005, 0.56, 0.36, 0.06, outline=0.005, bevel=0)
box('platformstair', M['stoneDark'], GX, GY - 0.2, G - 0.005, 0.16, 0.06, 0.04, outline=0.002, bevel=0)
box('palace', M['stone'], GX, GY + 0.03, G + 0.055, 0.48, 0.14, 0.15, outline=0.006, bevel=0)
box('palacefrieze', M['stoneDark'], GX, GY + 0.03, G + 0.13, 0.49, 0.15, 0.07, outline=0.003, bevel=0)
for j in range(5):
    box(f'palacedoor{j}', M['dark'], GX - 0.18 + j * 0.09, GY - 0.043, G + 0.055, 0.035, 0.006, 0.065, outline=0, bevel=0)
for j in range(12):
    for row in range(2):
        box(f'fret{j}{row}', M['dark'], GX - 0.22 + j * 0.04 + row * 0.02, GY - 0.047, G + 0.145 + row * 0.025, 0.012, 0.004, 0.012, rot_z=0, outline=0, bevel=0)

# ---------- the forest round the clearing ----------
rng = random.Random(900)
for k in range(18):
    a = 2 * math.pi * k / 18 + 0.1
    x, y = 1.08 * math.cos(a), 0.9 * math.sin(a)
    if math.hypot(x, y) > 1.2:
        continue
    ball(f'jungle{k}', M['jungle'], x, y, G + 0.11, 0.1 + 0.03 * rng.random(), outline=0.01)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
