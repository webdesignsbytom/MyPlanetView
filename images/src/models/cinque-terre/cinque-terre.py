# A cartoon Cinque Terre for the country maps, built in the set's shared look (../toon.py): Manarola's
# tall narrow houses in pastel colours stacked on their rocky spur above the little harbour, the
# boats pulled up on the slipway, the terraced vineyards on the hill behind, and the Ligurian Sea.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P cinque-terre.py -- cinque-terre-1024.png 1024 cinque-terre.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#2a8ac0', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'rock': toon('rock', '#8a7e70', shadow_mul=(0.84, 0.84, 0.9)),
    'vine': toon('vine', '#6a9a48', shadow_mul=(0.72, 0.8, 0.74)),
    'hill': toon('hill', '#5a8a48', shadow_mul=(0.72, 0.8, 0.74)),
    'h0': toon('h0', '#f0c050'), 'h1': toon('h1', '#e8806a'), 'h2': toon('h2', '#f4b0a0'), 'h3': toon('h3', '#a8c890'), 'h4': toon('h4', '#e89a50'), 'h5': toon('h5', '#c8d8e8'),
    'roof': toon('roof', '#6a6460'),
    'shutter': toon('shutter', '#3a7a4a'),
    'boat': toon('boat', '#2f6fc0'),
    'boatRed': toon('boatRed', '#d8402c'),
    'slip': toon('slip', '#b8b0a2', lift=0.15),
})

G = tile(M['sea'])
before = set(bpy.data.objects)
rng = random.Random(1663)


def segment(c, r, z, n=26):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


# ---------- the hill behind, its vineyard terraces ----------
for i in range(5):
    c = 0.35 + i * 0.12
    t = loft(f'vineyard{i}', M['vine' if i % 2 else 'hill'], [segment(c, 1.38 - i * 0.04, -0.01), segment(c + 0.01, 1.375 - i * 0.04, 0.12 + i * 0.1)], outline=0.01)
    t.visible_shadow = False

# ---------- the rocky spur the village stands on ----------
spur = loft('spur', M['rock'], [[(-0.55, -0.35, G - 0.01), (0.25, -0.4, G - 0.01), (0.45, 0.45, G - 0.01), (-0.6, 0.45, G - 0.01)],
                                [(-0.5, -0.28, G + 0.18), (0.2, -0.32, G + 0.18), (0.4, 0.42, G + 0.2), (-0.55, 0.42, G + 0.2)]], outline=0.016)
spur.visible_shadow = False
T = G + 0.18

# ---------- the tall narrow houses ----------
for i in range(3):
    for j in range(6):
        x = -0.45 + j * 0.14
        y = -0.2 + i * 0.2
        h = rng.uniform(0.18, 0.28) + i * 0.04
        box(f'house{i}{j}', M[f'h{(i * 2 + j) % 6}'], x, y, T - 0.005, 0.13, 0.15, h, outline=0.008, bevel=0)
        box(f'houseroof{i}{j}', M['roof'], x, y, T + h - 0.006, 0.135, 0.155, 0.02, outline=0.004, bevel=0)
        for row in range(int(h / 0.07)):
            box(f'shutter{i}{j}{row}', M['shutter'], x, y - 0.077, T + 0.03 + row * 0.07, 0.03, 0.006, 0.035, outline=0, bevel=0)

# ---------- the harbour's slipway and its boats ----------
box('slipway', M['slip'], 0.55, -0.55, G - 0.005, 0.3, 0.4, 0.03, rot_z=-0.3, outline=0.006, bevel=0)
for k, (x, y, a, mat) in enumerate(((0.5, -0.55, -0.3, 'boat'), (0.62, -0.48, -0.25, 'boatRed'), (0.78, -0.75, 0.3, 'boat'))):
    c, s = math.cos(a), math.sin(a)
    z = G + 0.025 if k < 2 else G
    loft(f'boat{k}', M[mat], [[(x - 0.07 * c, y - 0.07 * s, z), (x - 0.02 * s, y + 0.02 * c, z), (x + 0.07 * c, y + 0.07 * s, z), (x + 0.02 * s, y - 0.02 * c, z)],
                              [(x - 0.08 * c, y - 0.08 * s, z + 0.03), (x - 0.028 * s, y + 0.028 * c, z + 0.03), (x + 0.08 * c, y + 0.08 * s, z + 0.03),
                               (x + 0.028 * s, y - 0.028 * c, z + 0.03)]], outline=0.005)

turn(before, -20)
render(G)
