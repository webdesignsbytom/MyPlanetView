# A cartoon Valley of the Temples for the country maps, built in the set's shared look (../toon.py):
# Agrigento's Temple of Concordia, the best kept Greek temple of all, its golden Doric columns and
# pediments whole on their ridge, almond trees in blossom round it, and the great bronze of fallen
# Icarus lying on the grass before it. Turned a little towards the camera.
# Run: blender -b --factory-startup -P agrigento.py -- agrigento-1024.png 1024 agrigento.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#9ab860', shadow_mul=(0.74, 0.8, 0.74), lift=0.2),
    'path': toon('path', '#e0d0a8'),
    'tufa': toon('tufa', '#e0b870', shadow_mul=(0.86, 0.8, 0.72), lift=0.12),
    'tufaDark': toon('tufaDark', '#c89a58', shadow_mul=(0.86, 0.8, 0.72)),
    'bronze': toon('bronze', '#6a5a48', shadow_mul=(0.84, 0.82, 0.86)),
    'blossom': toon('blossom', '#f8d0dc', lift=0.25),
    'trunk': toon('trunk', '#5a4a40'),
})

G = tile(M['grass'])
before = set(bpy.data.objects)

box('path', M['path'], -0.1, -0.55, G - 0.004, 1.8, 0.16, 0.01, rot_z=0.1, outline=0.003, bevel=0)

# ---------- the Temple of Concordia ----------
TX, TY = 0.0, 0.2
for j in range(3):
    box(f'step{j}', M['tufaDark'], TX, TY, G - 0.005 + j * 0.03, 0.9 - j * 0.04, 0.46 - j * 0.04, 0.035, outline=0.005, bevel=0)
S = G + 0.085
COLS_X, COLS_Y = 6, 11
for i in range(COLS_X):
    for j in range(COLS_Y):
        if 0 < i < COLS_X - 1 and 0 < j < COLS_Y - 1:
            continue
        x = TX - 0.39 + j * 0.078
        y = TY - 0.16 + i * 0.064
        rod(f'col{i}{j}', M['tufa'], (x, y, S), (x, y, S + 0.26), 0.022, r2=0.019, segs=12, outline=0.004)
box('cella', M['tufaDark'], TX, TY, S, 0.6, 0.18, 0.24, outline=0.006, bevel=0)
box('architrave', M['tufa'], TX, TY, S + 0.26, 0.84, 0.36, 0.05, outline=0.006, bevel=0)
for j in range(14):
    box(f'triglyph{j}', M['tufaDark'], TX - 0.39 + j * 0.06, TY - 0.182, S + 0.285, 0.02, 0.006, 0.025, outline=0, bevel=0)
loft('roof', M['tufa'], [[(TX - 0.42, TY - 0.18, S + 0.31), (TX + 0.42, TY - 0.18, S + 0.31), (TX + 0.42, TY + 0.18, S + 0.31), (TX - 0.42, TY + 0.18, S + 0.31)],
                         [(TX - 0.42, TY - 0.004, S + 0.4), (TX + 0.42, TY - 0.004, S + 0.4), (TX + 0.42, TY + 0.004, S + 0.4), (TX - 0.42, TY + 0.004, S + 0.4)]], outline=0.007)

# ---------- fallen Icarus ----------
IX, IY = 0.35, -0.3
b = ball('icarusbody', M['bronze'], 0, 0, 0, 0.07, outline=0.006)
b.scale = (2.2, 0.9, 0.5)
b.rotation_euler = (0, 0, 0.3)
b.location = (IX, IY, G + 0.025)
ball('icarushead', M['bronze'], IX - 0.17, IY - 0.05, G + 0.04, 0.05, outline=0.005)
for s in (-1, 1):
    loft(f'icaruswing{s}', M['bronze'], [[(IX - 0.05, IY + s * 0.05, G + 0.03), (IX + 0.08, IY + s * 0.06, G + 0.03), (IX + 0.12, IY + s * 0.22, G + 0.008), (IX - 0.02, IY + s * 0.24, G + 0.008)],
                                         [(IX - 0.05, IY + s * 0.05, G + 0.042), (IX + 0.08, IY + s * 0.06, G + 0.042), (IX + 0.12, IY + s * 0.22, G + 0.02), (IX - 0.02, IY + s * 0.24, G + 0.02)]], outline=0.004)

# ---------- almond trees in blossom ----------
for k, (x, y) in enumerate(((-0.75, -0.25), (-0.4, -0.85), (0.8, -0.65), (-0.95, 0.35), (0.95, 0.15), (0.1, -0.85), (0.7, 0.7), (-0.6, 0.75))):
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + 0.09), 0.012, segs=6, outline=0.003)
    for j in range(3):
        ball(f'blossom{k}{j}', M['blossom'], x + 0.05 * math.cos(j * 2.1 + k), y + 0.05 * math.sin(j * 2.1 + k), G + 0.13 + 0.015 * j, 0.06, outline=0.006)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
