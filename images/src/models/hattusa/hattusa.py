# A cartoon Hattusa for the country maps, built in the set's shared look (../toon.py): the Hittite
# capital's Lion Gate, the great stone jambs with the carved lions' fore-parts guarding the pointed
# parabolic arch, the towers on either side, and the city wall of huge stones on its sloping
# earthwork rampart running across the dry Anatolian hills. Turned a little towards the camera.
# Run: blender -b --factory-startup -P hattusa.py -- hattusa-1024.png 1024 hattusa.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#c8b878', shadow_mul=(0.82, 0.8, 0.8), lift=0.2),
    'hill': toon('hill', '#b0a068', shadow_mul=(0.8, 0.8, 0.82)),
    'earth': toon('earth', '#a89068'),
    'stone': toon('stone', '#b8ae98', shadow_mul=(0.84, 0.84, 0.88), lift=0.06),
    'stoneDark': toon('stoneDark', '#948a76'),
    'dark': flat('dark', '#2e2a26'),
    'shrub': toon('shrub', '#8a9a50'),
})

G = tile(M['grass'])
before = set(bpy.data.objects)
rng = random.Random(2549)

for k, (x, y, r, h) in enumerate(((-0.6, 0.85, 0.38, 0.2), (0.2, 0.95, 0.34, 0.24), (0.75, 0.7, 0.32, 0.18))):
    hl = lathe(f'hill{k}', M['hill'], ((r, 0), (r * 0.7, h * 0.65), (r * 0.3, h * 0.95), (0.004, h)), G - 0.01, x, y, segs=20, outline=0.008)
    hl.visible_shadow = False

# ---------- the rampart and wall ----------
WY = 0.1
loft('rampart', M['earth'], [[(-1.0, WY - 0.22, G - 0.005), (1.0, WY - 0.22, G - 0.005), (1.0, WY + 0.15, G - 0.005), (-1.0, WY + 0.15, G - 0.005)],
                             [(-1.0, WY - 0.06, G + 0.09), (1.0, WY - 0.06, G + 0.09), (1.0, WY + 0.08, G + 0.09), (-1.0, WY + 0.08, G + 0.09)]], outline=0.006)
for s in (-1, 1):
    x0, x1 = s * 0.18, s * 0.95
    L = abs(x1 - x0)
    box(f'wall{s}', M['stone'], (x0 + x1) / 2, WY, G + 0.085, L, 0.1, 0.13, outline=0.006, bevel=0)
    n = int(L / 0.07)
    for j in range(n):
        x = x0 + (j + 0.5) * (x1 - x0) / n
        box(f'block{s}{j}', M['stoneDark'], x, WY - 0.051, G + 0.09 + (j % 2) * 0.06, 0.06, 0.004, 0.004, outline=0, bevel=0)
        box(f'jointv{s}{j}', M['stoneDark'], x + 0.03, WY - 0.051, G + 0.09, 0.004, 0.004, 0.12, outline=0, bevel=0)
    tx = s * 0.55
    box(f'walltower{s}', M['stone'], tx, WY - 0.02, G + 0.085, 0.14, 0.14, 0.17, outline=0.006, bevel=0)

# ---------- the Lion Gate ----------
for s in (-1, 1):
    box(f'gatetower{s}', M['stone'], s * 0.17, WY - 0.02, G + 0.085, 0.14, 0.16, 0.22, outline=0.007, bevel=0)
    jx = s * 0.075
    box(f'jamb{s}', M['stone'], jx, WY - 0.06, G + 0.085, 0.07, 0.1, 0.2, outline=0.005, bevel=0)
    lx, ly = jx + s * 0.005, WY - 0.13
    b = ball(f'lionbody{s}', M['stone'], 0, 0, 0, 0.5, outline=0.003)
    b.scale = (0.05, 0.06, 0.07)
    b.location = (lx, ly + 0.01, G + 0.17)
    ball(f'lionmane{s}', M['stoneDark'], lx, ly - 0.005, G + 0.21, 0.032, outline=0.003)
    ball(f'lionhead{s}', M['stone'], lx, ly - 0.025, G + 0.21, 0.024, outline=0.002)
    ball(f'lionsnout{s}', M['stone'], lx, ly - 0.045, G + 0.2, 0.012, outline=0.001)
    rod(f'lionleg{s}', M['stone'], (lx, ly - 0.015, G + 0.1), (lx, ly - 0.015, G + 0.15), 0.012, segs=6, outline=0.001)
box('gateopening', M['dark'], 0.0, WY - 0.105, G + 0.085, 0.07, 0.006, 0.11, outline=0, bevel=0)
loft('gatearch', M['dark'], [[(-0.035, WY - 0.105, G + 0.19), (0.035, WY - 0.105, G + 0.19), (0.035, WY - 0.1, G + 0.19), (-0.035, WY - 0.1, G + 0.19)],
                             [(-0.004, WY - 0.105, G + 0.26), (0.004, WY - 0.105, G + 0.26), (0.004, WY - 0.1, G + 0.26), (-0.004, WY - 0.1, G + 0.26)]], outline=0)
box('lintel', M['stone'], 0.0, WY - 0.06, G + 0.27, 0.22, 0.1, 0.04, outline=0.004, bevel=0)
bar('road', M['earth'], (0.0, WY - 0.2, G + 0.003), (0.0, -0.85, G + 0.003), 0.1, outline=0)
for k in range(12):
    x, y = rng.uniform(-0.9, 0.9), rng.uniform(-0.8, -0.25)
    if math.hypot(x, y) > 1.05 or abs(x) < 0.1:
        continue
    ball(f'shrub{k}', M['shrub'], x, y, G + 0.02, 0.035, outline=0.003)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
