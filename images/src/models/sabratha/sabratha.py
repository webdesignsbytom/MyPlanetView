# A cartoon Sabratha for the country maps, built in the set's shared look (../toon.py): the Roman city
# on the Libyan coast, its theatre with the great stage front rebuilt three storeys high in columns
# of pink and white stone, the three doors of the stage, the half circle of seats rising in tiers
# in front of it, and the Mediterranean right behind. Turned a little towards the camera.
# Run: blender -b --factory-startup -P sabratha.py -- sabratha-1024.png 1024 sabratha.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#dccaa0', shadow_mul=(0.82, 0.8, 0.84), lift=0.18),
    'sandstone': toon('sandstone', '#dcb48a', shadow_mul=(0.8, 0.76, 0.8), lift=0.15),
    'seats': toon('seats', '#d4c0a0', lift=0.15),
    'pink': toon('pink', '#d89c88', lift=0.15),
    'white': toon('white', '#f2eee6', lift=0.22),
    'water': toon('water', '#3a92c8', lift=0.3),
    'orchestra': toon('orchestra', '#e8dcc4', lift=0.18),
    'dark': flat('dark', '#3a2e26'),
})

G = tile(M['ground'])
before = set(bpy.data.objects)


def strip(y0, y1, r, z):
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    right = [(r * math.cos(a0 + (a1 - a0) * k / 12), r * math.sin(a0 + (a1 - a0) * k / 12), z) for k in range(13)]
    left = [(-r * math.cos(a1 + (a0 - a1) * k / 12), r * math.sin(a1 + (a0 - a1) * k / 12), z) for k in range(13)]
    return right + left


# ---------- the sea behind ----------
loft('sea', M['water'], [strip(0.62, 1.31, 1.32, G - 0.004), strip(0.62, 1.31, 1.32, G + 0.008)], outline=0.002)

# ---------- the half circle of seats ----------
OX, OY = 0.0, 0.2
lathe('orchestrafloor', M['orchestra'], ((0.24, 0), (0.24, 0.012)), G - 0.005, OX, OY, segs=32, outline=0.001)
TIERS = ((0.26, 0.05), (0.37, 0.1), (0.48, 0.15), (0.59, 0.2), (0.7, 0.25))
RMAX = 0.82
NW = 14
for k, (r0, h) in enumerate(TIERS):
    for j in range(NW):
        a0 = math.pi + j * math.pi / NW
        a1 = a0 + math.pi / NW
        pts = [(OX + r0 * math.cos(a0), OY + r0 * math.sin(a0)), (OX + RMAX * math.cos(a0), OY + RMAX * math.sin(a0)),
               (OX + RMAX * math.cos(a1), OY + RMAX * math.sin(a1)), (OX + r0 * math.cos(a1), OY + r0 * math.sin(a1))]
        loft(f'seats{k}_{j}', M['seats'], [[(x, y, G - 0.005) for x, y in pts], [(x, y, G + h) for x, y in pts]], outline=0.002)
for j in range(5):
    a = math.pi + (j + 0.5) * math.pi / 5
    x0, y0 = OX + 0.25 * math.cos(a), OY + 0.25 * math.sin(a)
    x1, y1 = OX + RMAX * math.cos(a), OY + RMAX * math.sin(a)
    bar(f'aisle{j}', M['dark'], (x0, y0, G + 0.04), (x1, y1, G + 0.255), 0.012, outline=0)

# ---------- the stage and its three-storey front ----------
SY = OY + 0.05
box('stage', M['sandstone'], OX, SY + 0.04, G - 0.005, 0.86, 0.1, 0.06, outline=0.004, bevel=0)
FY = SY + 0.14
box('frons', M['sandstone'], OX, FY + 0.04, G - 0.005, 0.86, 0.08, 0.5, outline=0.007, bevel=0)
for k, (x, w) in enumerate(((-0.24, 0.06), (0.0, 0.08), (0.24, 0.06))):
    box(f'stagedoor{k}', M['dark'], OX + x, FY - 0.004, G + 0.055, w, 0.006, 0.12, outline=0, bevel=0)
    cyl(f'stagedoortop{k}', M['dark'], w / 2, 0.006, segs=10, outline=0, matrix=Matrix.Translation((OX + x, FY - 0.004, G + 0.175)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
STOREYS = ((G + 0.055, 0.15, 12), (G + 0.22, 0.13, 12), (G + 0.365, 0.12, 8))
for st, (z0, h, n) in enumerate(STOREYS):
    for j in range(n):
        x = OX - 0.39 + j * 0.78 / (n - 1)
        rod(f'col{st}{j}', M['pink'] if j % 2 == 0 else M['white'], (x, FY - 0.035, z0), (x, FY - 0.035, z0 + h), 0.011, segs=8, outline=0.001)
        box(f'colbase{st}{j}', M['white'], x, FY - 0.035, z0 - 0.008, 0.03, 0.03, 0.012, outline=0, bevel=0)
    box(f'entablature{st}', M['white'], OX, FY - 0.02, z0 + h, 0.86 - st * 0.08, 0.06, 0.025, outline=0.003, bevel=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
