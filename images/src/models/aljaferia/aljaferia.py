# A cartoon Aljafería for the country maps, built in the set's shared look (../toon.py): Zaragoza's
# fortified Moorish palace, its square walls of brick and stone with the round towers all round, the
# tall square Troubadour Tower, the dry moat and the bridge to the gate, and inside the courtyard of
# Santa Isabel with its interlaced horseshoe arches round the garden pool. Turned a little towards the
# camera.
# Run: blender -b --factory-startup -P aljaferia.py -- aljaferia-1024.png 1024 aljaferia.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#8ac05a', shadow_mul=(0.72, 0.8, 0.74), lift=0.2),
    'moat': toon('moat', '#6aa84a'),
    'brick': toon('brick', '#c88a5a', shadow_mul=(0.86, 0.8, 0.76), lift=0.08),
    'brickDark': toon('brickDark', '#a8704a'),
    'stone': toon('stone', '#e0d0b0', lift=0.12),
    'dark': flat('dark', '#2e2622'),
    'water': toon('water', '#4a9ac8', lift=0.3),
    'orange': toon('orange', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'roof': toon('roof', '#c4603e'),
})

G = tile(M['grass'])
before = set(bpy.data.objects)

CX, CY = 0.0, 0.1
S = 0.9            # the walls' square
WH = 0.22
box('moatfloor', M['moat'], CX, CY, G - 0.004, S + 0.3, S + 0.3, 0.01, outline=0.002, bevel=0)
for k in range(4):
    a = k * math.pi / 2
    nx, ny = round(math.cos(a)), round(math.sin(a))
    x, y = CX + nx * S / 2, CY + ny * S / 2
    box(f'wall{k}', M['brick'], x, y, G - 0.005, 0.07 if nx else S, S if nx else 0.07, WH, outline=0.007, bevel=0)
    box(f'wallbase{k}', M['stone'], x, y, G - 0.005, 0.09 if nx else S + 0.02, S + 0.02 if nx else 0.09, 0.06, outline=0.003, bevel=0)
    for j in range(5):
        t = -S / 2 + (j + 0.5) * S / 5
        tx, ty = x + (0 if nx else t), y + (t if nx else 0)
        lathe(f'tower{k}{j}', M['brick'], ((0.055, 0), (0.05, WH + 0.04)), G - 0.005, tx + nx * 0.03, ty + ny * 0.03, segs=14, outline=0.004)
        for m in range(4):
            b = 2 * math.pi * m / 4
            box(f'merlon{k}{j}{m}', M['brickDark'], tx + nx * 0.03 + 0.04 * math.cos(b), ty + ny * 0.03 + 0.04 * math.sin(b), G + WH + 0.03, 0.02, 0.02, 0.03, outline=0.001, bevel=0)
# the corner towers, bigger
for sx in (-1, 1):
    for sy in (-1, 1):
        lathe(f'cornertower{sx}{sy}', M['brick'], ((0.075, 0), (0.07, WH + 0.07)), G - 0.005, CX + sx * S / 2, CY + sy * S / 2, segs=16, outline=0.005)
# the gate and the bridge over the moat
box('gate', M['stone'], CX, CY - S / 2 - 0.02, G - 0.005, 0.14, 0.1, WH + 0.06, outline=0.005, bevel=0)
box('gatedoor', M['dark'], CX, CY - S / 2 - 0.072, G - 0.005, 0.06, 0.006, 0.12, outline=0, bevel=0)
cyl('gatedoortop', M['dark'], 0.03, 0.006, segs=12, outline=0, matrix=Matrix.Translation((CX, CY - S / 2 - 0.072, G + 0.115)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
box('bridge', M['stone'], CX, CY - S / 2 - 0.2, G + 0.01, 0.1, 0.26, 0.03, outline=0.003, bevel=0)

# ---------- the Troubadour Tower ----------
TX, TY = CX - 0.28, CY + 0.25
box('troubadour', M['brick'], TX, TY, G - 0.005, 0.18, 0.18, 0.55, outline=0.008, bevel=0)
for k in range(3):
    box(f'troubadourwin{k}', M['dark'], TX, TY - 0.093, G + 0.15 + k * 0.13, 0.03, 0.006, 0.06, outline=0, bevel=0)
for j in range(4):
    for s in (-1, 1):
        box(f'troubadourmerlon{j}{s}', M['brickDark'], TX - 0.07 + j * 0.047, TY + s * 0.08, G + 0.545, 0.025, 0.02, 0.035, outline=0.001, bevel=0)

# ---------- the courtyard of Santa Isabel with its interlaced arches ----------
box('courtyard', M['stone'], CX + 0.08, CY - 0.02, G - 0.004, 0.5, 0.36, 0.012, outline=0.001, bevel=0)
box('pool', M['water'], CX + 0.08, CY - 0.02, G + 0.004, 0.16, 0.08, 0.008, outline=0, bevel=0)
for s in (-1, 1):
    box(f'palacewing{s}', M['stone'], CX + 0.08, CY - 0.02 + s * 0.22, G - 0.005, 0.5, 0.1, 0.18, outline=0.005, bevel=0)
    for j in range(6):
        x = CX + 0.08 - 0.2 + j * 0.08
        y = CY - 0.02 + s * 0.22 - s * 0.053
        box(f'arch{s}{j}', M['dark'], x, y, G - 0.005, 0.05, 0.006, 0.09, outline=0, bevel=0)
        cyl(f'archtop{s}{j}', M['dark'], 0.03, 0.006, segs=12, outline=0, matrix=Matrix.Translation((x, y, G + 0.085)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    loft(f'palaceroof{s}', M['roof'], [[(CX - 0.17, CY - 0.02 + s * 0.22 - 0.055, G + 0.175), (CX + 0.33, CY - 0.02 + s * 0.22 - 0.055, G + 0.175), (CX + 0.33, CY - 0.02 + s * 0.22 + 0.055, G + 0.175), (CX - 0.17, CY - 0.02 + s * 0.22 + 0.055, G + 0.175)],
                                       [(CX - 0.17, CY - 0.02 + s * 0.22 - 0.003, G + 0.22), (CX + 0.33, CY - 0.02 + s * 0.22 - 0.003, G + 0.22), (CX + 0.33, CY - 0.02 + s * 0.22 + 0.003, G + 0.22), (CX - 0.17, CY - 0.02 + s * 0.22 + 0.003, G + 0.22)]], outline=0.003)
for k, (x, y) in enumerate(((-0.05, -0.05), (0.2, 0.0))):
    ball(f'orangetree{k}', M['orange'], CX + x, CY + y, G + 0.07, 0.05, outline=0.006)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
