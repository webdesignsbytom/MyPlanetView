# A cartoon Little Mermaid for the country maps, built in the set's shared look (../toon.py): Edvard
# Eriksen's small bronze mermaid sitting on her boulder at the water's edge of Copenhagen's
# Langelinie, her tail curled beside her and her head bowed towards the sea, the granite rocks round
# her, the harbour's water, the promenade with its benches and trees, and a harbour boat passing.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P little-mermaid.py -- little-mermaid-1024.png 1024 little-mermaid.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#3a7aa0', shadow_mul=(0.76, 0.84, 0.92), lift=0.3),
    'paving': toon('paving', '#c8c0b0', shadow_mul=(0.82, 0.8, 0.88), lift=0.2),
    'rock': toon('rock', '#8e8a86', shadow_mul=(0.84, 0.84, 0.9), lift=0.1),
    'rockDark': toon('rockDark', '#6e6a68'),
    'bronze': toon('bronze', '#4a8a7a', shadow_mul=(0.8, 0.86, 0.84), lift=0.15),
    'wood': toon('wood', '#8a6040'),
    'white': toon('white', '#f4f2ec', lift=0.15),
    'red': toon('red', '#c83a30'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a4a36'),
    'grass': toon('grass2', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
})

G = tile(M['sea'])
before = set(bpy.data.objects)
rng = random.Random(1913)


def strip(y0, y1, r, z, n=6):
    """The band of the tile's disc between y0 and y1 (counter-clockwise from above)."""
    xa0, xa1 = math.sqrt(r * r - y0 * y0), math.sqrt(r * r - y1 * y1)
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    pts = [(-xa0, y0), (xa0, y0)]
    pts += [(r * math.cos(a0 + (a1 - a0) * k / n), r * math.sin(a0 + (a1 - a0) * k / n)) for k in range(1, n)]
    pts += [(xa1, y1), (-xa1, y1)]
    pts += [(r * math.cos(math.pi - a1 + (a1 - a0) * k / n), r * math.sin(math.pi - a1 + (a1 - a0) * k / n)) for k in range(1, n)]
    return [(x, y, G + z) for x, y in pts]


# the shore at the back: the promenade, a strip of lawn and the trees
loft('promenade', M['paving'], [strip(0.35, 1.41, 1.42, -0.01), strip(0.35, 1.41, 1.42, 0.05)], outline=0.006)
loft('lawn', M['grass'], [strip(0.75, 1.38, 1.39, 0.04), strip(0.75, 1.38, 1.39, 0.06)], outline=0.003)
for k, x in enumerate((-0.75, -0.35, 0.05, 0.45, 0.8)):
    y = 0.95 + 0.05 * (k % 2)
    rod(f'trunk{k}', M['trunk'], (x, y, G + 0.05), (x, y, G + 0.13), 0.014, segs=6, outline=0.002)
    ball(f'tree{k}', M['tree'], x, y, G + 0.22, 0.12, outline=0.012)
for k, x in enumerate((-0.45, 0.4)):
    box(f'bench{k}', M['wood'], x, 0.5, G + 0.05, 0.16, 0.05, 0.03, outline=0.002, bevel=0)
    box(f'benchback{k}', M['wood'], x, 0.525, G + 0.08, 0.16, 0.01, 0.04, outline=0.001, bevel=0)

# ---------- the rocks and the mermaid (built small, then grown so she reads on the map) ----------
MX, MY = 0.0, -0.12
statue = set(bpy.data.objects)
for k in range(12):
    a = 2 * math.pi * k / 12 + rng.uniform(-0.2, 0.2)
    r = rng.uniform(0.18, 0.32)
    rk = ball(f'rock{k}', M['rock'] if k % 3 else M['rockDark'], 0, 0, 0, rng.uniform(0.06, 0.1), outline=0.006)
    rk.scale = (1.3, 1.0, 0.6)
    rk.location = (MX + r * math.cos(a), MY + 0.1 + r * math.sin(a) * 0.8, G + 0.01)
boulder = ball('boulder', M['rock'], 0, 0, 0, 0.13, outline=0.008)
boulder.scale = (1.2, 1.0, 0.75)
boulder.location = (MX, MY, G + 0.05)
BZ = G + 0.05 + 0.13 * 0.75 - 0.01   # the boulder's top
# the mermaid: sitting sideways, her tail curling to her right, her body turned to the water
tail = [(MX + 0.06, MY - 0.02, BZ + 0.005), (MX + 0.03, MY - 0.05, BZ + 0.01), (MX - 0.02, MY - 0.06, BZ + 0.01), (MX - 0.06, MY - 0.04, BZ + 0.0), (MX - 0.08, MY - 0.07, BZ - 0.02)]
for k in range(len(tail) - 1):
    bar(f'tail{k}', M['bronze'], tail[k], tail[k + 1], 0.04 - 0.006 * k, outline=0.003)
loft('fin', M['bronze'], [[(MX - 0.08, MY - 0.07, BZ - 0.035), (MX - 0.06, MY - 0.07, BZ - 0.02), (MX - 0.1, MY - 0.07, BZ - 0.0)], [(MX - 0.08, MY - 0.075, BZ - 0.035), (MX - 0.06, MY - 0.075, BZ - 0.02), (MX - 0.1, MY - 0.075, BZ - 0.0)]], outline=0.002)
rod('hips', M['bronze'], (MX + 0.07, MY - 0.01, BZ + 0.01), (MX + 0.06, MY - 0.03, BZ + 0.03), 0.032, segs=10, outline=0.003)
rod('body', M['bronze'], (MX + 0.06, MY - 0.02, BZ + 0.02), (MX + 0.045, MY - 0.045, BZ + 0.12), 0.026, r2=0.02, segs=10, outline=0.003)
ball('head', M['bronze'], MX + 0.035, MY - 0.06, BZ + 0.145, 0.022, outline=0.003)
hair = ball('hair', M['bronze'], 0, 0, 0, 0.022, outline=0.002)
hair.scale = (1.0, 1.0, 0.6)
hair.location = (MX + 0.045, MY - 0.05, BZ + 0.16)
for s in (-1, 1):
    bar(f'arm{s}', M['bronze'], (MX + 0.05 + s * 0.02, MY - 0.035, BZ + 0.1), (MX + 0.04 + s * 0.035, MY - 0.03, BZ + 0.03), 0.013, outline=0.002)

bpy.context.view_layer.update()
grow = Matrix.Translation((MX, MY, G)) @ Matrix.Scale(2.0, 4) @ Matrix.Translation((-MX, -MY, -G))
for o in set(bpy.data.objects) - statue:
    o.matrix_world = grow @ o.matrix_world

# ---------- a harbour boat ----------
BX, BY = -0.6, -0.85
hull = ball('boat', M['white'], 0, 0, 0, 0.08, outline=0.005)
hull.scale = (2.6, 0.9, 0.5)
hull.location = (BX, BY, G + 0.015)
box('boatcabin', M['white'], BX + 0.03, BY, G + 0.035, 0.24, 0.1, 0.06, outline=0.003, bevel=0)
box('boatstripe', M['red'], BX, BY - 0.072, G + 0.03, 0.34, 0.004, 0.015, outline=0, bevel=0)
for j in range(5):
    box(f'boatwin{j}', M['sea'], BX - 0.07 + j * 0.05, BY - 0.052, G + 0.07, 0.03, 0.006, 0.02, outline=0, bevel=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
