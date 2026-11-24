# A cartoon Wat Phra Mahathat Woramahawihan for the country maps, built in the set's shared look
# (../toon.py): the great temple of Nakhon Si Thammarat in southern Thailand, its huge white
# bell-shaped chedi in the Sri Lankan style on its square terrace, the tall spire above the bell
# rising in rings to its top of gold, the ring of small white chedis with golden tips round it and
# the cloister of red-roofed galleries closing the court, with palms outside. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P nakhon-si-thammarat.py -- nakhon-si-thammarat-1024.png 1024 nakhon-si-thammarat.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'court': toon('court', '#e0d8c8', shadow_mul=(0.84, 0.84, 0.9), lift=0.2),
    'white': toon('white', '#f6f4ee', shadow_mul=(0.8, 0.82, 0.9), lift=0.22),
    'gold': toon('gold', '#e8b440', lift=0.3),
    'roof': toon('roof', '#c0503a'),
    'roofGreen': toon('roofGreen', '#3a7a5a'),
    'dark': flat('dark', '#2e2a2a'),
    'palm': toon('palm', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6a4a'),
})

G = tile(M['grass'])
before = set(bpy.data.objects)

# ---------- the court and the cloister round it ----------
S = 0.68
box('court', M['court'], 0.0, 0.05, G - 0.005, 2 * S, 2 * S, 0.012, outline=0.002, bevel=0)
for k, (x, y, sx, sy) in enumerate(((0, 0.05 + S, 2 * S + 0.1, 0.1), (-S, 0.05, 0.1, 2 * S), (S, 0.05, 0.1, 2 * S))):
    box(f'cloister{k}', M['white'], x, y, G - 0.005, sx, sy, 0.08, outline=0.004, bevel=0)
    along_x = sx > sy
    hx, hy = sx / 2 + 0.01, sy / 2 + 0.01
    top = (hx - 0.02, 0.004) if along_x else (0.004, hy - 0.02)
    loft(f'cloisterroof{k}', M['roof'], [[(x - hx, y - hy, G + 0.075), (x + hx, y - hy, G + 0.075), (x + hx, y + hy, G + 0.075), (x - hx, y + hy, G + 0.075)],
                                         [(x - top[0], y - top[1], G + 0.13), (x + top[0], y - top[1], G + 0.13), (x + top[0], y + top[1], G + 0.13), (x - top[0], y + top[1], G + 0.13)]], outline=0.003)
for s in (-1, 1):
    box(f'frontcloister{s}', M['white'], s * 0.42, 0.05 - S, G - 0.005, 0.5, 0.1, 0.08, outline=0.004, bevel=0)
    loft(f'frontcloisterroof{s}', M['roof'], [[(s * 0.42 - 0.26, -S - 0.01, G + 0.075), (s * 0.42 + 0.26, -S - 0.01, G + 0.075), (s * 0.42 + 0.26, -S + 0.11, G + 0.075), (s * 0.42 - 0.26, -S + 0.11, G + 0.075)],
                                              [(s * 0.42 - 0.24, -S + 0.046, G + 0.13), (s * 0.42 + 0.24, -S + 0.046, G + 0.13), (s * 0.42 + 0.24, -S + 0.054, G + 0.13), (s * 0.42 - 0.24, -S + 0.054, G + 0.13)]], outline=0.003)
# the gate between them, with its green and red tiered roof
box('gate', M['white'], 0.0, 0.05 - S, G - 0.005, 0.2, 0.12, 0.12, outline=0.004, bevel=0)
box('gatedoor', M['dark'], 0.0, -0.01 - S, G - 0.005, 0.06, 0.006, 0.08, outline=0, bevel=0)
for t, (w, z) in enumerate(((0.24, 0.115), (0.16, 0.17))):
    loft(f'gateroof{t}', M['roofGreen'] if t else M['roof'], [[(-w / 2, -S - 0.02, G + z), (w / 2, -S - 0.02, G + z), (w / 2, -S + 0.12, G + z), (-w / 2, -S + 0.12, G + z)],
                                                               [(-0.004, -S - 0.02, G + z + 0.07), (0.004, -S - 0.02, G + z + 0.07), (0.004, -S + 0.12, G + z + 0.07), (-0.004, -S + 0.12, G + z + 0.07)]], outline=0.003)

# ---------- the great chedi ----------
CX, CY = 0.0, 0.1
box('terrace', M['white'], CX, CY, G - 0.005, 0.56, 0.56, 0.06, outline=0.005, bevel=0)
box('terrace2', M['white'], CX, CY, G + 0.05, 0.46, 0.46, 0.04, outline=0.004, bevel=0)
lathe('bellbase', M['white'], ((0.22, 0), (0.22, 0.02), (0.2, 0.02), (0.2, 0.04), (0.185, 0.04), (0.185, 0.06)), G + 0.085, CX, CY, segs=28, outline=0.004, smooth=False)
lathe('bell', M['white'], ((0.18, 0), (0.18, 0.04), (0.165, 0.11), (0.13, 0.17), (0.07, 0.205), (0.0, 0.215)), G + 0.14, CX, CY, segs=28, outline=0.006)
box('harmika', M['white'], CX, CY, G + 0.34, 0.09, 0.09, 0.05, outline=0.003, bevel=0)
RINGS = 8
for k in range(RINGS):
    r = 0.04 - k * 0.0035
    lathe(f'ring{k}', M['white'], ((r, 0), (r, 0.018), (r - 0.004, 0.022)), G + 0.385 + k * 0.022, CX, CY, segs=16, outline=0.001)
lathe('spire', M['gold'], ((0.012, 0), (0.008, 0.08), (0.004, 0.16), (0.012, 0.18), (0.002, 0.24)), G + 0.385 + RINGS * 0.022, CX, CY, segs=12, outline=0.002)

# ---------- the ring of small chedis ----------
for k in range(12):
    a = 2 * math.pi * k / 12 + math.pi / 12
    x, y = CX + 0.42 * math.cos(a), CY + 0.42 * math.sin(a)
    lathe(f'smallbase{k}', M['white'], ((0.035, 0), (0.035, 0.02)), G - 0.005, x, y, segs=8, outline=0.002, smooth=False)
    lathe(f'smallbell{k}', M['white'], ((0.03, 0), (0.028, 0.025), (0.015, 0.045), (0.0, 0.05)), G + 0.015, x, y, segs=12, outline=0.002)
    lathe(f'smallspire{k}', M['gold'], ((0.008, 0), (0.002, 0.07)), G + 0.06, x, y, segs=8, outline=0.001, smooth=False)

# ---------- palms outside ----------
for k, (x, y) in enumerate(((-0.95, -0.3), (0.95, -0.3), (-0.95, 0.4), (0.95, 0.45))):
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + 0.3), 0.012, segs=6, outline=0.002)
    for j in range(6):
        a = 2 * math.pi * j / 6
        b = ball(f'frond{k}{j}', M['palm'], 0, 0, 0, 1.0, outline=0.003)
        b.scale = (0.08, 0.02, 0.012)
        b.rotation_euler = (0, 0.35, a)
        b.location = (x + 0.02 + 0.06 * math.cos(a), y + 0.06 * math.sin(a), G + 0.29)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
