# A cartoon San Miguel de Allende for the country maps, built in the set's shared look (../toon.py): the
# Parroquia de San Miguel Arcángel over the town's garden square, its pink stone neo-Gothic front
# rising in stages bristling with pinnacles to the tall central spire, the tiled dome behind, the
# colonial houses round the square in ochre, red and yellow, and the square's clipped laurel trees
# and bandstand. Turned a little towards the camera.
# Run: blender -b --factory-startup -P san-miguel-de-allende.py -- san-miguel-de-allende-1024.png 1024 san-miguel-de-allende.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d8cdb8', shadow_mul=(0.84, 0.84, 0.9), lift=0.2),
    'pink': toon('pink', '#e49a84', shadow_mul=(0.8, 0.74, 0.8), lift=0.15),
    'pinkDark': toon('pinkDark', '#c87a66'),
    'domeTiles': toon('domeTiles', '#e8a040', lift=0.15),
    'ochre': toon('ochre', '#e0a850', lift=0.12),
    'red': toon('red', '#c0503e', lift=0.12),
    'yellow': toon('yellow', '#f0d070', lift=0.12),
    'white': toon('white', '#f6f2ea', lift=0.2),
    'dark': flat('dark', '#2e2a2a'),
    'laurel': toon('laurel', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a4a36'),
    'iron': toon('iron', '#3a3e44'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)


def pinnacle(name, x, y, z, r, h):
    lathe(name, M['pink'], ((r, 0), (r * 0.8, h * 0.2), (0.002, h)), z, x, y, segs=6, outline=0.001, smooth=False)


def gothic_window(name, x, y, z, w, h):
    box(name, M['dark'], x, y, z, w, 0.006, h, outline=0, bevel=0)
    loft(f'{name}point', M['dark'], [[(x - w / 2, y - 0.003, z + h), (x + w / 2, y - 0.003, z + h), (x + 0.001, y - 0.003, z + h + w * 0.9), (x - 0.001, y - 0.003, z + h + w * 0.9)],
                                     [(x - w / 2, y + 0.003, z + h), (x + w / 2, y + 0.003, z + h), (x + 0.001, y + 0.003, z + h + w * 0.9), (x - 0.001, y + 0.003, z + h + w * 0.9)]], outline=0)


# ---------- the Parroquia: the nave, the dome and the staged front ----------
PX, PY = 0.0, 0.42
box('nave', M['pink'], PX, PY + 0.22, G - 0.005, 0.26, 0.4, 0.24, outline=0.006, bevel=0)
loft('naveroof', M['pinkDark'], [[(PX - 0.14, PY + 0.02, G + 0.235), (PX + 0.14, PY + 0.02, G + 0.235), (PX + 0.14, PY + 0.42, G + 0.235), (PX - 0.14, PY + 0.42, G + 0.235)],
                                 [(PX - 0.004, PY + 0.02, G + 0.3), (PX + 0.004, PY + 0.02, G + 0.3), (PX + 0.004, PY + 0.42, G + 0.3), (PX - 0.004, PY + 0.42, G + 0.3)]], outline=0.004)
lathe('drum', M['pink'], ((0.08, 0), (0.08, 0.1)), G + 0.26, PX, PY + 0.3, segs=8, outline=0.003, smooth=False)
lathe('dome', M['domeTiles'], ((0.09, 0), (0.08, 0.05), (0.05, 0.09), (0.0, 0.11)), G + 0.355, PX, PY + 0.3, segs=16, outline=0.004)
lathe('domelantern', M['white'], ((0.02, 0), (0.02, 0.04), (0.003, 0.07)), G + 0.455, PX, PY + 0.3, segs=8, outline=0.002, smooth=False)
STAGES = ((0.34, 0.16, 0.0, 0.26), (0.24, 0.13, 0.26, 0.17), (0.16, 0.1, 0.43, 0.14))
for k, (w, d, z0, h) in enumerate(STAGES):
    box(f'stage{k}', M['pink'], PX, PY, G - 0.005 + z0, w, d, h + 0.005, outline=0.005, bevel=0)
    for sx in (-1, 1):
        for sy in (-1, 1):
            pinnacle(f'pin{k}{sx}{sy}', PX + sx * w / 2, PY + sy * d / 2, G + z0 + h - 0.01, 0.014, 0.1 - 0.015 * k)
        pinnacle(f'pinmid{k}{sx}', PX + sx * w / 4, PY - d / 2, G + z0 + h - 0.01, 0.01, 0.07 - 0.01 * k)
    for j in range(3 - k if k < 2 else 1):
        n = 3 - k if k < 2 else 1
        wx = PX + (j - (n - 1) / 2) * w / (n + 0.6)
        gothic_window(f'win{k}{j}', wx, PY - d / 2 - 0.004, G + z0 + 0.04, 0.035 if k else 0.05, h * 0.45)
lathe('spire', M['pink'], ((0.055, 0), (0.003, 0.3)), G + 0.565, PX, PY, segs=8, outline=0.003, smooth=False)
for sx in (-1, 1):
    for sy in (-1, 1):
        pinnacle(f'spirepin{sx}{sy}', PX + sx * 0.045, PY + sy * 0.035, G + 0.565, 0.01, 0.1)
rod('cross', M['iron'], (PX, PY, G + 0.86), (PX, PY, G + 0.91), 0.004, segs=4, outline=0)
bar('crossbar', M['iron'], (PX - 0.014, PY, G + 0.895), (PX + 0.014, PY, G + 0.895), 0.005, outline=0)
for s in (-1, 1):
    box(f'sidetower{s}', M['pink'], PX + s * 0.22, PY + 0.02, G - 0.005, 0.1, 0.12, 0.3, outline=0.004, bevel=0)
    for sx in (-1, 1):
        pinnacle(f'sidepin{s}{sx}', PX + s * 0.22 + sx * 0.045, PY - 0.04, G + 0.29, 0.012, 0.08)
    lathe(f'sidecap{s}', M['pink'], ((0.035, 0), (0.003, 0.14)), G + 0.29, PX + s * 0.22, PY + 0.02, segs=8, outline=0.002, smooth=False)

# ---------- the houses round the square ----------
for k, (x, y, w, mat) in enumerate(((-0.62, 0.35, 0.3, 'ochre'), (0.62, 0.35, 0.3, 'red'), (-0.78, -0.15, 0.26, 'yellow'), (0.78, -0.15, 0.26, 'ochre'), (-0.55, -0.62, 0.3, 'red'), (0.55, -0.62, 0.3, 'yellow'))):
    box(f'house{k}', M[mat], x, y, G - 0.005, w, 0.2, 0.17, outline=0.005, bevel=0)
    box(f'houseparapet{k}', M['white'], x, y, G + 0.16, w + 0.01, 0.21, 0.015, outline=0.002, bevel=0)
    for j in range(3):
        box(f'housewin{k}{j}', M['dark'], x - w / 3 + j * w / 3, y - 0.103, G + 0.07, 0.03, 0.006, 0.06, outline=0, bevel=0)
        bar(f'balcony{k}{j}', M['iron'], (x - w / 3 + j * w / 3 - 0.025, y - 0.11, G + 0.075), (x - w / 3 + j * w / 3 + 0.025, y - 0.11, G + 0.075), 0.006, outline=0)

# ---------- the garden square: clipped laurels and the bandstand ----------
for k, (x, y) in enumerate(((-0.3, -0.05), (0.3, -0.05), (-0.3, -0.4), (0.3, -0.4), (-0.05, -0.65), (0.2, -0.7))):
    rod(f'laureltrunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.07), 0.012, segs=6, outline=0.001)
    b = ball(f'laurel{k}', M['laurel'], 0, 0, 0, 0.08, outline=0.008)
    b.scale = (1.0, 1.0, 0.75)
    b.location = (x, y, G + 0.12)
lathe('bandstand', M['white'], ((0.07, 0), (0.07, 0.03)), G - 0.005, 0.0, -0.22, segs=8, outline=0.002, smooth=False)
for k in range(8):
    a = 2 * math.pi * k / 8
    rod(f'bandpost{k}', M['iron'], (0.06 * math.cos(a), -0.22 + 0.06 * math.sin(a), G + 0.025), (0.06 * math.cos(a), -0.22 + 0.06 * math.sin(a), G + 0.1), 0.004, segs=4, outline=0)
lathe('bandroof', M['iron'], ((0.08, 0), (0.003, 0.05)), G + 0.1, 0.0, -0.22, segs=8, outline=0.002, smooth=False)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
