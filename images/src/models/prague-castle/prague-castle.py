# A cartoon Prague Castle for the country maps, built in the set's shared look (../toon.py):
# the long cream palace with its red-tiled roof along the top of its green hill, St Vitus
# Cathedral rising behind it (its steep dark roof, the twin Gothic spires at its west end and
# the great south tower with its green copper helmet), red-roofed houses of the Lesser Town at
# the hill's foot and the Vltava in front. Its long side turned to the camera.
# Run: blender -b --factory-startup -P prague-castle.py -- prague-castle-1024.png 1024 prague-castle.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'palace': toon('palace', '#f1e7cf', shadow_mul=(0.82, 0.78, 0.86), lift=0.2),
    'tiles': toon('tiles', '#c8573e'),
    'stone': toon('stone', '#b9b2a4', shadow_mul=(0.76, 0.76, 0.86)),
    'slate': toon('slate', '#4f5d58', shadow_mul=(0.75, 0.78, 0.82), lift=0.25),
    'copper': toon('copper', '#5fae8c', shadow_mul=(0.7, 0.78, 0.8)),
    'window': flat('window', '#4b3a55'),
    'hill': toon('hill', '#6faa55', shadow_mul=(0.7, 0.78, 0.8)),
    'water': toon('water', '#4aa6dc', shadow_mul=(0.75, 0.82, 0.9), lift=0.35),
    'house': toon('house', '#efd9b0'),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(13)

# ---------- the Vltava along the front ----------
EDGE, R = -0.86, 1.43
a0 = math.asin(-EDGE / R)
arc = [(R * math.cos(a), R * math.sin(a)) for a in (math.pi + a0 + (math.pi - 2 * a0) * k / 40 for k in range(41))]
bm = bmesh.new()
bm.faces.new([bm.verts.new((x, y, G + 0.003)) for x, y in arc])
finish('river', bm, M['water'], outline=0)


def ring(rx, ry, cy, z, jitter, sides=16):
    return [(rx * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / sides),
             cy + ry * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / sides), G + z) for k in range(sides)]


# ---------- the hill ----------
HILL = 0.3
hill = loft('hill', M['hill'], [ring(1.3, 0.72, 0.28, -0.01, 0.02), ring(1.15, 0.6, 0.3, 0.18, 0.04), ring(1.0, 0.5, 0.3, HILL, 0.0)],
            outline=0.035)
hill.visible_shadow = False
H = G + HILL


def gable(name, mat, x, y, z, w, d, h, over=0.02):
    loft(name, mat, [[(xx, y - d / 2 - over, z), (xx, y + d / 2 + over, z), (xx, y, z + h)]
                     for xx in (x - w / 2 - over, x + w / 2 + over)], outline=0.022)


# ---------- the palace along the hill's front ----------
box('palace', M['palace'], 0.05, 0.02, H - 0.01, 1.3, 0.2, 0.26, outline=0.03, bevel=0.005)
gable('palaceroof', M['tiles'], 0.05, 0.02, H + 0.25, 1.3, 0.2, 0.1)
for r in range(2):
    for c in range(13):
        box(f'pwin{r}{c}', M['window'], -0.55 + c * 0.1, 0.02 - 0.106, H + 0.05 + r * 0.1, 0.035, 0.02, 0.055, outline=0, bevel=0)

# ---------- St Vitus Cathedral behind it ----------
CY = 0.36
box('nave', M['stone'], 0.0, CY, H - 0.01, 0.95, 0.24, 0.42, outline=0.03, bevel=0.005)
gable('naveroof', M['slate'], 0.0, CY, H + 0.41, 0.95, 0.24, 0.22)
for k in range(7):
    x = -0.38 + k * 0.13
    for side in (-1, 1):
        lathe(f'pinnacle{k}{side}', M['stone'], ((0.022, 0), (0.003, 0.12)), H + 0.4, x, CY + side * 0.13, segs=8, outline=0.012)
# the twin west spires
for k, y in enumerate((CY - 0.07, CY + 0.07)):
    box(f'westtower{k}', M['stone'], -0.52, y, H - 0.01, 0.12, 0.12, 0.72, outline=0.025, bevel=0.004)
    pyramid(f'westspire{k}', M['slate'], -0.52, y, H + 0.71, 0.13, 0.42, outline=0.022)
    box(f'westwin{k}', M['window'], -0.52 + 0.0, y - 0.061, H + 0.45, 0.035, 0.02, 0.1, outline=0, bevel=0)
# the great south tower with its copper helmet
box('southtower', M['stone'], 0.12, CY - 0.1, H - 0.01, 0.2, 0.2, 0.82, outline=0.03, bevel=0.005)
box('southwin', M['window'], 0.12, CY - 0.201, H + 0.55, 0.06, 0.02, 0.14, outline=0, bevel=0)
lathe('helmet', M['copper'], ((0.12, 0), (0.13, 0.05), (0.1, 0.12), (0.05, 0.16), (0.055, 0.2), (0.035, 0.24), (0.012, 0.3),
                              (0.003, 0.36)), H + 0.81, 0.12, CY - 0.1, segs=16, outline=0.022)

# ---------- the Lesser Town's red roofs at the hill's foot ----------
for k in range(8):
    x = -1.0 + k * 0.28
    y = -0.6 + 0.04 * (k % 2)
    h = 0.08 + 0.03 * (k % 3)
    box(f'house{k}', M['house'], x, y, G - 0.005, 0.18, 0.13, h, outline=0.016, bevel=0.004)
    gable(f'houseroof{k}', M['tiles'], x, y, G + h - 0.005, 0.18, 0.13, 0.07, over=0.01)

turn(before, -32)
render(G)
