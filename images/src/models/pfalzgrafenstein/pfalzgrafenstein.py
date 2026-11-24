# A cartoon Pfalzgrafenstein Castle for the country maps, built in the set's shared look
# (../toon.py): the old toll castle like a stone ship on its island in the middle of the Rhine, its
# white walls with the pointed bow upstream, the pentagonal keep with its baroque cap, the little
# turrets and the red-roofed gallery, the river round it with a barge, and the steep vineyards of the
# Rhine gorge on the banks with Gutenfels Castle above. Turned a little towards the camera.
# Run: blender -b --factory-startup -P pfalzgrafenstein.py -- pfalzgrafenstein-1024.png 1024 pfalzgrafenstein.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'river': toon('river', '#4a8aa0', shadow_mul=(0.78, 0.86, 0.9), lift=0.3),
    'white': toon('white', '#f2eee4', shadow_mul=(0.82, 0.84, 0.9), lift=0.2),
    'stone': toon('stone', '#b8ae98'),
    'roof': toon('roof', '#c4503e'),
    'slate': toon('slate', '#4a4e58', shadow_mul=(0.84, 0.86, 0.92)),
    'dark': flat('dark', '#2e2a2a'),
    'vine': toon('vine', '#6a9a3a', shadow_mul=(0.72, 0.8, 0.74)),
    'vineRow': toon('vineRow', '#4f7a2e'),
    'rock': toon('rock', '#9a8a78'),
    'barge': toon('barge', '#2a2a30'),
    'red': toon('red', '#c83a30'),
})

G = tile(M['river'])
before = set(bpy.data.objects)
rng = random.Random(1327)

# ---------- the vineyard slopes on both banks (the river runs front to back) ----------
for s in (-1, 1):
    for j in range(8):
        y0, y1 = -1.25 + j * 0.32, -1.25 + (j + 1) * 0.32
        xin = 0.62
        xo0 = math.sqrt(max(0.0, 1.4 ** 2 - y0 * y0))
        xo1 = math.sqrt(max(0.0, 1.4 ** 2 - y1 * y1))
        if xo0 < xin + 0.05 or xo1 < xin + 0.05:
            continue
        quad = [(s * xin, y0), (s * xo0, y0), (s * xo1, y1), (s * xin, y1)]
        top = [(s * xin, y0, G + 0.01), (s * xo0, y0, G + 0.01 + 0.3 * (xo0 - xin) / (1.4 - xin)), (s * xo1, y1, G + 0.01 + 0.3 * (xo1 - xin) / (1.4 - xin)), (s * xin, y1, G + 0.01)]
        bank = loft(f'bank{s}{j}', M['vine'], [[(x, y, G - 0.01) for x, y in quad], top], outline=0.006)
        bank.visible_shadow = False
        for r in range(3):
            t = (r + 0.5) / 3
            x = s * (xin + (min(xo0, xo1) - xin) * t)
            z = G + 0.01 + 0.3 * (abs(x) - xin) / (1.4 - xin)
            bar(f'vinerow{s}{j}{r}', M['vineRow'], (x, y0 + 0.02, z + 0.012), (x, y1 - 0.02, z + 0.012), 0.014, outline=0)
# Gutenfels Castle on the right bank's hill
box('gutenfels', M['stone'], 0.95, 0.45, G + 0.15, 0.16, 0.14, 0.14, outline=0.004, bevel=0)
box('gutenfelskeep', M['stone'], 0.95, 0.45, G + 0.15, 0.07, 0.07, 0.26, outline=0.004, bevel=0)

# ---------- the castle on its rock in mid-river (built at 1, then grown) ----------
CX, CY = 0.0, 0.05
castle = set(bpy.data.objects)
rock = [(0.18 * math.cos(2 * math.pi * k / 16), CY + 0.42 * math.sin(2 * math.pi * k / 16)) for k in range(16)]
loft('islandrock', M['rock'], [[(x * 1.1, CY + (y - CY) * 1.05, G - 0.01) for x, y in rock], [(x, y, G + 0.03) for x, y in rock]], outline=0.005)
# the walls: a long hexagon, pointed at the upstream (back) end like a ship's bow
hull = [(-0.13, CY - 0.3), (0.13, CY - 0.3), (0.15, CY + 0.15), (0.0, CY + 0.38), (-0.15, CY + 0.15)]
W0, WH = G + 0.03, 0.2
loft('walls', M['white'], [[(x, y, W0) for x, y in hull], [(x, y, W0 + WH) for x, y in hull]], outline=0.008)
inner = [(x * 0.82, CY + (y - CY) * 0.86) for x, y in hull]
loft('gallery', M['roof'], [[(x, y, W0 + WH - 0.005) for x, y in hull], [(x, y, W0 + WH + 0.06) for x, y in inner]], outline=0.004)
for k in range(5):
    box(f'gunport{k}', M['dark'], -0.09 + k * 0.045, CY - 0.303, W0 + 0.1, 0.02, 0.006, 0.03, outline=0, bevel=0)
# the corner turrets
for k, (x, y) in enumerate(((-0.13, CY - 0.3), (0.13, CY - 0.3), (0.15, CY + 0.15), (-0.15, CY + 0.15))):
    lathe(f'turret{k}', M['white'], ((0.035, 0), (0.035, WH + 0.06)), W0, x, y, segs=12, outline=0.003)
    lathe(f'turretcap{k}', M['slate'], ((0.042, 0), (0.003, 0.09)), W0 + WH + 0.06, x, y, segs=12, outline=0.002)
# the keep: pentagonal, with its tiered baroque cap
KX, KY = CX, CY + 0.05
lathe('keep', M['white'], ((0.1, 0), (0.1, 0.48)), W0, KX, KY, segs=5, outline=0.007, smooth=False)
for k in range(3):
    box(f'keepwin{k}', M['dark'], KX, KY - 0.083, W0 + 0.28 + k * 0.06, 0.02, 0.006, 0.035, outline=0, bevel=0)
lathe('keepcap', M['slate'], ((0.105, 0), (0.07, 0.06), (0.05, 0.07), (0.05, 0.1), (0.03, 0.14), (0.003, 0.2)), W0 + 0.475, KX, KY, segs=10, outline=0.004)
rod('keepfinial', M['slate'], (KX, KY, W0 + 0.67), (KX, KY, W0 + 0.72), 0.004, segs=4, outline=0)

bpy.context.view_layer.update()
grow = Matrix.Translation((CX, CY, G)) @ Matrix.Scale(1.35, 4) @ Matrix.Translation((-CX, -CY, -G))
for o in set(bpy.data.objects) - castle:
    o.matrix_world = grow @ o.matrix_world

# ---------- a barge on the Rhine ----------
BX, BY = -0.38, -0.85
box('barge', M['barge'], BX, BY, G - 0.005, 0.12, 0.5, 0.04, outline=0.004, bevel=0)
box('bargecabin', M['white'], BX, BY + 0.2, G + 0.03, 0.1, 0.08, 0.05, outline=0.003, bevel=0)
box('bargestripe', M['red'], BX, BY, G + 0.03, 0.12, 0.4, 0.006, outline=0, bevel=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
