# A cartoon Haghpat Monastery for the country maps, built in the set's shared look (../toon.py):
# the medieval Armenian monastery on its plateau above the Debed gorge, its grey basalt churches
# with their drums and conical roofs, the long narthex in front, the three-storey bell tower,
# carved cross-stones (khachkars), walnut trees, and the green ridge across the gorge.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P haghpat.py -- haghpat-1024.png 1024 haghpat.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'basalt': toon('basalt', '#8e8478', shadow_mul=(0.82, 0.8, 0.86)),
    'basaltDark': toon('basaltDark', '#6e665c', shadow_mul=(0.82, 0.8, 0.86)),
    'roof': toon('roof', '#7a7068', shadow_mul=(0.82, 0.8, 0.86)),
    'khachkar': toon('khachkar', '#b0a28e', shadow_mul=(0.82, 0.8, 0.86)),
    'window': flat('window', '#3a3640'),
    'ridge': toon('ridge', '#7a9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'gorge': toon('gorge', '#9a8670', shadow_mul=(0.82, 0.8, 0.86)),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a40'),
    'path': toon('path2', '#d9c9a8', lift=0.25),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(1229)


def segment(c, r, z, n=24):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


# ---------- the gorge's far side: a rock face, then the green ridge ----------
face = loft('gorgeface', M['gorge'], [segment(0.62, 1.38, -0.01), segment(0.66, 1.36, 0.2)], outline=0.016)
face.visible_shadow = False
ridge = loft('ridge', M['ridge'], [segment(0.66, 1.36, 0.19), segment(0.82, 1.22, 0.4), segment(0.98, 1.0, 0.46)], outline=0.016, smooth=True)
ridge.visible_shadow = False
for k in range(9):
    x = -0.8 + k * 0.2
    ball(f'ridgetree{k}', M['tree'], x, 0.85 + 0.05 * math.sin(k * 1.7), G + 0.4, rng.uniform(0.06, 0.08), outline=0.01)


# ---------- an Armenian church: cross-shaped, gabled, a drum and conical roof ----------
def church(name, x, y, w, d, h, dr, dh, ch):
    box(name, M['basalt'], x, y, G - 0.005, w, d, h, outline=0.014, bevel=0)
    box(f'{name}arms', M['basalt'], x, y, G - 0.005, w + 0.08, d * 0.5, h * 0.9, outline=0.012, bevel=0)
    for (a, b, along) in ((w + 0.1, d * 0.52, 'x'), (w * 0.55, d + 0.02, 'y')):
        hx, hy = a / 2, b / 2
        top = G + h * (0.88 if along == 'x' else 1.0)
        if along == 'x':
            ring0 = [(x - hx, y - hy, top), (x + hx, y - hy, top), (x + hx, y + hy, top), (x - hx, y + hy, top)]
            ring1 = [(x - hx, y - 0.004, top + 0.07), (x + hx, y - 0.004, top + 0.07), (x + hx, y + 0.004, top + 0.07), (x - hx, y + 0.004, top + 0.07)]
        else:
            ring0 = [(x - hx, y - hy, top), (x + hx, y - hy, top), (x + hx, y + hy, top), (x - hx, y + hy, top)]
            ring1 = [(x - 0.004, y - hy, top + 0.07), (x + 0.004, y - hy, top + 0.07), (x + 0.004, y + hy, top + 0.07), (x - 0.004, y + hy, top + 0.07)]
        loft(f'{name}gable{along}', M['roof'], [ring0, ring1], outline=0.01)
    lathe(f'{name}drum', M['basalt'], ((dr, 0), (dr, dh)), G + h + 0.04, x, y, segs=8, outline=0.01)
    lathe(f'{name}cone', M['roof'], ((dr * 1.15, 0), (0.004, ch)), G + h + 0.04 + dh, x, y, segs=8, outline=0.01)
    box(f'{name}door', M['window'], x, y - d / 2 - 0.004, G, 0.05, 0.01, 0.09, outline=0, bevel=0)
    for s in (-1, 1):
        box(f'{name}slit{s}', M['window'], x + s * w * 0.3, y - d / 2 - 0.004, G + h * 0.55, 0.015, 0.01, 0.05, outline=0, bevel=0)


church('nshan', -0.05, 0.3, 0.36, 0.3, 0.22, 0.085, 0.12, 0.13)
church('astvatsatsin', 0.5, 0.42, 0.22, 0.2, 0.15, 0.055, 0.08, 0.09)
# the long narthex (gavit) in front of the main church, a lantern on its roof
box('gavit', M['basaltDark'], -0.05, 0.02, G - 0.005, 0.44, 0.24, 0.15, outline=0.014, bevel=0)
box('gavitroof', M['roof'], -0.05, 0.02, G + 0.145, 0.46, 0.26, 0.02, outline=0.006, bevel=0)
lathe('gavitlantern', M['basalt'], ((0.045, 0), (0.045, 0.04), (0.004, 0.08)), G + 0.165, -0.05, 0.02, segs=8, outline=0.006)
for s in (-1, 1):
    box(f'gavitdoor{s}', M['window'], -0.05 + s * 0.1, -0.103, G, 0.05, 0.01, 0.08, outline=0, bevel=0)

# ---------- the three-storey bell tower ----------
BX, BY = -0.62, 0.05
box('belfry1', M['basalt'], BX, BY, G - 0.005, 0.18, 0.18, 0.14, outline=0.012, bevel=0)
box('belfry2', M['basalt'], BX, BY, G + 0.135, 0.15, 0.15, 0.11, outline=0.01, bevel=0)
for s in (-1, 1):
    box(f'belfrywin{s}', M['window'], BX + s * 0.035, BY - 0.079, G + 0.17, 0.03, 0.01, 0.05, outline=0, bevel=0)
for k in range(6):
    a = 2 * math.pi * k / 6
    rod(f'rotundapost{k}', M['basalt'], (BX + 0.05 * math.cos(a), BY + 0.05 * math.sin(a), G + 0.245), (BX + 0.05 * math.cos(a), BY + 0.05 * math.sin(a), G + 0.32), 0.008,
        segs=6, outline=0.002)
lathe('rotundaroof', M['roof'], ((0.07, 0), (0.004, 0.1)), G + 0.32, BX, BY, segs=8, outline=0.008)

# ---------- cross-stones, a path, walnut trees ----------
for k, x in enumerate((0.25, 0.37, 0.49)):
    box(f'khachkar{k}', M['khachkar'], x, -0.25, G - 0.005, 0.07, 0.025, 0.13, outline=0.006, bevel=0)
    bar(f'crossup{k}', M['basaltDark'], (x, -0.264, G + 0.03), (x, -0.264, G + 0.11), 0.012, outline=0)
    bar(f'crossbar{k}', M['basaltDark'], (x - 0.022, -0.264, G + 0.085), (x + 0.022, -0.264, G + 0.085), 0.012, outline=0)
box('path', M['path'], -0.05, -0.45, G - 0.004, 0.14, 0.7, 0.008, outline=0.004, bevel=0)
for k, (x, y) in enumerate(((-0.95, -0.25), (0.85, -0.2), (-0.5, -0.6), (0.6, -0.65), (1.0, 0.25), (-1.05, 0.35))):
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.1), 0.018, segs=6, outline=0.005)
    ball(f'tree{k}', M['tree'], x, y, G + 0.16, rng.uniform(0.09, 0.11), outline=0.012)

turn(before, -20)
render(G)
