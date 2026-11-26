# A cartoon Palazzina di Caccia of Stupinigi for the country maps, built in the set's shared look
# (../toon.py): the Savoy kings' baroque hunting lodge outside Turin, Italy, one of the
# Residences of the Royal House of Savoy: Juvarra's great oval hall in the middle under its
# stepped dome crowned by the bronze stag, and the long wings reaching out from it in a St
# Andrew's cross, filling its tile, with the gravel court before it. Turned a little towards
# the camera.
# Run: blender -b --factory-startup -P stupinigi.py -- stupinigi-1024.png 1024 stupinigi.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#8cc05a', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'wall': toon('wall', '#f0d8b0', shadow_mul=(0.82, 0.8, 0.84), lift=0.2),
    'white': toon('white', '#f6f2ea', lift=0.25),
    'roof': toon('roof', '#b8603e'),
    'dome': toon('dome', '#9a8a7a'),
    'bronze': toon('bronze', '#6a5a3a', lift=0.2),
    'path': toon('path2', '#e2d6bc', lift=0.18),
    'dark': flat('dark', '#2e2622'),
})

G = tile()
before = set(bpy.data.objects)

lathe('court', M['path'], ((0.42, 0), (0.42, 0.008)), G - 0.004, 0.0, -0.42, segs=40, outline=0.001)

# ---------- the oval hall ----------
HX, HY = 0.0, 0.05
HR, HH = 0.27, 0.4
lathe('hall', M['wall'], ((HR, 0), (HR, HH)), G - 0.005, HX, HY, segs=32, outline=0.008)
for j in range(9):
    a = -math.pi / 2 + (j - 4) * 0.27
    for z, h in ((G + 0.05, 0.13), (G + 0.24, 0.1)):
        b = box(f'hallwin{j}{z:.2f}', M['white'], 0, 0, 0, 0.05, 0.01, h, outline=0, bevel=0)
        b.matrix_world = Matrix.Translation((HX + (HR + 0.002) * math.cos(a), HY + (HR + 0.002) * math.sin(a), z)) @ Matrix.Rotation(a + math.pi / 2, 4, 'Z') @ b.matrix_world
lathe('hallcornice', M['white'], ((HR + 0.015, 0), (HR + 0.015, 0.025)), G + HH - 0.02, HX, HY, segs=32, outline=0.003)
lathe('dome1', M['dome'], ((HR + 0.01, 0), (HR - 0.03, 0.08), (HR - 0.08, 0.11)), G + HH, HX, HY, segs=32, outline=0.006)
lathe('drum2', M['wall'], ((0.16, 0), (0.16, 0.07)), G + HH + 0.1, HX, HY, segs=24, outline=0.004)
lathe('dome2', M['dome'], ((0.17, 0), (0.15, 0.05), (0.1, 0.1), (0.05, 0.12)), G + HH + 0.165, HX, HY, segs=24, outline=0.005)
# the bronze stag on top
SZ = G + HH + 0.28
b = ball('stagbody', M['bronze'], 0, 0, 0, 0.05, outline=0.003)
b.scale = (1.6, 0.8, 0.8)
b.location = (HX, HY, SZ + 0.07)
for (dx, dy) in ((-0.05, -0.02), (-0.05, 0.02), (0.05, -0.02), (0.05, 0.02)):
    rod(f'stagleg{dx}{dy}', M['bronze'], (HX + dx, HY + dy, SZ), (HX + dx, HY + dy, SZ + 0.07), 0.008, segs=6, outline=0.001)
rod('stagneck', M['bronze'], (HX + 0.06, HY, SZ + 0.08), (HX + 0.085, HY, SZ + 0.14), 0.014, segs=8, outline=0.001)
ball('staghead', M['bronze'], HX + 0.095, HY, SZ + 0.15, 0.022, outline=0.002)
for s in (-1, 1):
    bar(f'antler{s}', M['bronze'], (HX + 0.09, HY + s * 0.01, SZ + 0.17), (HX + 0.075, HY + s * 0.055, SZ + 0.24), 0.008, outline=0)
    bar(f'antlertine{s}', M['bronze'], (HX + 0.083, HY + s * 0.03, SZ + 0.2), (HX + 0.11, HY + s * 0.045, SZ + 0.23), 0.006, outline=0)

# ---------- the wings in a St Andrew's cross ----------
for k, a in enumerate((math.radians(-35), math.radians(-145), math.radians(35), math.radians(145))):
    L = 0.95 if k < 2 else 0.68
    end = 1 if math.cos(a) > 0 else -1
    D, WH = 0.22, 0.22
    cx, cy = HX + (HR - 0.02 + L / 2) * math.cos(a), HY + (HR - 0.02 + L / 2) * math.sin(a)
    objs = set(bpy.data.objects)
    box(f'wing{k}', M['wall'], 0, 0, G - 0.005, L, D, WH, outline=0.007, bevel=0)
    hip(f'wingroof{k}', M['roof'], 0, 0, G + WH - 0.005, L, D, 0.1, over=0.015, outline=0.006)
    box(f'wingcornice{k}', M['white'], 0, 0, G + WH - 0.025, L + 0.01, D + 0.01, 0.02, outline=0.002, bevel=0)
    n = int(L / 0.075)
    for j in range(n):
        x = -L / 2 + 0.05 + j * (L - 0.1) / (n - 1)
        for side in (-1, 1):
            box(f'wingwin{k}{j}{side}', M['white'], x, side * (D / 2 + 0.003), G + 0.04, 0.035, 0.006, 0.09, outline=0, bevel=0)
            box(f'wingwinup{k}{j}{side}', M['white'], x, side * (D / 2 + 0.003), G + 0.15, 0.035, 0.006, 0.045, outline=0, bevel=0)
    # the end pavilion of each wing
    box(f'pavilion{k}', M['wall'], end * (L / 2 - 0.06), 0, G - 0.005, 0.14, D + 0.04, WH + 0.04, outline=0.005, bevel=0)
    hip(f'pavilionroof{k}', M['roof'], end * (L / 2 - 0.06), 0, G + WH + 0.035, 0.14, D + 0.04, 0.08, over=0.012)
    for o in set(bpy.data.objects) - objs:
        o.matrix_world = Matrix.Translation((cx, cy, 0)) @ Matrix.Rotation(a if math.cos(a) > 0 else a + math.pi, 4, 'Z') @ o.matrix_world

bpy.context.view_layer.update()
turn(before, -20)
render(G)
