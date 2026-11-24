# A cartoon Villa d'Este for the country maps, built in the set's shared look (../toon.py): the
# Renaissance villa at Tivoli on top of its terraced garden, the Organ Fountain's baroque front with
# its cascade below, the long wall of the Hundred Fountains with its row of jets, the fishponds and
# the tall cypresses. Turned a little towards the camera.
# Run: blender -b --factory-startup -P villa-deste.py -- villa-deste-1024.png 1024 villa-deste.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'terrace': toon('terrace', '#6aa54a', shadow_mul=(0.7, 0.78, 0.8)),
    'stone': toon('stone', '#e0d4bc', shadow_mul=(0.84, 0.82, 0.86), lift=0.12),
    'villa': toon('villa', '#e8c890', shadow_mul=(0.86, 0.82, 0.76), lift=0.1),
    'roof': toon('roof', '#c4603e'),
    'window': flat('window', '#3a3a44'),
    'water': toon('water', '#5aa8d0', lift=0.3),
    'spray': toon('spray', '#ffffff', shadow_mul=(0.86, 0.9, 0.97), lift=0.15),
    'cypress': toon('cypress', '#3f6a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)

def segment(c, r, z, n=26):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


# ---------- the terraces up to the villa ----------
STEPS = 3
for t in range(STEPS):
    y0 = 0.1 + t * 0.22
    z = (t + 1) * 0.09
    half = math.sqrt(max(0.0, 1.3 ** 2 - y0 ** 2))
    tr = loft(f'terrace{t}', M['terrace'], [segment(y0, 1.3, -0.01), segment(y0, 1.3, z)], outline=0.006)
    tr.visible_shadow = False
    box(f'terracewall{t}', M['stone'], 0.0, y0, G + z - 0.02, 2 * half - 0.05, 0.02, 0.02, outline=0.002, bevel=0)
T = G + STEPS * 0.09

# ---------- the villa ----------
VX, VY = 0.0, 0.82
box('villa', M['villa'], VX, VY, T - 0.005, 0.8, 0.18, 0.2, outline=0.01, bevel=0)
for r in range(2):
    for j in range(9):
        box(f'villawin{r}{j}', M['window'], VX - 0.36 + j * 0.09, VY - 0.092, T + 0.04 + r * 0.08, 0.035, 0.006, 0.05, outline=0, bevel=0)
loft('villaroof', M['roof'], [[(VX - 0.41, VY - 0.1, T + 0.195), (VX + 0.41, VY - 0.1, T + 0.195), (VX + 0.41, VY + 0.1, T + 0.195), (VX - 0.41, VY + 0.1, T + 0.195)],
                              [(VX - 0.37, VY - 0.004, T + 0.25), (VX + 0.37, VY - 0.004, T + 0.25), (VX + 0.37, VY + 0.004, T + 0.25), (VX - 0.37, VY + 0.004, T + 0.25)]], outline=0.006)
box('loggia', M['stone'], VX, VY - 0.1, T - 0.005, 0.22, 0.05, 0.22, outline=0.005, bevel=0)

# ---------- the Hundred Fountains along the second terrace ----------
HY = 0.1 + 1 * 0.22
for j in range(15):
    x = -0.7 + j * 0.1
    lathe(f'hundredjet{j}', M['spray'], ((0.012, 0), (0.004, 0.05)), G + 0.15, x, HY - 0.025, segs=6, outline=0.001)
box('hundredchannel', M['water'], 0.0, HY - 0.04, G + 0.14, 1.5, 0.04, 0.02, outline=0.002, bevel=0)

# ---------- the Organ Fountain and its cascade ----------
OX, OY = 0.0, 0.1
box('organ', M['stone'], OX, OY, G - 0.005, 0.36, 0.1, 0.4, outline=0.009, bevel=0)
for j in range(5):
    rod(f'organcol{j}', M['stone'], (OX - 0.14 + j * 0.07, OY - 0.06, G), (OX - 0.14 + j * 0.07, OY - 0.06, G + 0.34), 0.012, segs=8, outline=0.002)
box('organniche', M['window'], OX, OY - 0.052, G + 0.18, 0.08, 0.006, 0.12, outline=0, bevel=0)
lathe('organtop', M['stone'], ((0.08, 0), (0.06, 0.05), (0.004, 0.1)), G + 0.395, OX, OY, segs=10, outline=0.004)
for j in range(5):
    bar(f'cascade{j}', M['spray'], (OX - 0.08 + j * 0.04, OY - 0.07, G + 0.12), (OX - 0.08 + j * 0.04, OY - 0.2, G + 0.01), 0.025, outline=0.002)

# ---------- the fishponds ----------
for s in (-1, 1):
    box(f'fishpondrim{s}', M['stone'], s * 0.35, -0.4, G - 0.004, 0.5, 0.18, 0.02, outline=0.003, bevel=0)
    box(f'fishpond{s}', M['water'], s * 0.35, -0.4, G - 0.003, 0.46, 0.14, 0.025, outline=0.002, bevel=0)
lathe('poolfountain', M['spray'], ((0.025, 0), (0.008, 0.16)), G, 0.0, -0.4, segs=8, outline=0.002)

# ---------- cypresses ----------
for k, (x, y) in enumerate(((-0.95, -0.2), (-0.8, -0.55), (0.95, -0.2), (0.8, -0.55), (-0.6, -0.8), (0.6, -0.8), (-0.95, 0.2), (0.95, 0.2))):
    lathe(f'cypress{k}', M['cypress'], ((0.035, 0), (0.045, 0.07), (0.03, 0.2), (0.004, 0.3)), G - 0.005, x, y, segs=8, outline=0.005)

turn(before, -20)
render(G)
