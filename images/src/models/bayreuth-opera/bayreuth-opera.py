# A cartoon Margravial Opera House for the country maps, built in the set's shared look
# (../toon.py): Margravine Wilhelmine's baroque court theatre in Bayreuth, Bavaria, its sandstone
# front with the projecting centre of four columns over three arched doors, the balcony, the
# statues and the crowned crest on the top, the long hall behind under its high roof, and the
# square before it. Turned a little towards the camera.
# Run: blender -b --factory-startup -P bayreuth-opera.py -- bayreuth-opera-1024.png 1024 bayreuth-opera.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d8cdb4', shadow_mul=(0.82, 0.8, 0.84), lift=0.18),
    'stone': toon('stone', '#e8cc98', shadow_mul=(0.8, 0.78, 0.82), lift=0.18),
    'stoneDark': toon('stoneDark', '#c8a87a'),
    'roof': toon('roof', '#6a6a72'),
    'gold': toon('gold2', '#e8b848', shadow_mul=(0.78, 0.66, 0.6), lift=0.35),
    'dark': flat('dark', '#2e2622'),
    'tree': toon('tree', '#4e8a3e', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)
def tree(name, x, y, r=0.09, h=0.12, mat="tree"):
    rod(name + "trunk", M["trunk"], (x, y, G), (x, y, G + h), 0.012, segs=6, outline=0.002)
    b = ball(name, M[mat], 0, 0, 0, r, outline=0.008)
    b.scale = (1.1, 1.1, 0.95)
    b.location = (x, y, G + h + r * 0.75)


# ---------- the hall behind ----------
HX, HY = 0.0, 0.3
box('hall', M['stone'], HX, HY, G - 0.005, 0.5, 0.6, 0.32, outline=0.007, bevel=0)
hip('hallroof', M['roof'], HX, HY, G + 0.315, 0.5, 0.6, 0.18, over=0.012)
for s in (-1, 1):
    for j in range(4):
        arch(f'hallwin{s}{j}', M['dark'], HX + s * 0.253, HY - 0.15 + j * 0.12, G + 0.14, 0.035, 0.1, face='x')

# ---------- the front ----------
FY = HY - 0.32
box('front', M['stone'], HX, FY, G - 0.005, 0.6, 0.06, 0.36, outline=0.007, bevel=0)
box('centre', M['stone'], HX, FY - 0.04, G - 0.005, 0.28, 0.04, 0.4, outline=0.006, bevel=0)
for j in range(4):
    x = HX - 0.105 + j * 0.07
    lathe(f'col{j}', M['stoneDark'], ((0.014, 0), (0.014, 0.18)), G + 0.17, x, FY - 0.07, segs=10, outline=0.001)
    box(f'colbase{j}', M['stoneDark'], x, FY - 0.07, G + 0.15, 0.04, 0.04, 0.02, outline=0.001, bevel=0)
for j in range(3):
    arch(f'door{j}', M['dark'], HX - 0.07 + j * 0.07, FY - 0.063, G - 0.005, 0.045, 0.12)
box('balcony', M['stoneDark'], HX, FY - 0.08, G + 0.14, 0.26, 0.05, 0.015, outline=0.002, bevel=0)
for j in range(2):
    arch(f'upwin{j}', M['dark'], HX - 0.035 + j * 0.07, FY - 0.063, G + 0.2, 0.035, 0.11)
for s in (-1, 1):
    for j in range(2):
        arch(f'sidewin{s}{j}', M['dark'], HX + s * (0.19 + j * 0.07), FY - 0.033, G + 0.06, 0.035, 0.1)
        arch(f'sidewinup{s}{j}', M['dark'], HX + s * (0.19 + j * 0.07), FY - 0.033, G + 0.2, 0.035, 0.09)
box('cornice', M['stoneDark'], HX, FY - 0.02, G + 0.355, 0.62, 0.1, 0.02, outline=0.002, bevel=0)
box('attic', M['stone'], HX, FY - 0.04, G + 0.375, 0.28, 0.04, 0.07, outline=0.003, bevel=0)
lathe('crest', M['gold'], ((0.04, 0), (0.045, 0.04), (0.02, 0.07), (0.0, 0.08)), G + 0.44, HX, FY - 0.04, segs=10, outline=0.002)
for j in range(4):
    x = HX - 0.27 + j * 0.18
    rod(f'statue{j}', M['stoneDark'], (x, FY - 0.02, G + 0.375), (x, FY - 0.02, G + 0.43), 0.012, segs=8, outline=0.001)
    ball(f'statuehead{j}', M['stoneDark'], x, FY - 0.02, G + 0.44, 0.012, outline=0.001)

for k, (x, y) in enumerate(((-0.75, -0.45), (0.75, -0.45), (-0.8, 0.3), (0.8, 0.3), (-0.5, 0.85), (0.5, 0.85))):
    tree(f'tree{k}', x, y, r=0.1, h=0.13)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
