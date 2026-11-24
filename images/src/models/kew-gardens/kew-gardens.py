# A cartoon Kew Gardens for the country maps, built in the set's shared look (../toon.py): the Palm
# House, its white iron ribs and green-tinted glass in a tall curved middle and two long lower
# wings with rounded ends, the pond before it with its fountain, the ten-storey Great Pagoda behind,
# and lawns and trees. Turned a little towards the camera.
# Run: blender -b --factory-startup -P kew-gardens.py -- kew-gardens-1024.png 1024 kew-gardens.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'glass': toon('glass', '#b8e0d8', shadow_mul=(0.8, 0.88, 0.9), lift=0.3),
    'rib': toon('rib', '#f8f8f6', lift=0.2),
    'stone': toon('stone', '#e0d8c8', lift=0.12),
    'pond': toon('pond', '#4a8ab0', lift=0.3),
    'white': toon('white', '#f6f4ee', lift=0.2),
    'pagodaRed': toon('pagodaRed', '#c4573a'),
    'pagodaRoof': toon('pagodaRoof', '#3f7a5a'),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)

PX, PY = 0.0, 0.25


def vault(name, x0, x1, y, half_w, z0, h, ribs):
    """A glass barrel vault along x: an arched profile across y, swept from x0 to x1, with white ribs."""
    arch = [(y + half_w * math.cos(math.pi * j / 12), z0 + h * math.sin(math.pi * j / 12)) for j in range(13)]
    loft(name, M['glass'], [[(x0, yy, zz) for yy, zz in arch], [(x1, yy, zz) for yy, zz in arch]], outline=0.007)
    for i in range(ribs + 1):
        x = x0 + (x1 - x0) * i / ribs
        for j in range(12):
            (ya, za), (yb, zb) = arch[j], arch[j + 1]
            bar(f'{name}rib{i}{j}', M['rib'], (x, ya, za), (x, yb, zb), 0.01, outline=0)


def apse(name, x, y, half_w, z0, h, side):
    b = ball(name, M['glass'], 0, 0, 0, 1.0, outline=0.007)
    b.scale = (half_w * 0.9, half_w, h)
    b.location = (x, y, z0)
    for j in range(5):
        a = side * (-math.pi / 2 + math.pi * j / 4)
        pts = [(x + half_w * 0.9 * math.cos(t) * math.cos(a), y + half_w * math.cos(t) * math.sin(a), z0 + h * math.sin(t)) for t in (math.pi / 2 * i / 6 for i in range(7))]
        for i in range(6):
            bar(f'{name}rib{j}{i}', M['rib'], pts[i], pts[i + 1], 0.009, outline=0)


box('plinth', M['stone'], PX, PY, G - 0.005, 1.5, 0.42, 0.04, outline=0.006, bevel=0)
B = G + 0.035
# the wings, low and long, with rounded ends
for s in (-1, 1):
    x0, x1 = PX + s * 0.2, PX + s * 0.58
    vault(f'wing{s}', min(x0, x1), max(x0, x1), PY, 0.16, B, 0.17, 5)
    apse(f'wingend{s}', PX + s * 0.58, PY, 0.16, B, 0.17, s)
# the tall middle with its clerestory
box('middlebase', M['glass'], PX, PY, B - 0.005, 0.42, 0.36, 0.12, outline=0.007, bevel=0)
for j in range(7):
    bar(f'middlerib{j}', M['rib'], (PX - 0.21 + j * 0.07, PY - 0.181, B), (PX - 0.21 + j * 0.07, PY - 0.181, B + 0.115), 0.01, outline=0)
vault('middle', PX - 0.2, PX + 0.2, PY, 0.18, B + 0.11, 0.2, 4)
box('gallery', M['rib'], PX, PY, B + 0.11, 0.44, 0.38, 0.015, outline=0.003, bevel=0)
lathe('lantern', M['glass'], ((0.04, 0), (0.04, 0.06)), B + 0.3, PX, PY, segs=8, outline=0.003, smooth=False)

# ---------- the pond and its fountain ----------
loft('pond', M['pond'], [[(PX + 0.6 * math.cos(t), -0.45 + 0.2 * math.sin(t), G - 0.004) for t in (2 * math.pi * j / 24 for j in range(24))],
                         [(PX + 0.6 * math.cos(t), -0.45 + 0.2 * math.sin(t), G + 0.006) for t in (2 * math.pi * j / 24 for j in range(24))]], outline=0.004, smooth=True)
lathe('fountain', M['white'], ((0.025, 0), (0.008, 0.14)), G + 0.005, PX, -0.45, segs=8, outline=0.002)

# ---------- the Great Pagoda behind ----------
GX, GY = 0.75, 0.85
z = G - 0.005
for t in range(7):
    r = 0.09 - t * 0.008
    lathe(f'pagodastorey{t}', M['pagodaRed' if t % 2 else 'white'], ((r, 0), (r, 0.06)), z, GX, GY, segs=8, outline=0.004, smooth=False)
    lathe(f'pagodaroof{t}', M['pagodaRoof'], ((r + 0.035, 0), (r * 0.7, 0.025)), z + 0.06, GX, GY, segs=8, outline=0.003, smooth=False)
    z += 0.085
lathe('pagodafinial', M['pagodaRoof'], ((0.02, 0), (0.004, 0.06)), z, GX, GY, segs=8, outline=0.002)

for k, (x, y) in enumerate(((-0.95, -0.2), (0.95, -0.1), (-0.8, 0.7), (-0.4, 0.85), (1.05, 0.4))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.12, 0.1, outline=0.009)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
