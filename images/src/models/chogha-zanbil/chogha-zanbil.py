# A cartoon Chogha Zanbil for the country maps, built in the set's shared look (../toon.py): the great
# Elamite ziggurat of mud brick in the plain of Khuzestan, the square stepped tiers still standing
# with their sloping walls of baked brick, the gateway and stair in the middle of each side, the
# ruined top, and the low wall of the sacred enclosure round it in the dry plain. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P chogha-zanbil.py -- chogha-zanbil-1024.png 1024 chogha-zanbil.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'plain': toon('plain', '#dcc89c', shadow_mul=(0.82, 0.8, 0.84), lift=0.18),
    'brick': toon('brick', '#c49a6e', shadow_mul=(0.8, 0.74, 0.78), lift=0.15),
    'brickDark': toon('brickDark', '#a8805a'),
    'dark': flat('dark', '#3a2e26'),
    'scrub': toon('scrub', '#8a9a5a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['plain'])
before = set(bpy.data.objects)


def tier(name, half, z0, h, inset):
    """A square tier with sloping sides."""
    return loft(name, M['brick'], [[(-half, -half, z0), (half, -half, z0), (half, half, z0), (-half, half, z0)],
                                   [(-half + inset, -half + inset, z0 + h), (half - inset, -half + inset, z0 + h), (half - inset, half - inset, z0 + h), (-half + inset, half - inset, z0 + h)]], outline=0.007)


# ---------- the enclosure wall ----------
E = 0.88
for k, (x, y, sx, sy) in enumerate(((0, -E, 2 * E, 0.04), (0, E, 2 * E, 0.04), (-E, 0, 0.04, 2 * E), (E, 0, 0.04, 2 * E))):
    if k == 0:
        for s in (-1, 1):
            box(f'wall{k}{s}', M['brickDark'], s * (E / 2 + 0.06), y, G - 0.005, E - 0.12, sy, 0.05, outline=0.003, bevel=0)
        continue
    box(f'wall{k}', M['brickDark'], x, y, G - 0.005, sx, sy, 0.05, outline=0.003, bevel=0)

# ---------- the stepped tiers ----------
Z = G - 0.005
for k, (half, h) in enumerate(((0.5, 0.14), (0.38, 0.13), (0.26, 0.12))):
    tier(f'tier{k}', half, Z, h, 0.025)
    Z += h
# the ruined top
rng = random.Random(1250)
for k in range(9):
    x, y = -0.14 + (k % 3) * 0.14, -0.14 + (k // 3) * 0.14
    box(f'ruin{k}', M['brick'], x, y, Z - 0.005, 0.12, 0.12, 0.02 + 0.05 * rng.random(), outline=0.003, bevel=0)

# ---------- the gateway and stair in the middle of the front ----------
box('gatehouse', M['brick'], 0.0, -0.53, G - 0.005, 0.16, 0.1, 0.16, outline=0.005, bevel=0)
box('gatedoor', M['dark'], 0.0, -0.583, G - 0.005, 0.05, 0.006, 0.09, outline=0, bevel=0)
cyl('gatearch', M['dark'], 0.025, 0.006, segs=10, outline=0, matrix=Matrix.Translation((0.0, -0.583, G + 0.085)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for i in range(5):
    box(f'stair{i}', M['brickDark'], 0.0, -0.465 + i * 0.02, G + 0.13, 0.08, 0.02, 0.025 + i * 0.026, outline=0.001, bevel=0)
for s in (-1, 1):
    box(f'sidegate{s}', M['brick'], s * 0.53, 0.0, G - 0.005, 0.1, 0.16, 0.14, outline=0.004, bevel=0)

# ---------- scrub on the plain ----------
for k in range(10):
    a = 2 * math.pi * k / 10 + 0.3
    r = 0.7 + 0.08 * rng.random()
    b = ball(f'scrub{k}', M['scrub'], 0, 0, 0, 0.04, outline=0.004)
    b.scale = (1.0, 1.0, 0.6)
    b.location = (r * math.cos(a), r * math.sin(a), G + 0.01)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
