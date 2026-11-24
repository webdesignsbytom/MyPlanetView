# A cartoon Wartburg for the country maps, built in the set's shared look (../toon.py): the castle
# along the top of its wooded hill above Eisenach, the Romanesque palace with its arcaded windows,
# the square keep with the cross on its roof, the half-timbered buildings of the courtyard in white
# and brown, the gate tower and the curtain wall round the summit, and the forest down the slopes.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P wartburg.py -- wartburg-1024.png 1024 wartburg.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#6aa54a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'hill': toon('hill', '#5a9a44', shadow_mul=(0.72, 0.8, 0.74)),
    'stone': toon('stone', '#c8b89a', shadow_mul=(0.86, 0.84, 0.82), lift=0.08),
    'stoneDark': toon('stoneDark', '#a8987a'),
    'white': toon('white', '#f4efe2', lift=0.15),
    'timber': toon('timber', '#6a4a30'),
    'slate': toon('slate', '#5a5e66'),
    'roof': toon('roof', '#a8503a'),
    'gold': toon('gold', '#f0c030', lift=0.3),
    'window': flat('window', '#3a3a42'),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'treeDark': toon('treeDark', '#2f6a34', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['grass'])
before = set(bpy.data.objects)
rng = random.Random(2399)
N = 32


def ring(rx, ry, z, cy=0.05):
    return [(rx * math.cos(2 * math.pi * j / N), cy + ry * math.sin(2 * math.pi * j / N), G + z) for j in range(N)]


RINGS = [(1.0, 0.62, -0.01), (0.8, 0.45, 0.18), (0.62, 0.27, 0.3)]
hl = loft('hill', M['hill'], [ring(*r) for r in RINGS], outline=0.01, smooth=True)
hl.visible_shadow = False
T = G + 0.3

# ---------- the forest on the slopes ----------
for k in range(30):
    j = rng.randrange(N)
    band = rng.randrange(2)
    u = rng.uniform(0.25, 0.8)
    (rx0, ry0, z0), (rx1, ry1, z1) = RINGS[band], RINGS[band + 1]
    a = 2 * math.pi * j / N
    x = (rx0 + (rx1 - rx0) * u) * math.cos(a)
    y = 0.05 + (ry0 + (ry1 - ry0) * u) * math.sin(a)
    z = G + z0 + (z1 - z0) * u
    r = rng.uniform(0.06, 0.09)
    ball(f'tree{k}', M['tree' if k % 2 else 'treeDark'], x, y, z + r * 0.7, r, outline=0.007)

# ---------- the curtain wall round the summit ----------
for j in range(N):
    a0, a1 = 2 * math.pi * j / N, 2 * math.pi * (j + 1) / N
    p0 = (0.6 * math.cos(a0), 0.05 + 0.25 * math.sin(a0))
    p1 = (0.6 * math.cos(a1), 0.05 + 0.25 * math.sin(a1))
    bar(f'curtain{j}', M['stone'], (p0[0], p0[1], T + 0.025), (p1[0], p1[1], T + 0.025), 0.05, outline=0.002)

# ---------- the palace ----------
PX, PY = -0.3, 0.02
box('palas', M['stone'], PX, PY, T - 0.005, 0.36, 0.18, 0.2, outline=0.008, bevel=0)
for r in range(3):
    for j in range(6):
        box(f'arcade{r}{j}', M['window'], PX - 0.15 + j * 0.06, PY - 0.092, T + 0.03 + r * 0.055, 0.03, 0.006, 0.035, outline=0, bevel=0)
loft('palasroof', M['slate'], [[(PX - 0.185, PY - 0.095, T + 0.195), (PX + 0.185, PY - 0.095, T + 0.195), (PX + 0.185, PY + 0.095, T + 0.195), (PX - 0.185, PY + 0.095, T + 0.195)],
                               [(PX - 0.185, PY - 0.004, T + 0.28), (PX + 0.185, PY - 0.004, T + 0.28), (PX + 0.185, PY + 0.004, T + 0.28), (PX - 0.185, PY + 0.004, T + 0.28)]], outline=0.005)

# ---------- the keep ----------
KX, KY = 0.06, 0.06
box('keep', M['stone'], KX, KY, T - 0.005, 0.13, 0.13, 0.36, outline=0.008, bevel=0)
box('keepwin', M['window'], KX, KY - 0.068, T + 0.26, 0.03, 0.006, 0.05, outline=0, bevel=0)
pyramid('keeproof', M['slate'], KX, KY, T + 0.355, 0.15, 0.12, outline=0.004)
rod('cross', M['gold'], (KX, KY, T + 0.47), (KX, KY, T + 0.56), 0.008, segs=6, outline=0.001)
bar('crossbar', M['gold'], (KX - 0.03, KY, T + 0.525), (KX + 0.03, KY, T + 0.525), 0.012, outline=0.001)

# ---------- the half-timbered buildings ----------
for k, (x, y, w, h) in enumerate(((0.3, 0.0, 0.22, 0.17), (0.46, 0.12, 0.14, 0.14))):
    box(f'fachwerk{k}', M['white'], x, y, T - 0.005, w, 0.15, h, outline=0.006, bevel=0)
    fy = y - 0.078
    for j in range(int(w / 0.05) + 1):
        xx = x - w / 2 + j * w / int(w / 0.05)
        bar(f'post{k}{j}', M['timber'], (xx, fy, T), (xx, fy, T + h - 0.01), 0.01, outline=0)
    for zz in (T + 0.005, T + h * 0.5, T + h - 0.01):
        bar(f'rail{k}{zz}', M['timber'], (x - w / 2, fy, zz), (x + w / 2, fy, zz), 0.01, outline=0)
    for j in range(int(w / 0.05)):
        xx = x - w / 2 + j * w / int(w / 0.05)
        bar(f'brace{k}{j}', M['timber'], (xx, fy, T + h * 0.5), (xx + w / int(w / 0.05), fy, T + h - 0.01), 0.008, outline=0)
    loft(f'fachwerkroof{k}', M['roof'], [[(x - w / 2 - 0.01, y - 0.085, T + h - 0.005), (x + w / 2 + 0.01, y - 0.085, T + h - 0.005), (x + w / 2 + 0.01, y + 0.085, T + h - 0.005), (x - w / 2 - 0.01, y + 0.085, T + h - 0.005)],
                                         [(x - w / 2 - 0.01, y - 0.004, T + h + 0.09), (x + w / 2 + 0.01, y - 0.004, T + h + 0.09), (x + w / 2 + 0.01, y + 0.004, T + h + 0.09), (x - w / 2 - 0.01, y + 0.004, T + h + 0.09)]], outline=0.004)

# ---------- the gate tower ----------
box('gatetower', M['stone'], 0.56, -0.02, T - 0.005, 0.1, 0.1, 0.22, outline=0.006, bevel=0)
box('gatearch', M['window'], 0.56, -0.072, T - 0.005, 0.04, 0.006, 0.07, outline=0, bevel=0)
pyramid('gatetowerroof', M['slate'], 0.56, -0.02, T + 0.215, 0.12, 0.1, outline=0.003)

turn(before, -20)
render(G)
