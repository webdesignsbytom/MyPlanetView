# A cartoon University of Coimbra for the country maps, built in the set's shared look
# (../toon.py): the Paço das Escolas on top of its hill, the white buildings round the courtyard
# under orange roofs, the baroque clock tower rising at the corner, the colonnade and stair of the
# Via Latina, the Porta Férrea gate, and the old town's houses stepping down the slope. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P coimbra.py -- coimbra-1024.png 1024 coimbra.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#8ab85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'hill': toon('hill', '#7aa850', shadow_mul=(0.72, 0.8, 0.74)),
    'paving': toon('paving', '#d8d0c0'),
    'white': toon('white', '#f6f2ea', shadow_mul=(0.82, 0.84, 0.9), lift=0.15),
    'stone': toon('stone', '#d8c8a0', lift=0.08),
    'roof': toon('roof', '#d0703e'),
    'yellow': toon('yellow', '#f0d080', lift=0.12),
    'pink': toon('pink', '#e8b0a0', lift=0.1),
    'dark': flat('dark', '#2e2a28'),
})

G = tile(M['grass'])
before = set(bpy.data.objects)
rng = random.Random(2521)

HX, HY = 0.0, 0.3
hl = lathe('hill', M['hill'], ((0.9, 0), (0.72, 0.1), (0.52, 0.18), (0.42, 0.2)), G - 0.01, HX, HY, segs=32, outline=0.01)
hl.visible_shadow = False


def ground(r):
    if r >= 0.9:
        return G - 0.01
    if r >= 0.72:
        return G - 0.01 + 0.1 * (0.9 - r) / 0.18
    if r >= 0.52:
        return G - 0.01 + 0.1 + 0.08 * (0.72 - r) / 0.2
    return G + 0.19


T = G + 0.19
box('courtyard', M['paving'], HX, HY, T - 0.004, 0.5, 0.36, 0.008, outline=0, bevel=0)


def wing(name, x, y, w, d, h):
    box(name, M['white'], x, y, T - 0.005, w, d, h, outline=0.006, bevel=0)
    loft(f'{name}roof', M['roof'], [[(x - w / 2, y - d / 2, T + h - 0.005), (x + w / 2, y - d / 2, T + h - 0.005), (x + w / 2, y + d / 2, T + h - 0.005), (x - w / 2, y + d / 2, T + h - 0.005)],
                                    [(x - w / 2 + 0.03, y - 0.004, T + h + 0.05), (x + w / 2 - 0.03, y - 0.004, T + h + 0.05), (x + w / 2 - 0.03, y + 0.004, T + h + 0.05), (x - w / 2 + 0.03, y + 0.004, T + h + 0.05)]] if w > d else
         [[(x - w / 2, y - d / 2, T + h - 0.005), (x + w / 2, y - d / 2, T + h - 0.005), (x + w / 2, y + d / 2, T + h - 0.005), (x - w / 2, y + d / 2, T + h - 0.005)],
          [(x - 0.004, y - d / 2 + 0.03, T + h + 0.05), (x + 0.004, y - d / 2 + 0.03, T + h + 0.05), (x + 0.004, y + d / 2 - 0.03, T + h + 0.05), (x - 0.004, y + d / 2 - 0.03, T + h + 0.05)]], outline=0.004)


wing('northwing', HX, HY + 0.24, 0.6, 0.12, 0.15)
wing('westwing', HX - 0.3, HY + 0.02, 0.12, 0.46, 0.14)
wing('eastwing', HX + 0.3, HY + 0.02, 0.12, 0.46, 0.14)
for j in range(6):
    box(f'northwin{j}', M['dark'], HX - 0.22 + j * 0.088, HY + 0.177, T + 0.06, 0.025, 0.006, 0.05, outline=0, bevel=0)
# the Via Latina colonnade and stair
VX, VY = HX + 0.24, HY + 0.02
for j in range(6):
    rod(f'vialatina{j}', M['stone'], (VX - 0.065, VY - 0.18 + j * 0.07, T), (VX - 0.065, VY - 0.18 + j * 0.07, T + 0.1), 0.009, segs=8, outline=0.001)
box('viastair', M['stone'], VX - 0.08, VY, T - 0.005, 0.06, 0.1, 0.12, outline=0.003, bevel=0)
loft('viapediment', M['stone'], [[(VX - 0.11, VY - 0.06, T + 0.115), (VX - 0.05, VY - 0.06, T + 0.115), (VX - 0.05, VY + 0.06, T + 0.115), (VX - 0.11, VY + 0.06, T + 0.115)],
                                 [(VX - 0.11, VY - 0.004, T + 0.16), (VX - 0.05, VY - 0.004, T + 0.16), (VX - 0.05, VY + 0.004, T + 0.16), (VX - 0.11, VY + 0.004, T + 0.16)]], outline=0.003)
# the clock tower
TX, TY = HX + 0.3, HY + 0.28
box('towerbase', M['white'], TX, TY, T - 0.005, 0.12, 0.12, 0.38, outline=0.007, bevel=0)
for sx in (-1, 1):
    for sy in (-1, 1):
        box(f'quoin{sx}{sy}', M['stone'], TX + sx * 0.055, TY + sy * 0.055, T - 0.005, 0.015, 0.015, 0.38, outline=0, bevel=0)
cyl('clock', M['stone'], 0.03, 0.006, segs=14, outline=0.001, matrix=Matrix.Translation((TX, TY - 0.063, T + 0.3)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
box('belfry', M['white'], TX, TY, T + 0.375, 0.1, 0.1, 0.08, outline=0.004, bevel=0)
box('belfryarch', M['dark'], TX, TY - 0.053, T + 0.39, 0.04, 0.006, 0.05, outline=0, bevel=0)
lathe('towercap', M['stone'], ((0.055, 0), (0.045, 0.03), (0.025, 0.06), (0.004, 0.09)), T + 0.45, TX, TY, segs=8, outline=0.003, smooth=False)
# the Porta Férrea
box('portaferrea', M['stone'], HX, HY - 0.2, T - 0.005, 0.14, 0.05, 0.17, outline=0.004, bevel=0)
box('portaferreaarch', M['dark'], HX, HY - 0.227, T - 0.005, 0.05, 0.006, 0.1, outline=0, bevel=0)

# ---------- the town ----------
spots = []
for k in range(120):
    a = rng.uniform(math.pi * 0.9, math.pi * 2.1)
    r = rng.uniform(0.5, 0.85)
    x, y = HX + r * math.cos(a), HY + r * math.sin(a)
    if math.hypot(x, y) > 1.05 or any(math.hypot(x - px, y - py) < 0.15 for px, py in spots):
        continue
    spots.append((x, y))
    zb = ground(r + 0.06)
    h = 0.08 + (ground(r) - zb)
    box(f'house{k}', M[('white', 'yellow', 'pink')[k % 3]], x, y, zb - 0.005, 0.13, 0.11, h, outline=0.004, bevel=0)
    box(f'housewin{k}', M['dark'], x, y - 0.058, zb + h * 0.5, 0.03, 0.006, 0.025, outline=0, bevel=0)
    pyramid(f'houseroof{k}', M['roof'], x, y, zb + h - 0.01, 0.14, 0.05, outline=0.003)
    if len(spots) >= 16:
        break

turn(before, -20)
render(G)
