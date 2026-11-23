# A cartoon Giant's Causeway for the country maps, built in the set's shared look (../toon.py):
# Northern Ireland's honeycomb of hexagonal basalt columns stepping down from the cliffs into the
# sea, tall at the cliff foot and low at the water, the green-topped headlands behind, surf round
# the outer columns, and a few visitors. Turned a little towards the camera.
# Run: blender -b --factory-startup -P giants-causeway.py -- giants-causeway-1024.png 1024 giants-causeway.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#2f7fb8', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'foam': toon('foam', '#f4f8fb', shadow_mul=(0.82, 0.86, 0.95), lift=0.1),
    'basalt': toon('basalt', '#4a4648', shadow_mul=(0.86, 0.86, 0.9)),
    'basaltLight': toon('basaltLight', '#625c5e', shadow_mul=(0.86, 0.86, 0.9)),
    'cliff': toon('cliff', '#6a5e54', shadow_mul=(0.84, 0.82, 0.86)),
    'headland': toon('headland', '#6aa54a', shadow_mul=(0.7, 0.78, 0.8)),
    'coat1': toon('coat1', '#e0453a'), 'coat2': toon('coat2', '#f2c84a', shadow_mul=(0.84, 0.72, 0.6)), 'skin': toon('skin', '#e0b090'),
})

G = tile(M['sea'])
before = set(bpy.data.objects)
rng = random.Random(1031)

# ---------- the cliffs and their green headlands at the back ----------
back = [(1.38 * math.cos(math.radians(a)), 1.38 * math.sin(math.radians(a))) for a in range(15, 166, 6)]
cliff = loft('cliff', M['cliff'], [[(x, y, G - 0.01) for x, y in back], [(x * 0.97, y * 0.97 + 0.03, G + 0.4) for x, y in back]], outline=0.022)
cliff.visible_shadow = False
top = loft('headland', M['headland'], [[(x * 0.97, y * 0.97 + 0.03, G + 0.39) for x, y in back], [(x * 0.95, y * 0.95 + 0.05, G + 0.43) for x, y in back]], outline=0.01)
top.visible_shadow = False
# basalt columns standing in the cliff's face (the straight edge between its two ends, y about 0.36)
for k in range(19):
    x = -1.08 + k * 0.12
    bar(f'cliffcolumn{k}', M['basaltLight'], (x, 0.345, G + 0.02), (x, 0.368, G + 0.36), 0.04, outline=0.004)

# ---------- the causeway: hexagonal columns in a honeycomb, stepping down to the sea ----------
SIZE = 0.068
for q in range(-9, 10):
    for r in range(-12, 12):
        x = SIZE * 1.5 * q
        y = SIZE * math.sqrt(3) * (r + q / 2)
        # the causeway is a tongue running from the cliff foot (back) down to the sea (front left)
        u = (x * 0.55 - y * 0.83)            # along the tongue, towards the sea
        v = (x * 0.83 + y * 0.55)            # across it
        if abs(v) > 0.32 - 0.12 * max(0.0, u) or u < -0.75 or u > 0.95:
            continue
        if math.hypot(x, y) > 1.28:
            continue
        h = max(0.015, 0.3 * (1 - (u + 0.75) / 1.7) ** 1.3 + rng.uniform(-0.03, 0.03))
        lathe(f'col{q}_{r}', M['basalt' if (q + r) % 3 else 'basaltLight'], ((SIZE * 0.95, 0), (SIZE * 0.95, h)), G - 0.01, x, y, segs=6, outline=0.006, smooth=False)
for k in range(10):
    a = rng.uniform(0, 2 * math.pi)
    u = 0.85 + rng.uniform(-0.05, 0.1)
    v = rng.uniform(-0.25, 0.25)
    x, y = u * 0.55 + v * 0.83, -u * 0.83 + v * 0.55
    ball(f'foam{k}', M['foam'], x, y, G + 0.005, rng.uniform(0.03, 0.05), outline=0.004)

# ---------- a few visitors on the columns ----------
for k, (u, v, mat) in enumerate(((0.1, 0.05, 'coat1'), (0.35, -0.08, 'coat2'), (-0.2, 0.1, 'coat1'))):
    x, y = u * 0.55 + v * 0.83, -u * 0.83 + v * 0.55
    z = 0.3 * (1 - (u + 0.75) / 1.7) ** 1.3 + 0.03
    rod(f'visitorlegs{k}', M['basalt'], (x, y, G + z), (x, y, G + z + 0.04), 0.008, segs=6, outline=0.002)
    rod(f'visitorbody{k}', M[mat], (x, y, G + z + 0.04), (x, y, G + z + 0.085), 0.014, segs=8, outline=0.003)
    ball(f'visitorhead{k}', M['skin'], x, y, G + z + 0.1, 0.013, outline=0.003)

turn(before, -20)
render(G)
