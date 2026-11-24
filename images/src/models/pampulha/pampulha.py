# A cartoon Pampulha for the country maps, built in the set's shared look (../toon.py): Niemeyer's Church
# of St Francis of Assisi by Pampulha's lake in Belo Horizonte, its white concrete shells in parabolic
# waves, the tall nave vault behind and the row of small vaults in front faced with Portinari's blue
# and white tiles, the free-standing bell tower that widens towards its top, and the lake with its
# palms. Turned a little towards the camera.
# Run: blender -b --factory-startup -P pampulha.py -- pampulha-1024.png 1024 pampulha.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'paving': toon('paving', '#ddd6c8', shadow_mul=(0.84, 0.84, 0.9), lift=0.2),
    'concrete': toon('concrete', '#f2f0ea', shadow_mul=(0.8, 0.82, 0.9), lift=0.22),
    'tileWhite': toon('tileWhite', '#dce8f6', lift=0.2),
    'tileBlue': toon('tileBlue', '#2e5aa8', lift=0.15),
    'glass': toon('glass', '#5a7a90', lift=0.3),
    'water': toon('water', '#3f8fc0', lift=0.3),
    'palm': toon('palm', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6a4a'),
    'dark': flat('dark', '#2e2a2a'),
})

G = tile(M['grass'])
before = set(bpy.data.objects)
rng = random.Random(1943)


def strip(y0, y1, r, z):
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    right = [(r * math.cos(a0 + (a1 - a0) * k / 12), r * math.sin(a0 + (a1 - a0) * k / 12), z) for k in range(13)]
    left = [(-r * math.cos(a1 + (a0 - a1) * k / 12), r * math.sin(a1 + (a0 - a1) * k / 12), z) for k in range(13)]
    return right + left


def parabola(x0, w, h, y, z0, n=14):
    """A parabolic arch outline in the xz plane at depth y, counter-clockwise seen from the front."""
    return [(x0 - w + 2 * w * k / n, y, z0 + h * (1 - ((-w + 2 * w * k / n) / w) ** 2)) for k in range(n + 1)]


def vault(name, mat, x0, w, h, y0, y1):
    return loft(name, mat, [parabola(x0, w, h, y0, G - 0.005), parabola(x0, w, h, y1, G - 0.005)], outline=0.006)


# ---------- the lake ----------
loft('lake', M['water'], [strip(-1.31, -0.55, 1.32, G - 0.004), strip(-1.31, -0.55, 1.32, G + 0.008)], outline=0.002)
loft('terrace', M['paving'], [[(-0.6, -0.5, G - 0.004), (0.65, -0.5, G - 0.004), (0.65, 0.65, G - 0.004), (-0.6, 0.65, G - 0.004)],
                              [(-0.6, -0.5, G + 0.006), (0.65, -0.5, G + 0.006), (0.65, 0.65, G + 0.006), (-0.6, 0.65, G + 0.006)]], outline=0.002)

# ---------- the nave vault behind ----------
vault('nave', M['concrete'], 0.0, 0.26, 0.42, -0.1, 0.5)
loft('navefront', M['glass'], [parabola(0.0, 0.22, 0.36, -0.107, G), parabola(0.0, 0.22, 0.36, -0.101, G)], outline=0)
for k in range(5):
    x = -0.16 + k * 0.08
    zt = G + 0.36 * (1 - (x / 0.22) ** 2)
    bar(f'brise{k}', M['concrete'], (x, -0.11, G), (x, -0.11, zt), 0.012, outline=0.001)

# ---------- the row of small vaults in front, faced with blue and white tiles ----------
for k, x in enumerate((-0.36, 0.36)):
    vault(f'smallvault{k}', M['concrete'], x, 0.12, 0.22, -0.28, 0.0)
    loft(f'tiles{k}', M['tileWhite'], [parabola(x, 0.11, 0.2, -0.287, G), parabola(x, 0.11, 0.2, -0.281, G)], outline=0.001)
    for j in range(10):
        tx = x - 0.08 + 0.16 * rng.random()
        tz = G + 0.02 + 0.15 * rng.random() * (1 - ((tx - x) / 0.11) ** 2)
        box(f'tilefigure{k}{j}', M['tileBlue'], tx, -0.291, tz, 0.022, 0.004, 0.022, rot_z=0, outline=0, bevel=0)
# the low wavy porch between them
vault('porch', M['concrete'], 0.0, 0.24, 0.13, -0.24, -0.1)
loft('porchtiles', M['tileWhite'], [parabola(0.0, 0.22, 0.11, -0.247, G), parabola(0.0, 0.22, 0.11, -0.241, G)], outline=0.001)
for j in range(8):
    tx = -0.15 + 0.3 * j / 7
    box(f'porchfigure{j}', M['tileBlue'], tx, -0.251, G + 0.02 + 0.04 * (1 - (tx / 0.22) ** 2), 0.02, 0.004, 0.03, outline=0, bevel=0)

# ---------- the bell tower, wider at its top ----------
BX, BY = 0.55, 0.1
loft('belltower', M['concrete'], [[(BX - 0.025, BY - 0.02, G - 0.005), (BX + 0.025, BY - 0.02, G - 0.005), (BX + 0.025, BY + 0.02, G - 0.005), (BX - 0.025, BY + 0.02, G - 0.005)],
                                  [(BX - 0.06, BY - 0.03, G + 0.38), (BX + 0.06, BY - 0.03, G + 0.38), (BX + 0.06, BY + 0.03, G + 0.38), (BX - 0.06, BY + 0.03, G + 0.38)]], outline=0.004)
box('bellslot', M['dark'], BX, BY - 0.031, G + 0.27, 0.06, 0.006, 0.06, outline=0, bevel=0)
bar('cross', M['concrete'], (BX, BY, G + 0.38), (BX, BY, G + 0.47), 0.012, outline=0.002)
bar('crossbar', M['concrete'], (BX - 0.03, BY, G + 0.44), (BX + 0.03, BY, G + 0.44), 0.012, outline=0.002)

# ---------- palms ----------
for k, (x, y) in enumerate(((-0.85, -0.25), (-0.75, 0.35), (0.85, -0.2), (0.9, 0.4), (-0.2, 0.85))):
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + 0.3), 0.012, segs=6, outline=0.002)
    for j in range(6):
        a = 2 * math.pi * j / 6
        b = ball(f'frond{k}{j}', M['palm'], 0, 0, 0, 1.0, outline=0.003)
        b.scale = (0.08, 0.02, 0.012)
        b.rotation_euler = (0, 0.35, a)
        b.location = (x + 0.02 + 0.06 * math.cos(a), y + 0.06 * math.sin(a), G + 0.29)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
