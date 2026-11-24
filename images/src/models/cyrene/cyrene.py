# A cartoon Cyrene for the country maps, built in the set's shared look (../toon.py): the Greek city in
# the Jebel Akhdar of Libya, the Sanctuary of Apollo on its terrace below the cliff, the Temple of
# Apollo's stepped platform with its tall fluted Doric columns raised again, a few still carrying
# their beams, the fallen drums and the altars, the Sacred Fountain's cliff behind with its spring,
# and the green slopes running down towards the sea. Turned a little towards the camera.
# Run: blender -b --factory-startup -P cyrene.py -- cyrene-1024.png 1024 cyrene.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#8ab862', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'terrace': toon('terrace', '#d8ccb0', lift=0.18),
    'cliff': toon('cliff', '#b8a88a', shadow_mul=(0.8, 0.78, 0.84)),
    'stone': toon('stone', '#ece0c4', shadow_mul=(0.8, 0.8, 0.86), lift=0.2),
    'stoneDark': toon('stoneDark', '#c8b894'),
    'water': toon('water', '#3a92c8', lift=0.3),
    'dark': flat('dark', '#2e2a24'),
    'pine': toon('pine', '#4a7a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile(M['grass'])
before = set(bpy.data.objects)
rng = random.Random(630)


def strip(y0, y1, r, z):
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    right = [(r * math.cos(a0 + (a1 - a0) * k / 12), r * math.sin(a0 + (a1 - a0) * k / 12), z) for k in range(13)]
    left = [(-r * math.cos(a1 + (a0 - a1) * k / 12), r * math.sin(a1 + (a0 - a1) * k / 12), z) for k in range(13)]
    return right + left


# ---------- the sea far below and the cliff behind ----------
loft('sea', M['water'], [strip(-1.31, -0.95, 1.32, G - 0.004), strip(-1.31, -0.95, 1.32, G + 0.008)], outline=0.002)
cliff = loft('cliff', M['cliff'], [strip(0.55, 1.31, 1.32, G - 0.01), strip(0.55, 1.31, 1.32, G + 0.36)], outline=0.007)
cliff.visible_shadow = False
box('spring', M['dark'], -0.35, 0.546, G + 0.06, 0.1, 0.006, 0.08, outline=0, bevel=0)
cyl('springtop', M['dark'], 0.05, 0.006, segs=12, outline=0, matrix=Matrix.Translation((-0.35, 0.546, G + 0.14)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
box('springpool', M['water'], -0.35, 0.48, G - 0.004, 0.16, 0.1, 0.012, outline=0.001, bevel=0)
box('sanctuaryterrace', M['terrace'], 0.05, 0.0, G - 0.004, 1.2, 0.9, 0.012, outline=0.001, bevel=0)

# ---------- the Temple of Apollo ----------
TX, TY = 0.15, 0.1
for i, (w, d) in enumerate(((0.62, 0.38), (0.58, 0.34), (0.54, 0.3))):
    box(f'stylobate{i}', M['stoneDark'], TX, TY, G - 0.005 + i * 0.025, w, d, 0.028, outline=0.003, bevel=0)
SZ = G + 0.07
cols = []
for j in range(6):
    cols.append((TX - 0.235 + j * 0.094, TY - 0.13))
for j in (1, 3, 5):
    cols.append((TX - 0.235 + j * 0.094, TY + 0.13))
cols.append((TX - 0.235, TY + 0.0))
for k, (x, y) in enumerate(cols):
    h = 0.32 if k < 6 else 0.1 + 0.15 * rng.random()
    lathe(f'col{k}', M['stone'], ((0.025, 0), (0.02, h)), SZ, x, y, segs=12, outline=0.003, smooth=False)
    if k < 6:
        box(f'capital{k}', M['stone'], x, y, SZ + h, 0.055, 0.055, 0.02, outline=0.002, bevel=0)
box('architrave', M['stone'], TX - 0.14, TY - 0.13, SZ + 0.34, 0.24, 0.05, 0.04, outline=0.003, bevel=0)
box('architrave2', M['stone'], TX + 0.14, TY - 0.13, SZ + 0.34, 0.15, 0.05, 0.04, outline=0.003, bevel=0)
# fallen drums and the altars
for k in range(5):
    x, y = TX - 0.3 + 0.6 * rng.random(), TY - 0.35 - 0.15 * rng.random()
    cyl(f'drum{k}', M['stone'], 0.022, 0.05, segs=12, outline=0.002, matrix=Matrix.Translation((x, y, G + 0.018)) @ Matrix.Rotation(math.pi / 2, 4, 'Y') @ Matrix.Rotation(rng.random(), 4, 'X'))
box('altar', M['stoneDark'], TX, TY - 0.42, G - 0.005, 0.2, 0.06, 0.05, outline=0.003, bevel=0)
box('altar2', M['stoneDark'], -0.45, -0.2, G - 0.005, 0.12, 0.08, 0.05, outline=0.003, bevel=0)

for k, (x, y) in enumerate(((-0.8, -0.4), (0.85, -0.3), (-0.75, 0.25), (0.8, 0.3))):
    rod(f'pinetrunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.15), 0.012, segs=6, outline=0.002)
    b = ball(f'pine{k}', M['pine'], 0, 0, 0, 0.1, outline=0.008)
    b.scale = (1.2, 1.2, 0.55)
    b.location = (x, y, G + 0.19)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
