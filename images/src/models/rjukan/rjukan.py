# A cartoon Rjukan–Notodden for the country maps, built in the set's shared look (../toon.py): the Vemork
# hydroelectric power station of 1911 on its rock ledge above the gorge of the Måna, its long stone
# hall with tall arched windows under a dark hipped roof, the row of great penstock pipes running
# straight down the forested mountainside behind it from the valve house at the top, the river in
# the gorge below and the pines. Turned a little towards the camera.
# Run: blender -b --factory-startup -P rjukan.py -- rjukan-1024.png 1024 rjukan.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#6aa84c', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'rock': toon('rock', '#8a8a84', shadow_mul=(0.8, 0.8, 0.86)),
    'forest': toon('forest', '#4a7a3e', shadow_mul=(0.7, 0.78, 0.8)),
    'stone': toon('stone', '#c8b89a', shadow_mul=(0.82, 0.82, 0.88), lift=0.15),
    'roof': toon('roof', '#3e4248'),
    'pipe': toon('pipe', '#5a5e66', lift=0.25),
    'water': toon('water', '#4a8ab0', lift=0.3),
    'white': toon('white', '#f4f2ea', lift=0.2),
    'dark': flat('dark', '#2e2a2a'),
    'pine': toon('pine', '#2f5e34', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['grass'])
before = set(bpy.data.objects)


def strip(y0, y1, r, z):
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    right = [(r * math.cos(a0 + (a1 - a0) * k / 12), r * math.sin(a0 + (a1 - a0) * k / 12), z) for k in range(13)]
    left = [(-r * math.cos(a1 + (a0 - a1) * k / 12), r * math.sin(a1 + (a0 - a1) * k / 12), z) for k in range(13)]
    return right + left


# ---------- the river in the gorge, the ledge and the mountain ----------
loft('river', M['water'], [strip(-1.31, -0.62, 1.32, G - 0.004), strip(-1.31, -0.62, 1.32, G + 0.008)], outline=0.002)
LZ = G + 0.28
ledge = loft('ledge', M['rock'], [strip(-0.32, 1.31, 1.32, G - 0.01), strip(-0.32, 1.31, 1.32, LZ)], outline=0.006)
ledge.visible_shadow = False
TZ = LZ + 0.5
mountain = loft('mountain', M['forest'], [strip(0.22, 1.31, 1.32, LZ - 0.005), strip(0.95, 1.31, 1.32, TZ)], outline=0.006)
mountain.visible_shadow = False


def slope_z(y):
    return LZ + (TZ - LZ) * (y - 0.22) / (0.95 - 0.22)


# ---------- the penstocks down the mountainside ----------
for k, x in enumerate((-0.27, -0.2, -0.13, 0.13, 0.2, 0.27)):
    rod(f'penstock{k}', M['pipe'], (x, 0.12, LZ + 0.05), (x, 0.24, slope_z(0.24) + 0.025), 0.02, segs=10, outline=0.002)
    rod(f'penstockslope{k}', M['pipe'], (x, 0.24, slope_z(0.24) + 0.025), (x, 0.98, slope_z(0.98) + 0.025), 0.02, segs=10, outline=0.002)
    for j in range(4):
        y = 0.35 + j * 0.17
        box(f'anchor{k}{j}', M['stone'], x, y, slope_z(y) - 0.01, 0.05, 0.04, 0.04, outline=0.001, bevel=0)
box('valvehouse', M['stone'], 0.0, 1.0, slope_z(1.0) - 0.02, 0.36, 0.14, 0.1, outline=0.004, bevel=0)
loft('valveroof', M['roof'], [[(-0.19, 0.92, slope_z(1.0) + 0.075), (0.19, 0.92, slope_z(1.0) + 0.075), (0.19, 1.08, slope_z(1.0) + 0.075), (-0.19, 1.08, slope_z(1.0) + 0.075)],
                              [(-0.15, 0.996, slope_z(1.0) + 0.13), (0.15, 0.996, slope_z(1.0) + 0.13), (0.15, 1.004, slope_z(1.0) + 0.13), (-0.15, 1.004, slope_z(1.0) + 0.13)]], outline=0.003)

# ---------- the power station on the ledge ----------
SX, SY = 0.0, -0.02
W, D, H = 0.72, 0.26, 0.24
box('hall', M['stone'], SX, SY, LZ - 0.005, W, D, H, outline=0.008, bevel=0)
for j in range(7):
    x = SX - W / 2 + 0.07 + j * (W - 0.14) / 6
    box(f'hallwin{j}', M['dark'], x, SY - D / 2 - 0.004, LZ + 0.04, 0.045, 0.006, 0.13, outline=0, bevel=0)
    cyl(f'hallwintop{j}', M['dark'], 0.0225, 0.006, segs=10, outline=0, matrix=Matrix.Translation((x, SY - D / 2 - 0.004, LZ + 0.17)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
box('hallcornice', M['white'], SX, SY, LZ + H - 0.02, W + 0.02, D + 0.02, 0.02, outline=0.002, bevel=0)
loft('hallroof', M['roof'], [[(SX - W / 2 - 0.02, SY - D / 2 - 0.02, LZ + H - 0.005), (SX + W / 2 + 0.02, SY - D / 2 - 0.02, LZ + H - 0.005), (SX + W / 2 + 0.02, SY + D / 2 + 0.02, LZ + H - 0.005), (SX - W / 2 - 0.02, SY + D / 2 + 0.02, LZ + H - 0.005)],
                             [(SX - W / 2 + 0.08, SY - 0.02, LZ + H + 0.12), (SX + W / 2 - 0.08, SY - 0.02, LZ + H + 0.12), (SX + W / 2 - 0.08, SY + 0.02, LZ + H + 0.12), (SX - W / 2 + 0.08, SY + 0.02, LZ + H + 0.12)]], outline=0.005)
for s in (-1, 1):
    box(f'dormer{s}', M['white'], SX + s * 0.18, SY - 0.08, LZ + H + 0.01, 0.05, 0.04, 0.05, outline=0.002, bevel=0)

# ---------- pines on the gorge's floor ----------
for k, (x, y, h) in enumerate(((-0.85, -0.45, 0.36), (-0.6, -0.5, 0.3), (0.65, -0.48, 0.34), (0.9, -0.42, 0.3), (0.0, -0.5, 0.26))):
    lathe(f'pine{k}', M['pine'], ((0.08, 0), (0.05, h * 0.45), (0.003, h)), G, x, y, segs=10, outline=0.005, smooth=False)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
