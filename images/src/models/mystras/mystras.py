# A cartoon Mystras for the country maps, built in the set's shared look (../toon.py): the abandoned
# Byzantine city on its steep hill above Sparta, the Frankish castle on the summit, the long L-shaped
# Palace of the Despots on the slope below, and the churches with their red-tiled domes and banded
# stone and brick walls scattered down the hillside among cypresses and olive trees. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P mystras.py -- mystras-1024.png 1024 mystras.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'hill': toon('hill', '#8aa860', shadow_mul=(0.74, 0.8, 0.76)),
    'rock': toon('rock', '#a89a80'),
    'stone': toon('stone', '#d8c8a8', shadow_mul=(0.86, 0.82, 0.8), lift=0.12),
    'brick': toon('brick', '#c87a5a', lift=0.08),
    'roof': toon('roof', '#c4603e'),
    'dark': flat('dark', '#2e2622'),
    'cypress': toon('cypress', '#2f5a34', shadow_mul=(0.7, 0.78, 0.8)),
    'olive': toon('olive', '#8aa060', shadow_mul=(0.72, 0.8, 0.76)),
    'trunk': toon('trunk', '#6a4a36'),
})

G = tile()
before = set(bpy.data.objects)

# ---------- the hill, rising to the summit at the back ----------
SY, SZ = 0.5, 0.62
hl = lathe('hillmass', M['hill'], ((1.2, 0), (1.0, 0.1), (0.72, 0.28), (0.43, 0.48), (0.21, 0.6), (0.0, SZ)), G - 0.01, 0, SY - 0.35, segs=36, outline=0.008)
hl.visible_shadow = False


def ground(x, y):
    """The hill's height at (x, y), following its lathe profile."""
    r = math.hypot(x, y - (SY - 0.35))
    prof = ((0.0, SZ), (0.21, 0.6), (0.43, 0.48), (0.72, 0.28), (1.0, 0.1), (1.2, 0.0))
    for (r0, z0), (r1, z1) in zip(prof, prof[1:]):
        if r <= r1:
            return G - 0.01 + z0 + (z1 - z0) * (r - r0) / (r1 - r0)
    return G


# ---------- the castle on the summit ----------
KX, KY = 0.0, SY - 0.35
KZ = ground(KX, KY)
box('castle', M['stone'], KX, KY, KZ - 0.03, 0.3, 0.22, 0.12, outline=0.006, bevel=0)
box('keep', M['stone'], KX + 0.08, KY + 0.03, KZ - 0.03, 0.1, 0.1, 0.22, outline=0.005, bevel=0)
for j in range(6):
    box(f'merlon{j}', M['stone'], KX - 0.12 + j * 0.05, KY - 0.11, KZ + 0.085, 0.025, 0.02, 0.03, outline=0.001, bevel=0)


def church(name, x, y, s, dome=True):
    z = ground(x, y) - 0.03
    box(name, M['stone'], x, y, z, s * 1.2, s, s * 0.7, outline=0.005, bevel=0)
    for k in range(3):
        box(f'{name}band{k}', M['brick'], x, y - s / 2 - 0.003, z + 0.02 + k * s * 0.2, s * 1.2, 0.006, 0.012, outline=0, bevel=0)
    box(f'{name}door', M['dark'], x, y - s / 2 - 0.004, z, s * 0.25, 0.006, s * 0.35, outline=0, bevel=0)
    loft(f'{name}roof', M['roof'], [[(x - s * 0.62, y - s * 0.52, z + s * 0.7), (x + s * 0.62, y - s * 0.52, z + s * 0.7), (x + s * 0.62, y + s * 0.52, z + s * 0.7), (x - s * 0.62, y + s * 0.52, z + s * 0.7)],
                                    [(x - s * 0.62, y - 0.004, z + s * 0.95), (x + s * 0.62, y - 0.004, z + s * 0.95), (x + s * 0.62, y + 0.004, z + s * 0.95), (x - s * 0.62, y + 0.004, z + s * 0.95)]], outline=0.003)
    if dome:
        lathe(f'{name}drum', M['brick'], ((s * 0.22, 0), (s * 0.22, s * 0.25)), z + s * 0.8, x, y, segs=10, outline=0.003, smooth=False)
        lathe(f'{name}dome', M['roof'], ((s * 0.24, 0), (s * 0.2, s * 0.1), (s * 0.1, s * 0.18), (0.003, s * 0.2)), z + s * 1.05, x, y, segs=12, outline=0.003)


# ---------- the Palace of the Despots on the slope ----------
PX, PY = -0.25, -0.05
PZ = ground(PX, PY) - 0.04
box('palace', M['stone'], PX, PY, PZ, 0.5, 0.14, 0.2, outline=0.007, bevel=0)
box('palacewing', M['stone'], PX + 0.2, PY + 0.15, ground(PX + 0.2, PY + 0.15) - 0.04, 0.12, 0.3, 0.18, outline=0.006, bevel=0)
for row in range(2):
    for j in range(7):
        box(f'palacewin{row}{j}', M['dark'], PX - 0.21 + j * 0.07, PY - 0.073, PZ + 0.06 + row * 0.07, 0.025, 0.006, 0.04, outline=0, bevel=0)
loft('palaceroof', M['roof'], [[(PX - 0.25, PY - 0.07, PZ + 0.195), (PX + 0.25, PY - 0.07, PZ + 0.195), (PX + 0.25, PY + 0.07, PZ + 0.195), (PX - 0.25, PY + 0.07, PZ + 0.195)],
                               [(PX - 0.25, PY - 0.004, PZ + 0.25), (PX + 0.25, PY - 0.004, PZ + 0.25), (PX + 0.25, PY + 0.004, PZ + 0.25), (PX - 0.25, PY + 0.004, PZ + 0.25)]], outline=0.003)

# ---------- the churches down the hillside ----------
church('pantanassa', 0.35, 0.05, 0.16)
church('metropolis', -0.1, -0.5, 0.18)
church('peribleptos', 0.55, -0.4, 0.14)
church('hodegetria', -0.6, -0.35, 0.14, dome=False)

# ---------- cypresses and olives ----------
for k, (x, y) in enumerate(((0.15, -0.2), (-0.45, 0.25), (0.6, 0.35), (-0.75, 0.1), (0.25, -0.75), (-0.4, -0.8), (0.85, -0.1))):
    z = ground(x, y) - 0.02
    if k % 2:
        lathe(f'cypress{k}', M['cypress'], ((0.035, 0), (0.045, 0.06), (0.03, 0.18), (0.004, 0.28)), z, x, y, segs=10, outline=0.006)
    else:
        rod(f'olivetrunk{k}', M['trunk'], (x, y, z), (x, y, z + 0.06), 0.012, segs=6, outline=0.002)
        ball(f'olive{k}', M['olive'], x, y, z + 0.11, 0.08, outline=0.009)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
