# A cartoon Hallstatt for the country maps, built in the set's shared look (../toon.py): the old
# salt town on the Hallstätter See, its pastel houses under steep roofs packed onto the shore, the
# Protestant church's white tower and pointed spire at the water, the Catholic church above, the
# forested mountain rising straight behind with snow on its top, a swan and a flat-bottomed boat.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P hallstatt.py -- hallstatt-1024.png 1024 hallstatt.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lake': toon('lake', '#3a8aa0', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'shore': toon('shore', '#7aa84a', shadow_mul=(0.7, 0.78, 0.8)),
    'mountain': toon('mountain', '#3f7a46', shadow_mul=(0.7, 0.78, 0.8)),
    'rock': toon('rock', '#8a8680', shadow_mul=(0.84, 0.84, 0.9)),
    'snow': toon('snow', '#fbfbfd', shadow_mul=(0.8, 0.86, 0.96), lift=0.15),
    'pine': toon('pine', '#2f6a3e', shadow_mul=(0.7, 0.78, 0.8)),
    'h0': toon('h0', '#f8f2e4', lift=0.2), 'h1': toon('h1', '#f0d8a0'), 'h2': toon('h2', '#e8b8a0'), 'h3': toon('h3', '#c8dcc0'), 'wood': toon('wood', '#8a5a3a'),
    'roof': toon('roof', '#5a5654', shadow_mul=(0.8, 0.8, 0.88)),
    'roofRed': toon('roofRed', '#9a4a3a'),
    'white': toon('white', '#f8f6f0', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'spire': toon('spire', '#4a6a64', shadow_mul=(0.8, 0.82, 0.88)),
    'window': flat('window', '#3a3640'),
    'swan': toon('swan', '#ffffff', shadow_mul=(0.82, 0.86, 0.95), lift=0.15),
    'beak': toon('beak', '#f08a2a'),
    'boat': toon('boat', '#7a5236'),
})

G = tile(M['lake'])
before = set(bpy.data.objects)
rng = random.Random(1249)


def segment(c, r, z, n=26):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


# ---------- the shore strip and the mountain straight behind it ----------
shore = loft('shore', M['shore'], [segment(0.12, 1.4, -0.01), segment(0.14, 1.39, 0.04)], outline=0.012)
shore.visible_shadow = False
mt = loft('mountain', M['mountain'], [segment(0.4, 1.36, 0.035), segment(0.56, 1.26, 0.42), segment(0.74, 1.1, 0.72)], outline=0.018, smooth=True)
mt.visible_shadow = False
rock = loft('rocktop', M['rock'], [segment(0.74, 1.1, 0.715), segment(0.84, 0.98, 0.86)], outline=0.014)
rock.visible_shadow = False
snow = loft('snowtop', M['snow'], [segment(0.84, 0.98, 0.855), segment(0.9, 0.94, 0.92)], outline=0.01, smooth=True)
snow.visible_shadow = False
for f, (c, z) in enumerate(((0.47, 0.17), (0.54, 0.34), (0.62, 0.52))):
    half = math.sqrt(1.3 ** 2 - c ** 2) - 0.1
    n = 9 - f
    for j in range(n):
        x = -half + (j + 0.5) * 2 * half / n + rng.uniform(-0.03, 0.03)
        if f == 0 and -0.55 < x < 0.55:
            continue
        lathe(f'pine{f}_{j}', M['pine'], ((0.06, 0), (0.004, 0.16)), G + z - 0.02, x, c, segs=10, outline=0.006)


# ---------- the houses, packed along the shore and up the slope ----------
def house(name, x, y, z, w, d, h, wall, wood=False):
    box(name, M[wall], x, y, z - 0.005, w, d, h, outline=0.008, bevel=0)
    if wood:
        box(f'{name}wood', M['wood'], x, y, z + h * 0.55, w + 0.004, d + 0.004, h * 0.45, outline=0.004, bevel=0)
    loft(f'{name}roof', M['roof'], [[(x - w / 2 - 0.01, y - d / 2 - 0.012, z + h - 0.004), (x + w / 2 + 0.01, y - d / 2 - 0.012, z + h - 0.004),
                                     (x + w / 2 + 0.01, y + d / 2 + 0.012, z + h - 0.004), (x - w / 2 - 0.01, y + d / 2 + 0.012, z + h - 0.004)],
                                    [(x - 0.004, y - d / 2 - 0.012, z + h + 0.075), (x + 0.004, y - d / 2 - 0.012, z + h + 0.075), (x + 0.004, y + d / 2 + 0.012, z + h + 0.075),
                                     (x - 0.004, y + d / 2 + 0.012, z + h + 0.075)]], outline=0.007)
    for j in range(2):
        box(f'{name}win{j}', M['window'], x - w / 4 + j * w / 2, y - d / 2 - 0.004, z + h * 0.3, 0.02, 0.006, 0.025, outline=0, bevel=0)


WALLS = ['h0', 'h1', 'h2', 'h3']
for k in range(9):
    x = -0.95 + k * 0.22
    if -0.1 < x < 0.12:
        continue
    house(f'front{k}', x, 0.22, G + 0.04, 0.13, 0.12, 0.1, WALLS[k % 4], wood=k % 3 == 0)
for k in range(7):
    x = -0.75 + k * 0.24
    house(f'back{k}', x, 0.36, G + 0.1, 0.12, 0.11, 0.09, WALLS[(k + 2) % 4], wood=k % 2 == 0)

# ---------- the Protestant church at the water, the Catholic church above ----------
PX, PY = 0.0, 0.24
box('church', M['white'], PX + 0.03, PY + 0.06, G + 0.035, 0.12, 0.2, 0.1, outline=0.009, bevel=0)
box('tower', M['white'], PX, PY - 0.02, G + 0.035, 0.08, 0.08, 0.3, outline=0.01, bevel=0)
for j in range(2):
    box(f'towerwin{j}', M['window'], PX, PY - 0.063, G + 0.18 + j * 0.08, 0.025, 0.006, 0.04, outline=0, bevel=0)
lathe('spire', M['spire'], ((0.06, 0), (0.004, 0.24)), G + 0.33, PX, PY - 0.02, segs=4, outline=0.008)
box('catholic', M['white'], -0.4, 0.5, G + 0.2, 0.14, 0.1, 0.09, outline=0.008, bevel=0)
box('catholictower', M['white'], -0.47, 0.48, G + 0.2, 0.06, 0.06, 0.18, outline=0.008, bevel=0)
lathe('catholicspire', M['roofRed'], ((0.045, 0), (0.004, 0.12)), G + 0.38, -0.47, 0.48, segs=4, outline=0.006)

# ---------- a swan and a flat-bottomed boat on the lake ----------
SX, SY = -0.45, -0.55
cs = ball('swanbody', M['swan'], 0, 0, 0, 0.045, outline=0.008)
cs.scale = (1.5, 0.9, 0.7)
cs.location = (SX, SY, G + 0.02)
rod('swanneck', M['swan'], (SX + 0.05, SY, G + 0.03), (SX + 0.06, SY, G + 0.12), 0.012, segs=8, outline=0.003)
ball('swanhead', M['swan'], SX + 0.065, SY, G + 0.125, 0.016, outline=0.003)
bar('swanbeak', M['beak'], (SX + 0.075, SY, G + 0.122), (SX + 0.1, SY, G + 0.115), 0.008, outline=0)
BX, BY = 0.45, -0.6
loft('boat', M['boat'], [[(BX - 0.16, BY - 0.03, G - 0.002), (BX + 0.12, BY - 0.03, G - 0.002), (BX + 0.12, BY + 0.03, G - 0.002), (BX - 0.16, BY + 0.03, G - 0.002)],
                         [(BX - 0.2, BY - 0.04, G + 0.04), (BX + 0.14, BY - 0.04, G + 0.035), (BX + 0.14, BY + 0.04, G + 0.035), (BX - 0.2, BY + 0.04, G + 0.04)]], outline=0.007)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
