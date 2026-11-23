# A cartoon Aït Benhaddou for the country maps, built in the set's shared look (../toon.py): the
# fortified earthen ksar climbing its hill above the Ounila river, its red mud-brick houses and
# kasbah towers with their crenellations stacked up the slope, the granary on top, palms along the
# riverbank, and the stepping stones across. Turned a little towards the camera.
# Run: blender -b --factory-startup -P ait-benhaddou.py -- ait-benhaddou-1024.png 1024 ait-benhaddou.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#d8a874', shadow_mul=(0.86, 0.78, 0.72), lift=0.2),
    'hill': toon('hill', '#c8905a', shadow_mul=(0.86, 0.76, 0.72)),
    'mud': toon('mud', '#c87a4a', shadow_mul=(0.86, 0.74, 0.72)),
    'mudLight': toon('mudLight', '#d8925a', shadow_mul=(0.86, 0.76, 0.72)),
    'window': flat('window', '#3a2a24'),
    'river': toon('river', '#7aa8a0', lift=0.3),
    'stone': toon('stone', '#b8aa94'),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(1787)


def ring(cx, cy, rx, ry, z, k, sides=22):
    return [(cx + rx * math.cos(t) * (1 + 0.06 * math.sin(3 * t + k)), cy + ry * math.sin(t) * (1 + 0.06 * math.cos(2 * t + k)), G + z) for t in (2 * math.pi * j / sides for j in range(sides))]


# ---------- the river and its stepping stones ----------
for k, ((x0, y0), (x1, y1)) in enumerate((((-1.3, -0.55), (0.0, -0.62)), ((0.0, -0.62), (1.3, -0.5)))):
    a = math.atan2(y1 - y0, x1 - x0) + math.pi / 2
    quad = [(x0 - 0.12 * math.cos(a), y0 - 0.12 * math.sin(a)), (x1 - 0.12 * math.cos(a), y1 - 0.12 * math.sin(a)), (x1 + 0.12 * math.cos(a), y1 + 0.12 * math.sin(a)),
            (x0 + 0.12 * math.cos(a), y0 + 0.12 * math.sin(a))]
    loft(f'river{k}', M['river'], [[(x, y, G - 0.004) for x, y in quad], [(x, y, G + 0.003) for x, y in quad]], outline=0.003)
for j in range(6):
    box(f'steppingstone{j}', M['stone'], 0.2 + 0.015 * j, -0.75 + j * 0.05, G - 0.002, 0.05, 0.035, 0.02, outline=0.003, bevel=0)

# ---------- the hill ----------
HX, HY = 0.0, 0.3
hill = loft('hill', M['hill'], [ring(HX, HY, 0.9, 0.62, -0.01, 1), ring(HX, HY + 0.08, 0.6, 0.4, 0.25, 1), ring(HX, HY + 0.12, 0.25, 0.18, 0.42, 1)], outline=0.016, smooth=True)
hill.visible_shadow = False


def kasbah(name, x, y, z, w, h, mat, towers=False):
    box(name, M[mat], x, y, G + z - 0.02, w, w * 0.8, h + 0.02, outline=0.008, bevel=0)
    for j in range(int(w / 0.04)):
        box(f'{name}merlon{j}', M[mat], x - w / 2 + 0.02 + j * 0.04, y - w * 0.4, G + z + h, 0.018, 0.02, 0.025, outline=0.002, bevel=0)
    box(f'{name}win', M['window'], x, y - w * 0.4 - 0.004, G + z + h * 0.5, 0.018, 0.006, 0.03, outline=0, bevel=0)
    if towers:
        for s in (-1, 1):
            loft(f'{name}tower{s}', M[mat], [[(x + s * w / 2 - 0.03, y - w * 0.4 - 0.03, G + z - 0.02), (x + s * w / 2 + 0.03, y - w * 0.4 - 0.03, G + z - 0.02),
                                              (x + s * w / 2 + 0.03, y - w * 0.4 + 0.03, G + z - 0.02), (x + s * w / 2 - 0.03, y - w * 0.4 + 0.03, G + z - 0.02)],
                                             [(x + s * w / 2 - 0.022, y - w * 0.4 - 0.022, G + z + h + 0.08), (x + s * w / 2 + 0.022, y - w * 0.4 - 0.022, G + z + h + 0.08),
                                              (x + s * w / 2 + 0.022, y - w * 0.4 + 0.022, G + z + h + 0.08), (x + s * w / 2 - 0.022, y - w * 0.4 + 0.022, G + z + h + 0.08)]],
                 outline=0.006)


# rows of houses and kasbahs climbing the slope
for i, (y, z, n, w) in enumerate(((-0.12, 0.05, 7, 0.17), (0.05, 0.13, 6, 0.16), (0.2, 0.22, 5, 0.15), (0.33, 0.31, 4, 0.14))):
    half = n * w * 0.55
    for j in range(n):
        x = -half + (j + 0.5) * 2 * half / n + rng.uniform(-0.02, 0.02)
        kasbah(f'kasbah{i}{j}', x, y, z, w, rng.uniform(0.08, 0.13), 'mud' if (i + j) % 2 else 'mudLight', towers=(j % 3 == 1))
kasbah('granary', 0.0, 0.42, 0.42, 0.18, 0.1, 'mudLight', towers=True)

# ---------- palms along the river ----------
for k, (x, y) in enumerate(((-0.9, -0.35), (-0.6, -0.4), (0.7, -0.32), (1.0, -0.25), (-1.05, -0.8), (0.85, -0.85))):
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + 0.3), 0.013, r2=0.01, segs=8, outline=0.004)
    for f in range(7):
        b = 2 * math.pi * f / 7 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.02, y, G + 0.3), (x + 0.02 + 0.1 * math.cos(b), y + 0.1 * math.sin(b), G + 0.25), 0.019, outline=0.005)

turn(before, -20)
render(G)
