# A cartoon Gelati Monastery for the country maps, built in the set's shared look (../toon.py): the
# Georgian monastery on its green hillside, the main church in pale stone with its tall drum and
# cone roof and red-tiled arms, the smaller church beside it, the bell tower's open arches, the
# monastery wall round them, cypresses and oaks, and the Caucasus foothills behind.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P gelati.py -- gelati-1024.png 1024 gelati.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.25),
    'hill': toon('hill', '#5f9e55', shadow_mul=(0.7, 0.78, 0.8)),
    'mountain': toon('mountain', '#6a8a62', shadow_mul=(0.72, 0.8, 0.8)),
    'stone': toon('stone', '#e6d8b4', shadow_mul=(0.82, 0.78, 0.8), lift=0.2),
    'stoneDark': toon('stoneDark', '#c9b88e', shadow_mul=(0.82, 0.78, 0.8)),
    'roofTile': toon('roofTile', '#c4573a'),
    'cone': toon('cone', '#7f8a86', shadow_mul=(0.78, 0.8, 0.86)),
    'window': flat('window', '#3a3640'),
    'wall': toon('wall', '#d0c09a', shadow_mul=(0.82, 0.78, 0.8)),
    'cypress': toon('cypress', '#2f7a46', shadow_mul=(0.7, 0.78, 0.8)),
    'oak': toon('oak', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['grass'])
before = set(bpy.data.objects)
rng = random.Random(467)


def ring(cx, cy, rx, ry, z, jitter, sides=16):
    return [(cx + rx * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / sides),
             cy + ry * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / sides), G + z) for k in range(sides)]


# ---------- the foothills behind, the monastery's hill ----------
for k, (cx, cy, r, h) in enumerate(((-0.5, 0.97, 0.38, 0.55), (0.35, 1.05, 0.42, 0.48))):
    m = loft(f'mountain{k}', M['mountain'], [ring(cx, cy, r, r * 0.5, -0.01, 0.02), ring(cx, cy, r * 0.6, r * 0.32, h * 0.6, 0.08), ring(cx, cy, r * 0.22, r * 0.12, h, 0.08)],
             outline=0.03)
    m.visible_shadow = False
hill = loft('hill', M['hill'], [ring(0.0, 0.2, 1.05, 0.75, -0.01, 0.02), ring(0.0, 0.25, 0.8, 0.55, 0.1, 0.03)], outline=0.025)
hill.visible_shadow = False
T = G + 0.1


def cross_church(name, x, y, s, drum_h):
    """A Georgian cross-domed church: the arms under red tiles, the tall drum and its cone."""
    w, l, h = 0.2 * s, 0.4 * s, 0.24 * s
    box(f'{name}nave', M['stone'], x, y, T - 0.005, w, l, h, outline=0.018, bevel=0)
    box(f'{name}arms', M['stone'], x, y, T - 0.005, l * 0.85, w, h, outline=0.018, bevel=0)
    for n, (ww, dd, along) in enumerate(((w, l, False), (l * 0.85, w, True))):
        top = ([(x - ww / 2, y - 0.004), (x + ww / 2, y - 0.004), (x + ww / 2, y + 0.004), (x - ww / 2, y + 0.004)] if along else
               [(x - 0.004, y - dd / 2), (x + 0.004, y - dd / 2), (x + 0.004, y + dd / 2), (x - 0.004, y + dd / 2)])
        loft(f'{name}roof{n}', M['roofTile'], [[(x - ww / 2 - 0.01, y - dd / 2 - 0.01, T + h - 0.005), (x + ww / 2 + 0.01, y - dd / 2 - 0.01, T + h - 0.005),
                                                (x + ww / 2 + 0.01, y + dd / 2 + 0.01, T + h - 0.005), (x - ww / 2 - 0.01, y + dd / 2 + 0.01, T + h - 0.005)],
                                               [(px, py, T + h + 0.07 * s) for px, py in top]], outline=0.012)
    lathe(f'{name}apse', M['stone'], ((w * 0.4, 0), (w * 0.4, h * 0.85)), T - 0.005, x, y + l / 2, segs=16, outline=0.012)
    lathe(f'{name}drum', M['stone'], ((0.055 * s, 0), (0.055 * s, drum_h * s)), T + h + 0.03 * s, x, y, segs=12, outline=0.014, smooth=False)
    for k in range(6):
        a = 2 * math.pi * k / 6 + math.pi / 12
        box(f'{name}drumwin{k}', M['window'], x + 0.054 * s * math.cos(a), y + 0.054 * s * math.sin(a), T + h + 0.03 * s + drum_h * s * 0.35, 0.014, 0.014,
            drum_h * s * 0.35, rot_z=a, outline=0, bevel=0)
    lathe(f'{name}cone', M['cone'], ((0.065 * s, 0), (0.004, 0.1 * s)), T + h + 0.03 * s + drum_h * s, x, y, segs=12, outline=0.012, smooth=False)
    rod(f'{name}cross', M['gold'], (x, y, T + h + 0.13 * s + drum_h * s), (x, y, T + h + 0.17 * s + drum_h * s), 0.005, segs=6, outline=0)
    box(f'{name}door', M['window'], x, y - l / 2 - 0.004, T, 0.04 * s, 0.01, 0.1 * s, outline=0, bevel=0)
    for k in range(2):
        box(f'{name}win{k}', M['window'], x - l * 0.425 - 0.004, y - 0.04 * s + k * 0.08 * s, T + 0.12 * s, 0.01, 0.02 * s, 0.06 * s, outline=0, bevel=0)


cross_church('main', -0.05, 0.25, 1.45, 0.2)
cross_church('stgeorge', 0.55, 0.45, 0.8, 0.16)

# ---------- the bell tower, its open arches ----------
BX, BY = -0.55, -0.15
box('belltower', M['stoneDark'], BX, BY, T - 0.005, 0.16, 0.16, 0.24, outline=0.016, bevel=0)
box('belfry', M['stone'], BX, BY, T + 0.235, 0.14, 0.14, 0.12, outline=0.014, bevel=0)
for k in range(2):
    box(f'belfryarch{k}', M['window'], BX - 0.03 + k * 0.06, BY - 0.072, T + 0.255, 0.035, 0.01, 0.07, outline=0, bevel=0)
pyramid('belfryroof', M['roofTile'], BX, BY, T + 0.355, 0.17, 0.08, outline=0.01)

# ---------- the monastery wall ----------
WALL = [(-0.8, -0.35), (0.85, -0.35), (0.85, 0.8), (-0.8, 0.8)]
for k, ((x0, y0), (x1, y1)) in enumerate(zip(WALL, WALL[1:] + WALL[:1])):
    if k == 2:
        continue
    length = math.hypot(x1 - x0, y1 - y0)
    box(f'wall{k}', M['wall'], (x0 + x1) / 2, (y0 + y1) / 2, T - 0.02, length, 0.04, 0.1, rot_z=math.atan2(y1 - y0, x1 - x0), outline=0.012, bevel=0)
box('gate', M['window'], 0.1, -0.372, T - 0.01, 0.08, 0.01, 0.08, outline=0, bevel=0)

# ---------- cypresses and oaks ----------
for k, (x, y) in enumerate(((-0.95, -0.5), (0.95, -0.5), (-1.0, 0.3), (1.0, 0.35), (-0.35, -0.6), (0.4, -0.65))):
    if k < 4:
        rod(f'cypress{k}', M['cypress'], (x, y, G), (x, y, G + rng.uniform(0.38, 0.48)), 0.06, r2=0.0, segs=10, outline=0.014)
    else:
        ball(f'oak{k}', M['oak'], x, y, G + 0.12, 0.11, outline=0.018)

turn(before, -20)
render(G)
