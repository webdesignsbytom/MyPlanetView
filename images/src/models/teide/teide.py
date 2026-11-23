# A cartoon Teide National Park for the country maps, built in the set's shared look (../toon.py):
# Tenerife's volcano, Spain's highest peak, its pale pumice cone with a cap of snow rising from the
# caldera's lava fields, Pico Viejo beside it, the Roques de García's pillars of rock in front, red
# tajinaste spires, and Canary pines. Turned a little towards the camera.
# Run: blender -b --factory-startup -P teide.py -- teide-1024.png 1024 teide.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'caldera': toon('caldera', '#b8946a', shadow_mul=(0.84, 0.76, 0.72), lift=0.25),
    'lava': toon('lava', '#5a4a48', shadow_mul=(0.84, 0.84, 0.9)),
    'slope': toon('slope', '#8a6e58', shadow_mul=(0.84, 0.78, 0.8)),
    'pumice': toon('pumice', '#d8c8a8', shadow_mul=(0.84, 0.8, 0.84)),
    'snow': toon('snow', '#f4f8fb', shadow_mul=(0.82, 0.86, 0.95), lift=0.1),
    'roque': toon('roque', '#7a5a48', shadow_mul=(0.84, 0.76, 0.8)),
    'tajinaste': toon('tajinaste', '#d0402f'),
    'tajinasteLeaf': toon('tajinasteLeaf', '#8aa86a', shadow_mul=(0.72, 0.8, 0.78)),
    'pine': toon('pine', '#4f7a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a6048'),
})

G = tile(M['caldera'])
before = set(bpy.data.objects)
rng = random.Random(773)


def ring(cx, cy, rx, ry, z, k, sides=22):
    return [(cx + rx * math.cos(t) * (1 + 0.05 * math.sin(3 * t + k)), cy + ry * math.sin(t) * (1 + 0.05 * math.cos(2 * t + k)), G + z) for t in (2 * math.pi * j / sides for j in range(sides))]


# ---------- lava flows on the caldera floor ----------
for k, (x, y, rx, ry) in enumerate(((-0.6, -0.2, 0.35, 0.18), (0.55, -0.35, 0.3, 0.15), (0.15, -0.75, 0.4, 0.14))):
    loft(f'lavaflow{k}', M['lava'], [ring(x, y, rx, ry, -0.005, k), ring(x, y, rx * 0.9, ry * 0.85, 0.02, k)], outline=0.008).visible_shadow = False

# ---------- Pico Viejo, and Teide's cone ----------
pv = loft('picoviejo', M['slope'], [ring(-0.5, 0.65, 0.5, 0.38, -0.01, 4), ring(-0.5, 0.65, 0.25, 0.2, 0.36, 4), ring(-0.5, 0.65, 0.18, 0.14, 0.38, 4)], outline=0.025)
pv.visible_shadow = False
TX, TY = 0.15, 0.55
rings = [ring(TX, TY, 0.72, 0.52, -0.01, 7), ring(TX, TY, 0.42, 0.3, 0.32, 7), ring(TX, TY, 0.2, 0.15, 0.62, 7), ring(TX, TY, 0.1, 0.08, 0.78, 7), ring(TX, TY, 0.03, 0.025, 0.84, 7)]
for name, mat, a, b in (('teidebase', 'slope', 0, 2), ('teidepumice', 'pumice', 1, 4), ('teidesnow', 'snow', 3, 5)):
    part = loft(name, M[mat], rings[a:b], outline=0.025)
    part.visible_shadow = False

# ---------- the Roques de García: rock pillars, one narrow at its foot ----------
for k, (x, y, r, h) in enumerate(((-0.25, -0.35, 0.08, 0.32), (-0.05, -0.28, 0.06, 0.24), (0.12, -0.32, 0.07, 0.2))):
    profile = ((r * 0.55, 0), (r * 0.7, h * 0.3), (r, h * 0.7), (r * 0.85, h), (0.004, h + 0.02)) if k == 0 else ((r, 0), (r * 0.9, h * 0.6), (r * 0.5, h), (0.004, h + 0.02))
    lathe(f'roque{k}', M['roque'], profile, G - 0.005, x, y, segs=9, outline=0.012, smooth=False)

# ---------- red tajinaste spires ----------
for k in range(9):
    x, y = rng.uniform(-1.0, 1.0), rng.uniform(-1.05, 0.0)
    if math.hypot(x, y) > 1.2:
        continue
    lathe(f'tajinasteleaf{k}', M['tajinasteLeaf'], ((0.04, 0), (0.004, 0.04)), G, x, y, segs=8, outline=0.004)
    lathe(f'tajinaste{k}', M['tajinaste'], ((0.025, 0), (0.022, 0.08), (0.004, 0.2)), G + 0.03, x, y, segs=8, outline=0.006)

# ---------- Canary pines ----------
for k, (x, y) in enumerate(((-1.05, 0.0), (1.05, 0.05), (0.95, -0.5), (-0.95, -0.6))):
    h = rng.uniform(0.2, 0.26)
    rod(f'pinetrunk{k}', M['trunk'], (x, y, G), (x, y, G + h * 0.5), 0.016, segs=6, outline=0.005)
    lathe(f'pine{k}', M['pine'], ((0.08, 0), (0.06, h * 0.35), (0.065, h * 0.35 + 0.01), (0.03, h * 0.7), (0.004, h)), G + h * 0.3, x, y, segs=10, outline=0.01,
          smooth=False)

turn(before, -20)
render(G)
