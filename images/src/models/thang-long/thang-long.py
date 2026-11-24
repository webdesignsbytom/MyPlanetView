# A cartoon Thang Long for the country maps, built in the set's shared look (../toon.py): the Imperial
# Citadel in Hanoi, the Doan Mon gate with its five arched passages through the long stone base and
# the pavilion with its two tiers of curving tiled roofs on top, and beside it the Hanoi Flag Tower
# standing on its three stepped square bases, the tall hexagonal brick tower with the red flag and
# its yellow star flying from the top, among the citadel's old trees. Turned a little towards the
# camera.
# Run: blender -b --factory-startup -P thang-long.py -- thang-long-1024.png 1024 thang-long.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'paving': toon('paving', '#d6cfc0', shadow_mul=(0.84, 0.84, 0.9), lift=0.2),
    'stone': toon('stone', '#d8cca8', shadow_mul=(0.82, 0.8, 0.86), lift=0.15),
    'brick': toon('brick', '#a8806a', shadow_mul=(0.8, 0.76, 0.8)),
    'red': toon('red', '#c03a2e', lift=0.15),
    'yellow': toon('yellow', '#f0d040', lift=0.25),
    'wood': toon('wood', '#a8402e'),
    'roof': toon('roof', '#8a5a4a', shadow_mul=(0.8, 0.78, 0.84)),
    'dark': flat('dark', '#2e2a2a'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['grass'])
before = set(bpy.data.objects)

box('square', M['paving'], -0.25, -0.35, G - 0.004, 1.0, 0.5, 0.01, outline=0.001, bevel=0)

# ---------- Doan Mon: the gate's base and its five passages ----------
DX, DY = -0.3, 0.0
W, D, H = 0.86, 0.22, 0.2
box('gatebase', M['stone'], DX, DY, G - 0.005, W, D, H, outline=0.007, bevel=0)
for k, (dx, w) in enumerate(((-0.3, 0.06), (-0.15, 0.07), (0.0, 0.09), (0.15, 0.07), (0.3, 0.06))):
    box(f'passage{k}', M['dark'], DX + dx, DY - D / 2 - 0.004, G - 0.005, w, 0.006, 0.08 + w * 0.6, outline=0, bevel=0)
    cyl(f'passagetop{k}', M['dark'], w / 2, 0.006, segs=12, outline=0, matrix=Matrix.Translation((DX + dx, DY - D / 2 - 0.004, G + 0.075 + w * 0.6)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
box('parapet', M['stone'], DX, DY, G + H - 0.005, W + 0.02, D + 0.02, 0.025, outline=0.003, bevel=0)
# the pavilion on top, with its two tiers of curving roofs
PZ = G + H + 0.02
box('pavilion', M['wood'], DX, DY, PZ, 0.36, 0.14, 0.09, outline=0.005, bevel=0)
for k in range(7):
    rod(f'pavilionpillar{k}', M['wood'], (DX - 0.18 + k * 0.06, DY - 0.08, PZ), (DX - 0.18 + k * 0.06, DY - 0.08, PZ + 0.09), 0.008, segs=8, outline=0.001)


def curved_roof(name, x, y, z0, hx, hy, h, flare):
    loft(name, M['roof'], [[(x - hx - flare, y - hy - flare, z0 + 0.012), (x + hx + flare, y - hy - flare, z0 + 0.012), (x + hx + flare, y + hy + flare, z0 + 0.012), (x - hx - flare, y + hy + flare, z0 + 0.012)],
                           [(x - hx, y - hy, z0 + h * 0.3), (x + hx, y - hy, z0 + h * 0.3), (x + hx, y + hy, z0 + h * 0.3), (x - hx, y + hy, z0 + h * 0.3)],
                           [(x - hx + 0.05, y - 0.006, z0 + h), (x + hx - 0.05, y - 0.006, z0 + h), (x + hx - 0.05, y + 0.006, z0 + h), (x - hx + 0.05, y + 0.006, z0 + h)]], outline=0.005)
    for sx in (-1, 1):
        for sy in (-1, 1):
            rod(f'{name}tip{sx}{sy}', M['roof'], (x + sx * (hx + flare), y + sy * (hy + flare), z0 + 0.012), (x + sx * (hx + flare + 0.025), y + sy * (hy + flare + 0.025), z0 + 0.045), 0.008, r2=0.003, segs=6, outline=0.001)


curved_roof('lowerroof', DX, DY, PZ + 0.085, 0.2, 0.09, 0.05, 0.03)
box('upperstorey', M['wood'], DX, DY, PZ + 0.12, 0.24, 0.09, 0.06, outline=0.004, bevel=0)
curved_roof('upperroof', DX, DY, PZ + 0.175, 0.15, 0.06, 0.1, 0.03)
box('ridge', M['roof'], DX, DY, PZ + 0.27, 0.22, 0.02, 0.015, outline=0.002, bevel=0)

# ---------- the Flag Tower ----------
FX, FY = 0.5, 0.3
for k, (w, h) in enumerate(((0.42, 0.08), (0.32, 0.08), (0.22, 0.08))):
    box(f'flagbase{k}', M['brick'], FX, FY, G - 0.005 + k * 0.08, w, w, h + 0.005, outline=0.005, bevel=0)
    box(f'flagbasewall{k}', M['stone'], FX, FY, G + 0.075 + k * 0.08, w + 0.01, w + 0.01, 0.012, outline=0.001, bevel=0)
box('flagdoor', M['dark'], FX, FY - 0.213, G - 0.005, 0.05, 0.006, 0.06, outline=0, bevel=0)
TZ = G + 0.24
lathe('flagtower', M['brick'], ((0.07, 0), (0.06, 0.4)), TZ, FX, FY, segs=6, outline=0.005, smooth=False)
for k in range(5):
    z = 0.06 + k * 0.07
    apothem = (0.07 - 0.01 * z / 0.4) * math.cos(math.pi / 6)
    box(f'flagwin{k}', M['dark'], FX, FY - apothem - 0.003, TZ + z, 0.015, 0.006, 0.025, outline=0, bevel=0)
lathe('lookout', M['stone'], ((0.085, 0), (0.085, 0.05)), TZ + 0.395, FX, FY, segs=6, outline=0.003, smooth=False)
lathe('lookoutroof', M['brick'], ((0.04, 0), (0.04, 0.04), (0.003, 0.06)), TZ + 0.44, FX, FY, segs=6, outline=0.002, smooth=False)
rod('flagpole', M['dark'], (FX, FY, TZ + 0.5), (FX, FY, TZ + 0.68), 0.005, segs=6, outline=0)
box('flag', M['red'], FX - 0.065, FY, TZ + 0.6, 0.12, 0.006, 0.075, outline=0.002, bevel=0)
pyramid('star', M['yellow'], FX - 0.065, FY - 0.006, TZ + 0.625, 0.025, 0.025, outline=0)

for k, (x, y) in enumerate(((-0.85, 0.35), (-0.4, 0.55), (0.1, 0.65), (0.9, -0.2), (0.6, -0.65), (-0.9, -0.45))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.14, 0.12, outline=0.012)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
