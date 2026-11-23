# A cartoon Strasbourg for the country maps, built in the set's shared look (../toon.py): the
# cathedral of pink Vosges sandstone, its lacy west front with the great rose window and its single
# soaring openwork spire on the north tower, over the half-timbered houses of Petite France leaning
# along the canal of the Ill, with flower boxes. Turned a little towards the camera.
# Run: blender -b --factory-startup -P strasbourg.py -- strasbourg-1024.png 1024 strasbourg.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d8d0c0', shadow_mul=(0.84, 0.82, 0.88), lift=0.2),
    'canal': toon('canal', '#4a7a9a', lift=0.3),
    'pink': toon('pinkStone', '#d07a6a', shadow_mul=(0.86, 0.76, 0.76), lift=0.08),
    'pinkDark': toon('pinkDark', '#a85848', shadow_mul=(0.86, 0.76, 0.76)),
    'rose': toon('rose', '#2f5ab0', lift=0.2),
    'roof': toon('roof', '#5a5a62'),
    'tileRoof': toon('tileRoof', '#b8583a'),
    'plaster': toon('plaster', '#f6efe0', lift=0.15),
    'beam': toon('beam', '#6a3a24'),
    'window': flat('window', '#2e3a4a'),
    'flower': toon('flower', '#e8402c', lift=0.2),
})

G = tile(M['paving'])
before = set(bpy.data.objects)

box('canal', M['canal'], 0.0, -0.62, G - 0.004, 2.5, 0.26, 0.01, outline=0.004, bevel=0)

# ---------- the cathedral ----------
CX, CY = -0.1, 0.35
box('nave', M['pink'], CX + 0.05, CY + 0.32, G - 0.005, 0.36, 0.6, 0.32, outline=0.01, bevel=0)
loft('naveroof', M['roof'], [[(CX - 0.13, CY + 0.02, G + 0.315), (CX + 0.23, CY + 0.02, G + 0.315), (CX + 0.23, CY + 0.62, G + 0.315), (CX - 0.13, CY + 0.62, G + 0.315)],
                             [(CX + 0.046, CY + 0.02, G + 0.44), (CX + 0.054, CY + 0.02, G + 0.44), (CX + 0.054, CY + 0.62, G + 0.44), (CX + 0.046, CY + 0.62, G + 0.44)]], outline=0.007)
box('westfront', M['pink'], CX, CY, G - 0.005, 0.56, 0.12, 0.52, outline=0.011, bevel=0)
for j in range(7):
    bar(f'tracery{j}', M['pinkDark'], (CX - 0.24 + j * 0.08, CY - 0.062, G + 0.02), (CX - 0.24 + j * 0.08, CY - 0.062, G + 0.5), 0.01, outline=0)
cyl('rosewindow', M['rose'], 0.08, 0.008, segs=22, outline=0.004, matrix=Matrix.Translation((CX, CY - 0.066, G + 0.33)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for j in range(8):
    a = math.pi * j / 4
    bar(f'rosespoke{j}', M['pinkDark'], (CX, CY - 0.074, G + 0.33), (CX + 0.075 * math.cos(a), CY - 0.074, G + 0.33 + 0.075 * math.sin(a)), 0.007, outline=0)
for j, x in enumerate((-0.18, 0.0, 0.18)):
    box(f'portal{j}', M['window'], CX + x, CY - 0.063, G - 0.005, 0.07 if j != 1 else 0.09, 0.006, 0.14 if j != 1 else 0.17, outline=0, bevel=0)
    lathe(f'portalgable{j}', M['pinkDark'], ((0.06, 0), (0.004, 0.1)), G + (0.14 if j != 1 else 0.17), CX + x, CY - 0.07, segs=4, outline=0.002, smooth=False)
# the north tower and its single spire (on the left); the south tower stops at the platform
box('platform', M['pink'], CX, CY, G + 0.515, 0.56, 0.12, 0.03, outline=0.005, bevel=0)
NX = CX - 0.16
box('northtower', M['pink'], NX, CY, G + 0.54, 0.16, 0.12, 0.24, outline=0.008, bevel=0)
box('northtowerwin', M['window'], NX, CY - 0.062, G + 0.58, 0.05, 0.006, 0.16, outline=0, bevel=0)
z = G + 0.78
for t, (r, h) in enumerate(((0.07, 0.1), (0.055, 0.09), (0.04, 0.08), (0.028, 0.07))):
    lathe(f'spiretier{t}', M['pinkDark' if t % 2 else 'pink'], ((r, 0), (r * 0.8, h)), z, NX, CY, segs=8, outline=0.004, smooth=False)
    for j in range(4):
        a = math.pi / 4 + j * math.pi / 2
        lathe(f'spirepin{t}{j}', M['pink'], ((0.01, 0), (0.004, 0.05)), z + h - 0.01, NX + r * math.cos(a), CY + r * math.sin(a), segs=4, outline=0.001, smooth=False)
    z += h
lathe('spiretop', M['pink'], ((0.02, 0), (0.004, 0.12)), z, NX, CY, segs=8, outline=0.003, smooth=False)

# ---------- Petite France along the canal ----------
for k, x in enumerate((-1.0, -0.72, -0.44, -0.16, 0.12, 0.4, 0.68, 0.96)):
    y = -0.38
    if abs(x) > 1.05:
        continue
    h = 0.18 + 0.04 * (k % 2)
    box(f'house{k}', M['plaster'], x, y, G - 0.005, 0.24, 0.18, h, outline=0.007, bevel=0)
    for j in range(3):
        bar(f'beamv{k}{j}', M['beam'], (x - 0.1 + j * 0.1, y - 0.092, G), (x - 0.1 + j * 0.1, y - 0.092, G + h - 0.01), 0.012, outline=0)
        bar(f'beamd{k}{j}', M['beam'], (x - 0.1 + j * 0.1, y - 0.092, G + 0.02), (x - 0.05 + j * 0.1, y - 0.092, G + h * 0.5), 0.009, outline=0)
    bar(f'beamh{k}', M['beam'], (x - 0.12, y - 0.092, G + h * 0.5), (x + 0.12, y - 0.092, G + h * 0.5), 0.012, outline=0)
    box(f'housewin{k}', M['window'], x + 0.05, y - 0.093, G + h * 0.65, 0.04, 0.004, 0.04, outline=0, bevel=0)
    box(f'flowerbox{k}', M['flower'], x + 0.05, y - 0.1, G + h * 0.6, 0.05, 0.015, 0.015, outline=0.001, bevel=0)
    loft(f'houseroof{k}', M['tileRoof'], [[(x - 0.13, y - 0.1, G + h - 0.005), (x + 0.13, y - 0.1, G + h - 0.005), (x + 0.13, y + 0.1, G + h - 0.005), (x - 0.13, y + 0.1, G + h - 0.005)],
                                          [(x - 0.004, y - 0.1, G + h + 0.16), (x + 0.004, y - 0.1, G + h + 0.16), (x + 0.004, y + 0.1, G + h + 0.16), (x - 0.004, y + 0.1, G + h + 0.16)]], outline=0.006)

turn(before, -20)
render(G)
