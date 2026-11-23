# A cartoon Joya de Cerén for the country maps, built in the set's shared look (../toon.py): El
# Salvador's Maya village buried by a volcano's ash fourteen centuries ago, its dug-out adobe house
# platforms and walls in the excavation pits, the roofs sheltering them, a milpa of maize, and the
# San Salvador volcano behind. Turned a little towards the camera.
# Run: blender -b --factory-startup -P joya-de-ceren.py -- joya-de-ceren-1024.png 1024 joya-de-ceren.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#8cc35b', shadow_mul=(0.7, 0.78, 0.8), lift=0.25),
    'ash': toon('ash', '#a8957a', shadow_mul=(0.84, 0.8, 0.82)),
    'pit': toon('pit', '#8a7458'),
    'adobe': toon('adobe', '#c49a6a', shadow_mul=(0.84, 0.76, 0.74)),
    'adobeDark': toon('adobeDark', '#a87e54', shadow_mul=(0.84, 0.76, 0.74)),
    'roof': toon('roof', '#c9a85a', shadow_mul=(0.84, 0.76, 0.62)),
    'post': toon('post', '#7a5a40'),
    'volcano': toon('volcano', '#5f8a55', shadow_mul=(0.72, 0.78, 0.78)),
    'volcanoTop': toon('volcanoTop', '#7a6e64', shadow_mul=(0.82, 0.8, 0.86)),
    'maize': toon('maize', '#8ab84a', shadow_mul=(0.72, 0.78, 0.76)),
    'cob': toon('cob', '#f2c84a', shadow_mul=(0.84, 0.72, 0.6)),
    'path': toon('path2', '#d9c9a8', lift=0.25),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(971)

# ---------- the volcano behind ----------
vl = loft('volcano', M['volcano'], [[(0.1 + 0.8 * math.cos(t), 0.95 + 0.3 * math.sin(t), G - 0.01) for t in (2 * math.pi * j / 20 for j in range(20))],
                                   [(0.1 + 0.3 * math.cos(t), 0.98 + 0.12 * math.sin(t), G + 0.36) for t in (2 * math.pi * j / 20 for j in range(20))]], outline=0.022, smooth=True)
vl.visible_shadow = False
vt = loft('volcanotop', M['volcanoTop'], [[(0.1 + 0.3 * math.cos(t), 0.98 + 0.12 * math.sin(t), G + 0.36) for t in (2 * math.pi * j / 20 for j in range(20))],
                                         [(0.1 + 0.22 * math.cos(t), 0.98 + 0.09 * math.sin(t), G + 0.42) for t in (2 * math.pi * j / 20 for j in range(20))],
                                         [(0.1 + 0.18 * math.cos(t), 0.98 + 0.07 * math.sin(t), G + 0.39) for t in (2 * math.pi * j / 20 for j in range(20))]], outline=0.016)
vt.visible_shadow = False


# ---------- the excavations: ash-walled pits with adobe structures, under shelter roofs ----------
def excavation(name, x, y, w, d, structures, roofed=True):
    box(f'{name}rim', M['ash'], x, y, G - 0.005, w + 0.08, d + 0.08, 0.03, outline=0.008, bevel=0)
    box(f'{name}pit', M['pit'], x, y, G + 0.004, w, d, 0.026, outline=0, bevel=0)
    for k, (dx, dy, sw, sd, sh) in enumerate(structures):
        box(f'{name}platform{k}', M['adobeDark'], x + dx, y + dy, G + 0.02, sw + 0.04, sd + 0.04, 0.04, outline=0.006, bevel=0)
        for j, (ox, oy, ww, wd) in enumerate(((0, -sd / 2, sw, 0.02), (-sw / 2, 0, 0.02, sd), (sw / 2, 0, 0.02, sd))):
            box(f'{name}wall{k}{j}', M['adobe'], x + dx + ox, y + dy + oy, G + 0.055, ww, wd, sh, outline=0.005, bevel=0)
    if roofed:
        for sx in (-1, 1):
            for sy in (-1, 1):
                rod(f'{name}post{sx}{sy}', M['post'], (x + sx * (w / 2 + 0.02), y + sy * (d / 2 + 0.02), G), (x + sx * (w / 2 + 0.02), y + sy * (d / 2 + 0.02), G + 0.22),
                    0.01, segs=6, outline=0.003)
        loft(f'{name}roof', M['roof'], [[(x - w / 2 - 0.06, y - d / 2 - 0.06, G + 0.21), (x + w / 2 + 0.06, y - d / 2 - 0.06, G + 0.21), (x + w / 2 + 0.06, y + d / 2 + 0.06, G + 0.21),
                                         (x - w / 2 - 0.06, y + d / 2 + 0.06, G + 0.21)],
                                        [(x - w / 2, y - 0.004, G + 0.3), (x + w / 2, y - 0.004, G + 0.3), (x + w / 2, y + 0.004, G + 0.3), (x - w / 2, y + 0.004, G + 0.3)]],
             outline=0.01)


excavation('area1', -0.35, 0.15, 0.5, 0.36, ((-0.1, 0.0, 0.18, 0.14, 0.07), (0.13, 0.05, 0.12, 0.12, 0.06)))
excavation('area2', 0.45, 0.2, 0.36, 0.3, ((0.0, 0.0, 0.16, 0.14, 0.08),))
excavation('area3', 0.05, -0.35, 0.4, 0.26, ((-0.06, 0.0, 0.14, 0.12, 0.05), (0.1, 0.02, 0.1, 0.1, 0.07)), roofed=False)
box('path', M['path'], 0.05, -0.8, G - 0.004, 0.12, 0.6, 0.008, outline=0.004, bevel=0)

# ---------- a milpa of maize ----------
for r in range(4):
    for j in range(5):
        x, y = -0.95 + j * 0.1, -0.35 - r * 0.12
        if math.hypot(x, y) > 1.2:
            continue
        h = rng.uniform(0.12, 0.16)
        rod(f'maize{r}{j}', M['maize'], (x, y, G), (x, y, G + h), 0.007, segs=5, outline=0.002)
        for s in (-1, 1):
            bar(f'maizeleaf{r}{j}{s}', M['maize'], (x, y, G + h * 0.6), (x + s * 0.04, y, G + h * 0.75), 0.008, outline=0.001)
        if j % 2 == 0:
            ball(f'cob{r}{j}', M['cob'], x + 0.012, y, G + h * 0.5, 0.012, outline=0.002)

turn(before, -20)
render(G)
