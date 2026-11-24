# A cartoon Appian Way for the country maps, built in the set's shared look (../toon.py): the old
# Roman road running straight out of Rome, its big polygonal paving stones of dark basalt between the
# raised kerbs, lined with tall umbrella pines and cypresses and the ruins of tombs, and the great round
# Tomb of Caecilia Metella on its square base, its drum crowned by the medieval battlements, with the
# Roman countryside and an aqueduct's arches beyond. Turned a little towards the camera.
# Run: blender -b --factory-startup -P appian-way.py -- appian-way-1024.png 1024 appian-way.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#a8b86a', shadow_mul=(0.76, 0.8, 0.78), lift=0.2),
    'basalt': toon('basalt', '#6a6660', shadow_mul=(0.86, 0.86, 0.9), lift=0.08),
    'basaltLight': toon('basaltLight', '#8a857c'),
    'travertine': toon('travertine', '#e8dcc0', shadow_mul=(0.86, 0.84, 0.86), lift=0.15),
    'brick': toon('brick', '#b8704a', lift=0.08),
    'pine': toon('pine', '#4f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'cypress': toon('cypress', '#2f5a34', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3a'),
    'dark': flat('dark', '#2a2622'),
})

G = tile(M['grass'])
before = set(bpy.data.objects)
rng = random.Random(312)

# ---------- the road, running from front to back ----------
RW = 0.22
for k in range(14):
    y0, y1 = -1.3 + k * 0.2, -1.3 + (k + 1) * 0.2
    xa = math.sqrt(max(0.0, 1.38 ** 2 - max(y0 * y0, y1 * y1)))
    if xa < RW:
        continue
    box(f'road{k}', M['basalt'], 0, (y0 + y1) / 2, G - 0.004, RW * 2, y1 - y0, 0.012, outline=0, bevel=0)
    for s in (-1, 1):
        box(f'kerb{k}{s}', M['basaltLight'], s * (RW + 0.02), (y0 + y1) / 2, G - 0.004, 0.04, y1 - y0, 0.022, outline=0.001, bevel=0)
    for j in range(6):
        x = rng.uniform(-RW + 0.03, RW - 0.03)
        y = rng.uniform(y0 + 0.02, y1 - 0.02)
        lathe(f'paving{k}{j}', M['basaltLight'], ((0.035, 0), (0.035, 0.004)), G + 0.008, x, y, segs=6, outline=0, smooth=False)

# ---------- the Tomb of Caecilia Metella ----------
TX, TY = -0.55, 0.15
box('tombbase', M['basaltLight'], TX, TY, G - 0.005, 0.34, 0.34, 0.14, outline=0.006, bevel=0)
lathe('tombdrum', M['travertine'], ((0.15, 0), (0.15, 0.24)), G + 0.135, TX, TY, segs=28, outline=0.007)
lathe('tombfrieze', M['travertine'], ((0.153, 0), (0.153, 0.03)), G + 0.33, TX, TY, segs=28, outline=0.002)
for k in range(10):
    a = 2 * math.pi * k / 10
    if math.sin(a) > 0.3:
        continue
    cyl(f'bucranium{k}', M['basaltLight'], 0.01, 0.006, segs=8, outline=0, matrix=Matrix.Translation((TX + 0.155 * math.cos(a), TY + 0.155 * math.sin(a), G + 0.345)) @ Matrix.Rotation(a + math.pi / 2, 4, 'Z') @ Matrix.Rotation(math.pi / 2, 4, 'X'))
# the medieval battlements added on top
lathe('battlementring', M['brick'], ((0.14, 0), (0.14, 0.04)), G + 0.37, TX, TY, segs=24, outline=0.003)
for k in range(14):
    a = 2 * math.pi * k / 14
    box(f'merlon{k}', M['brick'], TX + 0.13 * math.cos(a), TY + 0.13 * math.sin(a), G + 0.405, 0.03, 0.025, 0.035, rot_z=a + math.pi / 2, outline=0.001, bevel=0)
# the castle wall next to it
box('castlewall', M['brick'], TX + 0.0, TY + 0.3, G - 0.005, 0.4, 0.06, 0.18, outline=0.004, bevel=0)

# ---------- tomb ruins, umbrella pines and cypresses along the road ----------
for k, (x, y) in enumerate(((0.45, -0.55), (-0.45, -0.6), (0.5, 0.45))):
    box(f'ruin{k}', M['brick'], x, y, G - 0.005, 0.12, 0.12, rng.uniform(0.1, 0.2), outline=0.004, bevel=0)
    if k == 1:
        box(f'ruintop{k}', M['travertine'], x, y, G + 0.08, 0.13, 0.13, 0.02, outline=0.002, bevel=0)
for k, (x, y) in enumerate(((-0.38, -0.25), (0.38, -0.2), (0.38, 0.85), (-0.3, 0.75), (0.4, -0.95), (-0.35, -1.0))):
    if math.hypot(x, y) > 1.15:
        x, y = x * 0.95, y * 0.95
    rod(f'pinetrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + 0.3), 0.014, segs=6, outline=0.002)
    pn = ball(f'pine{k}', M['pine'], 0, 0, 0, 0.13, outline=0.012)
    pn.scale = (1.3, 1.3, 0.45)
    pn.location = (x + 0.02, y, G + 0.33)
for k, (x, y) in enumerate(((0.65, 0.05), (-0.75, -0.25), (0.75, -0.3))):
    lathe(f'cypress{k}', M['cypress'], ((0.035, 0), (0.045, 0.06), (0.03, 0.2), (0.004, 0.32)), G - 0.005, x, y, segs=10, outline=0.006)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
