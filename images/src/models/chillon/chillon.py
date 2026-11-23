# A cartoon Château de Chillon for the country maps, built in the set's shared look (../toon.py) on
# a tile of lake water: the castle on its rock in Lake Geneva, its white walls, the square keep under
# a steep roof, round towers along the lake side under pointed red-brown roofs, the wooden bridge to
# the shore, and the Alps behind with snow on their tops. Turned a little towards the camera.
# Run: blender -b --factory-startup -P chillon.py -- chillon-1024.png 1024 chillon.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lake': toon('lake', '#4aa6dc', shadow_mul=(0.75, 0.82, 0.9), lift=0.35),
    'wall': toon('wall', '#ece6d8', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'rockbase': toon('rockbase', '#a39d93', shadow_mul=(0.76, 0.76, 0.86)),
    'roof': toon('roof', '#9a5a3c'),
    'window': flat('window', '#3f3a44'),
    'wood': toon('wood', '#8a6448'),
    'shore': toon('shore', '#6faa55', shadow_mul=(0.7, 0.78, 0.8)),
    'mountain': toon('mountain', '#7f8a96', shadow_mul=(0.75, 0.76, 0.86)),
    'snow': toon('snow', '#f7f8fb', shadow_mul=(0.80, 0.84, 0.95), lift=0.15),
})

G = tile(M['lake'])
before = set(bpy.data.objects)
rng = random.Random(43)


def ring(cx, cy, r, z, jitter, sides=11, squash=1.0):
    return [(cx + r * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / sides),
             cy + r * squash * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / sides), G + z) for k in range(sides)]


# ---------- the shore and the Alps behind ----------
EDGE = 0.55
a0 = math.asin(EDGE / 1.42)
shore = [(1.42 * math.cos(a), 1.42 * math.sin(a)) for a in (a0 + (math.pi - 2 * a0) * k / 30 for k in range(31))]
loft('shore', M['shore'], [[(x, y, G - 0.01) for x, y in shore], [(x, y, G + 0.08) for x, y in shore]], outline=0.03)
for k, (cx, cy, r, h) in enumerate(((-0.55, 1.0, 0.42, 1.05), (0.35, 1.05, 0.5, 1.25), (1.0, 0.75, 0.32, 0.8))):
    body = loft(f'alp{k}', M['mountain'], [ring(cx, cy, r, 0.05, 0.0, squash=0.6), ring(cx, cy, r * 0.65, h * 0.45, 0.12, squash=0.6),
                                           ring(cx, cy, r * 0.32, h * 0.78, 0.12, squash=0.6), ring(cx, cy, 0.02, h, 0.0)], outline=0.035)
    cap = loft(f'alpsnow{k}', M['snow'], [ring(cx, cy, r * 0.36, h * 0.74, 0.14, squash=0.6), ring(cx, cy, 0.02, h + 0.01, 0.0)],
               outline=0.02)
    body.visible_shadow = cap.visible_shadow = False

# ---------- the rock the castle stands on ----------
CX, CY = -0.05, -0.15
rock = loft('islet', M['rockbase'], [ring(CX, CY, 0.78, -0.01, 0.04, squash=0.55), ring(CX, CY, 0.74, 0.1, 0.05, squash=0.55)], outline=0.03)
rock.visible_shadow = False
B = G + 0.1


def windows(name, x0, x1, y, z, count, side=-1):
    for c in range(count):
        x = x0 + (x1 - x0) * (c + 0.5) / count
        box(f'{name}{c}', M['window'], x, y + side * 0.004, z, 0.035, 0.02, 0.06, outline=0, bevel=0)


def hip_roof(name, x, y, z, w, d, h):
    loft(name, M['roof'], [[(x - w / 2, y - d / 2, z), (x + w / 2, y - d / 2, z), (x + w / 2, y + d / 2, z), (x - w / 2, y + d / 2, z)],
                           [(x - 0.01, y - 0.005, z + h), (x + 0.01, y - 0.005, z + h), (x + 0.01, y + 0.005, z + h),
                            (x - 0.01, y + 0.005, z + h)]], outline=0.02)


# ---------- the castle: its walls, the keep, the towers along the lake ----------
box('curtain', M['wall'], CX, CY, B, 1.1, 0.42, 0.28, outline=0.03, bevel=0.005)
hip_roof('curtainroof', CX, CY, B + 0.28, 1.14, 0.46, 0.12)
windows('cwin', CX - 0.45, CX + 0.45, CY - 0.21, B + 0.13, 8)
box('keep', M['wall'], CX + 0.05, CY + 0.05, B, 0.24, 0.24, 0.6, outline=0.03, bevel=0.005)
hip_roof('keeproof', CX + 0.05, CY + 0.05, B + 0.6, 0.27, 0.27, 0.24)
windows('kwin', CX - 0.04, CX + 0.14, CY + 0.05 - 0.12, B + 0.42, 2)
for k, (dx, r, h) in enumerate(((-0.5, 0.08, 0.4), (-0.22, 0.07, 0.36), (0.3, 0.075, 0.38), (0.52, 0.085, 0.44))):
    x, y = CX + dx, CY - 0.2
    lathe(f'tower{k}', M['wall'], ((r, 0), (r, h)), B, x, y, segs=16, outline=0.022)
    lathe(f'towerroof{k}', M['roof'], ((r + 0.02, 0), (r * 0.6, 0.06), (0.004, 0.2)), B + h, x, y, segs=16, outline=0.018)
    box(f'towerwin{k}', M['window'], x, y - r - 0.004, B + h * 0.6, 0.03, 0.02, 0.05, outline=0, bevel=0)

# ---------- the wooden bridge to the shore ----------
box('bridge', M['wood'], CX - 0.25, CY + 0.42, G + 0.06, 0.1, 0.44, 0.03, outline=0.012, bevel=0)
for k, dy in enumerate((0.3, 0.45, 0.6)):
    rod(f'bridgeleg{k}', M['wood'], (CX - 0.25, CY + dy, G), (CX - 0.25, CY + dy, G + 0.07), 0.012, segs=6, outline=0.006)

turn(before, -20)
render(G)
