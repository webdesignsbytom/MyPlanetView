# A cartoon Palacio de Bellas Artes for the country maps, built in the set's shared look (../toon.py):
# Mexico City's white marble palace of the arts, its Art Nouveau front with the great arched entrance
# and its sculpture groups, the big central dome tiled in orange and yellow with the eagle on top and
# the smaller domes round it, and the Alameda's paving and fountains before it. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P bellas-artes.py -- bellas-artes-1024.png 1024 bellas-artes.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d8d0c0', shadow_mul=(0.82, 0.8, 0.88), lift=0.2),
    'marble': toon('marble', '#f4efe4', shadow_mul=(0.84, 0.84, 0.9), lift=0.2),
    'marbleDark': toon('marbleDark', '#d8d0c0'),
    'orange': toon('orange', '#e8843a', shadow_mul=(0.86, 0.78, 0.7), lift=0.15),
    'yellow': toon('yellow', '#f0c040', lift=0.2),
    'dark': flat('dark', '#2e2a2e'),
    'bronze': toon('bronze', '#4a6a5a', lift=0.1),
    'water': toon('water', '#4a9ac8', lift=0.3),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a4a36'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)

PX, PY = 0.0, 0.28
W, D, H = 0.9, 0.62, 0.3
# ---------- the palace ----------
box('palace', M['marble'], PX, PY, G - 0.005, W, D, H, outline=0.009, bevel=0)
box('plinth', M['marbleDark'], PX, PY, G - 0.005, W + 0.02, D + 0.02, 0.04, outline=0.003, bevel=0)
box('cornice', M['marbleDark'], PX, PY, G + H - 0.02, W + 0.03, D + 0.03, 0.025, outline=0.003, bevel=0)
FY = PY - D / 2
# the front's projecting centre with the great arch
box('centre', M['marble'], PX, FY - 0.04, G - 0.005, 0.34, 0.08, H + 0.08, outline=0.007, bevel=0)
box('arch', M['dark'], PX, FY - 0.083, G + 0.03, 0.12, 0.006, 0.16, outline=0, bevel=0)
cyl('archtop', M['dark'], 0.06, 0.006, segs=16, outline=0, matrix=Matrix.Translation((PX, FY - 0.083, G + 0.19)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
box('archframe', M['marbleDark'], PX, FY - 0.081, G + 0.03, 0.16, 0.004, 0.24, outline=0, bevel=0)
for s in (-1, 1):
    rod(f'centrecol{s}', M['marbleDark'], (PX + s * 0.13, FY - 0.085, G + 0.03), (PX + s * 0.13, FY - 0.085, G + H + 0.04), 0.014, segs=8, outline=0.002)
    # the sculpture groups on the corners of the centre and the pegasus horses on the plinths
    for f in range(2):
        rod(f'group{s}{f}', M['marble'], (PX + s * (0.13 + f * 0.03), FY - 0.09, G + H + 0.075), (PX + s * (0.13 + f * 0.03), FY - 0.09, G + H + 0.14 - f * 0.02), 0.012, segs=6, outline=0.002)
        ball(f'grouphead{s}{f}', M['marble'], PX + s * (0.13 + f * 0.03), FY - 0.09, G + H + 0.15 - f * 0.02, 0.01, outline=0.001)
    box(f'pegasusplinth{s}', M['marbleDark'], PX + s * 0.38, FY - 0.18, G - 0.005, 0.08, 0.08, 0.1, outline=0.003, bevel=0)
    horse = ball(f'pegasus{s}', M['bronze'], 0, 0, 0, 0.03, outline=0.003)
    horse.scale = (0.8, 1.5, 0.9)
    horse.location = (PX + s * 0.38, FY - 0.18, G + 0.15)
    rod(f'pegasusneck{s}', M['bronze'], (PX + s * 0.38, FY - 0.22, G + 0.16), (PX + s * 0.38, FY - 0.24, G + 0.21), 0.011, segs=6, outline=0.002)
    for fy in (-1, 1):
        bar(f'pegasuswing{s}{fy}', M['bronze'], (PX + s * 0.38, FY - 0.18, G + 0.17), (PX + s * 0.38 + fy * 0.05, FY - 0.16, G + 0.22), 0.012, outline=0.001)
# the front's windows either side
for s in (-1, 1):
    for j in range(2):
        x = PX + s * (0.24 + j * 0.1)
        box(f'win{s}{j}', M['dark'], x, FY - 0.003, G + 0.08, 0.05, 0.006, 0.12, outline=0, bevel=0)
        cyl(f'wintop{s}{j}', M['dark'], 0.025, 0.006, segs=10, outline=0, matrix=Matrix.Translation((x, FY - 0.003, G + 0.2)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))

# ---------- the domes ----------


def tiled_dome(name, x, y, z, r, h):
    lathe(name, M['orange'], ((r, 0), (r * 0.96, h * 0.35), (r * 0.78, h * 0.7), (r * 0.42, h * 0.95), (0.004, h)), z, x, y, segs=24, outline=0.006)
    for k in range(8):
        a = 2 * math.pi * k / 8
        pts = [(x + rr * math.cos(a), y + rr * math.sin(a), z + hh + 0.004) for rr, hh in ((r * 1.005, 0), (r * 0.97, h * 0.35), (r * 0.79, h * 0.7), (r * 0.43, h * 0.95))]
        for j, (p, q) in enumerate(zip(pts, pts[1:])):
            bar(f'{name}rib{k}{j}', M['yellow'], p, q, 0.012, outline=0)


DZ = G + H + 0.02
lathe('drum', M['marble'], ((0.2, 0), (0.2, 0.08)), DZ - 0.005, PX, PY + 0.04, segs=24, outline=0.006)
tiled_dome('maindome', PX, PY + 0.04, DZ + 0.07, 0.2, 0.26)
lathe('lantern', M['yellow'], ((0.035, 0), (0.035, 0.04), (0.02, 0.06)), DZ + 0.33, PX, PY + 0.04, segs=12, outline=0.002)
# the eagle on top, wings spread
EZ = DZ + 0.39
ball('eagle', M['bronze'], PX, PY + 0.04, EZ + 0.02, 0.018, outline=0.002)
for s in (-1, 1):
    bar(f'eaglewing{s}', M['bronze'], (PX, PY + 0.04, EZ + 0.025), (PX + s * 0.05, PY + 0.04, EZ + 0.06), 0.012, outline=0.001)
for sx in (-1, 1):
    for sy in (-1, 1):
        x, y = PX + sx * 0.3, PY + sy * 0.2
        lathe(f'smalldrum{sx}{sy}', M['marble'], ((0.06, 0), (0.06, 0.04)), DZ - 0.005, x, y, segs=16, outline=0.003)
        tiled_dome(f'smalldome{sx}{sy}', x, y, DZ + 0.035, 0.06, 0.08)

# the palace grown to fill its tile
bpy.context.view_layer.update()
grow = Matrix.Translation((0, 0.15, G)) @ Matrix.Scale(1.3, 4) @ Matrix.Translation((0, -0.15, -G))
for o in set(bpy.data.objects) - before:
    o.matrix_world = grow @ o.matrix_world
bpy.context.view_layer.update()

# ---------- the Alameda in front ----------
for s in (-1, 1):
    lathe(f'fountain{s}', M['marbleDark'], ((0.12, 0), (0.12, 0.03), (0.1, 0.03)), G - 0.004, s * 0.5, -0.72, segs=20, outline=0.003)
    lathe(f'fountainwater{s}', M['water'], ((0.105, 0), (0.105, 0.025)), G - 0.002, s * 0.5, -0.72, segs=20, outline=0)
    rod(f'fountainjet{s}', M['marble'], (s * 0.5, -0.72, G), (s * 0.5, -0.72, G + 0.08), 0.01, segs=6, outline=0.001)
for k, (x, y) in enumerate(((-0.98, -0.3), (0.98, -0.3), (-0.8, -0.85), (0.8, -0.85), (-1.0, 0.45), (1.0, 0.45))):
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.07), 0.013, segs=6, outline=0.002)
    ball(f'tree{k}', M['tree'], x, y, G + 0.15, 0.1, outline=0.012)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
