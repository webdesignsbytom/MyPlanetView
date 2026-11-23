# A cartoon Luang Prabang for the country maps, built in the set's shared look (../toon.py): Wat
# Xieng Thong's sim, its low roofs sweeping almost to the ground in overlapping tiers, the dark red
# walls stencilled in gold, a gilded spire on the ridge, monks in saffron robes walking past, palms
# and frangipani, and the Mekong with a long boat. Turned a little towards the camera.
# Run: blender -b --factory-startup -P luang-prabang.py -- luang-prabang-1024.png 1024 luang-prabang.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'mekong': toon('mekong', '#a8865a', shadow_mul=(0.86, 0.8, 0.76), lift=0.25),
    'paving': toon('paving', '#e2d8c2', lift=0.2),
    'wall': toon('wall', '#7a2a24'),
    'gold': toon('gold', '#f0c030', lift=0.35),
    'roof': toon('roof', '#8a3a2c'),
    'roofGold': toon('roofGold', '#c8902a'),
    'white': toon('white', '#f8f6f0', lift=0.2),
    'saffron': toon('saffron', '#f08a2a', lift=0.25),
    'skin': toon('skin', '#b07a50'),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
    'frangipani': toon('frangipani', '#fbf4e8', lift=0.2),
    'leaf': toon('leaf', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'boat': toon('boat', '#6a4a36'),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)
rng = random.Random(1741)


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


flat_face('mekong', M['mekong'], [(1.42 * math.cos(math.radians(a)), 1.42 * math.sin(math.radians(a))) for a in range(206, 335, 4)], G + 0.004, outline=0.01)
loft('longboat', M['boat'], [[(0.1, -0.95, G), (0.5, -0.97, G), (0.56, -0.95, G), (0.5, -0.93, G)],
                             [(0.05, -0.95, G + 0.035), (0.5, -0.98, G + 0.035), (0.62, -0.95, G + 0.045), (0.5, -0.92, G + 0.035)]], outline=0.005)

# ---------- the sim of Wat Xieng Thong ----------
SX, SY = 0.0, 0.3
box('platform', M['white'], SX, SY, G - 0.005, 0.66, 0.42, 0.04, outline=0.008, bevel=0)
box('sim', M['wall'], SX, SY, G + 0.035, 0.48, 0.26, 0.1, outline=0.01, bevel=0)
for j in range(6):
    box(f'stencil{j}', M['gold'], SX - 0.2 + j * 0.08, SY - 0.133, G + 0.05, 0.05, 0.006, 0.07, outline=0, bevel=0)
box('door', M['gold'], SX, SY - 0.134, G + 0.035, 0.07, 0.006, 0.09, outline=0, bevel=0)
for i, (w, d, z0, z1) in enumerate(((0.7, 0.44, 0.06, 0.16), (0.56, 0.34, 0.14, 0.25), (0.44, 0.26, 0.23, 0.33))):
    loft(f'roof{i}', M['roof' if i % 2 == 0 else 'roofGold'], [[(SX - w / 2, SY - d / 2, G + z0), (SX + w / 2, SY - d / 2, G + z0), (SX + w / 2, SY + d / 2, G + z0),
                                                                 (SX - w / 2, SY + d / 2, G + z0)],
                                                                [(SX - w * 0.42, SY - 0.006, G + z1), (SX + w * 0.42, SY - 0.006, G + z1), (SX + w * 0.42, SY + 0.006, G + z1),
                                                                 (SX - w * 0.42, SY + 0.006, G + z1)]], outline=0.009)
lathe('dokso', M['gold'], ((0.02, 0), (0.012, 0.04), (0.004, 0.09)), G + 0.33, SX, SY, segs=8, outline=0.003)
for s in (-1, 1):
    bar(f'nagatail{s}', M['gold'], (SX + s * 0.29, SY, G + 0.33), (SX + s * 0.33, SY, G + 0.38), 0.012, outline=0.002)

# ---------- monks in saffron ----------
for k in range(5):
    x, y = -0.55 + k * 0.12, -0.3 - 0.02 * k
    rod(f'monk{k}', M['saffron'], (x, y, G), (x, y, G + 0.09), 0.02, r2=0.016, segs=8, outline=0.003)
    ball(f'monkhead{k}', M['skin'], x, y, G + 0.108, 0.016, outline=0.003)

# ---------- palms and frangipani ----------
for k, (x, y) in enumerate(((-0.9, 0.2), (0.85, 0.3), (-0.75, 0.65), (0.7, 0.7))):
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + 0.32), 0.013, r2=0.01, segs=8, outline=0.004)
    for f in range(7):
        b = 2 * math.pi * f / 7 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.02, y, G + 0.32), (x + 0.02 + 0.1 * math.cos(b), y + 0.1 * math.sin(b), G + 0.27), 0.019, outline=0.005)
for k, (x, y) in enumerate(((0.55, -0.15), (-0.45, 0.0))):
    rod(f'frangitrunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.08), 0.012, segs=6, outline=0.003)
    ball(f'frangileaf{k}', M['leaf'], x, y, G + 0.12, 0.06, outline=0.009)
    for j in range(5):
        a = 2 * math.pi * j / 5
        ball(f'frangiflower{k}{j}', M['frangipani'], x + 0.045 * math.cos(a), y + 0.045 * math.sin(a), G + 0.15, 0.014, outline=0.002)

turn(before, -20)
render(G)
