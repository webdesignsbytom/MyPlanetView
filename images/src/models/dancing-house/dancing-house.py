# A cartoon Dancing House for the country maps, built in the set's shared look (../toon.py): Gehry and
# Milunić's "Fred and Ginger" on the Vltava embankment in Prague, the glass tower pinched at the waist
# leaning on the solid concrete one with its wavy rows of windows, the twisted metal "Medusa" dome on
# its roof, the river in front and the neighbouring nineteenth-century houses. Turned a little towards
# the camera.
# Run: blender -b --factory-startup -P dancing-house.py -- dancing-house-1024.png 1024 dancing-house.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#c8c0b0', shadow_mul=(0.82, 0.8, 0.88), lift=0.2),
    'river': toon('river', '#4a8aa0', shadow_mul=(0.78, 0.86, 0.9), lift=0.3),
    'concrete': toon('concrete', '#e4dccc', shadow_mul=(0.84, 0.84, 0.9), lift=0.18),
    'glass': toon('glass', '#8ab8d0', shadow_mul=(0.8, 0.88, 0.94), lift=0.3),
    'steel': toon('steel', '#8e969e'),
    'window': flat('window', '#3a4048'),
    'house': toon('house', '#e8d8b8', lift=0.12),
    'houseB': toon('houseB', '#d8c4a4', lift=0.1),
    'roof': toon('roof', '#c4603e'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a4a36'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)


def strip(y0, y1, r, z, n=6):
    """The band of the tile's disc between y0 and y1 (counter-clockwise from above)."""
    xa0, xa1 = math.sqrt(r * r - y0 * y0), math.sqrt(r * r - y1 * y1)
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    pts = [(-xa0, y0), (xa0, y0)]
    pts += [(r * math.cos(a0 + (a1 - a0) * k / n), r * math.sin(a0 + (a1 - a0) * k / n)) for k in range(1, n)]
    pts += [(xa1, y1), (-xa1, y1)]
    pts += [(r * math.cos(math.pi - a1 + (a1 - a0) * k / n), r * math.sin(math.pi - a1 + (a1 - a0) * k / n)) for k in range(1, n)]
    return [(x, y, G + z) for x, y in pts]


loft('vltava', M['river'], [strip(-1.41, -0.5, 1.42, -0.004), strip(-1.41, -0.5, 1.42, 0.004)], outline=0)
box('embankment', M['concrete'], 0, -0.5, G - 0.005, 2.4, 0.04, 0.03, outline=0.003, bevel=0)
for k, x in enumerate((-0.9, -0.6, 0.6, 0.9)):
    rod(f'trunk{k}', M['trunk'], (x, -0.38, G), (x, -0.38, G + 0.07), 0.012, segs=6, outline=0.002)
    ball(f'tree{k}', M['tree'], x, -0.38, G + 0.14, 0.085, outline=0.01)

# ---------- Ginger: the glass tower, pinched at the waist and leaning ----------
H = 0.78
GX, GY = -0.14, 0.0
rings = []
for k in range(9):
    t = k / 8
    z = G - 0.005 + H * t
    pinch = 1 - 0.38 * math.exp(-((t - 0.5) / 0.18) ** 2)
    r = 0.12 * pinch
    lean = 0.06 * math.sin(math.pi * t) + 0.04 * t
    rings.append([(GX + lean + r * math.cos(2 * math.pi * j / 16), GY + r * math.sin(2 * math.pi * j / 16), z) for j in range(16)])
loft('ginger', M['glass'], rings, outline=0.007, smooth=True)
# her concrete "legs": the columns at the foot
for j in range(3):
    rod(f'gingerleg{j}', M['concrete'], (GX - 0.08 + j * 0.08, GY - 0.11, G - 0.005), (GX - 0.06 + j * 0.06, GY - 0.08, G + 0.14), 0.014, segs=8, outline=0.002)
for k in range(1, 8):
    t = k / 8
    pinch = 1 - 0.38 * math.exp(-((t - 0.5) / 0.18) ** 2)
    lean = 0.06 * math.sin(math.pi * t) + 0.04 * t
    lathe(f'gingerband{k}', M['steel'], ((0.122 * pinch, 0), (0.122 * pinch, 0.006)), G + H * t, GX + lean, GY, segs=16, outline=0)

# ---------- Fred: the solid tower with its wavy windows ----------
FX, FY = 0.14, 0.04
box('fred', M['concrete'], FX, FY, G - 0.005, 0.26, 0.26, H - 0.06, outline=0.009, bevel=0)
for row in range(7):
    z = G + 0.07 + row * 0.09
    for j in range(3):
        x = FX - 0.08 + j * 0.08 + 0.02 * math.sin(row * 1.4 + j)
        box(f'fredwin{row}{j}', M['window'], x, FY - 0.133, z + 0.01 * math.cos(row + j), 0.04, 0.006, 0.04, outline=0, bevel=0)
        box(f'fredframe{row}{j}', M['concrete'], x, FY - 0.137, z - 0.008 + 0.01 * math.cos(row + j), 0.05, 0.006, 0.008, outline=0, bevel=0)
# the wavy cornice lines across Fred's front
for row in range(7):
    z = G + 0.06 + row * 0.09
    pts = [(FX - 0.13 + 0.26 * k / 8, FY - 0.132, z + 0.012 * math.sin(k * 0.9 + row)) for k in range(9)]
    for k, (a, b) in enumerate(zip(pts, pts[1:])):
        bar(f'wave{row}{k}', M['houseB'], a, b, 0.006, outline=0)
# the Medusa on the roof: a twisted dome of steel tubes
MZ = G + H - 0.065
for k in range(10):
    a = 2 * math.pi * k / 10
    pts = []
    for j in range(6):
        t = j / 5
        r = 0.08 * (1 - t ** 1.6) + 0.01
        aa = a + 1.6 * t
        pts.append((FX + r * math.cos(aa), FY + r * math.sin(aa), MZ + 0.12 * math.sin(t * math.pi / 2)))
    for j, (p, q) in enumerate(zip(pts, pts[1:])):
        bar(f'medusa{k}{j}', M['steel'], p, q, 0.01, outline=0)

# ---------- the neighbours ----------
for k, (x, mat, h) in enumerate(((-0.52, 'house', 0.56), (0.55, 'houseB', 0.6))):
    box(f'neighbour{k}', M[mat], x, 0.1, G - 0.005, 0.42, 0.36, h, outline=0.008, bevel=0)
    for row in range(5):
        for j in range(4):
            box(f'nwin{k}{row}{j}', M['window'], x - 0.15 + j * 0.1, 0.1 - 0.183, G + 0.06 + row * 0.1, 0.035, 0.006, 0.055, outline=0, bevel=0)
    loft(f'nroof{k}', M['roof'], [[(x - 0.21, -0.08, G + h - 0.005), (x + 0.21, -0.08, G + h - 0.005), (x + 0.21, 0.28, G + h - 0.005), (x - 0.21, 0.28, G + h - 0.005)],
                                  [(x - 0.21, 0.08, G + h + 0.08), (x + 0.21, 0.08, G + h + 0.08), (x + 0.21, 0.12, G + h + 0.08), (x - 0.21, 0.12, G + h + 0.08)]], outline=0.004)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
