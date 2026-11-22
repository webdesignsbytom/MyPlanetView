# A cartoon Suomenlinna for the country maps, built in the set's shared look (../toon.py) on a tile
# of the Baltic: the sea fortress on its granite islands, the star-shaped bastion walls with their
# grassy ramparts and cannon, the King's Gate at the water with its steps, the church that is also
# a lighthouse, a red wooden house on the little island beside it, and the ferry. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P suomenlinna.py -- suomenlinna-1024.png 1024 suomenlinna.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#3f8fc0', shadow_mul=(0.75, 0.82, 0.9), lift=0.35),
    'granite': toon('granite', '#b8a8a0', shadow_mul=(0.8, 0.78, 0.86)),
    'grass': toon('grass2', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8)),
    'stone': toon('stone', '#9a958c', shadow_mul=(0.8, 0.8, 0.88)),
    'gate': toon('gate', '#c9c2b4', shadow_mul=(0.8, 0.8, 0.88)),
    'church': toon('church', '#efe2b8', shadow_mul=(0.84, 0.78, 0.7)),
    'dome': toon('dome', '#5f8a7a', shadow_mul=(0.72, 0.82, 0.84)),
    'lamp': toon('lamp', '#f4d860', shadow_mul=(0.8, 0.68, 0.55), lift=0.4),
    'cannon': toon('cannon', '#3a3a40'),
    'red': toon('red', '#a8402f'),
    'white': toon('white', '#f6f3ec', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'window': flat('window', '#33303d'),
    'tree': toon('tree', '#3f8a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'ferry': toon('ferry', '#2f6fb8', shadow_mul=(0.72, 0.72, 0.82)),
})

G = tile(M['sea'])
before = set(bpy.data.objects)
rng = random.Random(331)


def ring(cx, cy, rx, ry, z, jitter, sides=18):
    return [(cx + rx * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / sides),
             cy + ry * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / sides), G + z) for k in range(sides)]


# ---------- the main island ----------
IX, IY = -0.1, 0.2
island = loft('island', M['granite'], [ring(IX, IY, 0.98, 0.78, -0.01, 0.04), ring(IX, IY, 0.92, 0.72, 0.06, 0.04)], outline=0.025)
top = loft('islandgrass', M['grass'], [ring(IX, IY, 0.88, 0.68, 0.055, 0.0), ring(IX, IY, 0.85, 0.65, 0.07, 0.03)], outline=0.015)
island.visible_shadow = top.visible_shadow = False
T = G + 0.07

# ---------- the star-shaped bastion: stone walls, grass on top, cannon ----------
STAR = []
for k in range(10):
    a = 2 * math.pi * k / 10 + 0.2
    r = 0.62 if k % 2 == 0 else 0.45
    STAR.append((IX + r * math.cos(a), IY + r * 0.8 * math.sin(a)))
inner = [(IX + (x - IX) * 0.84, IY + (y - IY) * 0.84) for x, y in STAR]
loft('bastion', M['stone'], [[(x, y, T - 0.01) for x, y in STAR], [(x, y, T + 0.16) for x, y in STAR]], outline=0.022)
loft('rampart', M['grass'], [[(x, y, T + 0.155) for x, y in STAR], [(x, y, T + 0.2) for x, y in inner]], outline=0.016)
for k, (x, y) in enumerate(STAR[::2]):
    a = math.atan2(y - IY, x - IX)
    rod(f'cannon{k}', M['cannon'], (x - 0.06 * math.cos(a), y - 0.06 * math.sin(a), T + 0.2), (x + 0.02 * math.cos(a), y + 0.02 * math.sin(a), T + 0.21),
        0.014, r2=0.011, segs=8, outline=0.005)

# ---------- the King's Gate on the shore, with its steps down to the water ----------
GX, GY = IX + 0.05, IY - 0.62
box('kingsgate', M['gate'], GX, GY, T - 0.01, 0.26, 0.1, 0.24, outline=0.018, bevel=0)
pyramid('gatepediment', M['gate'], GX, GY, T + 0.23, 0.22, 0.05, outline=0.01)
box('gatearch', M['window'], GX, GY - 0.051, T, 0.08, 0.01, 0.13, outline=0, bevel=0)
cyl('gatearchtop', M['window'], 0.04, 0.01, segs=16, outline=0, matrix=Matrix.Translation((GX, GY - 0.051, T + 0.13)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for k in range(5):
    box(f'gatestep{k}', M['gate'], GX, GY - 0.08 - k * 0.035, G - 0.01, 0.22 - k * 0.01, 0.04, T - G + 0.01 - k * 0.016, outline=0.006, bevel=0)

# ---------- the church that is also a lighthouse ----------
CX, CY = IX - 0.05, IY + 0.1
box('church', M['church'], CX, CY, T - 0.01, 0.26, 0.22, 0.24, outline=0.018, bevel=0)
pyramid('churchroof', M['dome'], CX, CY, T + 0.23, 0.28, 0.06, outline=0.012)
for s in (-1, 1):
    box(f'churchwin{s}', M['window'], CX + s * 0.07, CY - 0.112, T + 0.1, 0.03, 0.01, 0.08, outline=0, bevel=0)
box('portico', M['church'], CX, CY - 0.13, T - 0.01, 0.14, 0.06, 0.2, outline=0.012, bevel=0)
pyramid('porticopediment', M['church'], CX, CY - 0.13, T + 0.19, 0.15, 0.05, outline=0.008)
lathe('drum', M['church'], ((0.07, 0), (0.07, 0.1)), T + 0.28, CX, CY, segs=16, outline=0.012)
lathe('cupola', M['dome'], ((0.075, 0), (0.06, 0.05), (0.03, 0.08), (0.025, 0.08)), T + 0.38, CX, CY, segs=16, outline=0.012)
lathe('lantern', M['lamp'], ((0.025, 0), (0.025, 0.05)), T + 0.46, CX, CY, segs=12, outline=0.008)
lathe('lanterncap', M['dome'], ((0.032, 0), (0.004, 0.05)), T + 0.51, CX, CY, segs=12, outline=0.006)

# trees inside the walls
for k, (dx, dy) in enumerate(((0.25, 0.05), (0.2, 0.25), (-0.3, 0.2), (-0.25, -0.05))):
    ball(f'tree{k}', M['tree'], IX + dx, IY + dy, T + 0.08, 0.07, outline=0.014)

# ---------- the little island beside it, with a red wooden house ----------
SX, SY = 0.78, -0.45
small = loft('smallisland', M['granite'], [ring(SX, SY, 0.3, 0.22, -0.01, 0.06), ring(SX, SY, 0.26, 0.18, 0.05, 0.05)], outline=0.02)
small.visible_shadow = False
box('house', M['red'], SX, SY, G + 0.045, 0.16, 0.11, 0.09, outline=0.012, bevel=0)
loft('houseroof', M['stone'], [[(SX - 0.09, SY - 0.065, G + 0.13), (SX + 0.09, SY - 0.065, G + 0.13), (SX + 0.09, SY + 0.065, G + 0.13), (SX - 0.09, SY + 0.065, G + 0.13)],
                               [(SX - 0.09, SY - 0.004, G + 0.18), (SX + 0.09, SY - 0.004, G + 0.18), (SX + 0.09, SY + 0.004, G + 0.18), (SX - 0.09, SY + 0.004, G + 0.18)]],
     outline=0.01)
for s in (-1, 1):
    box(f'housewin{s}', M['white'], SX + s * 0.045, SY - 0.057, G + 0.07, 0.03, 0.006, 0.035, outline=0, bevel=0)
ball('smalltree', M['tree'], SX + 0.16, SY + 0.05, G + 0.12, 0.06, outline=0.012)

# ---------- the ferry ----------
FX, FY = -0.65, -0.85
loft('ferryhull', M['white'], [[(FX - 0.17, FY - 0.04, G - 0.005), (FX + 0.12, FY - 0.04, G - 0.005), (FX + 0.18, FY, G - 0.005), (FX + 0.12, FY + 0.04, G - 0.005),
                                (FX - 0.17, FY + 0.04, G - 0.005)],
                               [(FX - 0.18, FY - 0.06, G + 0.045), (FX + 0.12, FY - 0.06, G + 0.045), (FX + 0.21, FY, G + 0.045), (FX + 0.12, FY + 0.06, G + 0.045),
                                (FX - 0.18, FY + 0.06, G + 0.045)]], outline=0.012)
box('ferrystripe', M['ferry'], FX, FY - 0.06, G + 0.025, 0.28, 0.006, 0.014, outline=0, bevel=0)
box('ferrycabin', M['white'], FX - 0.03, FY, G + 0.045, 0.18, 0.09, 0.06, outline=0.01, bevel=0)
box('ferrywindows', M['ferry'], FX - 0.03, FY - 0.046, G + 0.07, 0.16, 0.006, 0.02, outline=0, bevel=0)

turn(before, -20)
render(G)
