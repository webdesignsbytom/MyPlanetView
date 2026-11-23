# A cartoon Biertan for the country maps, built in the set's shared look (../toon.py): the Saxon
# fortified church on its hill in Transylvania, the late Gothic church with its steep roof and tall
# bell tower, the rings of walls round it with their towers under red tiled roofs, and the
# village's houses at the hill's foot. Turned a little towards the camera.
# Run: blender -b --factory-startup -P biertan.py -- biertan-1024.png 1024 biertan.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#8ab85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'hill': toon('hill', '#7aa850', shadow_mul=(0.72, 0.8, 0.74)),
    'stone': toon('stone', '#d8ccb0', shadow_mul=(0.84, 0.84, 0.88), lift=0.08),
    'stoneDark': toon('stoneDark', '#b0a488'),
    'roof': toon('roof', '#b85a3e'),
    'white': toon('white', '#f0eadc', lift=0.12),
    'yellow': toon('yellow', '#ecd088', lift=0.1),
    'dark': flat('dark', '#2e2a28'),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['grass'])
before = set(bpy.data.objects)
rng = random.Random(2557)

HX, HY = 0.0, 0.25
hl = lathe('hill', M['hill'], ((0.75, 0), (0.6, 0.08), (0.45, 0.15), (0.34, 0.18)), G - 0.01, HX, HY, segs=32, outline=0.01)
hl.visible_shadow = False


def ring(name, r, z, h, n_towers):
    m = 24
    for k in range(m):
        a0, a1 = 2 * math.pi * k / m, 2 * math.pi * (k + 1) / m
        bar(f'{name}wall{k}', M['stone'], (HX + r * math.cos(a0), HY + r * 0.85 * math.sin(a0), z + h / 2), (HX + r * math.cos(a1), HY + r * 0.85 * math.sin(a1), z + h / 2), h, outline=0.002)
        loft(f'{name}cap{k}', M['roof'], [[(HX + (r - 0.025) * math.cos(a0), HY + (r - 0.025) * 0.85 * math.sin(a0), z + h), (HX + (r + 0.025) * math.cos(a0), HY + (r + 0.025) * 0.85 * math.sin(a0), z + h),
                                           (HX + (r + 0.025) * math.cos(a1), HY + (r + 0.025) * 0.85 * math.sin(a1), z + h), (HX + (r - 0.025) * math.cos(a1), HY + (r - 0.025) * 0.85 * math.sin(a1), z + h)],
                                          [(HX + r * math.cos(a0), HY + r * 0.85 * math.sin(a0), z + h + 0.025), (HX + r * math.cos(a0) + 0.001, HY + r * 0.85 * math.sin(a0) + 0.001, z + h + 0.025),
                                           (HX + r * math.cos(a1) + 0.001, HY + r * 0.85 * math.sin(a1) + 0.001, z + h + 0.025), (HX + r * math.cos(a1), HY + r * 0.85 * math.sin(a1), z + h + 0.025)]], outline=0)
    for k in range(n_towers):
        a = 2 * math.pi * (k + 0.3) / n_towers
        tx, ty = HX + r * math.cos(a), HY + r * 0.85 * math.sin(a)
        box(f'{name}tower{k}', M['stone'], tx, ty, z - 0.01, 0.08, 0.08, h + 0.12, rot_z=a, outline=0.004, bevel=0)
        pyramid(f'{name}towerroof{k}', M['roof'], tx, ty, z + h + 0.105, 0.1, 0.1, outline=0.003)
        box(f'{name}towerslit{k}', M['dark'], tx + 0.041 * math.cos(a), ty + 0.041 * math.sin(a), z + h * 0.5, 0.015, 0.006, 0.04, rot_z=a + math.pi / 2, outline=0, bevel=0)


ring('outer', 0.58, G + 0.06, 0.08, 4)
ring('inner', 0.38, G + 0.15, 0.1, 4)

# ---------- the church ----------
T = G + 0.175
CX, CY = HX + 0.02, HY + 0.02
box('nave', M['stone'], CX, CY, T - 0.005, 0.36, 0.16, 0.18, outline=0.007, bevel=0)
loft('naveroof', M['roof'], [[(CX - 0.19, CY - 0.09, T + 0.175), (CX + 0.19, CY - 0.09, T + 0.175), (CX + 0.19, CY + 0.09, T + 0.175), (CX - 0.19, CY + 0.09, T + 0.175)],
                             [(CX - 0.17, CY - 0.004, T + 0.33), (CX + 0.17, CY - 0.004, T + 0.33), (CX + 0.17, CY + 0.004, T + 0.33), (CX - 0.17, CY + 0.004, T + 0.33)]], outline=0.005)
for j in range(4):
    box(f'navewin{j}', M['dark'], CX - 0.12 + j * 0.08, CY - 0.083, T + 0.04, 0.025, 0.006, 0.1, outline=0, bevel=0)
    box(f'navebuttress{j}', M['stoneDark'], CX - 0.16 + j * 0.08 + 0.04, CY - 0.09, T - 0.005, 0.02, 0.02, 0.15, outline=0.001, bevel=0) if j < 3 else None
BX, BY = CX - 0.22, CY
box('belltower', M['stone'], BX, BY, T - 0.005, 0.1, 0.1, 0.42, outline=0.006, bevel=0)
box('belfry', M['dark'], BX, BY - 0.053, T + 0.33, 0.035, 0.006, 0.05, outline=0, bevel=0)
box('belltowergallery', M['roof'], BX, BY, T + 0.415, 0.12, 0.12, 0.03, outline=0.002, bevel=0)
lathe('belltowerspire', M['roof'], ((0.07, 0), (0.004, 0.2)), T + 0.44, BX, BY, segs=8, outline=0.004, smooth=False)
for sx in (-1, 1):
    for sy in (-1, 1):
        lathe(f'spirelet{sx}{sy}', M['roof'], ((0.012, 0), (0.004, 0.06)), T + 0.44, BX + sx * 0.05, BY + sy * 0.05, segs=6, outline=0.001, smooth=False)

# ---------- the village ----------
for k in range(10):
    x = -0.85 + k * 0.19
    y = -0.62 + 0.06 * (k % 2)
    if math.hypot(x, y) > 1.05:
        continue
    box(f'house{k}', M[('white', 'yellow')[k % 2]], x, y, G - 0.005, 0.15, 0.12, 0.09, outline=0.004, bevel=0)
    box(f'housewin{k}', M['dark'], x, y - 0.063, G + 0.04, 0.08, 0.006, 0.025, outline=0, bevel=0)
    loft(f'houseroof{k}', M['roof'], [[(x - 0.08, y - 0.065, G + 0.085), (x + 0.08, y - 0.065, G + 0.085), (x + 0.08, y + 0.065, G + 0.085), (x - 0.08, y + 0.065, G + 0.085)],
                                      [(x - 0.004, y - 0.065, G + 0.15), (x + 0.004, y - 0.065, G + 0.15), (x + 0.004, y + 0.065, G + 0.15), (x - 0.004, y + 0.065, G + 0.15)]], outline=0.003)
for k, (x, y) in enumerate(((-0.85, 0.3), (0.85, 0.3), (-0.65, 0.75), (0.65, 0.75))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.09, 0.09, outline=0.007)

turn(before, -20)
render(G)
