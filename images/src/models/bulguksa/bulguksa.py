# A cartoon Bulguksa for the country maps, built in the set's shared look (../toon.py): the Silla
# temple near Gyeongju, its granite terrace walls with the arched stone stair-bridges up to the
# gate, the halls above painted green and red under curving grey tiled roofs, the two stone pagodas
# in the courtyard (ornate Dabotap and plain Seokgatap), and maples in autumn red.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P bulguksa.py -- bulguksa-1024.png 1024 bulguksa.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'granite': toon('granite', '#c8c0b0', shadow_mul=(0.82, 0.82, 0.88)),
    'graniteDark': toon('graniteDark', '#a8a092', shadow_mul=(0.82, 0.82, 0.88)),
    'paving': toon('paving', '#e2d8c2', lift=0.2),
    'red': toon('dancheongRed', '#b8402c'),
    'green': toon('dancheongGreen', '#3f8a6a'),
    'roof': toon('roof', '#5a5e66', shadow_mul=(0.8, 0.82, 0.9)),
    'window': flat('window', '#3a3640'),
    'maple': toon('maple', '#d84a2a', lift=0.2),
    'mapleGold': toon('mapleGold', '#f0a030', lift=0.25),
    'trunk': toon('trunk', '#5a4038'),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)
rng = random.Random(1723)

# ---------- the terrace and its stair-bridges ----------
box('terrace', M['granite'], 0.0, 0.3, G - 0.005, 1.6, 0.7, 0.18, outline=0.014, bevel=0)
for j in range(10):
    box(f'terracecourse{j}', M['graniteDark'], -0.75 + j * 0.166, -0.052, G + 0.04, 0.09, 0.006, 0.03, outline=0, bevel=0)
box('terracetop', M['paving'], 0.0, 0.3, G + 0.17, 1.58, 0.68, 0.012, outline=0.004, bevel=0)
T = G + 0.18
for k, x in enumerate((-0.3, 0.25)):
    for i in range(6):
        box(f'stair{k}{i}', M['granite'], x, -0.12 + i * 0.03, G - 0.005, 0.14, 0.04, 0.03 * (i + 1), outline=0.003, bevel=0)
    box(f'bridgearch{k}', M['window'], x, -0.13, G - 0.005, 0.06, 0.006, 0.05, outline=0, bevel=0)

# ---------- the halls above: a gate, the main hall behind ----------
def hall(name, x, y, w, d, h):
    box(name, M['green'], x, y, T - 0.005, w, d, h, outline=0.01, bevel=0)
    for j in range(int(w / 0.06)):
        rod(f'{name}col{j}', M['red'], (x - w / 2 + 0.03 + j * 0.06, y - d / 2 - 0.004, T), (x - w / 2 + 0.03 + j * 0.06, y - d / 2 - 0.004, T + h), 0.008, segs=6, outline=0.002)
    e = 0.06
    loft(f'{name}roof', M['roof'], [[(x - w / 2 - e, y - d / 2 - e, T + h + 0.03), (x + w / 2 + e, y - d / 2 - e, T + h + 0.03), (x + w / 2 + e, y + d / 2 + e, T + h + 0.03),
                                     (x - w / 2 - e, y + d / 2 + e, T + h + 0.03)],
                                    [(x - w / 2, y - d / 2, T + h + 0.05), (x + w / 2, y - d / 2, T + h + 0.05), (x + w / 2, y + d / 2, T + h + 0.05), (x - w / 2, y + d / 2, T + h + 0.05)],
                                    [(x - w * 0.3, y - 0.006, T + h + 0.14), (x + w * 0.3, y - 0.006, T + h + 0.14), (x + w * 0.3, y + 0.006, T + h + 0.14),
                                     (x - w * 0.3, y + 0.006, T + h + 0.14)]], outline=0.008)


hall('jahamun', 0.0, 0.05, 0.4, 0.14, 0.09)
hall('daeungjeon', 0.0, 0.5, 0.56, 0.22, 0.12)
for s in (-1, 1):
    box(f'corridor{s}', M['red'], s * 0.55, 0.3, T - 0.005, 0.1, 0.5, 0.07, outline=0.006, bevel=0)
    box(f'corridorroof{s}', M['roof'], s * 0.55, 0.3, T + 0.065, 0.14, 0.52, 0.025, outline=0.004, bevel=0)

# ---------- the two pagodas ----------
DX, DY = -0.25, 0.28
box('dabotapbase', M['granite'], DX, DY, T - 0.005, 0.1, 0.1, 0.05, outline=0.005, bevel=0)
for i in range(3):
    lathe(f'dabotap{i}', M['granite'], ((0.045 - i * 0.008, 0), (0.035 - i * 0.008, 0.04), (0.05 - i * 0.008, 0.045)), T + 0.045 + i * 0.05, DX, DY, segs=8, outline=0.004)
lathe('dabotaptop', M['granite'], ((0.012, 0), (0.004, 0.06)), T + 0.19, DX, DY, segs=8, outline=0.002)
SX, SY = 0.25, 0.28
for i in range(3):
    w = 0.08 - i * 0.015
    box(f'seokgatap{i}', M['granite'], SX, SY, T - 0.005 + i * 0.06, w * 0.6, w * 0.6, 0.04, outline=0.004, bevel=0)
    box(f'seokgatapcap{i}', M['granite'], SX, SY, T + 0.035 + i * 0.06, w, w, 0.015, outline=0.004, bevel=0)
lathe('seokgataptop', M['granite'], ((0.01, 0), (0.004, 0.05)), T + 0.2, SX, SY, segs=8, outline=0.002)

# ---------- autumn maples ----------
for k, (x, y) in enumerate(((-0.9, -0.35), (-0.6, -0.55), (0.65, -0.5), (0.95, -0.25), (-1.0, 0.7), (0.95, 0.75), (0.0, -0.65))):
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.08), 0.012, segs=6, outline=0.003)
    ball(f'maple{k}', M['maple' if k % 2 else 'mapleGold'], x, y, G + 0.14, rng.uniform(0.07, 0.09), outline=0.011)

turn(before, -20)
render(G)
