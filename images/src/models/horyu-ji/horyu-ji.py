# A cartoon Hōryū-ji for the country maps, built in the set's shared look (../toon.py): the world's
# oldest wooden buildings in their cloistered court at Nara, the five-storey pagoda with its deep eaves
# and bronze finial on the left, the Golden Hall (Kondō) with its double roof on the right, the
# vermilion-pillared cloister corridor round them on white gravel, the Middle Gate in front, and the
# pines. Turned a little towards the camera.
# Run: blender -b --factory-startup -P horyu-ji.py -- horyu-ji-1024.png 1024 horyu-ji.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'gravel': toon('gravel', '#e4e0d6', shadow_mul=(0.84, 0.84, 0.9), lift=0.25),
    'wood': toon('wood', '#c8803e', shadow_mul=(0.86, 0.78, 0.74), lift=0.08),
    'white': toon('white', '#f2ecde', lift=0.15),
    'tile': toon('tile', '#4a4e58', shadow_mul=(0.86, 0.86, 0.92)),
    'stone': toon('stone', '#bcb4a6'),
    'bronze': toon('bronze', '#8a7a4a', lift=0.12),
    'dark': flat('dark', '#2e2a26'),
    'pine': toon('pine', '#3f7a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a4a36'),
})

G = tile(M['gravel'])
before = set(bpy.data.objects)


def roof(name, x, y, z, w, d, h, over):
    """A deep-eaved tiled roof, hipped to a short ridge, with its corners turning up."""
    x0, y0 = w / 2 + over, d / 2 + over
    loft(name, M['tile'], [[(x - x0, y - y0, z), (x + x0, y - y0, z), (x + x0, y + y0, z), (x - x0, y + y0, z)],
                           [(x - x0 + over * 0.6, y - y0 + over * 0.6, z + h * 0.35), (x + x0 - over * 0.6, y - y0 + over * 0.6, z + h * 0.35), (x + x0 - over * 0.6, y + y0 - over * 0.6, z + h * 0.35), (x - x0 + over * 0.6, y + y0 - over * 0.6, z + h * 0.35)],
                           [(x - w * 0.25, y - 0.006, z + h), (x + w * 0.25, y - 0.006, z + h), (x + w * 0.25, y + 0.006, z + h), (x - w * 0.25, y + 0.006, z + h)]], outline=0.004)
    for sx in (-1, 1):
        for sy in (-1, 1):
            bar(f'{name}curl{sx}{sy}', M['tile'], (x + sx * (x0 - over * 0.5), y + sy * (y0 - over * 0.5), z + 0.004), (x + sx * (x0 + 0.01), y + sy * (y0 + 0.01), z + 0.025), 0.018, outline=0.001)


# ---------- the cloister round the court ----------
CX0, CX1, CY0, CY1 = -0.75, 0.75, -0.45, 0.65
# each run of the corridor: its two ends on the court side, and which way is outwards
RUNS = (((CX0, CY0), (-0.15, CY0), (0, -1)), ((0.15, CY0), (CX1, CY0), (0, -1)),
        ((CX0, CY0), (CX0, CY1), (-1, 0)), ((CX1, CY0), (CX1, CY1), (1, 0)), ((CX0, CY1), (CX1, CY1), (0, 1)))
for side, ((x0, y0), (x1, y1), (nx, ny)) in enumerate(RUNS):
    length = math.hypot(x1 - x0, y1 - y0)
    n = max(1, int(length / 0.09))
    for j in range(n + 1):
        t = j / n
        x, y = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
        rod(f'cloistercol{side}{j}', M['wood'], (x, y, G), (x, y, G + 0.1), 0.009, segs=6, outline=0.001)
    mx, my = (x0 + x1) / 2, (y0 + y1) / 2
    along_x = y0 == y1
    box(f'cloisterwall{side}', M['white'], mx + nx * 0.06, my + ny * 0.06, G - 0.005, length if along_x else 0.02, 0.02 if along_x else length, 0.1, outline=0.002, bevel=0)
    roof(f'cloisterroof{side}', mx + nx * 0.03, my + ny * 0.03, G + 0.1, length if along_x else 0.06, 0.06 if along_x else length, 0.05, 0.03)

# ---------- the Middle Gate ----------
box('gate', M['white'], 0, CY0, G - 0.005, 0.28, 0.14, 0.14, outline=0.005, bevel=0)
for j in range(4):
    rod(f'gatecol{j}', M['wood'], (-0.1 + j * 0.067, CY0 - 0.075, G), (-0.1 + j * 0.067, CY0 - 0.075, G + 0.14), 0.01, segs=6, outline=0.001)
roof('gateroof1', 0, CY0, G + 0.14, 0.28, 0.14, 0.05, 0.07)
box('gateupper', M['white'], 0, CY0, G + 0.18, 0.22, 0.1, 0.06, outline=0.003, bevel=0)
roof('gateroof2', 0, CY0, G + 0.24, 0.24, 0.12, 0.08, 0.07)

# ---------- the Golden Hall on the right ----------
KX, KY = 0.33, 0.15
box('kondoplatform', M['stone'], KX, KY, G - 0.005, 0.4, 0.34, 0.04, outline=0.003, bevel=0)
box('kondo', M['white'], KX, KY, G + 0.035, 0.28, 0.22, 0.12, outline=0.005, bevel=0)
for j in range(5):
    rod(f'kondocol{j}', M['wood'], (KX - 0.13 + j * 0.065, KY - 0.115, G + 0.035), (KX - 0.13 + j * 0.065, KY - 0.115, G + 0.155), 0.01, segs=6, outline=0.001)
roof('kondoroof1', KX, KY, G + 0.155, 0.28, 0.22, 0.06, 0.09)
box('kondoupper', M['white'], KX, KY, G + 0.2, 0.22, 0.16, 0.06, outline=0.003, bevel=0)
roof('kondoroof2', KX, KY, G + 0.26, 0.22, 0.16, 0.12, 0.09)

# ---------- the five-storey pagoda on the left ----------
PX, PY = -0.33, 0.15
box('pagodaplatform', M['stone'], PX, PY, G - 0.005, 0.3, 0.3, 0.04, outline=0.003, bevel=0)
z = G + 0.035
for k in range(5):
    w = 0.18 - k * 0.022
    h = 0.09 if k == 0 else 0.06
    box(f'storey{k}', M['white'], PX, PY, z, w, w, h, outline=0.004, bevel=0)
    for j in range(3):
        rod(f'storeycol{k}{j}', M['wood'], (PX - w / 2 + 0.01 + j * (w - 0.02) / 2, PY - w / 2 - 0.004, z), (PX - w / 2 + 0.01 + j * (w - 0.02) / 2, PY - w / 2 - 0.004, z + h), 0.007, segs=6, outline=0)
    z += h
    roof(f'storeyroof{k}', PX, PY, z, w, w, 0.03, 0.07)
    z += 0.03
lathe('sorin', M['bronze'], ((0.012, 0), (0.012, 0.2)), z - 0.01, PX, PY, segs=8, outline=0.002, smooth=False)
for k in range(9):
    lathe(f'sorinring{k}', M['bronze'], ((0.026, 0), (0.026, 0.006)), z + 0.02 + k * 0.016, PX, PY, segs=10, outline=0)

# ---------- pines ----------
for k, (x, y) in enumerate(((-0.95, -0.75), (0.95, -0.75), (-0.55, -0.95), (0.55, -0.95), (-1.0, 0.85), (1.0, 0.85))):
    if math.hypot(x, y) > 1.3:
        x, y = x * 0.9, y * 0.9
    rod(f'pinetrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + 0.16), 0.014, segs=6, outline=0.002)
    pn = ball(f'pine{k}', M['pine'], 0, 0, 0, 0.09, outline=0.01)
    pn.scale = (1.4, 1.3, 0.6)
    pn.location = (x + 0.02, y, G + 0.2)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
