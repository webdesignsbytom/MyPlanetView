# A cartoon Kizhi Pogost for the country maps, built in the set's shared look (../toon.py): the
# wooden Church of the Transfiguration on its island in Lake Onega, its log walls and its 22 onion
# domes of silvery aspen shingles stacked in tiers up to the great top dome, the smaller nine-domed
# Church of the Intercession beside it, the tented bell tower, and the fence round the pogost.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P kizhi.py -- kizhi-1024.png 1024 kizhi.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lake': toon('lake', '#3a7aa0', shadow_mul=(0.74, 0.82, 0.9), lift=0.3),
    'grass': toon('grass2', '#8ab860', shadow_mul=(0.72, 0.8, 0.74)),
    'log': toon('log', '#8a6448', shadow_mul=(0.86, 0.8, 0.78)),
    'logDark': toon('logDark', '#6a4a36', shadow_mul=(0.86, 0.8, 0.78)),
    'aspen': toon('aspen', '#c8ccd0', shadow_mul=(0.82, 0.84, 0.9), lift=0.2),
    'shingle': toon('shingle', '#8a8278', shadow_mul=(0.84, 0.84, 0.88)),
    'gold': toon('gold', '#f0c030', lift=0.35),
    'fence': toon('fence', '#7a5a40'),
})

G = tile(M['lake'])
before = set(bpy.data.objects)


def ring(cx, cy, rx, ry, z, k, sides=24):
    return [(cx + rx * math.cos(t) * (1 + 0.05 * math.sin(3 * t + k)), cy + ry * math.sin(t) * (1 + 0.05 * math.cos(2 * t + k)), G + z) for t in (2 * math.pi * j / sides for j in range(sides))]


isle = loft('island', M['grass'], [ring(0.0, 0.15, 1.05, 0.75, -0.01, 1), ring(0.0, 0.15, 1.02, 0.72, 0.04, 1)], outline=0.012, smooth=True)
isle.visible_shadow = False
T = G + 0.04


def onion(name, x, y, z, r):
    lathe(f'{name}neck', M['aspen'], ((r * 0.45, 0), (r * 0.45, r * 0.4)), z, x, y, segs=10, outline=0.003)
    lathe(name, M['aspen'], ((r * 0.45, 0), (r, r * 0.55), (r * 0.8, r * 1.1), (r * 0.2, r * 1.5), (0.004, r * 1.9)), z + r * 0.35, x, y, segs=12, outline=0.004)
    rod(f'{name}cross', M['gold'], (x, y, z + r * 2.2), (x, y, z + r * 2.6), 0.003, segs=4, outline=0)


def grow(objs, f, px, py):
    """Scales a group of finished objects about a point on the ground."""
    m = Matrix.Translation((px, py, G)) @ Matrix.Scale(f, 4) @ Matrix.Translation((-px, -py, -G))
    for o in objs:
        o.matrix_world = m @ o.matrix_world


# ---------- the Church of the Transfiguration: tiers of domes ----------
mark = set(bpy.data.objects)
CX, CY = -0.25, 0.25
lathe('octagon', M['log'], ((0.2, 0), (0.2, 0.18)), T - 0.005, CX, CY, segs=8, outline=0.012, smooth=False)
for k in range(4):
    a = k * math.pi / 2
    box(f'arm{k}', M['log'], CX + 0.2 * math.cos(a), CY + 0.2 * math.sin(a), T - 0.005, 0.16 if k % 2 == 0 else 0.14, 0.14 if k % 2 == 0 else 0.16, 0.16, outline=0.01, bevel=0)
lathe('tier1', M['logDark'], ((0.15, 0), (0.15, 0.12)), T + 0.175, CX, CY, segs=8, outline=0.01, smooth=False)
lathe('tier2', M['log'], ((0.1, 0), (0.1, 0.1)), T + 0.295, CX, CY, segs=8, outline=0.008, smooth=False)
lathe('tier3', M['logDark'], ((0.06, 0), (0.06, 0.08)), T + 0.395, CX, CY, segs=8, outline=0.006, smooth=False)
n = 0
for (rad, z, r, cnt) in ((0.26, T + 0.155, 0.032, 8), (0.17, T + 0.29, 0.03, 8), (0.11, T + 0.39, 0.026, 4)):
    for j in range(cnt):
        a = 2 * math.pi * j / cnt + (math.pi / cnt if cnt == 4 else 0)
        onion(f'dome{n}', CX + rad * math.cos(a), CY + rad * math.sin(a), z, r)
        n += 1
onion('topdome', CX, CY, T + 0.47, 0.055)

# ---------- the Church of the Intercession ----------
IX, IY = 0.35, 0.35
box('intercession', M['log'], IX, IY, T - 0.005, 0.22, 0.3, 0.16, outline=0.01, bevel=0)
lathe('intercessiondrum', M['logDark'], ((0.09, 0), (0.09, 0.08)), T + 0.155, IX, IY, segs=8, outline=0.007, smooth=False)
for j in range(8):
    a = 2 * math.pi * j / 8
    onion(f'idome{j}', IX + 0.085 * math.cos(a), IY + 0.085 * math.sin(a), T + 0.235, 0.022)
onion('idometop', IX, IY, T + 0.24, 0.04)

# ---------- the bell tower, the fence ----------
BX, BY = 0.05, -0.15
box('belltower', M['log'], BX, BY, T - 0.005, 0.12, 0.12, 0.14, outline=0.008, bevel=0)
lathe('belltowerframe', M['logDark'], ((0.06, 0), (0.06, 0.08)), T + 0.135, BX, BY, segs=8, outline=0.006, smooth=False)
lathe('belltowertent', M['shingle'], ((0.075, 0), (0.004, 0.16)), T + 0.21, BX, BY, segs=8, outline=0.006, smooth=False)
onion('belldome', BX, BY, T + 0.37, 0.02)
grow(set(bpy.data.objects) - mark, 1.35, 0.0, 0.2)
for k in range(30):
    a = 2 * math.pi * k / 30
    x, y = 0.95 * math.cos(a), 0.2 + 0.62 * math.sin(a)
    rod(f'fence{k}', M['fence'], (x, y, T), (x, y, T + 0.05), 0.008, segs=4, outline=0.002)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
