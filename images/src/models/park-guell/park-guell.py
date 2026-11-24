# A cartoon Park Güell for the country maps, built in the set's shared look (../toon.py): Gaudí's
# terrace on its forest of Doric columns, the long serpentine bench along its edge in broken-tile
# mosaic, the double stairway with the colourful mosaic dragon in the middle, and the two gingerbread
# gatehouses with their wavy roofs, one with its chequered tower and four-armed cross; palms and
# pines round them. Turned a little towards the camera.
# Run: blender -b --factory-startup -P park-guell.py -- park-guell-1024.png 1024 park-guell.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#e0cfa8', shadow_mul=(0.86, 0.82, 0.76), lift=0.2),
    'stone': toon('stone', '#d8c49c', shadow_mul=(0.86, 0.82, 0.78), lift=0.1),
    'stoneDark': toon('stoneDark', '#b8a27a'),
    'white': toon('white', '#f6f2e8', lift=0.2),
    'blue': toon('blue', '#3a8ad0', lift=0.15),
    'green': toon('green', '#5ab87a', lift=0.15),
    'yellow': toon('yellow', '#f0c840', lift=0.15),
    'orange': toon('orange', '#f08a40', lift=0.15),
    'red': toon('red', '#d84a3a', lift=0.1),
    'brown': toon('brown', '#a8643e'),
    'dark': flat('dark', '#3a3028'),
    'palm': toon('palm', '#5a9a40'),
    'pine': toon('pine', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3a'),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(1914)
MOSAIC = ('blue', 'green', 'yellow', 'orange', 'white', 'red')

# ---------- the Hypostyle Hall and the terrace on top ----------
TZ = G + 0.26          # the terrace's top
TY, TW, TD = 0.42, 0.9, 0.46
box('terrace', M['stone'], 0, TY + 0.03, TZ - 0.04, TW, TD, 0.04, outline=0.008, bevel=0)
box('terraceback', M['stone'], 0, TY + TD / 2 - 0.02, G - 0.005, TW, 0.1, TZ - G, outline=0.006, bevel=0)
for j in range(6):
    for i in range(3):
        x = -TW / 2 + 0.08 + j * (TW - 0.16) / 5
        y = TY - TD / 2 + 0.07 + i * 0.12
        rod(f'column{j}{i}', M['white'], (x, y, G - 0.005), (x, y, TZ - 0.04), 0.024, segs=12, outline=0.003)
        lathe(f'capital{j}{i}', M['white'], ((0.024, 0), (0.035, 0.02)), TZ - 0.06, x, y, segs=12, outline=0.002)
# the serpentine bench winding along the terrace's front edge
N = 40
for k in range(N):
    t0, t1 = k / N, (k + 1) / N
    x0, x1 = -TW / 2 + 0.02 + (TW - 0.04) * t0, -TW / 2 + 0.02 + (TW - 0.04) * t1
    y0 = TY - TD / 2 + 0.03 + 0.05 * math.sin(t0 * 6 * math.pi)
    y1 = TY - TD / 2 + 0.03 + 0.05 * math.sin(t1 * 6 * math.pi)
    bar(f'bench{k}', M[MOSAIC[k % len(MOSAIC)]], (x0, y0, TZ + 0.02), (x1, y1, TZ + 0.02), 0.04, outline=0.002)

# ---------- the dragon stairway ----------
SY0, SY1 = -0.5, TY - TD / 2 - 0.01
for s in (-1, 1):
    for i in range(8):
        t = i / 8
        y = SY0 + (SY1 - SY0) * t
        z = G + (TZ - 0.13 - G) * t
        box(f'stair{s}{i}', M['stone'], s * 0.16, y, G - 0.005, 0.12, (SY1 - SY0) / 8 + 0.002, z - G + 0.03, outline=0.002, bevel=0)
    bar(f'stairwall{s}', M['stoneDark'], (s * 0.235, SY0, G + 0.04), (s * 0.235, SY1, TZ - 0.08), 0.03, outline=0.003)
box('stairmiddle', M['stoneDark'], 0, (SY0 + SY1) / 2, G - 0.005, 0.2, SY1 - SY0, 0.06, outline=0.004, bevel=0)
# the dragon (a salamander) on its fountain, in mosaic
DX, DY, DZ = 0.0, -0.18, G + 0.07
body = []
for k in range(7):
    t = k / 6
    x = DX + 0.03 * math.sin(t * math.pi * 1.5)
    y = DY - 0.16 + 0.3 * t
    z = DZ + 0.04 + 0.04 * math.sin(t * math.pi)
    body.append((x, y, z))
for k in range(6):
    bar(f'dragonbody{k}', M[MOSAIC[k % 4]], body[k], body[k + 1], 0.05 - 0.004 * k, outline=0.003)
ball('dragonhead', M['green'], body[0][0], body[0][1] - 0.03, body[0][2] + 0.015, 0.035, outline=0.004)
ball('dragoneyes', M['dark'], body[0][0], body[0][1] - 0.058, body[0][2] + 0.025, 0.008, outline=0)
for s in (-1, 1):
    for k in (1, 4):
        bar(f'dragonleg{s}{k}', M['yellow'], body[k], (body[k][0] + s * 0.05, body[k][1], DZ), 0.016, outline=0.002)
for k in range(14):
    x, y = DX + rng.uniform(-0.03, 0.03), DY + rng.uniform(-0.15, 0.13)
    ball(f'dragonspot{k}', M[MOSAIC[rng.randrange(6)]], x, y, DZ + 0.06 + 0.035 * math.sin((y - DY + 0.16) / 0.3 * math.pi), 0.009, outline=0)

# ---------- the gatehouses ----------


def gatehouse(name, x, y, tower):
    box(name, M['brown'], x, y, G - 0.005, 0.22, 0.2, 0.17, outline=0.006, bevel=0)
    for k in range(2):
        box(f'{name}win{k}', M['dark'], x - 0.05 + k * 0.1, y - 0.103, G + 0.06, 0.03, 0.006, 0.05, outline=0, bevel=0)
    # the wavy cream roof with white and blue mosaic ridges
    rings = []
    for z, r in ((0.165, 1.0), (0.2, 0.85), (0.24, 0.55), (0.27, 0.15)):
        ring = []
        for k in range(12):
            a = 2 * math.pi * k / 12
            wob = 1 + 0.12 * math.sin(3 * a)
            ring.append((x + 0.12 * r * wob * math.cos(a), y + 0.11 * r * wob * math.sin(a), G + z))
        rings.append(ring)
    loft(f'{name}roof', M['white'], rings, outline=0.004, smooth=True)
    for k in range(5):
        a = 2 * math.pi * k / 5
        bar(f'{name}ridge{k}', M['blue'], (x + 0.11 * math.cos(a), y + 0.1 * math.sin(a), G + 0.17), (x + 0.02 * math.cos(a), y + 0.02 * math.sin(a), G + 0.265), 0.012, outline=0)
    lathe(f'{name}mushroom', M['red'], ((0.03, 0), (0.035, 0.02), (0.015, 0.035), (0.003, 0.04)), G + 0.27, x, y, segs=10, outline=0.002)
    if tower:
        tx, ty = x + 0.09, y + 0.07
        lathe(f'{name}tower', M['white'], ((0.045, 0), (0.04, 0.2), (0.03, 0.28)), G - 0.005, tx, ty, segs=12, outline=0.004)
        for k in range(6):
            for j in range(6):
                if (k + j) % 2:
                    a = 2 * math.pi * k / 6
                    ball(f'{name}check{k}{j}', M['blue'], tx + 0.043 * math.cos(a), ty + 0.043 * math.sin(a), G + 0.04 + j * 0.03, 0.009, outline=0)
        for d in ((0.03, 0, 0), (0, 0.03, 0), (0, 0, 0.03)):
            bar(f'{name}cross{d}', M['white'], (tx - d[0], ty - d[1], G + 0.32 - d[2]), (tx + d[0], ty + d[1], G + 0.32 + d[2]), 0.014, outline=0.002)


gatehouse('gatehouse', -0.55, -0.62, True)
gatehouse('porterlodge', 0.55, -0.62, False)
box('gatewall', M['stone'], 0, -0.82, G - 0.005, 0.9, 0.05, 0.08, outline=0.004, bevel=0)
for k in range(9):
    ball(f'wallmosaic{k}', M[MOSAIC[k % 6]], -0.4 + k * 0.1, -0.846, G + 0.06, 0.014, outline=0)

# ---------- palms and pines ----------
for k, (x, y) in enumerate(((-0.85, 0.05), (0.85, 0.05), (-0.75, 0.6), (0.75, 0.6))):
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + 0.34), 0.016, segs=6, outline=0.002)
    for j in range(7):
        a = 2 * math.pi * j / 7
        bar(f'palmleaf{k}{j}', M['palm'], (x + 0.02, y, G + 0.34), (x + 0.02 + 0.11 * math.cos(a), y + 0.11 * math.sin(a), G + 0.28), 0.025, outline=0.002)
for k, (x, y) in enumerate(((-0.3, 0.9), (0.2, 0.95), (0.55, 0.85), (-0.6, 0.85))):
    rod(f'pinetrunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.3), 0.012, segs=6, outline=0.002)
    b = ball(f'pine{k}', M['pine'], 0, 0, 0, 0.09, outline=0.01)
    b.scale = (1.3, 1.3, 0.6)
    b.location = (x, y, G + 0.33)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
