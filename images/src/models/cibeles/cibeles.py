# A cartoon Cibeles Fountain for the country maps, built in the set's shared look (../toon.py):
# Madrid's goddess Cybele seated on her chariot with her turreted crown, sceptre and key, drawn by
# two lions on its rocky base in the round basin, and behind it the white Palacio de Cibeles with its
# tall pinnacled middle tower and corner turrets under slate spires. Turned a little towards the
# camera.
# Run: blender -b --factory-startup -P cibeles.py -- cibeles-1024.png 1024 cibeles.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#c8c0b0', shadow_mul=(0.84, 0.82, 0.88), lift=0.2),
    'lawn': toon('lawn', '#7cb85a'),
    'marble': toon('marble', '#ece6da', shadow_mul=(0.84, 0.84, 0.9), lift=0.15),
    'marbleDark': toon('marbleDark', '#c8c0b0'),
    'water': toon('water', '#5aa8d0', lift=0.3),
    'white': toon('white', '#f6f4ee', shadow_mul=(0.82, 0.84, 0.9), lift=0.15),
    'slate': toon('slate', '#4a4e56'),
    'window': flat('window', '#3a3a48'),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'gold': toon('gold', '#e0b040', lift=0.3),
})

G = tile(M['paving'])
before = set(bpy.data.objects)

# ---------- the Palacio de Cibeles ----------
PY = 0.62
box('palacio', M['white'], 0.0, PY, G - 0.005, 0.9, 0.26, 0.28, outline=0.009, bevel=0)
for r in range(3):
    for j in range(12):
        x = -0.41 + j * 0.075
        if abs(x) < 0.08:
            continue
        box(f'pwin{r}{j}', M['window'], x, PY - 0.132, G + 0.04 + r * 0.075, 0.025, 0.006, 0.045, outline=0, bevel=0)
box('ptower', M['white'], 0.0, PY - 0.02, G - 0.005, 0.15, 0.15, 0.55, outline=0.008, bevel=0)
box('ptowerclock', M['window'], 0.0, PY - 0.097, G + 0.42, 0.05, 0.006, 0.06, outline=0, bevel=0)
pyramid('ptowerroof', M['slate'], 0.0, PY - 0.02, G + 0.545, 0.16, 0.14, outline=0.004)
for sx in (-1, 1):
    for sy in (-1, 1):
        lathe(f'ptowerpin{sx}{sy}', M['white'], ((0.014, 0), (0.004, 0.08)), G + 0.545, sx * 0.07, PY - 0.02 + sy * 0.07, segs=6, outline=0.001, smooth=False)
for s in (-1, 1):
    box(f'turret{s}', M['white'], s * 0.42, PY - 0.08, G - 0.005, 0.1, 0.1, 0.36, outline=0.006, bevel=0)
    pyramid(f'turretroof{s}', M['slate'], s * 0.42, PY - 0.08, G + 0.355, 0.11, 0.12, outline=0.003)
    box(f'gable{s}', M['white'], s * 0.2, PY - 0.12, G + 0.275, 0.1, 0.03, 0.08, outline=0.003, bevel=0)

# ---------- the fountain ----------
FX, FY = 0.0, -0.22
lathe('basin', M['marbleDark'], ((0.4, 0), (0.4, 0.05)), G - 0.005, FX, FY, segs=32, outline=0.005)
lathe('basinwater', M['water'], ((0.38, 0), (0.38, 0.055)), G - 0.005, FX, FY, segs=32, outline=0)
lathe('rocks', M['marbleDark'], ((0.16, 0), (0.13, 0.06), (0.1, 0.09)), G + 0.04, FX, FY + 0.06, segs=10, outline=0.004, smooth=False)
Z = G + 0.13
# the chariot
box('chariot', M['marble'], FX, FY + 0.08, Z - 0.005, 0.14, 0.16, 0.08, outline=0.004, bevel=0)
for s in (-1, 1):
    cyl(f'wheel{s}', M['marbleDark'], 0.06, 0.02, segs=18, outline=0.003, matrix=Matrix.Translation((FX + s * 0.08, FY + 0.08, Z + 0.03)) @ Matrix.Rotation(math.pi / 2, 4, 'Y'))
# the goddess
lathe('goddess', M['marble'], ((0.055, 0), (0.05, 0.06), (0.035, 0.13), (0.02, 0.15)), Z + 0.07, FX, FY + 0.1, segs=12, outline=0.004)
ball('goddesshead', M['marble'], FX, FY + 0.1, Z + 0.245, 0.026, outline=0.002)
lathe('crown', M['marble'], ((0.026, 0), (0.03, 0.035)), Z + 0.258, FX, FY + 0.1, segs=8, outline=0.002, smooth=False)
rod('sceptre', M['marble'], (FX + 0.05, FY + 0.08, Z + 0.1), (FX + 0.07, FY + 0.06, Z + 0.28), 0.006, segs=6, outline=0.001)
bar('key', M['marble'], (FX - 0.045, FY + 0.07, Z + 0.16), (FX - 0.07, FY + 0.04, Z + 0.14), 0.01, outline=0.001)
# the two lions
for s in (-1, 1):
    lx, ly = FX + s * 0.05, FY - 0.08
    b = ball(f'lionbody{s}', M['marble'], 0, 0, 0, 0.05, outline=0.004)
    b.scale = (0.7, 1.4, 0.75)
    b.location = (lx, ly, Z + 0.03)
    ball(f'lionmane{s}', M['marbleDark'], lx, ly - 0.06, Z + 0.07, 0.035, outline=0.003)
    ball(f'lionhead{s}', M['marble'], lx, ly - 0.085, Z + 0.075, 0.024, outline=0.002)
    for fy in (-1, 1):
        rod(f'lionleg{s}{fy}', M['marble'], (lx, ly + fy * 0.045, Z - 0.03), (lx, ly + fy * 0.045, Z + 0.02), 0.012, segs=6, outline=0.001)

for k, (x, y, r) in enumerate(((-0.75, -0.2, 0.12), (0.75, -0.25, 0.12), (-0.55, -0.7, 0.1), (0.55, -0.7, 0.1))):
    ball(f'tree{k}', M['tree'], x, y, G + r * 1.1, r, outline=0.008)
for s in (-1, 1):
    box(f'lawn{s}', M['lawn'], s * 0.75, 0.2, G - 0.003, 0.3, 0.3, 0.008, outline=0.002, bevel=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
