# A cartoon Weimar for the country maps, built in the set's shared look (../toon.py): the bronze
# Goethe and Schiller monument on its granite plinth, the two poets side by side sharing a laurel
# wreath, in front of the German National Theatre's columned portico on the Theaterplatz, with the
# square's lime trees and the old town's houses. Turned a little towards the camera.
# Run: blender -b --factory-startup -P weimar.py -- weimar-1024.png 1024 weimar.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#c8c0b0', shadow_mul=(0.82, 0.8, 0.88), lift=0.2),
    'stone': toon('stone', '#e8dcc0', shadow_mul=(0.86, 0.84, 0.86), lift=0.15),
    'stoneDark': toon('stoneDark', '#c8b894'),
    'granite': toon('granite', '#8a8480', lift=0.08),
    'bronze': toon('bronze', '#4a7a6a', shadow_mul=(0.8, 0.86, 0.84), lift=0.15),
    'roof': toon('roof', '#5a5e66'),
    'red': toon('red', '#c4603e'),
    'cream': toon('cream', '#f0e2c4', lift=0.1),
    'yellow': toon('yellow', '#ecc878', lift=0.1),
    'dark': flat('dark', '#2e2a2a'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a4a36'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)

# ---------- the theatre behind ----------
TY = 0.55
box('theatre', M['stone'], 0, TY + 0.15, G - 0.005, 1.0, 0.4, 0.3, outline=0.009, bevel=0)
loft('theatreroof', M['roof'], [[(-0.5, TY - 0.05, G + 0.295), (0.5, TY - 0.05, G + 0.295), (0.5, TY + 0.35, G + 0.295), (-0.5, TY + 0.35, G + 0.295)],
                                [(-0.46, TY + 0.13, G + 0.38), (0.46, TY + 0.13, G + 0.38), (0.46, TY + 0.17, G + 0.38), (-0.46, TY + 0.17, G + 0.38)]], outline=0.005)
for row in range(2):
    for j in range(10):
        x = -0.45 + j * 0.1
        if abs(x) < 0.2:
            continue
        box(f'theatrewin{row}{j}', M['dark'], x, TY - 0.053, G + 0.08 + row * 0.11, 0.035, 0.006, 0.06, outline=0, bevel=0)
# the portico with its columns and pediment
box('porticofloor', M['stoneDark'], 0, TY - 0.12, G - 0.005, 0.42, 0.16, 0.04, outline=0.003, bevel=0)
for j in range(6):
    x = -0.17 + j * 0.068
    rod(f'column{j}', M['stone'], (x, TY - 0.17, G + 0.035), (x, TY - 0.17, G + 0.26), 0.016, segs=10, outline=0.002)
box('entablature', M['stoneDark'], 0, TY - 0.11, G + 0.26, 0.42, 0.16, 0.04, outline=0.004, bevel=0)
box('inscription', M['bronze'], 0, TY - 0.192, G + 0.27, 0.28, 0.006, 0.02, outline=0, bevel=0)
loft('pediment', M['stone'], [[(-0.21, TY - 0.19, G + 0.3), (0.21, TY - 0.19, G + 0.3), (0.21, TY - 0.03, G + 0.3), (-0.21, TY - 0.03, G + 0.3)],
                              [(-0.004, TY - 0.19, G + 0.37), (0.004, TY - 0.19, G + 0.37), (0.004, TY - 0.03, G + 0.37), (-0.004, TY - 0.03, G + 0.37)]], outline=0.004)
box('theatredoor', M['dark'], 0, TY - 0.052, G + 0.035, 0.08, 0.006, 0.12, outline=0, bevel=0)

# ---------- the monument (built at 1, then grown: it is the landmark) ----------
MX, MY = 0.0, -0.1
monument = set(bpy.data.objects)
box('plinthstep', M['granite'], MX, MY, G - 0.005, 0.36, 0.26, 0.04, outline=0.004, bevel=0)
box('plinth', M['granite'], MX, MY, G + 0.035, 0.28, 0.18, 0.2, outline=0.006, bevel=0)
box('plinthcap', M['granite'], MX, MY, G + 0.23, 0.31, 0.21, 0.02, outline=0.002, bevel=0)
box('plinthplaque', M['bronze'], MX, MY - 0.092, G + 0.1, 0.16, 0.006, 0.06, outline=0, bevel=0)
PZ = G + 0.25
for s, (dx, tall) in ((-1, (-0.055, 0.32)), (1, (0.055, 0.35))):
    x = MX + dx
    # legs and long coat, the body, the arm reaching to the shared wreath, the head
    rod(f'poetlegs{s}', M['bronze'], (x, MY, PZ), (x, MY, PZ + 0.12), 0.03, r2=0.026, segs=10, outline=0.003)
    rod(f'poetcoat{s}', M['bronze'], (x, MY, PZ + 0.08), (x, MY, PZ + tall - 0.07), 0.035, r2=0.028, segs=10, outline=0.004)
    ball(f'poethead{s}', M['bronze'], x, MY - 0.005, PZ + tall - 0.035, 0.026, outline=0.003)
    bar(f'poetarm{s}', M['bronze'], (x - s * 0.02, MY - 0.02, PZ + tall - 0.1), (MX, MY - 0.04, PZ + tall - 0.14), 0.016, outline=0.002)
    bar(f'poetotherarm{s}', M['bronze'], (x + s * 0.03, MY, PZ + tall - 0.1), (x + s * 0.045, MY - 0.01, PZ + tall - 0.2), 0.016, outline=0.002)
lathe('wreath', M['bronze'], ((0.03, 0), (0.035, 0.01), (0.03, 0.02)), PZ + 0.17, MX, MY - 0.045, segs=14, outline=0.002)

bpy.context.view_layer.update()
grow = Matrix.Translation((MX, MY, G)) @ Matrix.Scale(1.6, 4) @ Matrix.Translation((-MX, -MY, -G))
for o in set(bpy.data.objects) - monument:
    o.matrix_world = grow @ o.matrix_world

# ---------- the square's trees and the houses at the sides ----------
for k, (x, y) in enumerate(((-0.62, -0.3), (0.62, -0.3), (-0.75, -0.75), (0.75, -0.75), (-0.4, -0.95), (0.4, -0.95))):
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.09), 0.014, segs=6, outline=0.002)
    ball(f'tree{k}', M['tree'], x, y, G + 0.18, 0.12, outline=0.012)
for s in (-1, 1):
    for k, y in enumerate((0.1, -0.25)):
        x = s * 0.95
        mat = M['cream'] if (k + (s > 0)) % 2 else M['yellow']
        box(f'house{s}{k}', mat, x, y, G - 0.005, 0.24, 0.3, 0.22, outline=0.006, bevel=0)
        for j in range(3):
            box(f'housewin{s}{k}{j}', M['dark'], x - s * 0.123, y - 0.1 + j * 0.1, G + 0.11, 0.006, 0.035, 0.05, outline=0, bevel=0)
        loft(f'houseroof{s}{k}', M['red'], [[(x - 0.12, y - 0.15, G + 0.215), (x + 0.12, y - 0.15, G + 0.215), (x + 0.12, y + 0.15, G + 0.215), (x - 0.12, y + 0.15, G + 0.215)],
                                            [(x - 0.004, y - 0.15, G + 0.3), (x + 0.004, y - 0.15, G + 0.3), (x + 0.004, y + 0.15, G + 0.3), (x - 0.004, y + 0.15, G + 0.3)]], outline=0.003)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
