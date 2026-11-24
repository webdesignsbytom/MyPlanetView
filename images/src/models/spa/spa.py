# A cartoon Spa for the country maps, built in the set's shared look (../toon.py): the little town in
# the Belgian Ardennes that gave all spas their name, one of the Great Spa Towns of Europe: the
# grand neoclassical baths with their columned front and roof of slate, the Pouhon
# Pierre-le-Grand's glazed pavilion over the spring, the casino, and the wooded hills round the
# park. Turned a little towards the camera.
# Run: blender -b --factory-startup -P spa.py -- spa-1024.png 1024 spa.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#8cc05a', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'stone': toon('stone', '#ece2cc', shadow_mul=(0.82, 0.82, 0.88), lift=0.2),
    'brick': toon('brick', '#c87a58', lift=0.14),
    'slate': toon('slate', '#4a5260'),
    'glass': toon('glass', '#8cc0d8', lift=0.3),
    'iron': toon('iron', '#3a4a3e'),
    'path': toon('path2', '#e2d6bc', lift=0.18),
    'dark': flat('dark', '#2e2622'),
    'tree': toon('tree', '#3e7a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile()
before = set(bpy.data.objects)
def tree(name, x, y, r=0.09, h=0.12, mat="tree"):
    rod(name + "trunk", M["trunk"], (x, y, G), (x, y, G + h), 0.012, segs=6, outline=0.002)
    b = ball(name, M[mat], 0, 0, 0, r, outline=0.008)
    b.scale = (1.1, 1.1, 0.95)
    b.location = (x, y, G + h + r * 0.75)


box('square', M['path'], 0.0, -0.3, G - 0.004, 1.4, 0.5, 0.008, outline=0.001, bevel=0)

# ---------- the baths ----------
BX, BY = -0.05, 0.3
box('baths', M['stone'], BX, BY, G - 0.005, 0.8, 0.3, 0.22, outline=0.007, bevel=0)
hip('bathsroof', M['slate'], BX, BY, G + 0.215, 0.8, 0.3, 0.12, over=0.015)
box('portico', M['stone'], BX, BY - 0.17, G - 0.005, 0.32, 0.06, 0.03, outline=0.002, bevel=0)
for j in range(6):
    lathe(f'col{j}', M['stone'], ((0.016, 0), (0.016, 0.2)), G + 0.02, BX - 0.14 + j * 0.056, BY - 0.18, segs=10, outline=0.001)
box('entablature', M['stone'], BX, BY - 0.17, G + 0.215, 0.34, 0.06, 0.03, outline=0.002, bevel=0)
gable('pediment', M['stone'], BX, BY - 0.17, G + 0.245, 0.34, 0.06, 0.07)
for j in range(8):
    x = BX - 0.36 + j * 0.1
    if abs(x - BX) < 0.18:
        continue
    arch(f'bathwin{j}', M['dark'], x, BY - 0.153, G + 0.05, 0.04, 0.12)

# ---------- the Pouhon Pierre-le-Grand ----------
PX, PY = 0.5, -0.3
box('pouhon', M['brick'], PX, PY, G - 0.005, 0.24, 0.18, 0.14, outline=0.005, bevel=0)
for j in range(4):
    arch(f'pouhonwin{j}', M['glass'], PX - 0.09 + j * 0.06, PY - 0.093, G + 0.01, 0.045, 0.11)
box('pouhonglass', M['glass'], PX, PY, G + 0.135, 0.2, 0.14, 0.06, outline=0.003, bevel=0)
hip('pouhonroof', M['iron'], PX, PY, G + 0.195, 0.24, 0.18, 0.06, over=0.01)

# ---------- the casino ----------
CX, CY = -0.55, -0.3
box('casino', M['stone'], CX, CY, G - 0.005, 0.28, 0.2, 0.18, outline=0.005, bevel=0)
hip('casinoroof', M['slate'], CX, CY, G + 0.175, 0.28, 0.2, 0.08, over=0.012)
lathe('casinodome', M['slate'], [(0.05 * math.cos(a), 0.06 * math.sin(a)) for a in [k * math.pi / 12 for k in range(7)]], G + 0.25, CX, CY, segs=12, outline=0.003)
for j in range(3):
    arch(f'casinowin{j}', M['dark'], CX - 0.08 + j * 0.08, CY - 0.103, G + 0.02, 0.05, 0.12)

for k, (x, y) in enumerate(((-0.9, 0.35), (-0.6, 0.75), (0.0, 0.85), (0.6, 0.7), (0.95, 0.25), (0.15, -0.8), (-0.3, -0.85))):
    tree(f'tree{k}', x, y, r=0.1, h=0.13)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
