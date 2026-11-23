# A cartoon Ellora for the country maps, built in the set's shared look (../toon.py): the Kailasa
# Temple, carved down out of the basalt hillside in one piece, standing in the pit cut round it, its
# pyramid tower over the pillared hall, the stone elephants and the two tall victory pillars in its
# court, and the cliff faces round it with their cave galleries. Turned a little towards the camera.
# Run: blender -b --factory-startup -P ellora.py -- ellora-1024.png 1024 ellora.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#9aa860', shadow_mul=(0.74, 0.78, 0.72), lift=0.2),
    'basalt': toon('basalt', '#8a7a6a', shadow_mul=(0.86, 0.82, 0.82)),
    'basaltTop': toon('basaltTop', '#9a9a60', shadow_mul=(0.8, 0.82, 0.72)),
    'carved': toon('carved', '#b0987a', shadow_mul=(0.86, 0.8, 0.78), lift=0.08),
    'carvedDark': toon('carvedDark', '#8a7058'),
    'floor': toon('floor', '#a08a70'),
    'cave': flat('cave', '#2e2620'),
})

G = tile(M['grass'])
before = set(bpy.data.objects)

# ---------- the hillside cut round the temple: three cliff walls ----------
H = 0.42
for k, (x, y, w, d) in enumerate(((0.0, 0.78, 1.7, 0.36), (-0.75, 0.22, 0.3, 0.9), (0.75, 0.22, 0.3, 0.9))):
    box(f'cliff{k}', M['basalt'], x, y, G - 0.01, w, d, H, outline=0.012, bevel=0)
    box(f'clifftop{k}', M['basaltTop'], x, y, G + H - 0.015, w + 0.01, d + 0.01, 0.025, outline=0.004, bevel=0)
for j in range(7):
    box(f'gallery{j}', M['cave'], -0.6 + j * 0.2, 0.598, G + 0.08 + 0.13 * (j % 2), 0.08, 0.006, 0.1, outline=0, bevel=0)
for s in (-1, 1):
    for j in range(3):
        box(f'sidecave{s}{j}', M['cave'], s * 0.598, 0.0 + j * 0.2, G + 0.1, 0.006, 0.07, 0.09, outline=0, bevel=0)
box('pitfloor', M['floor'], 0.0, 0.2, G - 0.006, 1.2, 0.85, 0.012, outline=0.003, bevel=0)

# ---------- the Kailasa Temple ----------
TX, TY = 0.0, 0.25
box('plinth', M['carvedDark'], TX, TY, G - 0.005, 0.5, 0.56, 0.12, outline=0.008, bevel=0)
for j in range(5):
    box(f'frieze{j}', M['carved'], TX - 0.2 + j * 0.1, TY - 0.282, G + 0.03, 0.06, 0.006, 0.06, outline=0, bevel=0)
box('mandapa', M['carved'], TX, TY - 0.08, G + 0.115, 0.36, 0.3, 0.12, outline=0.008, bevel=0)
for j in range(5):
    rod(f'mandapacol{j}', M['carvedDark'], (TX - 0.16 + j * 0.08, TY - 0.235, G + 0.115), (TX - 0.16 + j * 0.08, TY - 0.235, G + 0.23), 0.01, segs=6, outline=0.002)
loft('mandaparoof', M['carved'], [[(TX - 0.19, TY - 0.24, G + 0.23), (TX + 0.19, TY - 0.24, G + 0.23), (TX + 0.19, TY + 0.08, G + 0.23), (TX - 0.19, TY + 0.08, G + 0.23)],
                                  [(TX - 0.12, TY - 0.16, G + 0.28), (TX + 0.12, TY - 0.16, G + 0.28), (TX + 0.12, TY + 0.02, G + 0.28), (TX - 0.12, TY + 0.02, G + 0.28)]], outline=0.006)
# the pyramid tower (shikhara) over the shrine
SX, SY = TX, TY + 0.13
z = G + 0.115
for t in range(5):
    w = 0.3 - t * 0.05
    box(f'shikhara{t}', M['carved' if t % 2 == 0 else 'carvedDark'], SX, SY, z, w, w, 0.08, outline=0.006, bevel=0)
    z += 0.08
lathe('amalaka', M['carved'], ((0.06, 0), (0.07, 0.025), (0.06, 0.05)), z, SX, SY, segs=16, outline=0.004)
lathe('kalasha', M['carvedDark'], ((0.02, 0), (0.004, 0.07)), z + 0.05, SX, SY, segs=8, outline=0.002)

# ---------- the court: elephants and the victory pillars ----------
for s in (-1, 1):
    x = TX + s * 0.38
    box(f'pillarbase{s}', M['carvedDark'], x, TY - 0.1, G - 0.005, 0.07, 0.07, 0.05, outline=0.004, bevel=0)
    lathe(f'pillar{s}', M['carved'], ((0.025, 0), (0.022, 0.4)), G + 0.045, x, TY - 0.1, segs=8, outline=0.004, smooth=False)
    box(f'pillartop{s}', M['carvedDark'], x, TY - 0.1, G + 0.44, 0.06, 0.06, 0.03, outline=0.003, bevel=0)
    ex, ey = TX + s * 0.3, TY - 0.38
    b = ball(f'elephant{s}', M['carved'], 0, 0, 0, 0.05, outline=0.005)
    b.scale = (1.4, 0.9, 1.0)
    b.location = (ex, ey, G + 0.08)
    for fx in (-0.035, 0.035):
        rod(f'elephantleg{s}{fx}', M['carved'], (ex + fx, ey, G), (ex + fx, ey, G + 0.06), 0.014, segs=6, outline=0.002)
    ball(f'elephanthead{s}', M['carved'], ex - s * 0.07, ey, G + 0.1, 0.035, outline=0.004)
    rod(f'elephanttrunk{s}', M['carved'], (ex - s * 0.09, ey, G + 0.09), (ex - s * 0.1, ey - 0.01, G + 0.02), 0.01, segs=5, outline=0.002)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
