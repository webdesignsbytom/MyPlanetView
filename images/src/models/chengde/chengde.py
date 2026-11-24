# A cartoon Chengde Mountain Resort for the country maps, built in the set's shared look (../toon.py):
# the Putuo Zongcheng Temple, the "Little Potala", on its hillside: the great red terrace building
# with its rows of blind Tibetan windows on the massive white base, the gilded roofs of the halls on
# its top, the white stupa-topped gate tower below, the steps up the slope, and the resort's lake
# with its pavilion in front. Turned a little towards the camera.
# Run: blender -b --factory-startup -P chengde.py -- chengde-1024.png 1024 chengde.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'hill': toon('hill', '#7aa854', shadow_mul=(0.72, 0.8, 0.76)),
    'white': toon('white', '#f2eee4', shadow_mul=(0.82, 0.84, 0.9), lift=0.2),
    'red': toon('red', '#b8372e', shadow_mul=(0.86, 0.76, 0.76), lift=0.08),
    'gold': toon('gold', '#e8b030', shadow_mul=(0.86, 0.78, 0.66), lift=0.25),
    'window': flat('window', '#2e2a2a'),
    'water': toon('water', '#4a9ab0', lift=0.3),
    'tile': toon('tile', '#5a8a6a'),
    'pine': toon('pine', '#3f7a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a4a36'),
})

G = tile(M['hill'])
before = set(bpy.data.objects)


def strip(y0, y1, r, z, n=6):
    """The band of the tile's disc between y0 and y1 (counter-clockwise from above)."""
    xa0, xa1 = math.sqrt(r * r - y0 * y0), math.sqrt(r * r - y1 * y1)
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    pts = [(-xa0, y0), (xa0, y0)]
    pts += [(r * math.cos(a0 + (a1 - a0) * k / n), r * math.sin(a0 + (a1 - a0) * k / n)) for k in range(1, n)]
    pts += [(xa1, y1), (-xa1, y1)]
    pts += [(r * math.cos(math.pi - a1 + (a1 - a0) * k / n), r * math.sin(math.pi - a1 + (a1 - a0) * k / n)) for k in range(1, n)]
    return [(x, y, G + z) for x, y in pts]


# ---------- the lake in front and the hillside rising behind ----------
loft('lake', M['water'], [strip(-1.38, -0.7, 1.4, -0.004), strip(-1.38, -0.7, 1.4, 0.006)], outline=0.002)
hs = loft('hillside', M['hill'], [strip(-0.2, 1.3, 1.36, -0.01), strip(0.0, 1.24, 1.3, 0.2)], outline=0.006, smooth=True)
hs.visible_shadow = False
T = G + 0.2

# ---------- the Great Red Terrace on its white base ----------
RX, RY = 0.0, 0.45
box('whitebase', M['white'], RX, RY, T - 0.005, 0.8, 0.5, 0.2, outline=0.008, bevel=0)
for row in range(2):
    for j in range(9):
        box(f'basewin{row}{j}', M['window'], RX - 0.34 + j * 0.085, RY - 0.253, T + 0.05 + row * 0.07, 0.025, 0.006, 0.035, outline=0, bevel=0)
box('redterrace', M['red'], RX, RY + 0.03, T + 0.19, 0.66, 0.4, 0.2, outline=0.008, bevel=0)
for row in range(3):
    for j in range(8):
        box(f'redwin{row}{j}', M['window'], RX - 0.28 + j * 0.08, RY + 0.03 - 0.203, T + 0.22 + row * 0.055, 0.025, 0.006, 0.03, outline=0, bevel=0)
box('redterracecap', M['white'], RX, RY + 0.03, T + 0.385, 0.68, 0.42, 0.015, outline=0.002, bevel=0)
# the gilded hall on the top and the little pavilions at the corners
box('tophall', M['red'], RX, RY + 0.05, T + 0.4, 0.26, 0.2, 0.08, outline=0.004, bevel=0)
loft('tophallroof', M['gold'], [[(RX - 0.17, RY - 0.06, T + 0.475), (RX + 0.17, RY - 0.06, T + 0.475), (RX + 0.17, RY + 0.16, T + 0.475), (RX - 0.17, RY + 0.16, T + 0.475)],
                                [(RX - 0.08, RY + 0.04, T + 0.58), (RX + 0.08, RY + 0.04, T + 0.58), (RX + 0.08, RY + 0.06, T + 0.58), (RX - 0.08, RY + 0.06, T + 0.58)]], outline=0.005)
for sx in (-1, 1):
    for sy in (-1, 1):
        px, py = RX + sx * 0.26, RY + 0.03 + sy * 0.15
        box(f'cornerpav{sx}{sy}', M['red'], px, py, T + 0.395, 0.08, 0.08, 0.06, outline=0.002, bevel=0)
        lathe(f'cornerpavroof{sx}{sy}', M['gold'], ((0.065, 0), (0.003, 0.07)), T + 0.45, px, py, segs=4, outline=0.002, smooth=False)

# ---------- the gate tower below with its five stupas ----------
GX, GY = 0.0, -0.15
box('gatetower', M['white'], GX, GY, G - 0.005, 0.3, 0.16, 0.2, outline=0.006, bevel=0)
box('gatepassage', M['window'], GX, GY - 0.083, G - 0.005, 0.07, 0.006, 0.1, outline=0, bevel=0)
for k, x in enumerate((-0.12, -0.06, 0.0, 0.06, 0.12)):
    lathe(f'stupa{k}', M['white'] if k % 2 else M['red'], ((0.022, 0), (0.026, 0.03), (0.012, 0.06), (0.003, 0.09)), G + 0.195, GX + x, GY, segs=10, outline=0.002)
# the stairs from the gate up to the terrace
for i in range(5):
    box(f'stair{i}', M['white'], GX, GY + 0.12 + i * 0.03, G - 0.005, 0.14, 0.03, 0.05 + i * 0.035, outline=0.001, bevel=0)

# ---------- the lake pavilion and the pines ----------
LX, LY = 0.45, -0.95
for sx in (-1, 1):
    for sy in (-1, 1):
        rod(f'lakecol{sx}{sy}', M['red'], (LX + sx * 0.05, LY + sy * 0.05, G), (LX + sx * 0.05, LY + sy * 0.05, G + 0.1), 0.008, segs=6, outline=0.001)
lathe('lakeroof', M['tile'], ((0.09, 0), (0.003, 0.08)), G + 0.1, LX, LY, segs=8, outline=0.003, smooth=False)
box('causeway', M['white'], LX - 0.25, LY + 0.05, G - 0.003, 0.4, 0.04, 0.012, rot_z=0.3, outline=0.001, bevel=0)
for k, (x, y) in enumerate(((-0.75, 0.2), (0.75, 0.2), (-0.6, 0.85), (0.6, 0.85), (-0.85, -0.3), (0.85, -0.35))):
    z = G + (0.2 if y > 0.05 else 0.0)
    rod(f'pinetrunk{k}', M['trunk'], (x, y, z), (x + 0.02, y, z + 0.14), 0.014, segs=6, outline=0.002)
    pn = ball(f'pine{k}', M['pine'], 0, 0, 0, 0.09, outline=0.01)
    pn.scale = (1.4, 1.3, 0.6)
    pn.location = (x + 0.02, y, z + 0.18)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
