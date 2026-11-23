# A cartoon Lake District for the country maps, built in the set's shared look (../toon.py): a long
# lake among the green fells, their craggy tops and bracken slopes crossed by dry-stone walls, white
# Herdwick sheep with their dark faces, a slate-roofed stone cottage, and a rowing boat on the
# water. Turned a little towards the camera.
# Run: blender -b --factory-startup -P lake-district.py -- lake-district-1024.png 1024 lake-district.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#7aa850', shadow_mul=(0.72, 0.8, 0.74), lift=0.2),
    'fell': toon('fell', '#6a9a48', shadow_mul=(0.72, 0.8, 0.76)),
    'bracken': toon('bracken', '#a88a48', shadow_mul=(0.84, 0.8, 0.72)),
    'crag': toon('crag', '#8a8884', shadow_mul=(0.84, 0.84, 0.9)),
    'lake': toon('lake', '#4a7ab0', lift=0.3),
    'wallstone': toon('wallstone', '#a8a49c'),
    'cottage': toon('cottage', '#e8e4dc', lift=0.15),
    'slate': toon('slate', '#4a5058'),
    'door': flat('door', '#2f5a3a'),
    'wool': toon('wool', '#f2eee6', lift=0.2),
    'face': toon('face', '#3a3436'),
    'boat': toon('boat', '#c4573a'),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['grass'])
before = set(bpy.data.objects)
rng = random.Random(2243)


def ring(cx, cy, rx, ry, z, k, sides=24):
    return [(cx + rx * math.cos(t) * (1 + 0.06 * math.sin(3 * t + k)), cy + ry * math.sin(t) * (1 + 0.06 * math.cos(2 * t + k)), G + z) for t in (2 * math.pi * j / sides for j in range(sides))]


# ---------- the fells ----------
for k, (x, y, r, h, mat) in enumerate(((-0.55, 0.65, 0.5, 0.55, 'fell'), (0.4, 0.7, 0.55, 0.62, 'bracken'), (0.85, 0.2, 0.33, 0.38, 'fell'), (-0.88, 0.1, 0.3, 0.32, 'bracken'))):
    b = ball(f'fell{k}', M[mat], 0, 0, 0, r, outline=0.012)
    b.scale = (1.15, 0.9, h / r)
    b.location = (x, y, G - 0.03)
    b.visible_shadow = False
    lathe(f'crag{k}', M['crag'], ((r * 0.25, 0), (r * 0.15, h * 0.12), (r * 0.05, h * 0.18)), G - 0.03 + h * 0.9, x, y, segs=6, outline=0.006, smooth=False)

# ---------- the lake ----------
loft('lake', M['lake'], [ring(-0.05, -0.1, 0.72, 0.26, -0.004, 1), ring(-0.05, -0.1, 0.72, 0.26, 0.006, 1)], outline=0.005, smooth=True)
box('rowboat', M['boat'], 0.15, -0.12, G + 0.004, 0.14, 0.05, 0.025, rot_z=0.4, outline=0.003, bevel=0)

# ---------- dry-stone walls ----------
WALLS = (((-1.0, -0.5), (-0.6, -0.7), (-0.2, -0.65)), ((0.3, -0.55), (0.7, -0.65), (1.05, -0.45)), ((-0.6, -0.7), (-0.75, -0.95)))
for k, pts in enumerate(WALLS):
    for j in range(len(pts) - 1):
        (x0, y0), (x1, y1) = pts[j], pts[j + 1]
        box(f'wall{k}{j}', M['wallstone'], (x0 + x1) / 2, (y0 + y1) / 2, G - 0.005, math.hypot(x1 - x0, y1 - y0) + 0.02, 0.03, 0.05, rot_z=math.atan2(y1 - y0, x1 - x0), outline=0.003, bevel=0)

# ---------- the cottage ----------
HX, HY = 0.55, -0.35
box('cottage', M['cottage'], HX, HY, G - 0.005, 0.24, 0.14, 0.11, outline=0.007, bevel=0)
box('cottagedoor', M['door'], HX - 0.05, HY - 0.072, G - 0.005, 0.04, 0.006, 0.07, outline=0, bevel=0)
loft('cottageroof', M['slate'], [[(HX - 0.13, HY - 0.085, G + 0.1), (HX + 0.13, HY - 0.085, G + 0.1), (HX + 0.13, HY + 0.085, G + 0.1), (HX - 0.13, HY + 0.085, G + 0.1)],
                                 [(HX - 0.13, HY - 0.004, G + 0.17), (HX + 0.13, HY - 0.004, G + 0.17), (HX + 0.13, HY + 0.004, G + 0.17), (HX - 0.13, HY + 0.004, G + 0.17)]], outline=0.005)
for s in (-1, 1):
    box(f'chimney{s}', M['slate'], HX + s * 0.11, HY, G + 0.12, 0.035, 0.035, 0.08, outline=0.003, bevel=0)
ball('cottagetree', M['tree'], HX + 0.25, HY + 0.05, G + 0.12, 0.08, outline=0.008)

# ---------- Herdwick sheep ----------
for k, (x, y) in enumerate(((-0.5, -0.55), (-0.3, -0.85), (-0.05, -0.6), (0.3, -0.8), (-0.75, -0.35), (0.85, -0.2))):
    b = ball(f'sheep{k}', M['wool'], 0, 0, 0, 0.04, outline=0.004)
    b.scale = (1.3, 0.9, 0.85)
    b.location = (x, y, G + 0.045)
    ball(f'sheephead{k}', M['face'], x + 0.05, y, G + 0.055, 0.018, outline=0.002)
    for fx in (-0.025, 0.025):
        rod(f'sheepleg{k}{fx}', M['face'], (x + fx, y, G), (x + fx, y, G + 0.025), 0.006, segs=4, outline=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
