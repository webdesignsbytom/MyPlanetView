# A cartoon Casa Batlló for the country maps, built in the set's shared look (../toon.py): Gaudí's
# house on the Passeig de Gràcia, its front shimmering with blue, green and lilac tiles, the
# bone-like columns of the first-floor windows, the mask-shaped balconies, the dragon's-back roof of
# coloured scales and the round tower with its four-armed cross; Casa Amatller's stepped gable beside
# it, and the avenue's plane trees and lamps in front. Turned a little towards the camera.
# Run: blender -b --factory-startup -P casa-batllo.py -- casa-batllo-1024.png 1024 casa-batllo.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#c8c0b0', shadow_mul=(0.82, 0.8, 0.88), lift=0.2),
    'road': toon('road', '#8a8a90'),
    'facade': toon('facade', '#9cc8d8', shadow_mul=(0.82, 0.88, 0.94), lift=0.2),
    'tileBlue': toon('tileBlue', '#3a8ad0', lift=0.15),
    'tileGreen': toon('tileGreen', '#5ab8a0', lift=0.15),
    'tileLilac': toon('tileLilac', '#b08ad8', lift=0.15),
    'bone': toon('bone', '#efe4cc', shadow_mul=(0.86, 0.84, 0.86), lift=0.2),
    'scaleRed': toon('scaleRed', '#d8604a', lift=0.1),
    'scaleGreen': toon('scaleGreen', '#4a9a7a', lift=0.1),
    'scaleBlue': toon('scaleBlue', '#4a6ab0', lift=0.1),
    'iron': toon('iron', '#3a3a40'),
    'window': flat('window', '#2e3440'),
    'amatller': toon('amatller', '#e8c8a0', lift=0.1),
    'amatllerTile': toon('amatllerTile', '#d88a70'),
    'neighbour': toon('neighbour', '#e0d4bc', lift=0.1),
    'tree': toon('tree', '#5a9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a6a5a'),
    'gold': toon('gold', '#e8b830', lift=0.2),
})

G = tile(M['paving'])
before = set(bpy.data.objects)
rng = random.Random(1906)

FY = 0.1            # the front's face
W, H = 0.36, 0.72   # Casa Batlló's front
box('road', M['road'], 0, -0.62, G - 0.003, 1.9, 0.42, 0.008, outline=0, bevel=0)

# ---------- Casa Batlló ----------
box('house', M['facade'], 0, FY + 0.25, G - 0.005, W, 0.5, H, outline=0.009, bevel=0)
for k in range(70):
    x = rng.uniform(-W / 2 + 0.02, W / 2 - 0.02)
    z = rng.uniform(0.25, H - 0.05)
    ball(f'tile{k}', M[rng.choice(('tileBlue', 'tileGreen', 'tileLilac'))], x, FY - 0.002, G + z, 0.012, outline=0)
# the ground and first floors: the bone columns round the great windows
box('groundfloor', M['bone'], 0, FY - 0.004, G - 0.005, W, 0.012, 0.24, outline=0.003, bevel=0)
for j in range(4):
    x = -0.12 + j * 0.08
    box(f'bigwin{j}', M['window'], x, FY - 0.012, G + 0.1, 0.055, 0.006, 0.11, outline=0, bevel=0)
    box(f'door{j}', M['window'], x, FY - 0.012, G - 0.005, 0.05, 0.006, 0.08, outline=0, bevel=0)
for j in range(5):
    x = -0.16 + j * 0.08
    b = rod(f'bone{j}', M['bone'], (x, FY - 0.02, G + 0.08), (x, FY - 0.02, G + 0.23), 0.012, r2=0.008, segs=8, outline=0.002)
    ball(f'bonejoint{j}', M['bone'], x, FY - 0.02, G + 0.155, 0.015, outline=0.002)
# the upper floors' windows with their mask balconies
for row in range(4):
    for j in range(3):
        x = -0.11 + j * 0.11
        z = G + 0.29 + row * 0.1
        box(f'win{row}{j}', M['window'], x, FY - 0.004, z, 0.045, 0.006, 0.06, outline=0, bevel=0)
        mask = ball(f'mask{row}{j}', M['iron'], 0, 0, 0, 0.03, outline=0.002)
        mask.scale = (1.0, 0.6, 0.55)
        mask.location = (x, FY - 0.03, z + 0.005)
        for s in (-1, 1):
            ball(f'maskeye{row}{j}{s}', M['bone'], x + s * 0.012, FY - 0.045, z + 0.012, 0.005, outline=0)
# the dragon's-back roof
for k in range(9):
    t = k / 8
    x = -W / 2 + 0.02 + (W - 0.04) * t
    z = G + H + 0.06 * math.sin(math.pi * t) + 0.02
    sc = ball(f'scale{k}', M[('scaleRed', 'scaleGreen', 'scaleBlue')[k % 3]], 0, 0, 0, 0.05, outline=0.004)
    sc.scale = (0.8, 1.2, 0.8)
    sc.location = (x, FY + 0.03, z)
for k in range(9):
    t = (k + 0.5) / 9
    x = -W / 2 + 0.02 + (W - 0.04) * t
    ball(f'spine{k}', M['bone'], x, FY + 0.03, G + H + 0.06 * math.sin(math.pi * t) + 0.06, 0.016, outline=0.002)
box('roofback', M['facade'], 0, FY + 0.3, G + H - 0.01, W, 0.4, 0.05, outline=0.004, bevel=0)
# the tower and its cross
TX = -0.13
lathe('tower', M['bone'], ((0.04, 0), (0.04, 0.12), (0.03, 0.15)), G + H - 0.01, TX, FY + 0.02, segs=12, outline=0.004)
lathe('towerbulb', M['scaleBlue'], ((0.03, 0), (0.036, 0.02), (0.02, 0.05), (0.004, 0.06)), G + H + 0.14, TX, FY + 0.02, segs=12, outline=0.003)
for d in ((0.025, 0, 0), (0, 0.025, 0), (0, 0, 0.025)):
    bar(f'cross{d}', M['gold'], (TX - d[0], FY + 0.02 - d[1], G + H + 0.23 - d[2]), (TX + d[0], FY + 0.02 + d[1], G + H + 0.23 + d[2]), 0.012, outline=0.002)

# ---------- the neighbours ----------
AX = -W / 2 - 0.19
box('amatller', M['amatller'], AX, FY + 0.25, G - 0.005, 0.38, 0.5, 0.6, outline=0.008, bevel=0)
for k in range(5):
    w = 0.38 - k * 0.07
    box(f'amatllerstep{k}', M['amatllerTile'], AX, FY + 0.02, G + 0.595 + k * 0.035, w, 0.04, 0.036, outline=0.002, bevel=0)
for row in range(4):
    for j in range(3):
        box(f'amwin{row}{j}', M['window'], AX - 0.11 + j * 0.11, FY - 0.004, G + 0.12 + row * 0.11, 0.04, 0.006, 0.06, outline=0, bevel=0)
box('amatllerdoor', M['window'], AX, FY - 0.004, G - 0.005, 0.08, 0.006, 0.09, outline=0, bevel=0)
NX = W / 2 + 0.19
box('neighbour', M['neighbour'], NX, FY + 0.25, G - 0.005, 0.38, 0.5, 0.56, outline=0.008, bevel=0)
for row in range(5):
    for j in range(3):
        box(f'nbwin{row}{j}', M['window'], NX - 0.11 + j * 0.11, FY - 0.004, G + 0.06 + row * 0.1, 0.04, 0.006, 0.06, outline=0, bevel=0)
        box(f'nbbalcony{row}{j}', M['iron'], NX - 0.11 + j * 0.11, FY - 0.02, G + 0.055 + row * 0.1, 0.06, 0.03, 0.008, outline=0.001, bevel=0)

# ---------- the avenue's trees and lamps ----------
for k, x in enumerate((-0.75, -0.25, 0.25, 0.75)):
    rod(f'trunk{k}', M['trunk'], (x, -0.3, G), (x, -0.3, G + 0.14), 0.014, segs=6, outline=0.002)
    ball(f'tree{k}', M['tree'], x, -0.3, G + 0.22, 0.1, outline=0.012)
for k, x in enumerate((-0.5, 0.5)):
    rod(f'lamp{k}', M['iron'], (x, -0.35, G), (x, -0.35, G + 0.2), 0.006, segs=6, outline=0.001)
    lathe(f'lampbench{k}', M['tileBlue'], ((0.04, 0), (0.04, 0.03)), G, x, -0.35, segs=10, outline=0.002)
    ball(f'lamptop{k}', M['bone'], x, -0.35, G + 0.21, 0.015, outline=0.002)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
