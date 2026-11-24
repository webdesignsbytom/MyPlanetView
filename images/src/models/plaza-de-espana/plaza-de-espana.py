# A cartoon Plaza de España, Seville, for the country maps, built in the set's shared look
# (../toon.py): the great half-circle of red brick round the square, its arcade along the front and its
# tiled roofs, the two tall baroque towers at its ends and the central building, the canal following
# the curve with its little bridges of blue and white tiles, and the fountain in the middle of the
# square. Turned a little towards the camera.
# Run: blender -b --factory-startup -P plaza-de-espana.py -- plaza-de-espana-1024.png 1024 plaza-de-espana.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#e0cca4', shadow_mul=(0.86, 0.82, 0.78), lift=0.2),
    'brick': toon('brick', '#c8704a', shadow_mul=(0.86, 0.78, 0.76), lift=0.06),
    'brickDark': toon('brickDark', '#a8583a'),
    'stone': toon('stone', '#f0e2c4', shadow_mul=(0.86, 0.84, 0.86), lift=0.15),
    'roof': toon('roof', '#c4603e'),
    'water': toon('water', '#4a9ac8', lift=0.3),
    'tileBlue': toon('tileBlue', '#3a6ab8', lift=0.15),
    'white': toon('white', '#f6f4ee', lift=0.2),
    'dark': flat('dark', '#3a2a24'),
    'green': toon('green', '#5a9a4a'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)

CX, CY = 0.0, 0.15   # the half circle's middle; it opens towards the camera
R0, R1 = 0.86, 1.03   # the building's inner and outer radii
H = 0.17


def at(r, a):
    return (CX + r * math.cos(a), CY + r * math.sin(a))


# ---------- the curved building ----------
N = 18
for k in range(N):
    a0 = math.pi * k / N
    a1 = math.pi * (k + 1) / N
    quad = [at(R0, a0), at(R1, a0), at(R1, a1), at(R0, a1)]
    loft(f'wing{k}', M['brick'], [[(x, y, G - 0.005) for x, y in quad], [(x, y, G + H) for x, y in quad]], outline=0.004)
    roof = [at(R0 - 0.01, a0), at(R1 + 0.01, a0), at(R1 + 0.01, a1), at(R0 - 0.01, a1)]
    mid = [at((R0 + R1) / 2 - 0.004, a0), at((R0 + R1) / 2 + 0.004, a0), at((R0 + R1) / 2 + 0.004, a1), at((R0 + R1) / 2 - 0.004, a1)]
    loft(f'wingroof{k}', M['roof'], [[(x, y, G + H - 0.005) for x, y in roof], [(x, y, G + H + 0.05) for x, y in mid]], outline=0.003)
    # the arcade along the inner face
    am = (a0 + a1) / 2
    x, y = at(R0 - 0.004, am)
    arch = box(f'arcade{k}', M['dark'], 0, 0, 0, 0.06, 0.006, 0.07, outline=0, bevel=0)
    win = box(f'window{k}', M['dark'], 0, 0, 0.1, 0.03, 0.006, 0.035, outline=0, bevel=0)
    bpy.context.view_layer.update()
    m = Matrix.Translation((x, y, G)) @ Matrix.Rotation(am - math.pi / 2, 4, 'Z')
    for o in (arch, win):
        o.matrix_world = m @ o.matrix_world
bpy.context.view_layer.update()

# ---------- the towers and the central building ----------
for s in (-1, 1):
    x, y = at((R0 + R1) / 2, 0 if s > 0 else math.pi)
    box(f'tower{s}', M['brick'], x, y, G - 0.005, 0.14, 0.14, 0.5, outline=0.007, bevel=0)
    box(f'towerband{s}', M['stone'], x, y, G + 0.17, 0.145, 0.145, 0.02, outline=0.002, bevel=0)
    for fy in (-1, 1):
        box(f'towerwin{s}{fy}', M['dark'], x, y + fy * 0.072, G + 0.3, 0.04, 0.006, 0.08, outline=0, bevel=0)
    lathe(f'towerlantern{s}', M['stone'], ((0.055, 0), (0.05, 0.08), (0.04, 0.09)), G + 0.495, x, y, segs=8, outline=0.003, smooth=False)
    lathe(f'towerdome{s}', M['tileBlue'], ((0.045, 0), (0.04, 0.04), (0.02, 0.08), (0.004, 0.13)), G + 0.58, x, y, segs=8, outline=0.003, smooth=False)
    rod(f'towerspire{s}', M['white'], (x, y, G + 0.7), (x, y, G + 0.75), 0.004, segs=4, outline=0)
x, y = at((R0 + R1) / 2, math.pi / 2)
box('central', M['brick'], x, y, G - 0.005, 0.34, 0.24, 0.26, outline=0.008, bevel=0)
box('centralgate', M['dark'], x, y - 0.122, G - 0.005, 0.1, 0.006, 0.14, outline=0, bevel=0)
cyl('centralgatetop', M['dark'], 0.05, 0.006, segs=14, outline=0, matrix=Matrix.Translation((x, y - 0.122, G + 0.135)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
loft('centralroof', M['roof'], [[(x - 0.17, y - 0.12, G + 0.255), (x + 0.17, y - 0.12, G + 0.255), (x + 0.17, y + 0.12, G + 0.255), (x - 0.17, y + 0.12, G + 0.255)],
                                [(x - 0.004, y - 0.12, G + 0.33), (x + 0.004, y - 0.12, G + 0.33), (x + 0.004, y + 0.12, G + 0.33), (x - 0.004, y + 0.12, G + 0.33)]], outline=0.004)
for s in (-1, 1):
    lathe(f'centralturret{s}', M['stone'], ((0.03, 0), (0.03, 0.08), (0.003, 0.13)), G + 0.255, x + s * 0.15, y - 0.1, segs=8, outline=0.002, smooth=False)

# ---------- the canal and its bridges ----------
RC0, RC1 = 0.62, 0.74
for k in range(N):
    a0 = math.pi * k / N
    a1 = math.pi * (k + 1) / N
    quad = [at(RC0 - 0.03, a0), at(RC1 + 0.03, a0), at(RC1 + 0.03, a1), at(RC0 - 0.03, a1)]
    loft(f'canalrim{k}', M['stone'], [[(x, y, G - 0.004) for x, y in quad], [(x, y, G + 0.014) for x, y in quad]], outline=0.001)
    quad = [at(RC0, a0), at(RC1, a0), at(RC1, a1), at(RC0, a1)]
    loft(f'canal{k}', M['water'], [[(x, y, G + 0.008) for x, y in quad], [(x, y, G + 0.018) for x, y in quad]], outline=0)
for k, a in enumerate((math.pi * 0.17, math.pi * 0.39, math.pi * 0.61, math.pi * 0.83)):
    x, y = at((RC0 + RC1) / 2, a)
    br = box(f'bridge{k}', M['white'], 0, 0, 0, 0.07, 0.2, 0.04, outline=0.003, bevel=0)
    rails = [box(f'bridgerail{k}{s}', M['tileBlue'], s * 0.032, 0, 0.035, 0.01, 0.2, 0.03, outline=0.001, bevel=0) for s in (-1, 1)]
    bpy.context.view_layer.update()
    m = Matrix.Translation((x, y, G + 0.01)) @ Matrix.Rotation(a - math.pi / 2, 4, 'Z')
    for o in [br] + rails:
        o.matrix_world = m @ o.matrix_world
bpy.context.view_layer.update()

# ---------- the fountain ----------
FX, FY = CX, CY - 0.3
lathe('fountainbasin', M['stone'], ((0.2, 0), (0.2, 0.03), (0.17, 0.03), (0.17, 0.02)), G - 0.004, FX, FY, segs=24, outline=0.003)
lathe('fountainwater', M['water'], ((0.175, 0), (0.175, 0.022)), G - 0.002, FX, FY, segs=24, outline=0)
lathe('fountaincolumn', M['stone'], ((0.03, 0), (0.025, 0.1), (0.06, 0.11), (0.06, 0.125), (0.015, 0.13), (0.004, 0.17)), G, FX, FY, segs=12, outline=0.002)
for k in range(6):
    a = 2 * math.pi * k / 6
    rod(f'jet{k}', M['white'], (FX + 0.05 * math.cos(a), FY + 0.05 * math.sin(a), G + 0.12), (FX + 0.12 * math.cos(a), FY + 0.12 * math.sin(a), G + 0.03), 0.006, segs=4, outline=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
