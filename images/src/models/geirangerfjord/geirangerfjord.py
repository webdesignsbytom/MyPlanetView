# A cartoon Geirangerfjord for the country maps, built in the set's shared look (../toon.py): the
# deep blue fjord between sheer green mountain walls, the Seven Sisters waterfalls streaming down one
# side, an old farm clinging to its ledge high above the water, and a ferry sailing up the fjord.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P geirangerfjord.py -- geirangerfjord-1024.png 1024 geirangerfjord.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'fjord': toon('fjord', '#2a6a8a', shadow_mul=(0.74, 0.82, 0.9), lift=0.3),
    'cliff': toon('cliff', '#5a6a58', shadow_mul=(0.76, 0.82, 0.8)),
    'green': toon('green', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'snow': toon('snow', '#fbfbfd', shadow_mul=(0.8, 0.86, 0.96), lift=0.15),
    'fall': toon('fall', '#eef6fb', shadow_mul=(0.82, 0.88, 0.96), lift=0.2),
    'farm': toon('farm', '#c8402c'),
    'roof': toon('roof', '#5a8a48'),
    'ferry': toon('ferry', '#f6f3ec', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'ferryRed': toon('ferryRed', '#c8302a'),
    'pine': toon('pine', '#2f6a3e', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['fjord'])
before = set(bpy.data.objects)
rng = random.Random(1889)


def wall(name, s):
    pts = [(1.41 * math.cos(math.radians(a)), 1.41 * math.sin(math.radians(a))) for a in (range(-70, 71, 5) if s > 0 else range(110, 251, 5))]
    inner_x = 0.5 * s
    ring0 = [(x, y, G - 0.01) for x, y in pts]
    ring1 = [(inner_x + (x - inner_x) * 0.96 + 0.05 * s, y * 0.96, G + 0.5) for x, y in pts]
    ring2 = [(inner_x + (x - inner_x) * 0.85 + 0.1 * s, y * 0.88, G + 0.62) for x, y in pts]
    c = loft(f'{name}cliff', M['cliff'], [ring0, ring1], outline=0.018)
    c.visible_shadow = False
    t = loft(f'{name}top', M['green'], [ring1, ring2], outline=0.012, smooth=True)
    t.visible_shadow = False


wall('left', -1)
wall('right', 1)
for k in range(5):
    lathe(f'snowpeak{k}', M['snow'], ((0.08, 0), (0.004, 0.1)), G + 0.62, -0.95 + 0.08 * k, -0.4 + k * 0.2, segs=6, outline=0.006, smooth=False)

# ---------- the Seven Sisters ----------
for k in range(7):
    y = -0.35 + k * 0.1
    x = 0.52 + 0.02 * (k % 2)
    box(f'sister{k}', M['fall'], x, y, G - 0.005, 0.012, 0.03, 0.48, outline=0.003, bevel=0)

# ---------- the farm on its ledge ----------
FX, FY, FZ = -0.62, 0.3, G + 0.38
box('ledge', M['green'], FX - 0.05, FY, FZ - 0.03, 0.2, 0.22, 0.03, outline=0.005, bevel=0)
for k, (dx, dy) in enumerate(((0.0, 0.0), (-0.07, 0.08))):
    box(f'farmhouse{k}', M['farm'], FX + dx, FY + dy, FZ, 0.08, 0.06, 0.05, outline=0.005, bevel=0)
    loft(f'farmroof{k}', M['roof'], [[(FX + dx - 0.045, FY + dy - 0.035, FZ + 0.048), (FX + dx + 0.045, FY + dy - 0.035, FZ + 0.048), (FX + dx + 0.045, FY + dy + 0.035, FZ + 0.048),
                                      (FX + dx - 0.045, FY + dy + 0.035, FZ + 0.048)],
                                     [(FX + dx - 0.045, FY + dy - 0.003, FZ + 0.08), (FX + dx + 0.045, FY + dy - 0.003, FZ + 0.08), (FX + dx + 0.045, FY + dy + 0.003, FZ + 0.08),
                                      (FX + dx - 0.045, FY + dy + 0.003, FZ + 0.08)]], outline=0.004)
for k in range(8):
    side = -1 if k % 2 else 1
    lathe(f'pine{k}', M['pine'], ((0.04, 0), (0.004, 0.12)), G + 0.6, side * rng.uniform(0.75, 1.05), rng.uniform(-0.6, 0.7), segs=8, outline=0.005)

# ---------- the ferry ----------
SX, SY = -0.05, -0.3
loft('ferry', M['ferry'], [[(SX, SY - 0.22, G), (SX + 0.06, SY - 0.1, G), (SX + 0.06, SY + 0.2, G), (SX - 0.06, SY + 0.2, G), (SX - 0.06, SY - 0.1, G)],
                           [(SX, SY - 0.28, G + 0.06), (SX + 0.07, SY - 0.12, G + 0.06), (SX + 0.07, SY + 0.22, G + 0.06), (SX - 0.07, SY + 0.22, G + 0.06),
                            (SX - 0.07, SY - 0.12, G + 0.06)]], outline=0.008)
box('ferrydeck', M['ferry'], SX, SY + 0.05, G + 0.06, 0.11, 0.24, 0.06, outline=0.006, bevel=0)
box('ferrystripe', M['ferryRed'], SX + 0.072, SY + 0.02, G + 0.03, 0.006, 0.36, 0.018, outline=0, bevel=0)
lathe('ferryfunnel', M['ferryRed'], ((0.025, 0), (0.025, 0.06)), G + 0.12, SX, SY + 0.12, segs=10, outline=0.003)

turn(before, -20)
render(G)
