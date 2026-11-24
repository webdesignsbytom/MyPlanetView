# A cartoon Matera for the country maps, built in the set's shared look (../toon.py): the Sassi, the
# cave houses of pale tufa stacked one above another up the side of the ravine with their doors cut
# into the rock and their roofs the streets of the houses above, little stairways between, the
# cathedral and its bell tower on the top, and the Gravina gorge in front. Turned a little towards
# the camera.
# Run: blender -b --factory-startup -P matera.py -- matera-1024.png 1024 matera.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#c8b890', shadow_mul=(0.86, 0.82, 0.76), lift=0.2),
    'gorge': toon('gorge', '#8a7a60', shadow_mul=(0.86, 0.82, 0.78)),
    'tufa': toon('tufa', '#e8dcc0', shadow_mul=(0.84, 0.82, 0.82), lift=0.12),
    'tufaDark': toon('tufaDark', '#d0c09c', shadow_mul=(0.84, 0.82, 0.82)),
    'cave': flat('cave', '#3a2e24'),
    'stair': toon('stair', '#c0ae88'),
    'scrub': toon('scrub', '#8a9a58'),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(2299)

def segment(c, r, z, n=26):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


# ---------- the gorge in front ----------
box('gorge', M['gorge'], 0.0, -0.75, G - 0.006, 2.4, 0.3, 0.012, rot_z=0.08, outline=0.003, bevel=0)

# ---------- the terraces of cave houses climbing the slope ----------
ROWS = 6
for r in range(ROWS):
    y = -0.45 + r * 0.15
    z = r * 0.07
    half = math.sqrt(max(0.0, 1.25 ** 2 - y * y)) - 0.1
    tr = loft(f'terrace{r}', M['tufaDark'], [segment(y, 1.3, -0.01), segment(y, 1.3, z + 0.035)], outline=0.006)
    tr.visible_shadow = False
    n = int(2 * half / 0.15)
    for j in range(n):
        x = -half + 0.08 + j * (2 * half - 0.16) / max(1, n - 1) + rng.uniform(-0.02, 0.02)
        h = rng.uniform(0.07, 0.11)
        w = rng.uniform(0.1, 0.13)
        box(f'house{r}{j}', M['tufa'], x, y + 0.05, G + z + 0.035, w, 0.1, h, outline=0.004, bevel=0)
        box(f'door{r}{j}', M['cave'], x - w * 0.15, y - 0.002, G + z + 0.035, w * 0.28, 0.006, h * 0.6, outline=0, bevel=0)
        if j % 2:
            box(f'window{r}{j}', M['cave'], x + w * 0.25, y - 0.002, G + z + 0.035 + h * 0.5, w * 0.15, 0.006, h * 0.2, outline=0, bevel=0)
    for j in range(2):
        x = -half * 0.5 + j * half
        for i in range(3):
            box(f'stair{r}{j}{i}', M['stair'], x, y - 0.02 + i * 0.02, G + z + 0.04 - 0.07 + i * 0.024, 0.06, 0.03, 0.024, outline=0.001, bevel=0)
T = G + ROWS * 0.07 + 0.04

# ---------- the cathedral on top ----------
CX, CY = 0.2, 0.62
box('cathedral', M['tufa'], CX, CY, T - 0.03, 0.34, 0.16, 0.16, outline=0.008, bevel=0)
loft('cathroof', M['tufaDark'], [[(CX - 0.17, CY - 0.08, T + 0.125), (CX + 0.17, CY - 0.08, T + 0.125), (CX + 0.17, CY + 0.08, T + 0.125), (CX - 0.17, CY + 0.08, T + 0.125)],
                                 [(CX - 0.17, CY - 0.004, T + 0.18), (CX + 0.17, CY - 0.004, T + 0.18), (CX + 0.17, CY + 0.004, T + 0.18), (CX - 0.17, CY + 0.004, T + 0.18)]], outline=0.005)
cyl('cathrose', M['cave'], 0.03, 0.006, segs=14, outline=0.002, matrix=Matrix.Translation((CX - 0.172, CY, T + 0.08)) @ Matrix.Rotation(-math.pi / 2, 4, 'Y'))
box('campanile', M['tufa'], CX + 0.22, CY, T - 0.03, 0.08, 0.08, 0.38, outline=0.006, bevel=0)
box('campanilebelfry', M['cave'], CX + 0.22, CY - 0.042, T + 0.24, 0.03, 0.006, 0.06, outline=0, bevel=0)
lathe('campanilespire', M['tufaDark'], ((0.045, 0), (0.004, 0.1)), T + 0.345, CX + 0.22, CY, segs=8, outline=0.004, smooth=False)

for k in range(6):
    x, y = rng.uniform(-1.0, 1.0), rng.uniform(-0.95, -0.6)
    if math.hypot(x, y) > 1.15:
        continue
    ball(f'scrub{k}', M['scrub'], x, y, G + 0.02, 0.04, outline=0.004)

turn(before, -20)
render(G)
