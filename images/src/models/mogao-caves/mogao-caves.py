# A cartoon Mogao Caves for the country maps, built in the set's shared look (../toon.py): the
# Buddhist cave temples near Dunhuang, hundreds of doorways in rows along the cliff face, the
# nine-storey red pagoda front built against it over the great Buddha, the desert's dunes in front
# and a line of poplars. Turned a little towards the camera.
# Run: blender -b --factory-startup -P mogao-caves.py -- mogao-caves-1024.png 1024 mogao-caves.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sand': toon('sand', '#e8c890', shadow_mul=(0.86, 0.8, 0.72), lift=0.2),
    'dune': toon('dune', '#e0b878', shadow_mul=(0.86, 0.8, 0.72)),
    'cliff': toon('cliff', '#c8a070', shadow_mul=(0.86, 0.8, 0.74)),
    'cave': flat('cave', '#3a2a20'),
    'red': toon('red', '#b8302a'),
    'roof': toon('roof', '#5a5a5a'),
    'gold': toon('gold', '#f0c030', lift=0.3),
    'poplar': toon('poplar', '#6a9a3a', shadow_mul=(0.72, 0.8, 0.74)),
    'trunk': toon('trunk', '#8a7a68'),
})

G = tile(M['sand'])
before = set(bpy.data.objects)
rng = random.Random(2273)


def segment(c, r, z, n=26):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


# ---------- the cliff and its caves ----------
cl = loft('cliff', M['cliff'], [segment(0.3, 1.37, -0.01), segment(0.32, 1.36, 0.42), segment(0.45, 1.28, 0.48)], outline=0.012)
cl.visible_shadow = False
half = math.sqrt(1.37 ** 2 - 0.3 ** 2)
for r in range(4):
    for j in range(16):
        x = -half + 0.12 + j * (2 * half - 0.24) / 15 + (0.03 if r % 2 else 0)
        if abs(x + 0.05) < 0.2:
            continue
        box(f'cave{r}{j}', M['cave'], x, 0.296, G + 0.05 + r * 0.09, 0.04, 0.006, 0.05, outline=0, bevel=0)
    box(f'gallery{r}', M['cliff'], 0.0, 0.27, G + 0.035 + r * 0.09, 2 * half - 0.1, 0.05, 0.01, outline=0.002, bevel=0)

# ---------- the nine-storey pagoda front ----------
PX, PY = -0.05, 0.2
z = G - 0.005
for t in range(5):
    w = 0.42 - t * 0.05
    h = 0.11 if t < 4 else 0.1
    box(f'storey{t}', M['red'], PX, PY, z, w, 0.18 - t * 0.012, h, outline=0.006, bevel=0)
    for j in range(3):
        box(f'storeywin{t}{j}', M['cave'], PX - w * 0.3 + j * w * 0.3, PY - (0.09 - t * 0.006) - 0.004, z + h * 0.3, w * 0.12, 0.006, h * 0.5, outline=0, bevel=0)
    eave = w + 0.1
    loft(f'eave{t}', M['roof'], [[(PX - eave / 2, PY - 0.14 + t * 0.006, z + h - 0.01), (PX + eave / 2, PY - 0.14 + t * 0.006, z + h - 0.01), (PX + eave / 2, PY + 0.1, z + h - 0.01), (PX - eave / 2, PY + 0.1, z + h - 0.01)],
                                 [(PX - eave / 2 + 0.05, PY - 0.06, z + h + 0.03), (PX + eave / 2 - 0.05, PY - 0.06, z + h + 0.03), (PX + eave / 2 - 0.05, PY + 0.1, z + h + 0.03), (PX - eave / 2 + 0.05, PY + 0.1, z + h + 0.03)]],
         outline=0.005)
    z += h + 0.03
pyramid('pagodatop', M['roof'], PX, PY + 0.02, z - 0.005, 0.2, 0.1, outline=0.005)
lathe('pagodafinial', M['gold'], ((0.015, 0), (0.004, 0.06)), z + 0.09, PX, PY + 0.02, segs=6, outline=0.002)

# ---------- the dunes and poplars ----------
for k, (x, y, r, h) in enumerate(((-0.6, -0.65, 0.35, 0.14), (0.45, -0.8, 0.3, 0.12), (1.0, -0.2, 0.22, 0.1))):
    b = ball(f'dune{k}', M['dune'], 0, 0, 0, r, outline=0.01)
    b.scale = (1.5, 0.9, h / r)
    b.location = (x, y, G - 0.01)
for k in range(9):
    x = -1.05 + k * 0.26
    y = 0.05 - 0.04 * math.sin(k)
    if math.hypot(x, y) > 1.15 or abs(x + 0.05) < 0.3:
        continue
    rod(f'poplartrunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.06), 0.01, segs=5, outline=0.002)
    lathe(f'poplar{k}', M['poplar'], ((0.035, 0), (0.045, 0.08), (0.03, 0.2), (0.004, 0.28)), G + 0.04, x, y, segs=8, outline=0.005)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
