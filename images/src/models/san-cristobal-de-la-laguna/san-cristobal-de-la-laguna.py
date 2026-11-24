# A cartoon San Cristóbal de La Laguna for the country maps, built in the set's shared look
# (../toon.py): the old capital of Tenerife, its colonial grid of low painted houses with wooden
# balconies and red tile roofs, the cathedral's white front between its two towers and its dome
# behind, and the Concepción church's tall square stone tower. Turned a little towards the camera.
# Run: blender -b --factory-startup -P san-cristobal-de-la-laguna.py -- san-cristobal-de-la-laguna-1024.png 1024 san-cristobal-de-la-laguna.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d8cdb4', shadow_mul=(0.82, 0.8, 0.84), lift=0.18),
    'white': toon('white', '#f4efe4', shadow_mul=(0.82, 0.82, 0.88), lift=0.22),
    'stone': toon('stone', '#8e8a82', shadow_mul=(0.8, 0.8, 0.86)),
    'tower': toon('tower', '#b4a68c', shadow_mul=(0.8, 0.78, 0.82), lift=0.15),
    'roof': toon('roof', '#c4643c'),
    'ochre': toon('ochre', '#e6b65a', lift=0.18),
    'blue': toon('blue', '#8cb6d6', lift=0.18),
    'pink': toon('pink', '#e8a490', lift=0.18),
    'green': toon('green', '#a8c890', lift=0.18),
    'wood': toon('wood', '#6a4428'),
    'dome': toon('dome', '#cfc8b8', lift=0.2),
    'dark': flat('dark', '#2e2622'),
    'leaf': toon('leaf', '#5e9a48', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)

# ---------- the cathedral ----------
CX, FY = -0.05, 0.12
box('nave', M['white'], CX, FY + 0.3, G - 0.005, 0.42, 0.56, 0.28, outline=0.006, bevel=0)
gable('naveroof', M['roof'], CX, FY + 0.3, G + 0.275, 0.42, 0.56, 0.1, outline=0.004)
lathe('drum', M['white'], ((0.11, 0), (0.11, 0.08)), G + 0.3, CX, FY + 0.42, segs=24, outline=0.004, smooth=False)
lathe('dome', M['dome'], [(0.115 * math.cos(a), 0.11 * math.sin(a)) for a in [k * math.pi / 16 for k in range(9)]], G + 0.38, CX, FY + 0.42, segs=24, outline=0.005)
lathe('lantern', M['white'], ((0.025, 0), (0.025, 0.05), (0.005, 0.08)), G + 0.485, CX, FY + 0.42, segs=8, outline=0.002, smooth=False)
box('front', M['white'], CX, FY + 0.02, G - 0.005, 0.38, 0.06, 0.34, outline=0.006, bevel=0)
for k in range(4):
    box(f'pilaster{k}', M['stone'], CX - 0.15 + k * 0.1, FY - 0.012, G - 0.005, 0.025, 0.012, 0.32, outline=0.001, bevel=0)
box('cornice', M['stone'], CX, FY + 0.02, G + 0.33, 0.4, 0.075, 0.02, outline=0.002, bevel=0)
gable('pediment', M['white'], CX, FY + 0.02, G + 0.35, 0.36, 0.06, 0.08, outline=0.004)
arch('door', M['dark'], CX, FY - 0.012, G - 0.005, 0.07, 0.15)
for s in (-1, 1):
    arch(f'sidedoor{s}', M['dark'], CX + s * 0.1, FY - 0.012, G - 0.005, 0.045, 0.1)
    arch(f'window{s}', M['dark'], CX + s * 0.1, FY - 0.012, G + 0.18, 0.04, 0.08)
    TX = CX + s * 0.25
    box(f'tower{s}', M['white'], TX, FY + 0.02, G - 0.005, 0.13, 0.13, 0.46, outline=0.006, bevel=0)
    for z in (G + 0.2, G + 0.34):
        box(f'towerband{s}{z:.2f}', M['stone'], TX, FY + 0.02, z, 0.14, 0.14, 0.018, outline=0.001, bevel=0)
    arch(f'belfry{s}', M['dark'], TX, FY - 0.048, G + 0.36, 0.05, 0.08)
    box(f'towertop{s}', M['stone'], TX, FY + 0.02, G + 0.455, 0.145, 0.145, 0.02, outline=0.002, bevel=0)
    lathe(f'cupola{s}', M['dome'], [(0.055 * math.cos(a), 0.06 * math.sin(a)) for a in [k * math.pi / 12 for k in range(7)]], G + 0.475, TX, FY + 0.02, segs=8, outline=0.003, smooth=False)
    rod(f'finial{s}', M['stone'], (TX, FY + 0.02, G + 0.53), (TX, FY + 0.02, G + 0.58), 0.006, segs=6, outline=0.001)

# ---------- the Concepción church's tower ----------
KX, KY = 0.68, -0.05
box('ctower', M['tower'], KX, KY, G - 0.005, 0.16, 0.16, 0.66, outline=0.007, bevel=0)
for z in (G + 0.22, G + 0.44):
    box(f'ctowerband{z:.2f}', M['stone'], KX, KY, z, 0.17, 0.17, 0.02, outline=0.001, bevel=0)
for j, z in enumerate((G + 0.08, G + 0.28)):
    box(f'cslit{j}', M['dark'], KX, KY - 0.083, z, 0.02, 0.006, 0.07, outline=0, bevel=0)
arch('cbelfry', M['dark'], KX, KY - 0.083, G + 0.5, 0.06, 0.11)
arch('cbelfryside', M['dark'], KX + 0.083, KY, G + 0.5, 0.06, 0.11, face='x')
box('ctowertop', M['stone'], KX, KY, G + 0.65, 0.18, 0.18, 0.025, outline=0.002, bevel=0)
hip('ctowercap', M['roof'], KX, KY, G + 0.675, 0.16, 0.16, 0.1)
box('cnave', M['white'], KX - 0.02, KY + 0.3, G - 0.005, 0.24, 0.44, 0.2, outline=0.005, bevel=0)
gable('cnaveroof', M['roof'], KX - 0.02, KY + 0.3, G + 0.195, 0.24, 0.44, 0.08)

# ---------- the low painted houses ----------
rng = random.Random(54898)
cols = [M['ochre'], M['blue'], M['pink'], M['white'], M['green'], M['ochre']]
x = -0.9
for k, mat in enumerate(cols):
    w = 0.2 + 0.05 * rng.random()
    h = 0.15 + 0.07 * rng.random()
    hx, hy = x + w / 2, -0.55
    box(f'house{k}', mat, hx, hy, G - 0.005, w, 0.24, h, outline=0.004, bevel=0)
    hip(f'houseroof{k}', M['roof'], hx, hy, G + h - 0.005, w, 0.24, 0.07, over=0.012)
    box(f'housedoor{k}', M['wood'], hx - w * 0.2, hy - 0.122, G - 0.005, 0.04, 0.006, 0.08, outline=0, bevel=0)
    box(f'housewin{k}', M['wood'], hx + w * 0.2, hy - 0.122, G + 0.05, 0.035, 0.006, 0.045, outline=0, bevel=0)
    if h > 0.18:
        box(f'balcony{k}', M['wood'], hx, hy - 0.135, G + h - 0.075, w * 0.6, 0.03, 0.045, outline=0.002, bevel=0)
    x += w + 0.02
for k, (tx, ty) in enumerate(((-0.75, -0.15), (0.35, -0.3), (-0.55, 0.65))):
    rod(f'trunk{k}', M['trunk'], (tx, ty, G), (tx, ty, G + 0.1), 0.012, segs=6, outline=0.002)
    b = ball(f'tree{k}', M['leaf'], 0, 0, 0, 0.08, outline=0.007)
    b.scale = (1.2, 1.2, 0.9)
    b.location = (tx, ty, G + 0.16)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
