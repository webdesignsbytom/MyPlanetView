# A cartoon Huangshan for the country maps, built in the set's shared look (../toon.py): the Yellow
# Mountains' granite peaks, sheer and fissured, standing out of a sea of clouds, crooked pines
# growing from their cracks and the Welcoming Guest Pine reaching out its long arm, stone steps
# climbing to a pavilion. Turned a little towards the camera.
# Run: blender -b --factory-startup -P huangshan.py -- huangshan-1024.png 1024 huangshan.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'cloud': toon('cloud', '#f8f8fa', shadow_mul=(0.86, 0.88, 0.96), lift=0.15),
    'granite': toon('granite', '#a8a4a0', shadow_mul=(0.82, 0.84, 0.9), lift=0.05),
    'graniteDark': toon('graniteDark', '#8a8684', shadow_mul=(0.82, 0.84, 0.9)),
    'pine': toon('pine', '#2f6a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#5a4a40'),
    'step': toon('step', '#c8c0b4'),
    'red': toon('red', '#b8302a'),
    'roof': toon('roof', '#4a4a50'),
})

G = tile(M['cloud'])
before = set(bpy.data.objects)
rng = random.Random(2239)

PEAKS = ((0.0, 0.4, 0.26, 0.95), (-0.45, 0.35, 0.2, 0.75), (0.45, 0.45, 0.22, 0.8), (-0.75, 0.0, 0.16, 0.55), (0.75, 0.05, 0.16, 0.5), (0.2, -0.05, 0.14, 0.42), (-0.25, -0.1, 0.13, 0.36))
for k, (x, y, r, h) in enumerate(PEAKS):
    rings = []
    for j, (f, z) in enumerate(((1.2, -0.02), (1.0, 0.25), (0.85, 0.5), (0.6, 0.75), (0.35, 0.92), (0.08, 1.0))):
        rings.append([(x + r * f * math.cos(t) * (1 + 0.18 * math.sin(3 * t + k + j)), y + r * f * math.sin(t) * (1 + 0.15 * math.cos(2 * t + k)), G + h * z) for t in (2 * math.pi * i / 8 for i in range(8))])
    p = loft(f'peak{k}', M['granite' if k % 2 == 0 else 'graniteDark'], rings, outline=0.012)
    p.visible_shadow = False
    for j in range(2):
        bar(f'fissure{k}{j}', M['graniteDark' if k % 2 == 0 else 'granite'], (x - r * 0.3 + j * r * 0.6, y - r * 1.0, G + h * 0.1), (x - r * 0.2 + j * r * 0.4, y - r * 0.6, G + h * 0.7), 0.02, outline=0)
    for j in range(2):
        a = rng.uniform(math.pi * 1.15, math.pi * 1.85)
        z = rng.uniform(0.45, 0.8)
        f = 1.0 - z * 0.6
        px, py = x + r * f * math.cos(a), y + r * f * math.sin(a)
        rod(f'cliffpinetrunk{k}{j}', M['trunk'], (px, py, G + h * z), (px + 0.03 * math.cos(a), py + 0.03 * math.sin(a), G + h * z + 0.04), 0.006, segs=4, outline=0.001)
        b = ball(f'cliffpine{k}{j}', M['pine'], 0, 0, 0, 0.05, outline=0.005)
        b.scale = (1.4, 1.2, 0.4)
        b.location = (px + 0.03 * math.cos(a), py + 0.03 * math.sin(a), G + h * z + 0.05)

# ---------- the Welcoming Guest Pine ----------
x, y, r, h = PEAKS[1]
WX, WY, WZ = x + r * 0.35, y - r * 0.35, G + h * 0.85
rod('guestpinetrunk', M['trunk'], (WX, WY, WZ), (WX + 0.04, WY - 0.02, WZ + 0.08), 0.012, segs=6, outline=0.003)
rod('guestpinearm', M['trunk'], (WX + 0.04, WY - 0.02, WZ + 0.07), (WX + 0.22, WY - 0.08, WZ + 0.06), 0.008, r2=0.005, segs=5, outline=0.002)
for j, (dx, dz) in enumerate(((0.04, 0.1), (0.12, 0.08), (0.2, 0.075), (0.0, 0.07))):
    b = ball(f'guestpine{j}', M['pine'], 0, 0, 0, 0.06, outline=0.005)
    b.scale = (1.5, 1.2, 0.35)
    b.location = (WX + dx, WY - dx * 0.3, WZ + dz)

# ---------- the sea of clouds ----------
for k in range(14):
    a = rng.uniform(0, 2 * math.pi)
    rr = rng.uniform(0.3, 1.05)
    x, y = rr * math.cos(a), 0.2 + rr * math.sin(a) * 0.85
    if math.hypot(x, y) > 1.18:
        continue
    b = ball(f'cloud{k}', M['cloud'], 0, 0, 0, rng.uniform(0.12, 0.18), outline=0.006)
    b.scale = (1.6, 1.1, 0.5)
    b.location = (x, y, G + rng.uniform(0.04, 0.12))

# ---------- steps and a pavilion ----------
x, y, r, h = PEAKS[5]
for j in range(6):
    box(f'step{j}', M['step'], x - 0.25 + j * 0.04, y - 0.25 + j * 0.03, G + 0.04 + j * 0.035, 0.05, 0.05, 0.015, outline=0.002, bevel=0)
lathe('pavilion', M['red'], ((0.04, 0), (0.04, 0.05)), G + h - 0.01, x, y, segs=6, outline=0.003, smooth=False)
lathe('pavilionroof', M['roof'], ((0.065, 0), (0.02, 0.04), (0.004, 0.07)), G + h + 0.04, x, y, segs=6, outline=0.003, smooth=False)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
