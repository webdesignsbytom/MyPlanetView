# A cartoon Two Towers of Bologna for the country maps, built in the set's shared look (../toon.py):
# the tall slender Asinelli tower and the short Garisenda leaning beside it, both of brick with their
# narrow windows and battlements, over the red porticoed streets of the old city with their long
# arcades, terracotta roofs and a church's bell tower. Turned a little towards the camera.
# Run: blender -b --factory-startup -P bologna-towers.py -- bologna-towers-1024.png 1024 bologna-towers.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#c8bca8', shadow_mul=(0.82, 0.8, 0.86), lift=0.2),
    'brick': toon('brick', '#b8704a', shadow_mul=(0.86, 0.78, 0.76), lift=0.06),
    'brickDark': toon('brickDark', '#985a3a'),
    'red': toon('red', '#c45a3e', lift=0.08),
    'ochre': toon('ochre', '#e0a060', lift=0.1),
    'cream': toon('cream', '#f0dcb8', lift=0.1),
    'roof': toon('roof', '#b8503a'),
    'dark': flat('dark', '#2e2622'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)
rng = random.Random(1119)

# ---------- the Asinelli tower ----------
AX, AY = -0.08, 0.12
AS, AH = 0.14, 1.25
box('asinellibase', M['brickDark'], AX, AY, G - 0.005, AS + 0.08, AS + 0.08, 0.12, outline=0.006, bevel=0)
sq = lambda h, z: [(AX - h, AY - h, z), (AX + h, AY - h, z), (AX + h, AY + h, z), (AX - h, AY + h, z)]
loft('asinelli', M['brick'], [sq(AS / 2, G + 0.11), sq(AS / 2 * 0.9, G + 0.11 + AH)], outline=0.008)
for k in range(12):
    z = G + 0.2 + k * 0.09
    box(f'asinelliwin{k}', M['dark'], AX + (0.012 if k % 2 else -0.012), AY - AS / 2 * (1 - 0.1 * k / 12) - 0.003, z, 0.016, 0.006, 0.035, outline=0, bevel=0)
TZ = G + 0.11 + AH
box('asinellitop', M['brickDark'], AX, AY, TZ - 0.005, AS + 0.04, AS + 0.04, 0.05, outline=0.004, bevel=0)
for sx in (-1, 1):
    for sy in (-1, 1):
        box(f'asinellimerlon{sx}{sy}', M['brickDark'], AX + sx * 0.06, AY + sy * 0.06, TZ + 0.04, 0.03, 0.03, 0.04, outline=0.002, bevel=0)
rod('asinellipole', M['brickDark'], (AX, AY, TZ + 0.04), (AX, AY, TZ + 0.12), 0.004, segs=4, outline=0)

# ---------- the Garisenda, short and leaning hard ----------
GX, GY = 0.14, 0.1
GS, GH = 0.15, 0.48
gar = set(bpy.data.objects)
box('garisendabase', M['brickDark'], 0, 0, 0, GS + 0.06, GS + 0.06, 0.1, outline=0.006, bevel=0)
box('garisenda', M['brick'], 0, 0, 0.095, GS, GS, GH, outline=0.007, bevel=0)
for k in range(4):
    box(f'garisendawin{k}', M['dark'], 0.0, -GS / 2 - 0.003, 0.17 + k * 0.1, 0.018, 0.006, 0.035, outline=0, bevel=0)
box('garisendatop', M['brickDark'], 0, 0, 0.09 + GH, GS + 0.02, GS + 0.02, 0.02, outline=0.002, bevel=0)
bpy.context.view_layer.update()
lean = Matrix.Translation((GX, GY, G - 0.005)) @ Matrix.Rotation(math.radians(5), 4, 'Y')
for o in set(bpy.data.objects) - gar:
    o.matrix_world = lean @ o.matrix_world
bpy.context.view_layer.update()

# ---------- the porticoed streets round them ----------
colours = ('red', 'ochre', 'cream')


def row_of_houses(name, x0, x1, y, facing, h0):
    x = x0
    k = 0
    while x < x1 - 0.05:
        w = min(rng.uniform(0.16, 0.24), x1 - x)
        h = h0 + rng.uniform(0, 0.08)
        cx = x + w / 2
        mat = M[colours[k % 3]]
        box(f'{name}{k}', mat, cx, y, G - 0.005, w - 0.004, 0.2, h, outline=0.005, bevel=0)
        # the portico: arches along the ground floor on the street side
        for j in range(max(1, int(w / 0.07))):
            ax = x + 0.04 + j * 0.07
            if ax > x + w - 0.03:
                break
            box(f'{name}{k}arch{j}', M['dark'], ax, y + facing * 0.103, G - 0.005, 0.04, 0.006, 0.06, outline=0, bevel=0)
            cyl(f'{name}{k}archtop{j}', M['dark'], 0.02, 0.006, segs=8, outline=0, matrix=Matrix.Translation((ax, y + facing * 0.103, G + 0.055)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
        for row in range(2):
            box(f'{name}{k}win{row}', M['dark'], cx, y + facing * 0.103, G + 0.12 + row * 0.07, 0.03, 0.006, 0.04, outline=0, bevel=0)
        loft(f'{name}{k}roof', M['roof'], [[(cx - w / 2, y - 0.105, G + h - 0.005), (cx + w / 2, y - 0.105, G + h - 0.005), (cx + w / 2, y + 0.105, G + h - 0.005), (cx - w / 2, y + 0.105, G + h - 0.005)],
                                           [(cx - w / 2, y - 0.004, G + h + 0.05), (cx + w / 2, y - 0.004, G + h + 0.05), (cx + w / 2, y + 0.004, G + h + 0.05), (cx - w / 2, y + 0.004, G + h + 0.05)]], outline=0.003)
        x += w
        k += 1


row_of_houses('front', -0.95, 0.95, -0.42, -1, 0.2)
row_of_houses('backleft', -1.0, -0.3, 0.62, -1, 0.22)
row_of_houses('backright', 0.4, 1.0, 0.62, -1, 0.22)
# a church's campanile behind
box('campanile', M['brick'], 0.6, 0.95, G - 0.005, 0.1, 0.1, 0.5, outline=0.005, bevel=0)
lathe('campanilecap', M['roof'], ((0.06, 0), (0.003, 0.14)), G + 0.495, 0.6, 0.95, segs=4, outline=0.003, smooth=False)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
