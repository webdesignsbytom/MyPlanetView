# A cartoon Mehmed Paša Sokolović Bridge for the country maps, built in the set's shared look
# (../toon.py): the Ottoman stone bridge at Višegrad, its eleven arches striding over the emerald
# Drina, the kapija (the widened terrace in its middle with its stone seats), the green banks, a
# minaret and red-roofed houses of the town, and poplars. Turned a little towards the camera.
# Run: blender -b --factory-startup -P visegrad-bridge.py -- visegrad-bridge-1024.png 1024 visegrad-bridge.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'river': toon('river', '#3f9a8a', shadow_mul=(0.74, 0.84, 0.86), lift=0.3),
    'bank': toon('bank', '#6aa54a', shadow_mul=(0.7, 0.78, 0.8)),
    'stone': toon('stone', '#d8cfbc', shadow_mul=(0.8, 0.8, 0.88), lift=0.15),
    'stoneDark': toon('stoneDark', '#b8ae98', shadow_mul=(0.8, 0.8, 0.88)),
    'house': toon('house', '#f2efe8', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'roof': toon('roof', '#c4573a'),
    'minaret': toon('minaret', '#f8f6f0', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'cone': toon('cone', '#5a6068'),
    'poplar': toon('poplar', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'tree': toon('tree', '#5a9a48', shadow_mul=(0.7, 0.78, 0.8)),
    'window': flat('window', '#3a3640'),
})

G = tile(M['river'])
before = set(bpy.data.objects)
rng = random.Random(1289)


def bank(name, a0, a1, h):
    pts = [(1.4 * math.cos(math.radians(a)), 1.4 * math.sin(math.radians(a))) for a in range(a0, a1 + 1, 5)]
    inner = [(x * 0.97, y * 0.97, G + h) for x, y in pts]
    b = loft(name, M['bank'], [[(x, y, G - 0.01) for x, y in pts], inner], outline=0.016)
    b.visible_shadow = False


# ---------- the banks either side ----------
bank('bankleft', 122, 238, 0.2)
bank('bankright', -58, 58, 0.2)

# ---------- the bridge: eleven arches between piers, the deck over them ----------
N, SPAN, PIER = 11, 0.148, 0.042
L = N * SPAN + (N + 1) * PIER
X0 = -L / 2
DECK = G + 0.2
for k in range(N + 1):
    px = X0 + PIER / 2 + k * (SPAN + PIER)
    box(f'pier{k}', M['stone'], px, 0.0, G - 0.01, PIER, 0.14, DECK - G + 0.01, outline=0.008, bevel=0)
    if 0 < k < N:
        pyramid(f'cutwater{k}', M['stoneDark'], px, -0.075, G - 0.01, 0.045, 0.07, outline=0.004)
for k in range(N):
    x0 = X0 + PIER + k * (SPAN + PIER)
    spring = G + 0.07
    rise = 0.085
    slices = 7
    for j in range(slices):
        u0, u1 = j / slices, (j + 1) / slices
        um = (u0 + u1) / 2
        z = spring + rise * math.sqrt(max(0.0, 1 - (2 * um - 1) ** 2))
        box(f'spandrel{k}_{j}', M['stone'], x0 + SPAN * um, 0.0, z, SPAN / slices + 0.002, 0.13, DECK - z, outline=0.004, bevel=0)
box('deck', M['stoneDark'], 0.0, 0.0, DECK - 0.005, L + 0.02, 0.16, 0.03, outline=0.01, bevel=0)
for s in (-1, 1):
    box(f'parapet{s}', M['stone'], 0.0, s * 0.072, DECK + 0.02, L + 0.02, 0.016, 0.03, outline=0.004, bevel=0)
# the kapija: a widened terrace on the downstream side, in the middle
box('kapija', M['stone'], 0.0, -0.12, DECK - 0.03, 0.16, 0.1, 0.06, outline=0.008, bevel=0)
box('kapijawall', M['stone'], 0.0, -0.168, DECK + 0.025, 0.16, 0.014, 0.03, outline=0.004, bevel=0)
box('kapijaseat', M['stoneDark'], 0.0, -0.13, DECK + 0.025, 0.12, 0.03, 0.015, outline=0.003, bevel=0)

# ---------- the town on the right bank, poplars on the left ----------
for k, (x, y) in enumerate(((1.05, 0.35), (0.95, 0.62), (1.15, 0.05), (0.85, -0.45), (1.08, -0.25))):
    box(f'house{k}', M['house'], x, y, G + 0.19, 0.13, 0.11, 0.08, outline=0.007, bevel=0)
    pyramid(f'houseroof{k}', M['roof'], x, y, G + 0.265, 0.15, 0.06, outline=0.006)
    box(f'housewin{k}', M['window'], x, y - 0.059, G + 0.22, 0.025, 0.006, 0.03, outline=0, bevel=0)
MX, MY = 0.98, 0.85
lathe('minaret', M['minaret'], ((0.03, 0), (0.026, 0.34)), G + 0.19, MX, MY, segs=12, outline=0.006)
cyl('minaretbalcony', M['minaret'], 0.042, 0.014, segs=12, outline=0.003, matrix=Matrix.Translation((MX, MY, G + 0.44)))
lathe('minaretcone', M['cone'], ((0.03, 0), (0.004, 0.1)), G + 0.525, MX, MY, segs=12, outline=0.004)
for k, (x, y) in enumerate(((-1.0, 0.55), (-1.12, 0.2), (-0.95, -0.4), (-1.15, -0.1), (-0.9, 0.85))):
    lathe(f'poplar{k}', M['poplar'], ((0.045, 0), (0.05, 0.08), (0.035, 0.2), (0.004, 0.3)), G + 0.2, x, y, segs=10, outline=0.006)
for k, (x, y) in enumerate(((1.2, 0.55), (0.82, 0.2))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.27, 0.07, outline=0.01)

turn(before, -20)
render(G)
