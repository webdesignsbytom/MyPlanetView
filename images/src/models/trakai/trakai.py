# A cartoon Trakai Island Castle for the country maps, built in the set's shared look (../toon.py)
# on a tile of lake water: the red-brick Gothic castle on its island in Lake Galvė, stone below and
# brick above, its tall keep under a steep roof, the palace beside it, the outer walls with round
# towers under their tiled cones, the wooden footbridge from the shore, and a yacht on the lake.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P trakai.py -- trakai-1024.png 1024 trakai.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lake': toon('lake', '#4aa6dc', shadow_mul=(0.75, 0.82, 0.9), lift=0.35),
    'island': toon('island', '#6faa55', shadow_mul=(0.7, 0.78, 0.8)),
    'brick': toon('brick', '#b0503a'),
    'brickDark': toon('brickDark', '#93412f'),
    'stone': toon('stone', '#a8a29a', shadow_mul=(0.78, 0.78, 0.86)),
    'tiles': toon('tiles', '#c8673f'),
    'window': flat('window', '#33303d'),
    'wood': toon('wood', '#8a6448'),
    'tree': toon('tree', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'sail': toon('sail', '#fbfbfd', shadow_mul=(0.82, 0.85, 0.95), lift=0.1),
    'hull': toon('hull', '#f6f3ec', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
})

G = tile(M['lake'])
before = set(bpy.data.objects)
rng = random.Random(191)


def ring(cx, cy, rx, ry, z, jitter, sides=16):
    return [(cx + rx * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / sides),
             cy + ry * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / sides), G + z) for k in range(sides)]


def ridge_roof(name, x, y, z, w, d, h, along_x=True):
    top = ([(x - w / 2 + 0.02, y - 0.004), (x + w / 2 - 0.02, y - 0.004), (x + w / 2 - 0.02, y + 0.004), (x - w / 2 + 0.02, y + 0.004)] if along_x else
           [(x - 0.004, y - d / 2 + 0.02), (x + 0.004, y - d / 2 + 0.02), (x + 0.004, y + d / 2 - 0.02), (x - 0.004, y + d / 2 - 0.02)])
    loft(name, M['tiles'], [[(x - w / 2, y - d / 2, z), (x + w / 2, y - d / 2, z), (x + w / 2, y + d / 2, z), (x - w / 2, y + d / 2, z)],
                            [(px, py, z + h) for px, py in top]], outline=0.018)


def wall(name, x, y, w, d, h, stone=0.08):
    """A wall, stone up to `stone` and brick above it."""
    box(name + 'stone', M['stone'], x, y, G + 0.05, w, d, stone, outline=0.016, bevel=0)
    box(name, M['brick'], x, y, G + 0.05 + stone, w, d, h - stone, outline=0.018, bevel=0)


def round_tower(name, x, y, r, h):
    lathe(name + 'stone', M['stone'], ((r, 0), (r, 0.1)), G + 0.05, x, y, segs=18, outline=0.014)
    lathe(name, M['brick'], ((r, 0), (r, h - 0.1)), G + 0.15, x, y, segs=18, outline=0.018)
    lathe(name + 'roof', M['tiles'], ((r + 0.02, 0), (0.004, 0.24)), G + 0.05 + h, x, y, segs=18, outline=0.016)
    box(name + 'slit', M['window'], x, y - r - 0.002, G + 0.05 + h * 0.6, 0.018, 0.01, 0.05, outline=0, bevel=0)


# ---------- the island and the shore ----------
island = loft('island', M['island'], [ring(0.05, 0.2, 0.92, 0.74, -0.01, 0.04), ring(0.05, 0.2, 0.86, 0.68, 0.05, 0.04)], outline=0.025)
island.visible_shadow = False
shore = [(-1.42 * math.cos(a), -1.42 * math.sin(a) * 0.98) for a in (math.radians(20 + 50 * k / 12) for k in range(13))]
loft('shore', M['island'], [[(x, y, G - 0.01) for x, y in shore + [(-0.78, -0.62)]], [(x, y, G + 0.05) for x, y in shore + [(-0.78, -0.62)]]], outline=0.02)

# ---------- the outer walls and their round towers ----------
OX0, OX1, OY0, OY1 = -0.6, 0.6, -0.32, 0.72
H = 0.24
wall('frontwall', (OX0 + OX1) / 2, OY0, OX1 - OX0, 0.05, H)
wall('leftwall', OX0, (OY0 + OY1) / 2, 0.05, OY1 - OY0, H)
wall('backwall', (OX0 + OX1) / 2, OY1, OX1 - OX0, 0.05, H)
wall('rightwall', OX1, (OY0 + OY1) / 2, 0.05, OY1 - OY0, H)
for k, (x, y) in enumerate(((OX0, OY0), (OX1, OY0), (OX0, OY1), (OX1, OY1), ((OX0 + OX1) / 2 - 0.15, OY0))):
    round_tower(f'tower{k}', x, y, 0.08, 0.34)
box('gate', M['window'], (OX0 + OX1) / 2 + 0.05, OY0 - 0.028, G + 0.05, 0.08, 0.01, 0.13, outline=0, bevel=0)

# ---------- the inner castle: the palace and the tall keep ----------
PX, PY = 0.2, 0.38
wall('palace', PX, PY, 0.62, 0.3, 0.38, stone=0.12)
ridge_roof('palaceroof', PX, PY, G + 0.43, 0.66, 0.34, 0.24)
for row, z in enumerate((0.22, 0.33)):
    for k in range(5):
        box(f'palacewin{row}{k}', M['window'], PX - 0.24 + k * 0.12, PY - 0.153, G + z, 0.03, 0.01, 0.06, outline=0, bevel=0)
KX, KY = -0.2, 0.32
wall('keep', KX, KY, 0.2, 0.2, 0.66, stone=0.12)
for k, z in enumerate((0.3, 0.45, 0.58)):
    box(f'keepwin{k}', M['window'], KX, KY - 0.103, G + z, 0.03, 0.01, 0.06, outline=0, bevel=0)
box('keepband', M['brickDark'], KX, KY, G + 0.66, 0.21, 0.21, 0.04, outline=0.012, bevel=0)
pyramid('keeproof', M['tiles'], KX, KY, G + 0.7, 0.24, 0.32, outline=0.018)

# ---------- the wooden footbridge to the shore ----------
for k in range(7):
    t = k / 6
    x, y = -0.45 - 0.4 * t, -0.42 - 0.3 * t
    box(f'bridge{k}', M['wood'], x, y, G + 0.045, 0.1, 0.12, 0.02, rot_z=math.atan2(-0.3, -0.4), outline=0.006, bevel=0)
    rod(f'bridgeleg{k}', M['wood'], (x, y, G), (x, y, G + 0.05), 0.008, segs=6, outline=0)

# ---------- trees on the island and the shore, a yacht on the lake ----------
for k, (x, y) in enumerate(((0.8, 0.0), (0.72, 0.5), (-0.75, 0.3), (-1.05, -0.45), (-0.85, -0.95))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.15, 0.11, outline=0.02)
YX, YY = 0.75, -0.85
loft('yachthull', M['hull'], [[(YX - 0.1, YY, G - 0.005), (YX + 0.08, YY - 0.025, G - 0.005), (YX + 0.12, YY, G - 0.005), (YX + 0.08, YY + 0.025, G - 0.005)],
                              [(YX - 0.11, YY, G + 0.035), (YX + 0.08, YY - 0.04, G + 0.035), (YX + 0.14, YY, G + 0.035), (YX + 0.08, YY + 0.04, G + 0.035)]],
     outline=0.01)
rod('yachtmast', M['wood'], (YX + 0.01, YY, G + 0.035), (YX + 0.01, YY, G + 0.32), 0.005, segs=6, outline=0)
loft('yachtsail', M['sail'], [[(YX - 0.09, YY - 0.002, G + 0.05), (YX + 0.005, YY - 0.002, G + 0.05), (YX + 0.005, YY - 0.002, G + 0.31)],
                              [(YX - 0.09, YY + 0.002, G + 0.05), (YX + 0.005, YY + 0.002, G + 0.05), (YX + 0.005, YY + 0.002, G + 0.31)]], outline=0.008)

turn(before, -20)
render(G)
