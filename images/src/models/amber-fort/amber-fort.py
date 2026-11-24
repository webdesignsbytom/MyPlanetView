# A cartoon Amber Fort for the country maps, built in the set's shared look (../toon.py): the
# honey-coloured palace fort climbing its hill above Maota Lake, its terraces of walls and pavilions
# topped with chhatris, the long battlemented wall snaking over the ridge behind, the saffron
# garden island in the lake, and an elephant on the ramp up. Turned a little towards the camera.
# Run: blender -b --factory-startup -P amber-fort.py -- amber-fort-1024.png 1024 amber-fort.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#b8b070', shadow_mul=(0.84, 0.82, 0.72), lift=0.2),
    'hill': toon('hill', '#9a9a58', shadow_mul=(0.8, 0.82, 0.72)),
    'honey': toon('honey', '#e8c078', shadow_mul=(0.86, 0.8, 0.74), lift=0.12),
    'honeyDark': toon('honeyDark', '#c89a58', shadow_mul=(0.86, 0.8, 0.74)),
    'marble': toon('marble', '#f8f6f0', lift=0.15),
    'lake': toon('lake', '#5a9ab0', lift=0.3),
    'garden': toon('garden', '#6aa54a'),
    'window': flat('window', '#3a2a24'),
    'elephant': toon('elephant', '#8a8484'),
    'saddle': toon('saddle', '#d83a2c'),
})

G = tile(M['ground'])
before = set(bpy.data.objects)


def chhatri(name, x, y, z, r, mat='honey'):
    for j in range(4):
        a = math.pi / 4 + j * math.pi / 2
        rod(f'{name}col{j}', M[mat], (x + r * 0.7 * math.cos(a), y + r * 0.7 * math.sin(a), z), (x + r * 0.7 * math.cos(a), y + r * 0.7 * math.sin(a), z + r * 1.1), r * 0.13, segs=5, outline=0.002)
    lathe(f'{name}dome', M[mat], ((r * 0.95, 0), (r * 0.85, r * 0.45), (r * 0.45, r * 0.85), (0.004, r * 1.05)), z + r * 1.1, x, y, segs=10, outline=0.004)


def segment(c, r, z, n=26):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


# ---------- the ridge and its long wall ----------
rd = loft('ridge', M['hill'], [segment(0.05, 1.38, -0.01), segment(0.2, 1.33, 0.22), segment(0.55, 1.15, 0.36), segment(0.8, 0.95, 0.4)], outline=0.012, smooth=True)
rd.visible_shadow = False
pts = [(-1.15, 0.6, 0.27), (-0.8, 0.75, 0.33), (-0.45, 0.95, 0.4), (0.0, 1.0, 0.41), (0.45, 0.95, 0.4), (0.8, 0.75, 0.33), (1.15, 0.6, 0.27)]
for j in range(len(pts) - 1):
    (x0, y0, z0), (x1, y1, z1) = pts[j], pts[j + 1]
    bar(f'ridgewall{j}', M['honeyDark'], (x0, y0, G + z0), (x1, y1, G + z1), 0.04, outline=0.004)
    lathe(f'ridgetower{j}', M['honeyDark'], ((0.04, 0), (0.035, 0.08)), G + z0 - 0.02, x0, y0, segs=8, outline=0.003)

# ---------- the palace terraces on the hill's face ----------
FX, FY = 0.0, 0.22
for t, (w, d, z, h) in enumerate(((1.1, 0.16, 0.0, 0.2), (0.85, 0.16, 0.18, 0.14), (0.6, 0.14, 0.3, 0.12))):
    y = FY + t * 0.14
    box(f'terrace{t}', M['honey' if t % 2 == 0 else 'honeyDark'], FX, y, G + z - 0.005, w, d, h + 0.02, outline=0.009, bevel=0)
    n = int(w / 0.08)
    for j in range(n):
        box(f'terracewin{t}{j}', M['window'], FX - w / 2 + 0.04 + j * (w - 0.08) / max(1, n - 1), y - d / 2 - 0.004, G + z + h * 0.45, 0.025, 0.006, h * 0.35, outline=0, bevel=0)
    for j in range(4):
        chhatri(f'chhatri{t}{j}', FX - w / 2 + 0.08 + j * (w - 0.16) / 3, y, G + z + h + 0.015, 0.035 if t < 2 else 0.045, 'marble' if t == 2 and j in (1, 2) else 'honey')
for s in (-1, 1):
    lathe(f'cornertower{s}', M['honeyDark'], ((0.06, 0), (0.055, 0.32)), G - 0.005, FX + s * 0.58, FY, segs=10, outline=0.006)
    chhatri(f'cornerchhatri{s}', FX + s * 0.58, FY, G + 0.315, 0.05)

# ---------- Maota Lake and its saffron garden ----------
loft('lake', M['lake'], [[(-0.1 + 0.75 * math.cos(t), -0.5 + 0.26 * math.sin(t), G - 0.004) for t in (2 * math.pi * j / 26 for j in range(26))],
                         [(-0.1 + 0.75 * math.cos(t), -0.5 + 0.26 * math.sin(t), G + 0.006) for t in (2 * math.pi * j / 26 for j in range(26))]], outline=0.004, smooth=True)
box('kesarkyari', M['honeyDark'], 0.25, -0.5, G - 0.004, 0.3, 0.16, 0.03, outline=0.004, bevel=0)
for i in range(3):
    for j in range(2):
        box(f'parterre{i}{j}', M['garden'], 0.17 + i * 0.08, -0.54 + j * 0.08, G + 0.022, 0.06, 0.06, 0.012, outline=0.001, bevel=0)

# ---------- an elephant on the ramp ----------
EX, EY = -0.75, -0.05
b = ball('elephantbody', M['elephant'], 0, 0, 0, 0.055, outline=0.005)
b.scale = (1.35, 0.9, 0.95)
b.location = (EX, EY, G + 0.1)
for fx in (-0.04, 0.04):
    for s in (-1, 1):
        rod(f'elephantleg{fx}{s}', M['elephant'], (EX + fx, EY + s * 0.03, G), (EX + fx, EY + s * 0.03, G + 0.07), 0.016, segs=6, outline=0.002)
ball('elephanthead', M['elephant'], EX + 0.08, EY, G + 0.13, 0.04, outline=0.004)
rod('elephanttrunk', M['elephant'], (EX + 0.11, EY, G + 0.12), (EX + 0.12, EY, G + 0.03), 0.012, r2=0.007, segs=6, outline=0.002)
box('howdah', M['saddle'], EX, EY, G + 0.15, 0.08, 0.08, 0.04, outline=0.003, bevel=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
