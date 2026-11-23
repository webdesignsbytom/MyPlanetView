# A cartoon Palace of the Shaki Khans for the country maps, built in the set's shared look
# (../toon.py): the khan's summer palace inside the fortress walls of Sheki, its two-storey front
# painted with blue and red flowers, the great shebeke windows of coloured glass in their wooden
# lattice, the deep wooden cornice, the long pool in front, and the two huge old plane trees beside
# it. Turned a little towards the camera.
# Run: blender -b --factory-startup -P sheki.py -- sheki-1024.png 1024 sheki.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'paving': toon('paving', '#d8d0c0'),
    'cream': toon('cream', '#f0e6cc', shadow_mul=(0.86, 0.84, 0.8), lift=0.12),
    'wood': toon('wood', '#6a4a30'),
    'blue': toon('blue', '#2a5ab0', lift=0.12),
    'red': toon('red', '#c43a2a', lift=0.1),
    'yellow': toon('yellow', '#f0c040', lift=0.2),
    'green': toon('green', '#3aa86a', lift=0.12),
    'water': toon('water', '#5aa8d0', lift=0.3),
    'stone': toon('stone', '#b8a888', shadow_mul=(0.84, 0.84, 0.88)),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a6a58'),
})

G = tile(M['grass'])
before = set(bpy.data.objects)
rng = random.Random(2539)

# ---------- the fortress walls ----------
for k, (x0, y0, x1, y1) in enumerate(((-0.9, 0.62, 0.9, 0.62), (-0.9, 0.62, -0.9, -0.2), (0.9, 0.62, 0.9, -0.2))):
    a = math.atan2(y1 - y0, x1 - x0)
    L = math.hypot(x1 - x0, y1 - y0)
    if math.hypot(x1, y1) > 1.1 or math.hypot(x0, y0) > 1.12:
        L *= 0.9
    box(f'fortwall{k}', M['stone'], (x0 + x1) / 2, (y0 + y1) / 2, G - 0.005, L, 0.05, 0.12, rot_z=a, outline=0.004, bevel=0)
box('court', M['paving'], 0.0, -0.05, G - 0.003, 0.9, 0.5, 0.008, outline=0, bevel=0)

# ---------- the palace ----------
PX, PY, W, D, H = 0.0, 0.22, 0.62, 0.18, 0.3
box('palace', M['cream'], PX, PY, G - 0.005, W, D, H, outline=0.009, bevel=0)
box('cornice', M['wood'], PX, PY, G + H - 0.005, W + 0.06, D + 0.08, 0.035, outline=0.003, bevel=0)
loft('roof', M['wood'], [[(PX - W / 2 - 0.02, PY - D / 2 - 0.03, G + H + 0.03), (PX + W / 2 + 0.02, PY - D / 2 - 0.03, G + H + 0.03), (PX + W / 2 + 0.02, PY + D / 2 + 0.03, G + H + 0.03), (PX - W / 2 - 0.02, PY + D / 2 + 0.03, G + H + 0.03)],
                         [(PX - W / 2 + 0.05, PY - 0.02, G + H + 0.08), (PX + W / 2 - 0.05, PY - 0.02, G + H + 0.08), (PX + W / 2 - 0.05, PY + 0.02, G + H + 0.08), (PX - W / 2 + 0.05, PY + 0.02, G + H + 0.08)]], outline=0.004)
F = PY - D / 2 - 0.003
mats = ('blue', 'red', 'yellow', 'green')
for k, (wx, ww, z0, wh) in enumerate(((0.0, 0.2, 0.02, 0.26), (-0.2, 0.08, 0.15, 0.12), (0.2, 0.08, 0.15, 0.12))):
    box(f'shebekeframe{k}', M['wood'], PX + wx, F, G + z0, ww, 0.006, wh, outline=0, bevel=0)
    n, m = max(2, int(ww / 0.022)), max(2, int(wh / 0.022))
    for i in range(n):
        for j in range(m):
            box(f'glass{k}{i}{j}', M[mats[(i + j * 2 + k) % 4]], PX + wx - ww / 2 + (i + 0.5) * ww / n, F - 0.003, G + z0 + (j + 0.5) * wh / m, ww / n * 0.7, 0.004, wh / m * 0.7, outline=0, bevel=0)
# painted panels
for k in range(8):
    x = PX - 0.28 + k * 0.08
    if abs(x - PX) < 0.12 or abs(abs(x - PX) - 0.2) < 0.05:
        continue
    box(f'panel{k}', M['blue'], x, F, G + 0.06, 0.05, 0.006, 0.08, outline=0, bevel=0)
    ball(f'flower{k}', M['red'], x, F - 0.004, G + 0.1, 0.012, outline=0)
for k in range(6):
    box(f'upperpanel{k}', M['blue'], PX - 0.27 + k * 0.108, F, G + 0.24, 0.07, 0.006, 0.03, outline=0, bevel=0) if abs(PX - 0.27 + k * 0.108) > 0.12 else None

# ---------- the pool and the plane trees ----------
box('poolrim', M['stone'], PX, -0.15, G - 0.005, 0.34, 0.14, 0.025, outline=0.003, bevel=0)
box('pool', M['water'], PX, -0.15, G - 0.003, 0.3, 0.1, 0.03, outline=0, bevel=0)
for k, (x, y) in enumerate(((-0.55, -0.05), (0.55, -0.1))):
    rod(f'planetrunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.3), 0.04, r2=0.03, segs=8, outline=0.004)
    for j in range(5):
        a = 2 * math.pi * j / 5
        ball(f'plane{k}{j}', M['tree'], x + 0.09 * math.cos(a), y + 0.07 * math.sin(a), G + 0.36 + 0.04 * (j % 2), 0.12, outline=0.008)
    ball(f'planetop{k}', M['tree'], x, y, G + 0.46, 0.13, outline=0.008)

turn(before, -20)
render(G)
