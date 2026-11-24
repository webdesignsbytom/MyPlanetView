# A cartoon Shushtar for the country maps, built in the set's shared look (../toon.py): the ancient
# hydraulic system of Shushtar in Khuzestan, the sandstone cliff cut with tunnels and channels, the
# waterfalls pouring white from its openings into the pool below, the old watermills with their
# little domes and arched brick fronts on the cliff, and the walkway along the pool. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P shushtar.py -- shushtar-1024.png 1024 shushtar.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#d8c8a0', shadow_mul=(0.82, 0.8, 0.84), lift=0.18),
    'cliff': toon('cliff', '#c8aa7c', shadow_mul=(0.8, 0.76, 0.8), lift=0.12),
    'brick': toon('brick', '#c49064', shadow_mul=(0.8, 0.74, 0.78), lift=0.12),
    'water': toon('water', '#3a9ab8', lift=0.3),
    'foam': toon('foam', '#eef6fa', lift=0.4),
    'fall': toon('fall', '#bfe2f0', lift=0.4),
    'dark': flat('dark', '#3a2e26'),
    'palm': toon('palm', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6a4a'),
})

G = tile(M['ground'])
before = set(bpy.data.objects)


def strip(y0, y1, r, z):
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    right = [(r * math.cos(a0 + (a1 - a0) * k / 12), r * math.sin(a0 + (a1 - a0) * k / 12), z) for k in range(13)]
    left = [(-r * math.cos(a1 + (a0 - a1) * k / 12), r * math.sin(a1 + (a0 - a1) * k / 12), z) for k in range(13)]
    return right + left


# ---------- the pool and the cliff ----------
loft('pool', M['water'], [strip(-0.62, 0.0, 1.32, G - 0.004), strip(-0.62, 0.0, 1.32, G + 0.008)], outline=0.002)
CZ = G + 0.34
cliff = loft('cliff', M['cliff'], [strip(0.0, 1.31, 1.32, G - 0.01), strip(0.0, 1.31, 1.32, CZ)], outline=0.007)
cliff.visible_shadow = False
# the tunnels in the cliff's face and the waterfalls pouring from them
FALLS = ((-0.7, 0.2), (-0.4, 0.26), (-0.12, 0.16), (0.15, 0.28), (0.42, 0.2), (0.7, 0.24))
for k, (x, z) in enumerate(FALLS):
    box(f'tunnel{k}', M['dark'], x, -0.004, G + z, 0.06, 0.006, 0.05, outline=0, bevel=0)
    cyl(f'tunneltop{k}', M['dark'], 0.03, 0.006, segs=10, outline=0, matrix=Matrix.Translation((x, -0.004, G + z + 0.05)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    loft(f'fall{k}', M['fall'], [[(x - 0.025, -0.01, G + z + 0.01), (x + 0.025, -0.01, G + z + 0.01), (x + 0.025, 0.0, G + z + 0.01), (x - 0.025, 0.0, G + z + 0.01)],
                                 [(x - 0.03, -0.06, G + 0.005), (x + 0.03, -0.06, G + 0.005), (x + 0.03, -0.04, G + 0.005), (x - 0.03, -0.04, G + 0.005)]], outline=0.002)
    for j in range(3):
        ball(f'foam{k}{j}', M['foam'], x - 0.03 + j * 0.03, -0.07, G + 0.012, 0.022, outline=0.002)
for k in range(5):
    box(f'channel{k}', M['dark'], -0.55 + k * 0.28, -0.004, G + 0.08, 0.04, 0.006, 0.03, outline=0, bevel=0)

# ---------- the watermills on the cliff ----------
for k, (x, y, w) in enumerate(((-0.5, 0.25, 0.26), (-0.05, 0.3, 0.3), (0.42, 0.25, 0.26), (0.0, 0.7, 0.36))):
    box(f'mill{k}', M['brick'], x, y, CZ - 0.005, w, 0.18, 0.1, outline=0.005, bevel=0)
    for j in range(3):
        ax = x - w / 3 + j * w / 3
        box(f'millarch{k}{j}', M['dark'], ax, y - 0.093, CZ + 0.005, 0.035, 0.006, 0.05, outline=0, bevel=0)
        cyl(f'millarchtop{k}{j}', M['dark'], 0.0175, 0.006, segs=10, outline=0, matrix=Matrix.Translation((ax, y - 0.093, CZ + 0.055)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
        lathe(f'milldome{k}{j}', M['brick'], ((0.04, 0), (0.035, 0.02), (0.02, 0.035), (0.0, 0.04)), CZ + 0.09, ax, y, segs=12, outline=0.002)
# the walkway along the pool, with its parapet
box('walkway', M['brick'], 0.0, -0.66, G - 0.005, 2.0, 0.08, 0.05, outline=0.004, bevel=0)
for k in range(20):
    x = -0.95 + k * 0.1
    box(f'parapet{k}', M['brick'], x, -0.64, G + 0.045, 0.06, 0.03, 0.03, outline=0.001, bevel=0)

for k, (x, y) in enumerate(((-0.75, -0.95), (0.75, -0.95))):
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
