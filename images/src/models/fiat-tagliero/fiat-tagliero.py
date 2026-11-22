# A cartoon Asmara for the country maps, built in the set's shared look (../toon.py): the Fiat
# Tagliero service station, the city's futurist landmark of 1938, built like an aeroplane: its
# central tower with the curved glass front and the long concrete wings reaching out either side
# over the petrol pumps; a vintage Fiat in front, an Art Deco corner building and palms along the
# avenue behind. Turned a little towards the camera.
# Run: blender -b --factory-startup -P fiat-tagliero.py -- fiat-tagliero-1024.png 1024 fiat-tagliero.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#ddd3c0', lift=0.25),
    'road': toon('road', '#8f8a84', shadow_mul=(0.8, 0.8, 0.88)),
    'white': toon('white', '#f6f3ec', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'cream': toon('cream', '#efe4c8', shadow_mul=(0.84, 0.8, 0.8)),
    'band': toon('band', '#3f8fb8', shadow_mul=(0.74, 0.8, 0.88)),
    'glass': flat('glass', '#3f5a72'),
    'pump': toon('pump', '#d9483b'),
    'car': toon('car', '#2f8a6a', shadow_mul=(0.7, 0.78, 0.8)),
    'tyre': toon('tyre', '#3a3a40'),
    'chrome': toon('chrome', '#d8dce2', lift=0.3),
    'deco': toon('deco', '#f2d27a', shadow_mul=(0.84, 0.74, 0.62)),
    'decoPink': toon('decoPink', '#eec2b4', shadow_mul=(0.84, 0.76, 0.82)),
    'palm': toon('palm', '#5a9e4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)
rng = random.Random(373)

# ---------- the road in front ----------
R = 1.42                                   # the road stops at the tile's edge
Y0, Y1 = -0.99, -0.57
side = [(math.sqrt(R * R - y * y), y) for y in (Y0 + (Y1 - Y0) * k / 6 for k in range(7))]
bm = bmesh.new()
bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, G + 0.002)) for x, y in [(-x, y) for x, y in reversed(side)] + side])])
finish('road', bm, M['road'], outline=0)
for k in range(5):
    box(f'roadline{k}', M['white'], -0.9 + k * 0.45, -0.78, G + 0.004, 0.18, 0.025, 0.004, outline=0, bevel=0)

# ---------- the station: the tower, its glass front and the long wings ----------
SX, SY = 0.0, 0.05
lathe('base', M['white'], ((0.2, 0), (0.2, 0.16)), G - 0.005, SX, SY, segs=32, outline=0.02)
cyl('baseglass', M['glass'], 0.205, 0.08, segs=32, outline=0, matrix=Matrix.Translation((SX, SY, G + 0.07)) @ Matrix.Scale(1.0, 4, (0, 1, 0)))
box('tower', M['white'], SX, SY + 0.06, G - 0.005, 0.18, 0.18, 0.62, outline=0.02, bevel=0.004)
box('towerband', M['band'], SX, SY + 0.06 - 0.092, G + 0.5, 0.18, 0.01, 0.05, outline=0, bevel=0)
for k in range(4):
    box(f'towerwin{k}', M['glass'], SX, SY + 0.06 - 0.092, G + 0.2 + k * 0.07, 0.1, 0.01, 0.035, outline=0, bevel=0)
box('fin', M['white'], SX, SY + 0.06, G + 0.6, 0.04, 0.22, 0.2, outline=0.014, bevel=0)
# the wings: long, thin and tapering, reaching out each side at the height of the base's top
WZ = G + 0.17
for s in (-1, 1):
    pts = [(SX + s * 0.12, SY - 0.12), (SX + s * 0.95, SY - 0.05), (SX + s * 1.0, SY + 0.02), (SX + s * 0.95, SY + 0.07), (SX + s * 0.12, SY + 0.14)]
    if s < 0:
        pts = list(reversed(pts))
    loft(f'wing{s}', M['cream'], [[(x, y, WZ) for x, y in pts], [(x, y, WZ + 0.035) for x, y in pts]], outline=0.014)
    box(f'wingband{s}', M['band'], SX + s * 0.55, SY - 0.09, WZ + 0.01, 0.8, 0.01, 0.015, rot_z=s * 0.08, outline=0, bevel=0)
    # the petrol pumps under the wing
    for k, d in enumerate((0.4, 0.7)):
        x = SX + s * d
        box(f'pump{s}{k}', M['pump'], x, SY - 0.02, G - 0.005, 0.06, 0.05, 0.12, outline=0.01, bevel=0.006)
        cyl(f'pumpglobe{s}{k}', M['white'], 0.022, 0.02, segs=12, outline=0.004, matrix=Matrix.Translation((x, SY - 0.02, G + 0.13)))
box('sign', M['band'], SX, SY - 0.205, G + 0.19, 0.14, 0.01, 0.045, outline=0.006, bevel=0)

# ---------- a vintage Fiat in front ----------
CX, CY = 0.35, -0.38
car = ball('carbody', M['car'], 0, 0, 0, 0.1, outline=0.012)
car.scale = (1.5, 0.75, 0.55)
car.location = (CX, CY, G + 0.07)
cab = ball('carcab', M['car'], 0, 0, 0, 0.065, outline=0.01)
cab.scale = (1.1, 1.0, 0.85)
cab.location = (CX - 0.02, CY, G + 0.12)
box('carwindow', M['glass'], CX - 0.02, CY - 0.06, G + 0.115, 0.09, 0.01, 0.04, outline=0, bevel=0)
for sx in (-1, 1):
    for sy in (-1, 1):
        cyl(f'carwheel{sx}{sy}', M['tyre'], 0.032, 0.025, segs=14, outline=0.005, matrix=Matrix.Translation((CX + sx * 0.09, CY + sy * 0.065, G + 0.03)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
cyl('carlamp', M['chrome'], 0.015, 0.01, segs=10, outline=0.003, matrix=Matrix.Translation((CX + 0.15, CY - 0.04, G + 0.08)) @ Matrix.Rotation(math.pi / 2, 4, 'Y'))

# ---------- an Art Deco corner building behind, palms along the avenue ----------
DX, DY = -0.55, 0.75
lathe('decocorner', M['deco'], ((0.22, 0), (0.22, 0.36)), G - 0.005, DX, DY, segs=28, outline=0.018)
for k, z in enumerate((0.1, 0.22, 0.34)):
    lathe(f'decoband{k}', M['white'], ((0.225, 0), (0.225, 0.02)), G + z, DX, DY, segs=28, outline=0)
box('decowing', M['deco'], DX + 0.32, DY + 0.05, G - 0.005, 0.4, 0.22, 0.3, outline=0.018, bevel=0)
box('deco2', M['decoPink'], 0.55, 0.78, G - 0.005, 0.36, 0.24, 0.26, outline=0.018, bevel=0)
for k in range(3):
    box(f'deco2win{k}', M['glass'], 0.43 + k * 0.12, 0.78 - 0.122, G + 0.12, 0.06, 0.01, 0.04, outline=0, bevel=0)
for k, x in enumerate((-1.05, -0.75, 0.85, 1.12)):
    y = -0.45 if abs(x) > 1 else -0.5
    h = rng.uniform(0.3, 0.36)
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + h), 0.016, r2=0.012, segs=8, outline=0.007)
    for f in range(7):
        b = 2 * math.pi * f / 7 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.02, y, G + h), (x + 0.02 + 0.12 * math.cos(b), y + 0.12 * math.sin(b), G + h - 0.06), 0.024, outline=0.006)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
