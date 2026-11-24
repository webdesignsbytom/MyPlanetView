# A cartoon Polonnaruwa for the country maps, built in the set's shared look (../toon.py): the Gal
# Vihara, the Buddhas carved from one long granite outcrop, the great reclining Buddha lying on his
# side with his head on a pillow, the standing Buddha with his arms crossed beside him, and the
# seated Buddha in his cave niche, with the old city's ruins and a dagoba on the lawn. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P polonnaruwa.py -- polonnaruwa-1024.png 1024 polonnaruwa.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'granite': toon('granite', '#a89a88', shadow_mul=(0.84, 0.84, 0.88)),
    'carved': toon('carved', '#c8b8a0', shadow_mul=(0.84, 0.82, 0.84), lift=0.1),
    'robe': toon('robe', '#bcaa90', shadow_mul=(0.84, 0.82, 0.84)),
    'niche': flat('niche', '#4a4038'),
    'eye': flat('eye', '#5a5048'),
    'white': toon('white', '#f4f0e6', lift=0.15),
    'brick': toon('brick', '#b8704a', shadow_mul=(0.86, 0.78, 0.76)),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)

# ---------- the granite outcrop ----------
RY = 0.35
box('rock', M['granite'], 0.0, RY + 0.08, G - 0.01, 1.7, 0.22, 0.5, outline=0.012, bevel=0)
box('rockledge', M['granite'], 0.0, RY - 0.08, G - 0.01, 1.7, 0.12, 0.06, outline=0.006, bevel=0)

# ---------- the reclining Buddha ----------
LX0, LX1 = -0.05, 0.75
LY = RY - 0.08
b = ball('reclinebody', M['robe'], 0, 0, 0, 0.1, outline=0.009)
b.scale = (3.4, 0.9, 0.85)
b.location = ((LX0 + LX1) / 2, LY, G + 0.12)
box('pillow', M['carved'], LX0 + 0.04, LY, G + 0.05, 0.14, 0.18, 0.1, outline=0.005, bevel=0)
ball('reclinehead', M['carved'], LX0 + 0.04, LY, G + 0.21, 0.07, outline=0.007)
ball('reclinecurls', M['granite'], LX0 + 0.0, LY, G + 0.21, 0.055, outline=0.003)
for j in range(2):
    ball(f'reclinefoot{j}', M['carved'], LX1 - 0.01, LY - 0.03 + j * 0.06, G + 0.08 + j * 0.06, 0.035, outline=0.003)
box('reclineeye', M['eye'], LX0 + 0.06, LY - 0.07, G + 0.22, 0.03, 0.004, 0.006, outline=0, bevel=0)

# ---------- the standing Buddha ----------
SX = -0.25
lathe('standrobe', M['robe'], ((0.08, 0), (0.07, 0.3), (0.05, 0.36)), G - 0.005, SX, LY, segs=14, outline=0.007)
for s in (-1, 1):
    bar(f'standarm{s}', M['robe'], (SX + s * 0.06, LY - 0.02, G + 0.33), (SX - s * 0.03, LY - 0.06, G + 0.26), 0.035, outline=0.003)
ball('standhead', M['carved'], SX, LY, G + 0.42, 0.055, outline=0.005)
ball('standushnisha', M['granite'], SX, LY, G + 0.47, 0.03, outline=0.002)
for s in (-1, 1):
    ball(f'standeye{s}', M['eye'], SX + s * 0.02, LY - 0.05, G + 0.43, 0.007, outline=0)

# ---------- the seated Buddha in his niche ----------
NX = -0.6
box('niche', M['niche'], NX, RY - 0.032, G + 0.06, 0.26, 0.006, 0.34, outline=0, bevel=0)
b = ball('seatlegs', M['robe'], 0, 0, 0, 0.08, outline=0.006)
b.scale = (1.3, 0.7, 0.45)
b.location = (NX, RY - 0.06, G + 0.1)
b = ball('seattorso', M['robe'], 0, 0, 0, 0.06, outline=0.006)
b.scale = (1.0, 0.7, 1.4)
b.location = (NX, RY - 0.05, G + 0.2)
ball('seathead', M['carved'], NX, RY - 0.05, G + 0.31, 0.045, outline=0.004)
lathe('seathalo', M['carved'], ((0.07, 0), (0.07, 0.01)), G + 0.3, NX, RY - 0.03, segs=16, outline=0.002)

# ---------- the dagoba and ruins on the lawn ----------
DX, DY = 0.7, -0.45
lathe('dagoba', M['white'], ((0.2, 0), (0.2, 0.04), (0.18, 0.12), (0.1, 0.2), (0.04, 0.22)), G - 0.005, DX, DY, segs=24, outline=0.008)
box('dagobahti', M['white'], DX, DY, G + 0.215, 0.06, 0.06, 0.04, outline=0.003, bevel=0)
lathe('dagobaspire', M['white'], ((0.025, 0), (0.004, 0.1)), G + 0.255, DX, DY, segs=10, outline=0.003)
for k, (x, y, w, d) in enumerate(((-0.5, -0.45, 0.4, 0.05), (-0.7, -0.6, 0.05, 0.3), (-0.3, -0.6, 0.05, 0.3))):
    box(f'ruin{k}', M['brick'], x, y, G - 0.005, w, d, 0.07, outline=0.004, bevel=0)
for k, (x, y) in enumerate(((-1.0, 0.0), (1.0, 0.1), (0.15, -0.8))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.1, 0.09, outline=0.009)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
