# A cartoon Maiden Tower for the country maps, built in the set's shared look (../toon.py): Baku's
# old stone tower in the Walled City, round with its buttress on one side, the crenellated city
# walls and a gate round it, the old town's flat-roofed houses, and the three Flame Towers rising
# behind. Turned a little towards the camera.
# Run: blender -b --factory-startup -P maiden-tower.py -- maiden-tower-1024.png 1024 maiden-tower.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'stone': toon('stone', '#d8c49a', shadow_mul=(0.86, 0.8, 0.78), lift=0.15),
    'stoneDark': toon('stoneDark', '#b8a47e', shadow_mul=(0.86, 0.8, 0.78)),
    'wall': toon('wall', '#cbb68c', shadow_mul=(0.86, 0.8, 0.78)),
    'house': toon('house', '#e2d2ae', shadow_mul=(0.86, 0.8, 0.78)),
    'window': flat('window', '#3a3640'),
    'glass': toon('glass', '#4a7ab8', shadow_mul=(0.76, 0.82, 0.92), lift=0.25),
    'glassLight': toon('glassLight', '#8ab8e0', shadow_mul=(0.76, 0.82, 0.92), lift=0.3),
    'paving': toon('paving', '#d8cbb0', lift=0.2),
    'tree': toon('tree', '#5a9a48', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['paving'])
before = set(bpy.data.objects)
rng = random.Random(1283)

# ---------- the Flame Towers behind ----------
FLAME = ((0.17, 0), (0.17, 0.25), (0.15, 0.45), (0.11, 0.6), (0.06, 0.7), (0.004, 0.76))
for k, (x, y, s) in enumerate(((-0.55, 0.82, 0.95), (-0.15, 0.98, 1.05), (0.28, 0.85, 0.9))):
    prof = tuple((r * s * 0.75, h * s) for r, h in FLAME)
    lathe(f'flame{k}', M['glass'], prof, G - 0.005, x, y, segs=18, outline=0.012)
    for j in range(5):
        z = 0.1 + j * 0.12
        r = next(pr for pr, ph in reversed(prof) if ph <= z * s) if z * s < prof[-1][1] else 0.01
        lathe(f'flameband{k}{j}', M['glassLight'], ((r + 0.004, 0), (r * 0.98 + 0.004, 0.02)), G + z * s, x, y, segs=18, outline=0)

# ---------- the old town's flat-roofed houses ----------
for k, (x, y, w, h) in enumerate(((-0.85, 0.3, 0.2, 0.12), (-0.6, 0.45, 0.18, 0.1), (0.55, 0.4, 0.2, 0.12), (0.82, 0.2, 0.16, 0.1), (-0.75, -0.15, 0.16, 0.1),
                                  (0.75, -0.2, 0.18, 0.11), (0.35, 0.55, 0.16, 0.1))):
    box(f'house{k}', M['house'], x, y, G - 0.005, w, 0.14, h, outline=0.009, bevel=0)
    box(f'houseparapet{k}', M['stoneDark'], x, y, G + h - 0.01, w + 0.01, 0.15, 0.02, outline=0.004, bevel=0)
    for j in range(2):
        box(f'housewin{k}{j}', M['window'], x - w / 4 + j * w / 2, y - 0.074, G + h * 0.45, 0.025, 0.006, 0.035, outline=0, bevel=0)

# ---------- the Maiden Tower ----------
TX, TY = 0.0, 0.15
lathe('tower', M['stone'], ((0.16, 0), (0.155, 0.5), (0.15, 0.58)), G - 0.005, TX, TY, segs=24, outline=0.016)
for k in range(5):
    lathe(f'course{k}', M['stoneDark'], ((0.161 - k * 0.0012, 0), (0.16 - k * 0.0012, 0.012)), G + 0.08 + k * 0.1, TX, TY, segs=24, outline=0.002)
box('buttress', M['stone'], TX + 0.13, TY - 0.12, G - 0.005, 0.12, 0.14, 0.56, rot_z=-0.75, outline=0.014, bevel=0)
lathe('towertop', M['stoneDark'], ((0.158, 0), (0.158, 0.025)), G + 0.575, TX, TY, segs=24, outline=0.006)
for k, z in enumerate((0.2, 0.35, 0.48)):
    box(f'slit{k}', M['window'], TX - 0.06, TY - 0.15, G + z, 0.022, 0.01, 0.045, rot_z=0.35, outline=0, bevel=0)
box('towerdoor', M['window'], TX - 0.1, TY - 0.12, G, 0.05, 0.01, 0.08, rot_z=0.6, outline=0, bevel=0)


# ---------- the city walls, crenellated, with a gate ----------
def wall(name, x0, y0, x1, y1, h=0.14):
    L = math.hypot(x1 - x0, y1 - y0)
    a = math.atan2(y1 - y0, x1 - x0)
    box(name, M['wall'], (x0 + x1) / 2, (y0 + y1) / 2, G - 0.005, L, 0.06, h, rot_z=a, outline=0.01, bevel=0)
    n = int(L / 0.07)
    for j in range(n):
        f = (j + 0.5) / n
        box(f'{name}merlon{j}', M['wall'], x0 + (x1 - x0) * f, y0 + (y1 - y0) * f, G + h - 0.005, 0.035, 0.06, 0.035, rot_z=a, outline=0.004, bevel=0)


wall('wallfront0', -1.05, -0.45, -0.18, -0.6)
wall('wallfront1', 0.18, -0.6, 1.05, -0.45)
for s in (-1, 1):
    lathe(f'gatetower{s}', M['wall'], ((0.07, 0), (0.07, 0.2)), G - 0.005, s * 0.2, -0.6, segs=14, outline=0.01)
    for j in range(6):
        a = 2 * math.pi * j / 6
        box(f'gatetowermerlon{s}{j}', M['wall'], s * 0.2 + 0.06 * math.cos(a), -0.6 + 0.06 * math.sin(a), G + 0.195, 0.03, 0.03, 0.035, rot_z=a, outline=0.003, bevel=0)
box('gatearch', M['wall'], 0.0, -0.6, G + 0.1, 0.34, 0.07, 0.07, outline=0.008, bevel=0)
box('gateopening', M['window'], 0.0, -0.636, G - 0.005, 0.12, 0.006, 0.1, outline=0, bevel=0)
for k, (x, y) in enumerate(((-0.4, -0.3), (0.42, -0.32))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.1, 0.08, outline=0.01)
    rod(f'treetrunk{k}', M['stoneDark'], (x, y, G), (x, y, G + 0.05), 0.012, segs=6, outline=0.003)

turn(before, -20)
render(G)
