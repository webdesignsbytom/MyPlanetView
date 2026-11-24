# A cartoon Aphrodisias for the country maps, built in the set's shared look (../toon.py): the
# Tetrapylon, the monumental gateway to the sanctuary of Aphrodite, its four rows of four white
# marble columns, the front pair with spiral fluting, carrying the pediment with the arched centre,
# the ruined columns of the temple beyond, and the poplars and olives of the site. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P aphrodisias.py -- aphrodisias-1024.png 1024 aphrodisias.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#8ab85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'paving': toon('paving', '#d8d0c0'),
    'marble': toon('marble', '#f2ece0', shadow_mul=(0.82, 0.84, 0.9), lift=0.15),
    'marbleDark': toon('marbleDark', '#d0c8b8'),
    'dark': flat('dark', '#8a8070'),
    'poplar': toon('poplar', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'olive': toon('olive', '#7a9a50', shadow_mul=(0.72, 0.8, 0.74)),
})

G = tile(M['grass'])
before = set(bpy.data.objects)

TX, TY = 0.0, 0.0
box('platform', M['paving'], TX, TY, G - 0.005, 0.6, 0.46, 0.03, outline=0.004, bevel=0)
for k in range(3):
    box(f'step{k}', M['paving'], TX, TY - 0.24 - k * 0.025, G - 0.005, 0.5, 0.03, 0.025 - k * 0.008, outline=0.001, bevel=0)
Z = G + 0.025
XS = (-0.2, -0.067, 0.067, 0.2)
YS = (-0.16, -0.06, 0.06, 0.16)
for i, y in enumerate(YS):
    for j, x in enumerate(XS):
        box(f'plinth{i}{j}', M['marbleDark'], x, y, Z - 0.005, 0.05, 0.05, 0.04, outline=0.001, bevel=0)
        rod(f'col{i}{j}', M['marble'], (x, y, Z + 0.035), (x, y, Z + 0.33), 0.018, segs=12, outline=0.002)
        lathe(f'capital{i}{j}', M['marble'], ((0.018, 0), (0.028, 0.03), (0.028, 0.036)), Z + 0.33, x, y, segs=10, outline=0.001)
        if i == 0:
            for k in range(6):
                z0 = Z + 0.05 + k * 0.045
                a0 = k * 1.4
                bar(f'flute{j}{k}', M['dark'], (x + 0.019 * math.cos(a0), y + 0.019 * math.sin(a0), z0), (x + 0.019 * math.cos(a0 + 1.4), y + 0.019 * math.sin(a0 + 1.4), z0 + 0.045), 0.004, outline=0)
for i, y in enumerate((YS[0], YS[3])):
    box(f'entablature{i}', M['marble'], TX, y, Z + 0.365, 0.5, 0.06, 0.04, outline=0.003, bevel=0)
# the pediment with the arched centre on the front
FY = YS[0]
for s in (-1, 1):
    loft(f'pedhalf{s}', M['marble'], [[(TX + s * 0.25, FY - 0.03, Z + 0.405), (TX + s * 0.07, FY - 0.03, Z + 0.405), (TX + s * 0.07, FY + 0.03, Z + 0.405), (TX + s * 0.25, FY + 0.03, Z + 0.405)],
                                      [(TX + s * 0.25, FY - 0.03, Z + 0.41), (TX + s * 0.07, FY - 0.03, Z + 0.47), (TX + s * 0.07, FY + 0.03, Z + 0.47), (TX + s * 0.25, FY + 0.03, Z + 0.41)]], outline=0.003)
cyl('pedarch', M['marble'], 0.07, 0.06, segs=18, outline=0.003, matrix=Matrix.Translation((TX, FY, Z + 0.405)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
cyl('pedarchin', M['dark'], 0.05, 0.062, segs=18, outline=0, matrix=Matrix.Translation((TX, FY, Z + 0.405)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
box('pedarchcut', M['marble'], TX, FY, Z + 0.38, 0.16, 0.064, 0.026, outline=0, bevel=0)

# ---------- the temple's columns beyond ----------
for j in range(6):
    x = -0.3 + j * 0.12
    h = 0.26 if j % 2 == 0 else 0.2
    rod(f'templecol{j}', M['marble'], (x, 0.62, G - 0.005), (x, 0.62, G + h), 0.017, segs=10, outline=0.002)
box('templebeam', M['marble'], -0.24, 0.62, G + 0.26, 0.26, 0.04, 0.03, outline=0.002, bevel=0)
for k, (x, y) in enumerate(((-0.75, 0.3), (0.75, 0.3), (-0.6, 0.7), (0.65, 0.68))):
    lathe(f'poplar{k}', M['poplar'], ((0.04, 0), (0.045, 0.12), (0.004, 0.36)), G - 0.005, x, y, segs=10, outline=0.004)
for k, (x, y) in enumerate(((-0.7, -0.45), (0.7, -0.45), (-0.4, -0.75), (0.4, -0.75))):
    ball(f'olive{k}', M['olive'], x, y, G + 0.07, 0.07, outline=0.005)

turn(before, -20)
render(G)
