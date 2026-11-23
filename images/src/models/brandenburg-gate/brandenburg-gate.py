# A cartoon Brandenburg Gate for the country maps, built in the set's shared look (../toon.py):
# Berlin's sandstone gate, its twelve Doric columns making five passages under the entablature and
# attic, the green copper Quadriga (Victoria in her chariot with four horses) on top, the side
# guardhouses, the paving of Pariser Platz, and lime trees. Turned a little towards the camera.
# Run: blender -b --factory-startup -P brandenburg-gate.py -- brandenburg-gate-1024.png 1024 brandenburg-gate.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#c8c0b0', shadow_mul=(0.82, 0.8, 0.88), lift=0.2),
    'sandstone': toon('sandstone', '#e2d2ae', shadow_mul=(0.86, 0.8, 0.78), lift=0.15),
    'sandDark': toon('sandDark', '#c8b48e', shadow_mul=(0.86, 0.8, 0.78)),
    'copper': toon('copper', '#5aa08a', shadow_mul=(0.78, 0.86, 0.84), lift=0.15),
    'lawn': toon('lawn', '#6aa54a', shadow_mul=(0.7, 0.78, 0.8)),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a4a36'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)
rng = random.Random(1451)

GX, GY = 0.0, 0.1
W, D = 1.0, 0.2
# ---------- the columns and the passages ----------
box('plinth', M['sandDark'], GX, GY, G - 0.005, W + 0.04, D + 0.04, 0.03, outline=0.008, bevel=0)
for j in range(6):
    x = GX - W / 2 + 0.04 + j * (W - 0.08) / 5
    for s in (-1, 1):
        rod(f'column{j}{s}', M['sandstone'], (x, GY + s * 0.07, G + 0.025), (x, GY + s * 0.07, G + 0.34), 0.026, segs=12, outline=0.005)
    box(f'wallpart{j}', M['sandstone'], x, GY, G + 0.025, 0.06, 0.1, 0.315, outline=0.006, bevel=0)
box('entablature', M['sandstone'], GX, GY, G + 0.335, W + 0.02, D + 0.02, 0.07, outline=0.012, bevel=0)
box('frieze', M['sandDark'], GX, GY - D / 2 - 0.012, G + 0.35, W, 0.006, 0.035, outline=0, bevel=0)
box('attic', M['sandstone'], GX, GY, G + 0.4, 0.5, 0.16, 0.08, outline=0.01, bevel=0)
for s in (-1, 1):
    box(f'atticstep{s}', M['sandstone'], GX + s * 0.36, GY, G + 0.4, 0.22, 0.14, 0.035, outline=0.006, bevel=0)

# ---------- the Quadriga ----------
QZ = G + 0.48
box('quadrigabase', M['sandDark'], GX, GY, QZ - 0.005, 0.24, 0.12, 0.02, outline=0.004, bevel=0)
for k in range(4):
    x = GX - 0.09 + k * 0.06
    for fy in (-0.02, 0.025):
        rod(f'horseleg{k}{fy}', M['copper'], (x, GY - 0.02 + fy, QZ + 0.015), (x, GY - 0.02 + fy, QZ + 0.06), 0.006, segs=5, outline=0.002)
    b = ball(f'horse{k}', M['copper'], 0, 0, 0, 0.022, outline=0.004)
    b.scale = (0.8, 1.5, 0.9)
    b.location = (x, GY - 0.02, QZ + 0.07)
    rod(f'horseneck{k}', M['copper'], (x, GY - 0.045, QZ + 0.075), (x, GY - 0.065, QZ + 0.11), 0.009, segs=6, outline=0.002)
    ball(f'horsehead{k}', M['copper'], x, GY - 0.072, QZ + 0.115, 0.011, outline=0.002)
box('chariot', M['copper'], GX, GY + 0.04, QZ + 0.015, 0.08, 0.05, 0.05, outline=0.004, bevel=0)
rod('victoria', M['copper'], (GX, GY + 0.045, QZ + 0.06), (GX, GY + 0.045, QZ + 0.15), 0.016, r2=0.01, segs=8, outline=0.003)
ball('victoriahead', M['copper'], GX, GY + 0.045, QZ + 0.165, 0.012, outline=0.002)
rod('staff', M['copper'], (GX + 0.025, GY + 0.04, QZ + 0.09), (GX + 0.03, GY + 0.03, QZ + 0.24), 0.004, segs=5, outline=0)
for s in (-1, 1):
    bar(f'wing{s}', M['copper'], (GX + 0.03, GY + 0.03, QZ + 0.22), (GX + 0.03 + s * 0.03, GY + 0.03, QZ + 0.255), 0.012, outline=0.002)

# ---------- the guardhouses, lawns and lime trees ----------
for s in (-1, 1):
    box(f'guardhouse{s}', M['sandstone'], s * 0.72, GY + 0.05, G - 0.005, 0.22, 0.26, 0.2, outline=0.01, bevel=0)
    for j in range(4):
        rod(f'guardcolumn{s}{j}', M['sandstone'], (s * 0.72 - 0.08 + j * 0.055, GY - 0.09, G), (s * 0.72 - 0.08 + j * 0.055, GY - 0.09, G + 0.18), 0.013, segs=8, outline=0.003)
    box(f'guardroof{s}', M['sandDark'], s * 0.72, GY + 0.03, G + 0.195, 0.24, 0.3, 0.03, outline=0.005, bevel=0)
for s in (-1, 1):
    box(f'lawn{s}', M['lawn'], s * 0.6, -0.55, G - 0.004, 0.5, 0.3, 0.012, outline=0.004, bevel=0)
    for j in range(3):
        x = s * (0.42 + j * 0.18)
        rod(f'trunk{s}{j}', M['trunk'], (x, -0.55, G), (x, -0.55, G + 0.08), 0.012, segs=6, outline=0.003)
        ball(f'lime{s}{j}', M['tree'], x, -0.55, G + 0.14, 0.075, outline=0.011)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
