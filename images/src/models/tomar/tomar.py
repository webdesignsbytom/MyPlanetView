# A cartoon Convent of Christ for the country maps, built in the set's shared look (../toon.py):
# Tomar's Templar castle on its hill, the battlemented walls and towers enclosing the Charola, the
# knights' round church of sixteen sides with its buttresses and its central drum, the nave beside
# it with the famous Manueline window carved with ropes and coral under the cross of the Order, and
# the cloisters. Turned a little towards the camera.
# Run: blender -b --factory-startup -P tomar.py -- tomar-1024.png 1024 tomar.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#8ab85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'hill': toon('hill', '#7aa850', shadow_mul=(0.72, 0.8, 0.74)),
    'stone': toon('stone', '#e0d0a8', shadow_mul=(0.86, 0.84, 0.8), lift=0.1),
    'stoneDark': toon('stoneDark', '#bca880'),
    'roof': toon('roof', '#c06a46'),
    'red': toon('red', '#c43a2a'),
    'dark': flat('dark', '#2e2a28'),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['grass'])
before = set(bpy.data.objects)

hl = lathe('hill', M['hill'], ((0.95, 0), (0.78, 0.08), (0.6, 0.12), (0.5, 0.13)), G - 0.01, 0.0, 0.1, segs=32, outline=0.01)
hl.visible_shadow = False
T = G + 0.125

# ---------- the castle walls ----------
WALL = [(-0.48, -0.25), (0.42, -0.3), (0.5, 0.35), (-0.4, 0.45)]
for k in range(4):
    (x0, y0), (x1, y1) = WALL[k], WALL[(k + 1) % 4]
    a = math.atan2(y1 - y0, x1 - x0)
    L = math.hypot(x1 - x0, y1 - y0)
    box(f'wall{k}', M['stone'], (x0 + x1) / 2, (y0 + y1) / 2, T - 0.005, L, 0.05, 0.14, rot_z=a, outline=0.005, bevel=0)
    for j in range(int(L / 0.06)):
        t = (j + 0.5) / int(L / 0.06)
        box(f'merlon{k}{j}', M['stoneDark'], x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, T + 0.135, 0.03, 0.04, 0.03, rot_z=a, outline=0.001, bevel=0)
    box(f'walltower{k}', M['stone'], x0, y0, T - 0.005, 0.1, 0.1, 0.2, rot_z=a, outline=0.004, bevel=0)

# ---------- the Charola ----------
CX, CY, R = -0.12, 0.12, 0.17
lathe('charola', M['stone'], ((R, 0), (R, 0.24)), T - 0.005, CX, CY, segs=16, outline=0.008, smooth=False)
for k in range(16):
    a = 2 * math.pi * k / 16
    box(f'charolabuttress{k}', M['stoneDark'], CX + (R + 0.012) * math.cos(a), CY + (R + 0.012) * math.sin(a), T - 0.005, 0.03, 0.025, 0.25, rot_z=a + math.pi / 2, outline=0.001, bevel=0)
    if math.sin(a + math.pi / 16) < 0.2:
        b = a + math.pi / 16
        box(f'charolawin{k}', M['dark'], CX + (R + 0.002) * math.cos(b), CY + (R + 0.002) * math.sin(b), T + 0.14, 0.022, 0.006, 0.06, rot_z=b + math.pi / 2, outline=0, bevel=0)
lathe('charolaroof', M['roof'], ((R + 0.01, 0), (0.08, 0.06)), T + 0.235, CX, CY, segs=16, outline=0.004, smooth=False)
lathe('charoladrum', M['stone'], ((0.075, 0), (0.075, 0.08)), T + 0.29, CX, CY, segs=16, outline=0.004, smooth=False)
lathe('charolacap', M['roof'], ((0.08, 0), (0.004, 0.07)), T + 0.365, CX, CY, segs=16, outline=0.003, smooth=False)

# ---------- the nave and the Manueline window ----------
NX, NY = 0.18, 0.12
box('nave', M['stone'], NX, NY, T - 0.005, 0.32, 0.2, 0.26, outline=0.007, bevel=0)
loft('naveroof', M['roof'], [[(NX - 0.16, NY - 0.1, T + 0.255), (NX + 0.16, NY - 0.1, T + 0.255), (NX + 0.16, NY + 0.1, T + 0.255), (NX - 0.16, NY + 0.1, T + 0.255)],
                             [(NX - 0.16, NY - 0.004, T + 0.32), (NX + 0.16, NY - 0.004, T + 0.32), (NX + 0.16, NY + 0.004, T + 0.32), (NX - 0.16, NY + 0.004, T + 0.32)]], outline=0.004)
WX, WY = NX + 0.06, NY - 0.103
box('manuelinewin', M['dark'], WX, WY, T + 0.08, 0.05, 0.006, 0.07, outline=0, bevel=0)
for s in (-1, 1):
    rod(f'rope{s}', M['stoneDark'], (WX + s * 0.04, WY - 0.008, T + 0.03), (WX + s * 0.04, WY - 0.008, T + 0.22), 0.012, segs=6, outline=0.001)
    for k in range(6):
        ball(f'coral{s}{k}', M['stoneDark'], WX + s * 0.04, WY - 0.012, T + 0.04 + k * 0.032, 0.011, outline=0)
box('manuelinesill', M['stoneDark'], WX, WY - 0.01, T + 0.04, 0.1, 0.02, 0.02, outline=0.001, bevel=0)
cyl('armillary', M['stoneDark'], 0.022, 0.006, segs=14, outline=0.001, matrix=Matrix.Translation((WX, WY - 0.01, T + 0.2)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
box('crossv', M['red'], WX, WY - 0.012, T + 0.225, 0.012, 0.006, 0.05, outline=0, bevel=0)
box('crossh', M['red'], WX, WY - 0.012, T + 0.24, 0.04, 0.006, 0.012, outline=0, bevel=0)
# the cloister wing
box('cloister', M['stone'], 0.25, 0.35, T - 0.005, 0.36, 0.14, 0.12, outline=0.005, bevel=0)
for j in range(6):
    box(f'cloisterarch{j}', M['dark'], 0.1 + j * 0.06, 0.278, T + 0.02, 0.03, 0.006, 0.06, outline=0, bevel=0)
for k, (x, y) in enumerate(((-0.8, -0.3), (0.82, -0.25), (-0.6, -0.65), (0.6, -0.68), (-0.8, 0.45))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.1, 0.09, outline=0.007)

turn(before, -20)
render(G)
