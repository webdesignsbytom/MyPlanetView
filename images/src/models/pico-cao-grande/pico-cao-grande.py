# A cartoon Pico Cão Grande for the country maps, built in the set's shared look (../toon.py): the
# volcanic needle of São Tomé's Obo National Park, its sheer grey spire of phonolite rising straight
# out of the rainforest with mist round its waist, the forest canopy, a river and a little
# waterfall, and tree ferns. Turned a little towards the camera.
# Run: blender -b --factory-startup -P pico-cao-grande.py -- pico-cao-grande-1024.png 1024 pico-cao-grande.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'forestFloor': toon('forestFloor', '#3f8a4a', shadow_mul=(0.7, 0.78, 0.8), lift=0.25),
    'spire': toon('spire', '#8a8a8e', shadow_mul=(0.8, 0.8, 0.88)),
    'spireDark': toon('spireDark', '#6e6e74', shadow_mul=(0.8, 0.8, 0.88)),
    'spireGreen': toon('spireGreen', '#5a8a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'mist': toon('mist', '#f2f4f8', shadow_mul=(0.84, 0.86, 0.94), lift=0.15),
    'forest': toon('forest', '#2f7a46', shadow_mul=(0.7, 0.78, 0.8)),
    'forestLight': toon('forestLight', '#5aa652', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6b5040'),
    'river': toon('river', '#4aa6c8', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'falls': toon('falls', '#eaf6fa', shadow_mul=(0.8, 0.86, 0.94), lift=0.15),
    'fern': toon('fern', '#6aaa4a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['forestFloor'])
before = set(bpy.data.objects)
rng = random.Random(967)

# ---------- the needle: a green-skirted foot, then the sheer grey spire ----------
PX, PY = 0.0, 0.25
lathe('spirefoot', M['spireGreen'], ((0.32, 0), (0.22, 0.12), (0.15, 0.22)), G - 0.01, PX, PY, segs=16, outline=0.018)
lathe('spire', M['spire'], ((0.16, 0), (0.15, 0.2), (0.135, 0.42), (0.12, 0.58), (0.095, 0.7), (0.05, 0.77), (0.004, 0.79)), G + 0.2, PX, PY, segs=16, outline=0.018,
      smooth=False)
for k in range(5):
    a = 2 * math.pi * k / 5 + 0.4
    bar(f'groove{k}', M['spireDark'], (PX + 0.15 * math.cos(a), PY + 0.15 * math.sin(a), G + 0.25), (PX + 0.1 * math.cos(a), PY + 0.1 * math.sin(a), G + 0.85), 0.018,
        outline=0.002)
for k in range(6):
    ball(f'spireshrub{k}', M['spireGreen'], PX + 0.13 * math.cos(k), PY + 0.13 * math.sin(k), G + 0.35 + 0.08 * (k % 3), 0.035, outline=0.006)
for k in range(9):
    a = 2 * math.pi * k / 9
    ball(f'mist{k}', M['mist'], PX + 0.22 * math.cos(a), PY + 0.16 * math.sin(a), G + 0.5 + 0.03 * math.sin(2 * a), 0.06 + 0.015 * (k % 2), outline=0.01)

# ---------- the rainforest canopy ----------
for k in range(40):
    x, y = rng.uniform(-1.15, 1.15), rng.uniform(-0.6, 1.1)
    if math.hypot(x, y) > 1.2 or math.hypot(x - PX, (y - PY) * 1.3) < 0.38 or (-0.15 < x < 0.45 and y < -0.2):
        continue
    h = rng.uniform(0.1, 0.18)
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + h), 0.016, segs=6, outline=0.005)
    ball(f'tree{k}', M['forest' if k % 2 else 'forestLight'], x, y, G + h + 0.06, rng.uniform(0.09, 0.12), outline=0.014)

# ---------- a river and a little waterfall at the front ----------
PATH = [(0.35, -0.05), (0.25, -0.3), (0.15, -0.55), (0.2, -0.85), (0.1, -1.15)]
bm = bmesh.new()
verts = []
for i, (x, y) in enumerate(PATH):
    (x0, y0), (x1, y1) = PATH[max(0, i - 1)], PATH[min(len(PATH) - 1, i + 1)]
    dx, dy = x1 - x0, y1 - y0
    n = math.hypot(dx, dy)
    w = 0.04 + 0.02 * i / len(PATH)
    verts.append((bm.verts.new((x - dy / n * w, y + dx / n * w, G + 0.005)), bm.verts.new((x + dy / n * w, y - dx / n * w, G + 0.005))))
for (a0, a1), (b0, b1) in zip(verts, verts[1:]):
    bm.faces.new((a0, a1, b1, b0))
finish('river', bm, M['river'], outline=0.006)
box('fallrock', M['spireDark'], 0.25, -0.28, G - 0.005, 0.2, 0.08, 0.1, outline=0.008, bevel=0.01)
bar('falls', M['falls'], (0.25, -0.33, G + 0.095), (0.25, -0.36, G + 0.01), 0.07, outline=0.004)

# ---------- tree ferns ----------
for k, (x, y) in enumerate(((-0.35, -0.6), (-0.65, -0.35), (0.6, -0.55), (-0.15, -0.85))):
    h = rng.uniform(0.16, 0.22)
    rod(f'fernstem{k}', M['trunk'], (x, y, G), (x, y, G + h), 0.011, segs=6, outline=0.004)
    for f in range(7):
        b = 2 * math.pi * f / 7 + k
        bar(f'frond{k}{f}', M['fern'], (x, y, G + h), (x + 0.1 * math.cos(b), y + 0.1 * math.sin(b), G + h - 0.04), 0.02, outline=0.004)

turn(before, -20)
render(G)
