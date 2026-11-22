# A cartoon Chichén Itzá (El Castillo, the Temple of Kukulcán) for the country maps, built in
# the set's shared look (../toon.py): nine terraces, a staircase up the middle of each side
# between its balustrades, the feathered serpents' heads at the foot of the front stairs, the
# temple on top with its doorways, and the jungle round the clearing.
# Run: blender -b --factory-startup -P chichen-itza.py -- chichen-itza-1024.png 1024 chichen-itza.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'limestone': toon('limestone', '#d9ceb4', shadow_mul=(0.78, 0.74, 0.80)),
    'limeDark': toon('limeDark', '#c4b696', shadow_mul=(0.78, 0.74, 0.80)),
    'stairs': toon('stairs', '#ebe2cc', shadow_mul=(0.8, 0.76, 0.82)),
    'door': flat('door', '#4b3a55'),
    'jungle': toon('jungle', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a5a3c'),
})

G = tile()
box('path', M['path'], 0, -1.08, G - 0.008, 0.36, 0.7, 0.02, outline=0.015, bevel=0)

# ---------- nine terraces ----------
BASE, TOP_SIDE, H, TERRACES = 1.34, 0.5, 0.86, 9
h = H / TERRACES


def half(z):
    """Half the pyramid's width at a height above the ground."""
    return (BASE - (BASE - TOP_SIDE) * z / H) / 2


for k in range(TERRACES):
    side = BASE - (BASE - TOP_SIDE) * k / (TERRACES - 1)
    box(f'terrace{k}', M['limestone'] if k % 2 == 0 else M['limeDark'], 0, 0, G + k * h, side, side, h,
        outline=0.025, bevel=0.006)

# ---------- a staircase up the middle of each side, between its balustrades ----------
STEPS, SW = 18, 0.26


def stairs(i, a, at):
    for j in range(STEPS):
        z0 = H * j / STEPS
        reach = half(z0) + 0.07
        depth = 0.12
        x, y = at(0, -(reach - depth / 2))
        box(f'step{i}_{j}', M['stairs'], x, y, G + z0, SW, depth, H / STEPS, rot_z=a, outline=0.012, bevel=0)
    for side in (-1, 1):
        p0 = (*at(side * (SW / 2 + 0.03), -(half(0) + 0.07)), G)
        p1 = (*at(side * (SW / 2 + 0.03), -(half(H) + 0.07)), G + H)
        bar(f'balustrade{i}{side}', M['limeDark'], p0, p1, 0.06, outline=0.02)
        if i == 0:
            # Kukulcán's heads at the foot of the front stairs
            x, y = at(side * (SW / 2 + 0.03), -(half(0) + 0.12))
            box(f'serpent{side}', M['limeDark'], x, y, G, 0.08, 0.11, 0.08, rot_z=a, outline=0.02, bevel=0.01)


each_side(stairs)

# ---------- the temple on top ----------
T = G + H
box('temple', M['limestone'], 0, 0, T, 0.44, 0.44, 0.2, outline=0.03, bevel=0.006)
box('templeroof', M['limeDark'], 0, 0, T + 0.2, 0.48, 0.48, 0.045, outline=0.025, bevel=0.004)


def doors(i, a, at):
    for dx in ((-0.12, 0.0, 0.12) if i == 0 else (0.0,)):
        x, y = at(dx, -0.226)
        box(f'door{i}{dx}', M['door'], x, y, T, 0.07, 0.02, 0.13, rot_z=a, outline=0, bevel=0)


each_side(doors)

# ---------- the jungle round the clearing ----------
for k, (x, y, r) in enumerate(((1.1, -0.38, 0.17), (-0.42, 1.1, 0.16), (0.92, 0.82, 0.18), (-1.1, 0.3, 0.15))):
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.18), 0.03, segs=8, outline=0.015)
    ball(f'tree{k}', M['jungle'], x, y, G + 0.24, r, outline=0.025)
    ball(f'tree{k}b', M['jungle'], x + r * 0.6, y - r * 0.3, G + 0.2, r * 0.7, outline=0.022)

render(G)
