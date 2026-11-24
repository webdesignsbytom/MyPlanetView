# A cartoon Dougga for the country maps, built in the set's shared look (../toon.py): the Roman town of
# Thugga on its hillside in northern Tunisia, its Capitol, the temple to Jupiter, Juno and Minerva,
# standing high on its podium at the top of its steps, the front of tall Corinthian columns under
# the pediment and the cella behind, the low walls of the town's houses and streets round it, and
# the olive groves on the slopes. Turned a little towards the camera.
# Run: blender -b --factory-startup -P dougga.py -- dougga-1024.png 1024 dougga.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#9ab86a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'hill': toon('hill', '#8aac5a', shadow_mul=(0.7, 0.78, 0.8)),
    'stone': toon('stone', '#e0cca4', shadow_mul=(0.8, 0.78, 0.84), lift=0.18),
    'stoneDark': toon('stoneDark', '#bca880'),
    'paving': toon('paving', '#d8ccb0', lift=0.18),
    'dark': flat('dark', '#3a322a'),
    'olive': toon('olive', '#7a9a5a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile(M['grass'])
before = set(bpy.data.objects)
rng = random.Random(166)

# ---------- the hill ----------
hill = lathe('hill', M['hill'], ((1.25, 0), (1.0, 0.06), (0.7, 0.13), (0.5, 0.16), (0.0, 0.17)), G - 0.01, 0.0, 0.1, segs=40, outline=0.006)
hill.visible_shadow = False
T = G + 0.16
box('forum', M['paving'], 0.0, -0.05, T - 0.004, 0.6, 0.4, 0.01, outline=0.001, bevel=0)

# ---------- the Capitol ----------
CX, CY = 0.0, 0.12
box('podium', M['stoneDark'], CX, CY, T - 0.005, 0.32, 0.42, 0.08, outline=0.005, bevel=0)
for i in range(5):
    box(f'step{i}', M['stone'], CX, CY - 0.21 - 0.015 - i * 0.025, T - 0.005, 0.22, 0.03, 0.08 - i * 0.016, outline=0.001, bevel=0)
PZ = T + 0.075
box('cella', M['stone'], CX, CY + 0.07, PZ, 0.28, 0.26, 0.26, outline=0.006, bevel=0)
box('celladoor', M['dark'], CX, CY - 0.063, PZ, 0.06, 0.006, 0.15, outline=0, bevel=0)
COLS = [(-0.12, -0.18), (-0.04, -0.18), (0.04, -0.18), (0.12, -0.18), (-0.12, -0.1), (0.12, -0.1)]
for k, (dx, dy) in enumerate(COLS):
    lathe(f'colbase{k}', M['stoneDark'], ((0.022, 0), (0.022, 0.012)), PZ, CX + dx, CY + dy, segs=10, outline=0.001)
    rod(f'col{k}', M['stone'], (CX + dx, CY + dy, PZ + 0.01), (CX + dx, CY + dy, PZ + 0.25), 0.016, segs=10, outline=0.002)
    lathe(f'capital{k}', M['stoneDark'], ((0.017, 0), (0.026, 0.025)), PZ + 0.245, CX + dx, CY + dy, segs=8, outline=0.001, smooth=False)
box('entablature', M['stone'], CX, CY - 0.02, PZ + 0.27, 0.3, 0.36, 0.04, outline=0.004, bevel=0)
loft('pediment', M['stone'], [[(CX - 0.15, CY - 0.2, PZ + 0.305), (CX + 0.15, CY - 0.2, PZ + 0.305), (CX + 0.15, CY + 0.16, PZ + 0.305), (CX - 0.15, CY + 0.16, PZ + 0.305)],
                              [(CX - 0.004, CY - 0.2, PZ + 0.38), (CX + 0.004, CY - 0.2, PZ + 0.38), (CX + 0.004, CY + 0.16, PZ + 0.38), (CX - 0.004, CY + 0.16, PZ + 0.38)]], outline=0.004)
box('frieze', M['stoneDark'], CX, CY - 0.201, PZ + 0.28, 0.3, 0.006, 0.02, outline=0, bevel=0)

# ---------- the town's low walls ----------
for k in range(14):
    x = -0.7 + (k % 5) * 0.35 + 0.05 * rng.random()
    y = -0.45 + (k // 5) * 0.4 + 0.05 * rng.random()
    if abs(x) < 0.3 and -0.3 < y < 0.45:
        continue
    r = math.hypot(x, y - 0.1)
    z = G + 0.17 * max(0.0, min(1.0, (1.25 - r) / 0.75)) - 0.005 if r > 0.5 else T - 0.005
    w, d = 0.12 + 0.08 * rng.random(), 0.1 + 0.06 * rng.random()
    for s in (-1, 1):
        box(f'house{k}{s}', M['stone'], x + s * w / 2, y, z, 0.02, d, 0.04 + 0.03 * rng.random(), outline=0.002, bevel=0)
    box(f'houseback{k}', M['stone'], x, y + d / 2, z, w, 0.02, 0.05, outline=0.002, bevel=0)

# ---------- olive groves on the slopes ----------
for k in range(10):
    a = 2 * math.pi * k / 10 + 0.4
    r = 0.95 + 0.1 * rng.random()
    x, y = r * math.cos(a), 0.1 + r * math.sin(a) * 0.95
    if math.hypot(x, y) > 1.18:
        continue
    zz = G + 0.17 * max(0.0, min(1.0, (1.25 - math.hypot(x, y - 0.1)) / 0.75))
    rod(f'olivetrunk{k}', M['trunk'], (x, y, zz - 0.01), (x, y, zz + 0.05), 0.01, segs=6, outline=0.001)
    b = ball(f'olive{k}', M['olive'], 0, 0, 0, 0.07, outline=0.007)
    b.scale = (1.2, 1.1, 0.75)
    b.location = (x, y, zz + 0.09)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
