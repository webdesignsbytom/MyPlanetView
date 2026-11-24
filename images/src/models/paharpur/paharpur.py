# A cartoon Paharpur for the country maps, built in the set's shared look (../toon.py): Somapura
# Mahavihara in Bangladesh, the great Buddhist monastery of the Pala kings, its huge square of
# monks' cells in red brick round the green courtyard, the gateway in the middle of its front, and in
# the middle of the courtyard the great terraced temple rising in three cross-shaped tiers to the
# shrine on top. Turned a little towards the camera.
# Run: blender -b --factory-startup -P paharpur.py -- paharpur-1024.png 1024 paharpur.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'brick': toon('brick', '#b8603e', shadow_mul=(0.8, 0.74, 0.78), lift=0.12),
    'brickDark': toon('brickDark', '#9a4a30'),
    'dark': flat('dark', '#2e2420'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['grass'])
before = set(bpy.data.objects)

# ---------- the square of cells ----------
S, T = 0.76, 0.1
for k, (x, y, sx, sy) in enumerate(((0, S, 2 * S + T, T), (-S, 0, T, 2 * S), (S, 0, T, 2 * S))):
    box(f'cells{k}', M['brick'], x, y, G - 0.005, sx, sy, 0.07, outline=0.004, bevel=0)
for s in (-1, 1):
    box(f'frontcells{s}', M['brick'], s * (S / 2 + 0.06), -S, G - 0.005, S - 0.12, T, 0.07, outline=0.004, bevel=0)
box('gateway', M['brickDark'], 0.0, -S - 0.02, G - 0.005, 0.12, 0.16, 0.1, outline=0.004, bevel=0)
box('gatewaydoor', M['dark'], 0.0, -S - 0.103, G - 0.005, 0.05, 0.006, 0.07, outline=0, bevel=0)
for j in range(12):
    t = -S + 0.08 + j * (2 * S - 0.16) / 11
    box(f'backcell{j}', M['dark'], t, S - T / 2 - 0.004, G + 0.01, 0.035, 0.006, 0.04, outline=0, bevel=0)
    box(f'leftcell{j}', M['dark'], -S + T / 2 + 0.004, t, G + 0.01, 0.006, 0.035, 0.04, outline=0, bevel=0)
    box(f'rightcell{j}', M['dark'], S - T / 2 - 0.004, t, G + 0.01, 0.006, 0.035, 0.04, outline=0, bevel=0)

# ---------- the cross-shaped terraced temple ----------
TIERS = ((0.62, 0.3, 0.1), (0.46, 0.22, 0.1), (0.3, 0.15, 0.1))
z = G - 0.005
for k, (arm, core, h) in enumerate(TIERS):
    box(f'tierx{k}', M['brick'], 0.0, 0.0, z, arm, core, h, outline=0.006, bevel=0)
    box(f'tiery{k}', M['brick'], 0.0, 0.0, z, core, arm, h, outline=0.006, bevel=0)
    box(f'tiercore{k}', M['brick'], 0.0, 0.0, z, core + 0.1, core + 0.1, h, outline=0.006, bevel=0)
    for b in range(2):
        box(f'band{k}{b}', M['brickDark'], 0.0, 0.0, z + 0.025 + b * 0.04, arm + 0.006, core + 0.006, 0.012, outline=0, bevel=0)
        box(f'bandy{k}{b}', M['brickDark'], 0.0, 0.0, z + 0.025 + b * 0.04, core + 0.006, arm + 0.006, 0.012, outline=0, bevel=0)
    z += h
box('shrine', M['brick'], 0.0, 0.0, z, 0.12, 0.12, 0.08, outline=0.004, bevel=0)
box('shrinedoor', M['dark'], 0.0, -0.063, z, 0.035, 0.006, 0.05, outline=0, bevel=0)
for i in range(6):
    box(f'stair{i}', M['brickDark'], 0.0, -0.31 - 0.02 + i * 0.03, G - 0.005, 0.06, 0.03, 0.05 * (i + 1), outline=0.001, bevel=0)

for k, (x, y) in enumerate(((-0.45, -0.45), (0.45, -0.45), (-0.5, 0.45), (0.5, 0.45), (0.98, -0.3), (-0.98, 0.25))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.12, 0.09 if abs(x) < 0.9 else 0.11, outline=0.01)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
