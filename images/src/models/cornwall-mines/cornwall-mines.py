# A cartoon Cornish mining landscape for the country maps, built in the set's shared look (../toon.py):
# Botallack's Crowns engine houses clinging to the granite cliffs above the Atlantic, their tall stone
# walls with the round-headed openings and the slender chimneys striped with brick at the top, the
# purple heather and yellow gorse on the clifftop, and the waves breaking at the foot of the rocks.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P cornwall-mines.py -- cornwall-mines-1024.png 1024 cornwall-mines.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#2a7ab0', shadow_mul=(0.76, 0.84, 0.92), lift=0.3),
    'foam': toon('foam', '#eef6fa', lift=0.4),
    'cliff': toon('cliff', '#8a8278', shadow_mul=(0.84, 0.84, 0.88)),
    'top': toon('top', '#8aa860', shadow_mul=(0.74, 0.8, 0.76), lift=0.2),
    'granite': toon('granite', '#a8a094', shadow_mul=(0.84, 0.84, 0.88), lift=0.1),
    'brick': toon('brick', '#b86a4a', lift=0.08),
    'dark': flat('dark', '#2a2622'),
    'heather': toon('heather', '#9a5aa0', lift=0.1),
    'gorse': toon('gorse', '#f0c840', lift=0.12),
})

G = tile(M['sea'])
before = set(bpy.data.objects)
rng = random.Random(1858)


def strip(y0, y1, r, z, n=6):
    """The band of the tile's disc between y0 and y1 (counter-clockwise from above)."""
    xa0, xa1 = math.sqrt(r * r - y0 * y0), math.sqrt(r * r - y1 * y1)
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    pts = [(-xa0, y0), (xa0, y0)]
    pts += [(r * math.cos(a0 + (a1 - a0) * k / n), r * math.sin(a0 + (a1 - a0) * k / n)) for k in range(1, n)]
    pts += [(xa1, y1), (-xa1, y1)]
    pts += [(r * math.cos(math.pi - a1 + (a1 - a0) * k / n), r * math.sin(math.pi - a1 + (a1 - a0) * k / n)) for k in range(1, n)]
    return [(x, y, G + z) for x, y in pts]


# ---------- the clifftop at the back, the cliffs falling to the sea in front ----------
TZ = 0.34
loft('cliffs', M['cliff'], [strip(-0.25, 1.4, 1.42, -0.01), strip(-0.15, 1.38, 1.4, TZ)], outline=0.007)
loft('clifftop', M['top'], [strip(-0.13, 1.36, 1.38, TZ - 0.005), strip(-0.12, 1.35, 1.37, TZ + 0.01)], outline=0.002)
T = G + TZ
# a lower ledge part-way down for the Crowns engine houses
box('ledge', M['cliff'], -0.3, -0.38, G - 0.01, 0.6, 0.3, 0.18, outline=0.006, bevel=0)
box('ledgetop', M['top'], -0.3, -0.38, G + 0.165, 0.58, 0.28, 0.012, outline=0.001, bevel=0)
for k in range(10):
    ball(f'rock{k}', M['cliff'], rng.uniform(-0.9, 0.9), rng.uniform(-0.55, -0.3), G + 0.01, rng.uniform(0.04, 0.08), outline=0.004)
for k in range(12):
    a = rng.uniform(-0.6, 0.6)
    f = ball(f'foam{k}', M['foam'], 0, 0, 0, rng.uniform(0.03, 0.05), outline=0.003)
    f.scale = (2.0, 0.7, 0.35)
    f.location = (rng.uniform(-1.0, 1.0), rng.uniform(-0.75, -0.5), G + 0.01)


def engine_house(name, x, y, z, s, chimney_side):
    """A Cornish engine house: a tall narrow granite box, a round-headed bob opening, its chimney."""
    box(name, M['granite'], x, y, z, s * 0.18, s * 0.24, s * 0.36, outline=0.006, bevel=0)
    loft(f'{name}gable', M['granite'], [[(x - s * 0.09, y - s * 0.12, z + s * 0.355), (x + s * 0.09, y - s * 0.12, z + s * 0.355), (x + s * 0.09, y + s * 0.12, z + s * 0.355), (x - s * 0.09, y + s * 0.12, z + s * 0.355)],
                                        [(x - s * 0.09, y - 0.004, z + s * 0.43), (x + s * 0.09, y - 0.004, z + s * 0.43), (x + s * 0.09, y + 0.004, z + s * 0.43), (x - s * 0.09, y + 0.004, z + s * 0.43)]], outline=0.004)
    box(f'{name}bob', M['dark'], x, y - s * 0.12 - 0.003, z + s * 0.2, s * 0.06, 0.006, s * 0.1, outline=0, bevel=0)
    cyl(f'{name}bobtop', M['dark'], s * 0.03, 0.006, segs=10, outline=0, matrix=Matrix.Translation((x, y - s * 0.12 - 0.003, z + s * 0.3)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    for k in range(2):
        box(f'{name}win{k}', M['dark'], x, y - s * 0.12 - 0.003, z + s * 0.06 + k * s * 0.06, s * 0.04, 0.006, s * 0.035, outline=0, bevel=0)
    cx = x + chimney_side * s * 0.12
    lathe(f'{name}chimney', M['granite'], ((s * 0.045, 0), (s * 0.03, s * 0.5)), z, cx, y + s * 0.08, segs=10, outline=0.004)
    lathe(f'{name}chimneytop', M['brick'], ((s * 0.031, 0), (s * 0.027, s * 0.14)), z + s * 0.5, cx, y + s * 0.08, segs=10, outline=0.003)


engine_house('crownslow', -0.45, -0.4, G + 0.17, 1.0, -1)
engine_house('crownshigh', -0.15, -0.33, G + 0.17, 0.85, 1)
engine_house('clifftophouse', 0.45, 0.25, T, 1.1, 1)

# ---------- heather and gorse on the clifftop ----------
for k in range(20):
    x, y = rng.uniform(-1.0, 1.0), rng.uniform(0.0, 1.1)
    if math.hypot(x, y) > 1.25 or math.hypot(x - 0.45, y - 0.25) < 0.2:
        continue
    ball(f'bush{k}', M['heather'] if k % 2 else M['gorse'], x, y, T + 0.02, rng.uniform(0.03, 0.05), outline=0.003)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
